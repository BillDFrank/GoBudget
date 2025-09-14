from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, and_
from datetime import datetime, date, timedelta
from typing import List
import httpx
import logging
from ..database import get_db, SessionLocal
from ..models import Receipt, ReceiptProduct, User
from ..schemas import Receipt as ReceiptSchema, ReceiptUploadResponse, SpendingSummary, PaginatedReceipts
from .auth import get_current_user

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# PDF extraction API endpoint
PDF_EXTRACTOR_URL = "http://91.98.45.199:8000/extract-batch"


@router.post("/upload", response_model=List[ReceiptUploadResponse])
async def upload_receipts(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload multiple PDF receipts and extract data using external API"""
    logger.info(f"Received {len(files)} files for processing")

    # Validate all files are PDFs
    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File {file.filename} is not a PDF. Only PDF files are allowed."
            )

    results = []

    # Read all file contents first
    file_contents = []
    for file in files:
        try:
            content = await file.read()
            file_contents.append({
                'filename': file.filename,
                'content': content,
                'size': len(content)
            })
            logger.info(
                f"Read file: {file.filename}, size: {len(content)} bytes")
        except Exception as e:
            logger.error(f"Failed to read file {file.filename}: {str(e)}")
            results.append(ReceiptUploadResponse(
                success=False,
                message=f"Failed to read file {file.filename}: {str(e)}",
                extracted_data=None
            ))

    # Prepare multipart form data for all files
    files_data = []
    for file_info in file_contents:
        files_data.append(
            ('files', (file_info['filename'], file_info['content'], 'application/pdf')))
        logger.info(f"Prepared file for upload: {file_info['filename']}")

    # Call the PDF extraction API with all files at once
    logger.info(
        f"Calling PDF extraction API: {PDF_EXTRACTOR_URL} with {len(files_data)} files")
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(PDF_EXTRACTOR_URL, files=files_data)
            logger.info(f"API response status: {response.status_code}")
            logger.info(f"API response headers: {dict(response.headers)}")

            if response.status_code != 200:
                logger.error(
                    f"API returned status {response.status_code}: {response.text}")
                # Mark all files as failed
                for file_info in file_contents:
                    results.append(ReceiptUploadResponse(
                        success=False,
                        message=f"Failed to extract data from {file_info['filename']}: API returned {response.status_code}",
                        extracted_data=None
                    ))
                return results

    except httpx.RequestError as e:
        logger.error(f"Network error calling PDF extraction API: {str(e)}")
        # Mark all files as failed
        for file_info in file_contents:
            results.append(ReceiptUploadResponse(
                success=False,
                message=f"Failed to connect to PDF extraction service for {file_info['filename']}: {str(e)}",
                extracted_data=None
            ))
        return results

    # Parse the batch response
    try:
        extraction_result = response.json()
        logger.info(f"Batch extraction result: {extraction_result}")
    except Exception as e:
        logger.error(f"Failed to parse API response as JSON: {str(e)}")
        # Mark all files as failed
        for file_info in file_contents:
            results.append(ReceiptUploadResponse(
                success=False,
                message=f"Invalid response format from extraction service for {file_info['filename']}",
                extracted_data=None
            ))
        return results

    if not extraction_result.get("results"):
        logger.warning("No results in extraction response")
        # Mark all files as failed
        for file_info in file_contents:
            results.append(ReceiptUploadResponse(
                success=False,
                message=f"No data could be extracted from {file_info['filename']}",
                extracted_data=None
            ))
        return results

    api_results = extraction_result["results"]
    logger.info(f"Received {len(api_results)} results from API")

    # Process each result
    for i, result in enumerate(api_results):
        filename = file_contents[i]['filename'] if i < len(
            file_contents) else f"file_{i+1}"
        logger.info(f"Processing result {i+1} for file: {filename}")

        try:
            if not result.get("success"):
                error_msg = result.get('error_message', 'Unknown error')
                logger.warning(
                    f"Extraction failed for {filename}: {error_msg}")
                results.append(ReceiptUploadResponse(
                    success=False,
                    message=f"Extraction failed for {filename}: {error_msg}",
                    extracted_data=None
                ))
                continue

            receipt_data = result.get("receipt", {})
            logger.info(
                f"Extracted receipt data for {filename}: {receipt_data}")

            # Validate extracted data
            required_keys = ["market", "branch", "total", "date", "products"]
            if not all(key in receipt_data for key in required_keys):
                missing_keys = [
                    key for key in required_keys if key not in receipt_data]
                logger.warning(
                    f"Missing required data for {filename}: {missing_keys}")
                results.append(ReceiptUploadResponse(
                    success=False,
                    message=f"Incomplete receipt data extracted from {filename}. Missing: {missing_keys}",
                    extracted_data=receipt_data
                ))
                continue

            # Parse date - handle different date formats
            try:
                date_str = receipt_data["date"]
                receipt_date = None

                # Try different date formats
                date_formats = [
                    "%d/%m/%Y",    # DD/MM/YYYY (forward slashes)
                    "%d-%m-%Y",    # DD-MM-YYYY (hyphens)
                    "%Y-%m-%d",    # YYYY-MM-DD (ISO format)
                    "%m/%d/%Y",    # MM/DD/YYYY (US format)
                    "%m-%d-%Y"     # MM-DD-YYYY (US format with hyphens)
                ]

                for date_format in date_formats:
                    try:
                        receipt_date = datetime.strptime(
                            date_str, date_format).date()
                        logger.info(
                            f"Successfully parsed date '{date_str}' using format '{date_format}' for {filename}")
                        break
                    except ValueError:
                        continue

                if receipt_date is None:
                    raise ValueError(
                        f"Date '{date_str}' doesn't match any supported format")

            except ValueError as e:
                logger.error(
                    f"Invalid date format for {filename}: {receipt_data['date']} - {str(e)}")
                results.append(ReceiptUploadResponse(
                    success=False,
                    message=f"Invalid date format in extracted data for {filename}: {receipt_data['date']}. Supported formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD",
                    extracted_data=receipt_data
                ))
                continue

            # Create receipt
            db_receipt = Receipt(
                market=receipt_data["market"],
                branch=receipt_data["branch"],
                invoice=receipt_data.get("invoice"),
                date=receipt_date,
                total=receipt_data["total"],
                user_id=current_user.id
            )

            db.add(db_receipt)
            db.flush()  # Get the receipt ID
            logger.info(
                f"Created receipt with ID: {db_receipt.id} for {filename}")

            # Create receipt products
            for product_data in receipt_data["products"]:
                # Handle null values for discounts
                discount = product_data.get("discount") or 0
                discount2 = product_data.get("discount2") or 0

                db_product = ReceiptProduct(
                    product_type=product_data["product_type"],
                    product=product_data["product"],
                    quantity=product_data["quantity"],
                    price=product_data["price"],
                    discount=discount,
                    discount2=discount2,
                    receipt_id=db_receipt.id
                )
                db.add(db_product)
                logger.info(
                    f"Created product for {filename}: {product_data['product']}")

            db.commit()
            db.refresh(db_receipt)
            logger.info(f"Successfully processed receipt: {filename}")

            results.append(ReceiptUploadResponse(
                success=True,
                receipt_id=db_receipt.id,
                message=f"Receipt {filename} uploaded and processed successfully",
                extracted_data=receipt_data
            ))

        except Exception as e:
            logger.error(f"Unexpected error processing {filename}: {str(e)}")
            db.rollback()
            results.append(ReceiptUploadResponse(
                success=False,
                message=f"Failed to process receipt {filename}: {str(e)}",
                extracted_data=None
            ))

    logger.info(
        f"Batch processing complete. Results: {len([r for r in results if r.success])} successful, {len([r for r in results if not r.success])} failed")
    return results


@router.get("/", response_model=PaginatedReceipts)
def get_receipts(
    page: int = 1,
    per_page: int = 25,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's receipts with pagination"""
    # Ensure page and per_page are valid
    page = max(1, page)
    per_page = min(max(1, per_page), 100)  # Max 100 items per page

    # Calculate offset
    skip = (page - 1) * per_page

    # Get total count
    total = db.query(Receipt).filter(
        Receipt.user_id == current_user.id).count()

    # Get receipts for current page
    receipts = db.query(Receipt).options(selectinload(Receipt.products)).filter(
        Receipt.user_id == current_user.id
    ).order_by(Receipt.date.desc()).offset(skip).limit(per_page).all()

    # Calculate pagination metadata
    pages = (total + per_page - 1) // per_page  # Ceiling division
    has_next = page < pages
    has_prev = page > 1

    return PaginatedReceipts(
        items=receipts,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
        has_next=has_next,
        has_prev=has_prev
    )


@router.get("/summary", response_model=SpendingSummary)
def get_monthly_summary(
    year: int = None,
    month: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get spending summary for a specific month/year"""
    today = date.today()

    # Use current month/year if not specified
    target_year = year if year is not None else today.year
    target_month = month if month is not None else today.month

    # Get start and end of the specified month
    start_date = date(target_year, target_month, 1)

    # Calculate last day of month
    if target_month == 12:
        end_date = date(target_year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(target_year, target_month + 1, 1) - timedelta(days=1)

    # Get receipts in the month
    receipts = db.query(Receipt).filter(
        and_(
            Receipt.user_id == current_user.id,
            Receipt.date >= start_date,
            Receipt.date <= end_date
        )
    ).all()

    total_spent = sum(receipt.total for receipt in receipts)
    receipt_count = len(receipts)
    average_per_receipt = total_spent / receipt_count if receipt_count > 0 else 0

    # Get top categories by product type
    category_totals = db.query(
        ReceiptProduct.product_type,
        func.sum(ReceiptProduct.price * ReceiptProduct.quantity).label('total')
    ).join(Receipt).filter(
        and_(
            Receipt.user_id == current_user.id,
            Receipt.date >= start_date,
            Receipt.date <= end_date
        )
    ).group_by(ReceiptProduct.product_type).order_by(func.sum(ReceiptProduct.price * ReceiptProduct.quantity).desc()).limit(5).all()

    top_categories = [
        {"category": category, "amount": float(total)}
        for category, total in category_totals
    ]

    return SpendingSummary(
        period="month",
        start_date=start_date,
        end_date=end_date,
        total_spent=total_spent,
        receipt_count=receipt_count,
        average_per_receipt=average_per_receipt,
        top_categories=top_categories
    )


@router.get("/spending/summary", response_model=SpendingSummary)
def get_spending_summary(
    period: str = "month",  # "week" or "month"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get spending summary with filters"""
    today = date.today()

    if period == "week":
        # Get start of current week (Monday)
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)
    elif period == "month":
        # Get start of current month
        start_date = today.replace(day=1)
        end_date = (start_date + timedelta(days=32)
                    ).replace(day=1) - timedelta(days=1)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Period must be 'week' or 'month'"
        )

    # Get receipts in the period
    receipts = db.query(Receipt).filter(
        and_(
            Receipt.user_id == current_user.id,
            Receipt.date >= start_date,
            Receipt.date <= end_date
        )
    ).all()

    total_spent = sum(receipt.total for receipt in receipts)
    receipt_count = len(receipts)
    average_per_receipt = total_spent / receipt_count if receipt_count > 0 else 0

    # Get top categories by product type
    category_totals = db.query(
        ReceiptProduct.product_type,
        func.sum(ReceiptProduct.price * ReceiptProduct.quantity).label('total')
    ).join(Receipt).filter(
        and_(
            Receipt.user_id == current_user.id,
            Receipt.date >= start_date,
            Receipt.date <= end_date
        )
    ).group_by(ReceiptProduct.product_type).order_by(func.sum(ReceiptProduct.price * ReceiptProduct.quantity).desc()).limit(5).all()

    top_categories = [
        {"category": category, "amount": float(total)}
        for category, total in category_totals
    ]

    return SpendingSummary(
        period=period,
        start_date=start_date,
        end_date=end_date,
        total_spent=total_spent,
        receipt_count=receipt_count,
        average_per_receipt=average_per_receipt,
        top_categories=top_categories
    )


