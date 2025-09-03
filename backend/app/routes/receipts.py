from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, date, timedelta
from typing import List
import httpx
import logging
from ..database import get_db
from ..models import Receipt, ReceiptProduct, User
from ..schemas import Receipt as ReceiptSchema, ReceiptUploadResponse, SpendingSummary
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
            logger.info(f"Read file: {file.filename}, size: {len(content)} bytes")
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
        files_data.append(('files', (file_info['filename'], file_info['content'], 'application/pdf')))
        logger.info(f"Prepared file for upload: {file_info['filename']}")

    # Call the PDF extraction API with all files at once
    logger.info(f"Calling PDF extraction API: {PDF_EXTRACTOR_URL} with {len(files_data)} files")
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(PDF_EXTRACTOR_URL, files=files_data)
            logger.info(f"API response status: {response.status_code}")
            logger.info(f"API response headers: {dict(response.headers)}")

            if response.status_code != 200:
                logger.error(f"API returned status {response.status_code}: {response.text}")
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
        filename = file_contents[i]['filename'] if i < len(file_contents) else f"file_{i+1}"
        logger.info(f"Processing result {i+1} for file: {filename}")

        try:
            if not result.get("success"):
                error_msg = result.get('error_message', 'Unknown error')
                logger.warning(f"Extraction failed for {filename}: {error_msg}")
                results.append(ReceiptUploadResponse(
                    success=False,
                    message=f"Extraction failed for {filename}: {error_msg}",
                    extracted_data=None
                ))
                continue

            receipt_data = result.get("receipt", {})
            logger.info(f"Extracted receipt data for {filename}: {receipt_data}")

            # Validate extracted data
            required_keys = ["market", "branch", "total", "date", "products"]
            if not all(key in receipt_data for key in required_keys):
                missing_keys = [key for key in required_keys if key not in receipt_data]
                logger.warning(f"Missing required data for {filename}: {missing_keys}")
                results.append(ReceiptUploadResponse(
                    success=False,
                    message=f"Incomplete receipt data extracted from {filename}. Missing: {missing_keys}",
                    extracted_data=receipt_data
                ))
                continue

            # Parse date - handle different date formats
            try:
                # Try DD/MM/YYYY format first (from API example)
                if "/" in receipt_data["date"]:
                    receipt_date = datetime.strptime(receipt_data["date"], "%d/%m/%Y").date()
                else:
                    # Fallback to YYYY-MM-DD format
                    receipt_date = datetime.strptime(receipt_data["date"], "%Y-%m-%d").date()
                logger.info(f"Parsed date for {filename}: {receipt_date}")
            except ValueError as e:
                logger.error(f"Invalid date format for {filename}: {receipt_data['date']}")
                results.append(ReceiptUploadResponse(
                    success=False,
                    message=f"Invalid date format in extracted data for {filename}: {receipt_data['date']}",
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
            logger.info(f"Created receipt with ID: {db_receipt.id} for {filename}")

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
                logger.info(f"Created product for {filename}: {product_data['product']}")

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

    logger.info(f"Batch processing complete. Results: {len([r for r in results if r.success])} successful, {len([r for r in results if not r.success])} failed")
    return results

@router.get("/", response_model=List[ReceiptSchema])
def get_receipts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's receipts"""
    receipts = db.query(Receipt).filter(Receipt.user_id == current_user.id).offset(skip).limit(limit).all()
    return receipts

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
        end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
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