@router.get("/{receipt_id}", response_model=ReceiptSchema)
def get_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific receipt details"""
    receipt = db.query(Receipt).filter(
        and_(Receipt.id == receipt_id, Receipt.user_id == current_user.id)
    ).first()

    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )

    return receipt


@router.delete("/{receipt_id}")
def delete_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a receipt"""
    receipt = db.query(Receipt).filter(
        and_(Receipt.id == receipt_id, Receipt.user_id == current_user.id)
    ).first()

    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )

    # Delete associated receipt products first
    db.query(ReceiptProduct).filter(
        ReceiptProduct.receipt_id == receipt_id).delete()

    # Delete the receipt
    db.delete(receipt)
    db.commit()

    return {"message": "Receipt deleted successfully"}


async def process_pdf_content(
    pdf_content: bytes,
    filename: str,
    db: Session,
    current_user: User
) -> ReceiptUploadResponse:
    """Process a single PDF content and save to database"""
    logger.info(f"Processing PDF: {filename}, size: {len(pdf_content)} bytes")

    # Prepare multipart form data
    files_data = [('files', (filename, pdf_content, 'application/pdf'))]

    # Call the PDF extraction API
    logger.info(f"Calling PDF extraction API: {PDF_EXTRACTOR_URL}")
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(PDF_EXTRACTOR_URL, files=files_data)
            logger.info(f"API response status: {response.status_code}")

            if response.status_code != 200:
                logger.error(
                    f"API returned status {response.status_code}: {response.text}")
                return ReceiptUploadResponse(
                    success=False,
                    message=f"Failed to extract data from {filename}: API returned {response.status_code}",
                    extracted_data=None
                )

            # Parse the response
            extraction_result = response.json()
            logger.info(f"Extraction result: {extraction_result}")

            if not extraction_result.get("results"):
                logger.warning("No results in extraction response")
                return ReceiptUploadResponse(
                    success=False,
                    message=f"No data could be extracted from {filename}",
                    extracted_data=None
                )

            api_results = extraction_result["results"]
            if not api_results:
                return ReceiptUploadResponse(
                    success=False,
                    message=f"No data could be extracted from {filename}",
                    extracted_data=None
                )

            result = api_results[0]  # Only one file

            if not result.get("success"):
                error_msg = result.get('error_message', 'Unknown error')
                logger.warning(
                    f"Extraction failed for {filename}: {error_msg}")
                return ReceiptUploadResponse(
                    success=False,
                    message=f"Extraction failed for {filename}: {error_msg}",
                    extracted_data=None
                )

            receipt_data = result.get("receipt", {})
            logger.info(
                f"Extracted receipt data for {filename}: {receipt_data}")

            # Validate extracted data
            required_keys = ["market", "branch", "total", "date", "products"]
            if not all(key in receipt_data for key in required_keys):
                missing_keys = [
                    key for key in required_keys if key not in receipt_data]
                logger.warning(
                    f"Missing required data for {filename}: {missing_keys}")
                return ReceiptUploadResponse(
                    success=False,
                    message=f"Incomplete receipt data extracted from {filename}. Missing: {missing_keys}",
                    extracted_data=receipt_data
                )

            # Parse date
            try:
                date_str = receipt_data["date"]
                receipt_date = None
                date_formats = [
                    "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y"
                ]

                for date_format in date_formats:
                    try:
                        receipt_date = datetime.strptime(
                            date_str, date_format).date()
                        logger.info(
                            f"Successfully parsed date '{date_str}' using format '{date_format}'")
                        break
                    except ValueError:
                        continue

                if receipt_date is None:
                    raise ValueError(
                        f"Date '{date_str}' doesn't match any supported format")

            except ValueError as e:
                logger.error(
                    f"Invalid date format for {filename}: {receipt_data['date']} - {str(e)}")
                return ReceiptUploadResponse(
                    success=False,
                    message=f"Invalid date format in extracted data for {filename}: {receipt_data['date']}",
                    extracted_data=receipt_data
                )

            # Create receipt
            db_receipt = Receipt(
                market=receipt_data["market"],
                branch=receipt_data["branch"],
                invoice=receipt_data.get("invoice"),
                date=receipt_date,
                total=receipt_data["total"],
                user_id=current_user.id
            )

            db.add(db_receipt)
            db.flush()
            logger.info(
                f"Created receipt with ID: {db_receipt.id} for {filename}")

            # Create receipt products
            for product_data in receipt_data["products"]:
                discount = product_data.get("discount") or 0
                discount2 = product_data.get("discount2") or 0

                db_product = ReceiptProduct(
                    product_type=product_data["product_type"],
                    product=product_data["product"],
                    quantity=product_data["quantity"],
                    price=product_data["price"],
                    discount=discount,
                    discount2=discount2,
                    receipt_id=db_receipt.id
                )
                db.add(db_product)
                logger.info(
                    f"Created product for {filename}: {product_data['product']}")

            db.commit()
            db.refresh(db_receipt)
            logger.info(f"Successfully processed receipt: {filename}")

            return ReceiptUploadResponse(
                success=True,
                receipt_id=db_receipt.id,
                message=f"Receipt {filename} uploaded and processed successfully",
                extracted_data=receipt_data
            )

    except httpx.RequestError as e:
        logger.error(f"Network error calling PDF extraction API: {str(e)}")
        return ReceiptUploadResponse(
            success=False,
            message=f"Failed to connect to PDF extraction service for {filename}: {str(e)}",
            extracted_data=None
        )
    except Exception as e:
        logger.error(f"Unexpected error processing {filename}: {str(e)}")
        db.rollback()
        return ReceiptUploadResponse(
            success=False,
            message=f"Failed to process receipt {filename}: {str(e)}",
            extracted_data=None
        )


async def process_pdf_batch(
    pdf_batch: List[dict],  # List of {'content': bytes, 'filename': str}
    db: Session,
    current_user: User
) -> List[ReceiptUploadResponse]:
    """Process a batch of PDFs together for better performance"""
    logger.info(f"Processing batch of {len(pdf_batch)} PDFs")

    # Use a fresh database session for this batch to avoid transaction issues
    batch_db = SessionLocal()
    try:
        # Since we now check for duplicates before download, this should be minimal
        # But we'll keep a safety check in case any duplicates slipped through
        processed_filenames = set()
        try:
            for receipt in batch_db.query(Receipt).filter(
                Receipt.user_id == current_user.id,
                Receipt.filename.isnot(None)
            ).all():
                processed_filenames.add(receipt.filename)
        except Exception as e:
            logger.warning(f"Could not check for existing filenames: {str(e)}")
            processed_filenames = set()

        # Filter out any remaining duplicates (should be rare now)
        new_pdfs = []
        skipped_results = []

        for pdf_data in pdf_batch:
            filename = pdf_data['filename']
            if filename in processed_filenames:
                logger.info(
                    f"Safety check: skipping duplicate file: {filename}")
                skipped_results.append(ReceiptUploadResponse(
                    success=False,
                    message=f"Receipt {filename} has already been processed",
                    extracted_data=None
                ))
            else:
                new_pdfs.append(pdf_data)

        if not new_pdfs:
            logger.info("All PDFs in batch have already been processed")
            return skipped_results

        logger.info(
            f"Processing {len(new_pdfs)} PDFs (safety check skipped {len(skipped_results)} duplicates)")

        # Prepare multipart form data for new files only
        files_data = []
        for pdf_data in new_pdfs:
            # Use original filename for API call but track with unique filename internally
            api_filename = pdf_data.get(
                'original_filename', pdf_data['filename'])
            # Ensure filename ends with .pdf for API
            if not api_filename.lower().endswith('.pdf'):
                api_filename += '.pdf'

            files_data.append(
                ('files', (api_filename,
                 pdf_data['content'], 'application/pdf'))
            )
            logger.info(
                f"Added to batch: {pdf_data['filename']}, size: {len(pdf_data['content'])} bytes")

        # Call the PDF extraction API with the entire batch
        logger.info(f"Calling PDF extraction API: {PDF_EXTRACTOR_URL}")
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(PDF_EXTRACTOR_URL, files=files_data)
            logger.info(f"API response status: {response.status_code}")

            if response.status_code != 200:
                logger.error(
                    f"API returned status {response.status_code}: {response.text}")
                # Return failed responses for new files + skipped results
                failed_results = [
                    ReceiptUploadResponse(
                        success=False,
                        message=f"Failed to extract data from {pdf_data['filename']}: API returned {response.status_code}",
                        extracted_data=None
                    ) for pdf_data in new_pdfs
                ]
                return skipped_results + failed_results

            # Parse the response
            extraction_result = response.json()
            logger.info(f"Extraction result: {extraction_result}")

            if not extraction_result.get("results"):
                logger.warning("No results in extraction response")
                failed_results = [
                    ReceiptUploadResponse(
                        success=False,
                        message=f"No data could be extracted from {pdf_data['filename']}",
                        extracted_data=None
                    ) for pdf_data in new_pdfs
                ]
                return skipped_results + failed_results

            api_results = extraction_result["results"]
            results = []

            # Process each result and match it to the new files
            for i, (pdf_data, result) in enumerate(zip(new_pdfs, api_results)):
                filename = pdf_data['filename']

                if not result.get("success"):
                    error_msg = result.get('error_message', 'Unknown error')
                    logger.warning(
                        f"Extraction failed for {filename}: {error_msg}")
                    results.append(ReceiptUploadResponse(
                        success=False,
                        message=f"Extraction failed for {filename}: {error_msg}",
                        extracted_data=None
                    ))
                    continue

                receipt_data = result.get("receipt")
                if not receipt_data:
                    logger.warning(f"No receipt data returned for {filename}")
                    results.append(ReceiptUploadResponse(
                        success=False,
                        message=f"No receipt data found in {filename}",
                        extracted_data=None
                    ))
                    continue

                # Extract receipt data for this file
                logger.info(
                    f"Extracted receipt data for {filename}: {receipt_data}")

                # Parse the date from various possible formats
                date_str = receipt_data["date"]
                receipt_date = None
                for date_format in ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"]:
                    try:
                        receipt_date = datetime.strptime(
                            date_str, date_format).date()
                        logger.info(
                            f"Successfully parsed date '{date_str}' using format '{date_format}'")
                        break
                    except ValueError:
                        continue

                if not receipt_date:
                    logger.error(
                        f"Could not parse date '{date_str}' for {filename}")
                    results.append(ReceiptUploadResponse(
                        success=False,
                        message=f"Invalid date format in {filename}: {date_str}",
                        extracted_data=None
                    ))
                    continue

                # Create receipt record
                try:
                    db_receipt = Receipt(
                        user_id=current_user.id,
                        market=receipt_data["market"],
                        branch=receipt_data["branch"],
                        invoice=receipt_data["invoice"],
                        total=receipt_data["total"],
                        date=receipt_date,
                        filename=filename
                    )
                except Exception as e:
                    # Handle case where filename column doesn't exist yet
                    logger.warning(
                        f"Could not set filename (possibly old schema): {str(e)}")
                    db_receipt = Receipt(
                        user_id=current_user.id,
                        market=receipt_data["market"],
                        branch=receipt_data["branch"],
                        invoice=receipt_data["invoice"],
                        total=receipt_data["total"],
                        date=receipt_date
                    )

                batch_db.add(db_receipt)
                batch_db.flush()
                logger.info(
                    f"Created receipt with ID: {db_receipt.id} for {filename}")

                # Create receipt products
                for product_data in receipt_data["products"]:
                    discount = product_data.get("discount") or 0
                    discount2 = product_data.get("discount2") or 0

                    db_product = ReceiptProduct(
                        product_type=product_data["product_type"],
                        product=product_data["product"],
                        quantity=product_data["quantity"],
                        price=product_data["price"],
                        discount=discount,
                        discount2=discount2,
                        receipt_id=db_receipt.id
                    )
                    batch_db.add(db_product)
                    logger.info(
                        f"Created product for {filename}: {product_data['product']}")

                results.append(ReceiptUploadResponse(
                    success=True,
                    receipt_id=db_receipt.id,
                    message=f"Receipt {filename} uploaded and processed successfully",
                    extracted_data=receipt_data
                ))

            # Commit all changes at once
            batch_db.commit()
            logger.info(
                f"Successfully processed batch: {len([r for r in results if r.success])} successful, {len([r for r in results if not r.success])} failed")

            # Combine skipped and processed results
            return skipped_results + results

    except httpx.RequestError as e:
        logger.error(f"Network error calling PDF extraction API: {str(e)}")
        batch_db.rollback()
        failed_results = [
            ReceiptUploadResponse(
                success=False,
                message=f"Failed to connect to PDF extraction service for {pdf_data['filename']}: {str(e)}",
                extracted_data=None
            ) for pdf_data in new_pdfs
        ]
        return skipped_results + failed_results
    except Exception as e:
        logger.error(f"Unexpected error processing batch: {str(e)}")
        batch_db.rollback()
        failed_results = [
            ReceiptUploadResponse(
                success=False,
                message=f"Failed to process receipt {pdf_data['filename']}: {str(e)}",
                extracted_data=None
            ) for pdf_data in new_pdfs
        ]
        return skipped_results + failed_results
    finally:
        batch_db.close()
