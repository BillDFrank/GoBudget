from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, and_, asc, desc
from datetime import datetime, date, timedelta
from typing import List, Optional
import httpx
import logging
import io
import csv
from ..database import get_db, init_database
from ..models import Receipt, ReceiptProduct, User
from ..schemas import Receipt as ReceiptSchema, ReceiptUploadResponse, SpendingSummary, PaginatedReceipts, ReceiptFilterOptions
from .auth import get_current_user

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

PDF_EXTRACTOR_URL = "http://91.98.45.199:8000/extract-batch"


def _normalize_totals(receipt_data: dict) -> tuple[float, float, float]:
    """Return sanitized (total, discount, paid) as non-null floats.

    Strategy:
    - If total is None, prefer sum(price*qty), then total_paid, else 0.0
    - If discount is None, use max(total - total_paid, 0.0)
    - If paid is None, use (total - discount) with safe fallbacks
    """
    products = receipt_data.get("products") or []
    try:
        products_sum = sum(
            float(p.get("price") or 0) * float(p.get("quantity") or 0)
            for p in products
        )
    except Exception:
        products_sum = 0.0

    raw_total = receipt_data.get("total")
    raw_paid = receipt_data.get("total_paid")
    raw_discount = receipt_data.get("total_discount")

    total = float(raw_total) if raw_total is not None else None
    total_paid = float(raw_paid) if raw_paid is not None else None
    total_discount = float(raw_discount) if raw_discount is not None else None

    if total is None:
        if products_sum and products_sum > 0:
            total = products_sum
        elif total_paid is not None:
            total = total_paid
        else:
            total = 0.0

    if total_discount is None:
        if total_paid is not None:
            total_discount = max(total - total_paid, 0.0)
        else:
            total_discount = 0.0

    if total_paid is None:
        candidate = total - (total_discount or 0.0)
        total_paid = max(candidate, 0.0)

    return round(float(total), 2), round(float(total_discount), 2), round(float(total_paid), 2)


@router.post("/upload", response_model=List[ReceiptUploadResponse])
async def upload_receipts(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload multiple PDF receipts and extract data using external API"""
    logger.info(f"Received {len(files)} files for processing")

    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File {file.filename} is not a PDF. Only PDF files are allowed."
            )

    results = []

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

    files_data = []
    for file_info in file_contents:
        files_data.append(
            ('files', (file_info['filename'], file_info['content'], 'application/pdf')))
        logger.info(f"Prepared file for upload: {file_info['filename']}")

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
                for file_info in file_contents:
                    results.append(ReceiptUploadResponse(
                        success=False,
                        message=f"Failed to extract data from {file_info['filename']}: API returned {response.status_code}",
                        extracted_data=None
                    ))
                return results

    except httpx.RequestError as e:
        logger.error(f"Network error calling PDF extraction API: {str(e)}")
        for file_info in file_contents:
            results.append(ReceiptUploadResponse(
                success=False,
                message=f"Failed to connect to PDF extraction service for {file_info['filename']}: {str(e)}",
                extracted_data=None
            ))
        return results

    try:
        extraction_result = response.json()
        logger.info(f"Batch extraction result: {extraction_result}")
    except Exception as e:
        logger.error(f"Failed to parse API response as JSON: {str(e)}")
        for file_info in file_contents:
            results.append(ReceiptUploadResponse(
                success=False,
                message=f"Invalid response format from extraction service for {file_info['filename']}",
                extracted_data=None
            ))
        return results

    if not extraction_result.get("results"):
        logger.warning("No results in extraction response")
        for file_info in file_contents:
            results.append(ReceiptUploadResponse(
                success=False,
                message=f"No data could be extracted from {file_info['filename']}",
                extracted_data=None
            ))
        return results

    api_results = extraction_result["results"]
    logger.info(f"Received {len(api_results)} results from API")

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

            required_keys = ["market", "branch", "total",
                             "total_discount", "total_paid", "date", "products"]
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

            try:
                date_str = receipt_data["date"]
                receipt_date = None

                date_formats = [
                    "%d/%m/%Y",
                    "%d-%m-%Y",
                    "%Y-%m-%d",
                    "%m/%d/%Y",
                    "%m-%d-%Y"
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

            norm_total, norm_discount, norm_paid = _normalize_totals(
                receipt_data)

            db_receipt = Receipt(
                market=receipt_data["market"],
                branch=receipt_data["branch"],
                invoice=receipt_data.get("invoice"),
                date=receipt_date,
                total=norm_total,
                total_discount=norm_discount,
                total_paid=norm_paid,
                user_id=current_user.id
            )

            db.add(db_receipt)
            db.flush()
            logger.info(
                f"Created receipt with ID: {db_receipt.id} for {filename}")

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
    sort_by: Optional[str] = Query(None, description="Field to sort by: date, market, branch, total, total_discount"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    filter_market: Optional[str] = Query(None, description="Filter by market name"),
    filter_branch: Optional[str] = Query(None, description="Filter by branch name"),
    filter_date_from: Optional[date] = Query(None, description="Filter receipts from this date"),
    filter_date_to: Optional[date] = Query(None, description="Filter receipts until this date"),
    filter_total_min: Optional[float] = Query(None, description="Filter receipts with total amount greater than or equal to this value"),
    filter_total_max: Optional[float] = Query(None, description="Filter receipts with total amount less than or equal to this value"),
    filter_discount_min: Optional[float] = Query(None, description="Filter receipts with total discount greater than or equal to this value"),
    filter_discount_max: Optional[float] = Query(None, description="Filter receipts with total discount less than or equal to this value"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's receipts with pagination, sorting, and filtering"""
    page = max(1, page)
    per_page = min(max(1, per_page), 10000)  # Increased limit to handle all receipts for client-side operations

    skip = (page - 1) * per_page

    # Build the base query
    query = db.query(Receipt).filter(Receipt.user_id == current_user.id)

    # Apply filters
    if filter_market:
        query = query.filter(Receipt.market.ilike(f"%{filter_market}%"))
    
    if filter_branch:
        query = query.filter(Receipt.branch.ilike(f"%{filter_branch}%"))
    
    if filter_date_from:
        query = query.filter(Receipt.date >= filter_date_from)
    
    if filter_date_to:
        query = query.filter(Receipt.date <= filter_date_to)
    
    if filter_total_min is not None:
        query = query.filter(Receipt.total_paid >= filter_total_min)
    
    if filter_total_max is not None:
        query = query.filter(Receipt.total_paid <= filter_total_max)
    
    if filter_discount_min is not None:
        query = query.filter(Receipt.total_discount >= filter_discount_min)
    
    if filter_discount_max is not None:
        query = query.filter(Receipt.total_discount <= filter_discount_max)

    # Get total count with filters applied
    total = query.count()

    # Apply sorting
    if sort_by:
        order_func = desc if sort_order == "desc" else asc
        if sort_by == "date":
            query = query.order_by(order_func(Receipt.date))
        elif sort_by == "market":
            query = query.order_by(order_func(Receipt.market))
        elif sort_by == "branch":
            query = query.order_by(order_func(Receipt.branch))
        elif sort_by == "total":
            query = query.order_by(order_func(Receipt.total_paid))
        elif sort_by == "total_discount":
            query = query.order_by(order_func(Receipt.total_discount))
        else:
            # Default sort by date desc if invalid sort_by provided
            query = query.order_by(desc(Receipt.date))
    else:
        # Default sort by date desc
        query = query.order_by(desc(Receipt.date))

    # Apply pagination and load products
    receipts = query.options(selectinload(Receipt.products)).offset(skip).limit(per_page).all()

    pages = (total + per_page - 1) // per_page
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

    target_year = year if year is not None else today.year
    target_month = month if month is not None else today.month

    start_date = date(target_year, target_month, 1)

    if target_month == 12:
        end_date = date(target_year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(target_year, target_month + 1, 1) - timedelta(days=1)

    receipts = db.query(Receipt).filter(
        and_(
            Receipt.user_id == current_user.id,
            Receipt.date >= start_date,
            Receipt.date <= end_date
        )
    ).all()

    total_spent = sum(receipt.total_paid for receipt in receipts)
    receipt_count = len(receipts)
    average_per_receipt = total_spent / receipt_count if receipt_count > 0 else 0

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
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)
    elif period == "month":
        start_date = today.replace(day=1)
        end_date = (start_date + timedelta(days=32)
                    ).replace(day=1) - timedelta(days=1)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Period must be 'week' or 'month'"
        )

    receipts = db.query(Receipt).filter(
        and_(
            Receipt.user_id == current_user.id,
            Receipt.date >= start_date,
            Receipt.date <= end_date
        )
    ).all()

    total_spent = sum(receipt.total_paid for receipt in receipts)
    receipt_count = len(receipts)
    average_per_receipt = total_spent / receipt_count if receipt_count > 0 else 0

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


@router.get("/filter-options", response_model=ReceiptFilterOptions)
def get_filter_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available filter options for receipts"""
    # Get unique markets
    markets = db.query(Receipt.market).filter(Receipt.user_id == current_user.id).distinct().all()
    markets = [market[0] for market in markets if market[0]]
    
    # Get unique branches
    branches = db.query(Receipt.branch).filter(Receipt.user_id == current_user.id).distinct().all()
    branches = [branch[0] for branch in branches if branch[0]]
    
    # Get date range
    date_query = db.query(
        func.min(Receipt.date).label('min_date'),
        func.max(Receipt.date).label('max_date')
    ).filter(Receipt.user_id == current_user.id).first()
    
    date_range = {
        "min": date_query.min_date.isoformat() if date_query.min_date else None,
        "max": date_query.max_date.isoformat() if date_query.max_date else None
    }
    
    # Get total range
    total_query = db.query(
        func.min(Receipt.total_paid).label('min_total'),
        func.max(Receipt.total_paid).label('max_total')
    ).filter(Receipt.user_id == current_user.id).first()
    
    total_range = {
        "min": float(total_query.min_total) if total_query.min_total else 0.0,
        "max": float(total_query.max_total) if total_query.max_total else 0.0
    }
    
    # Get discount range
    discount_query = db.query(
        func.min(Receipt.total_discount).label('min_discount'),
        func.max(Receipt.total_discount).label('max_discount')
    ).filter(Receipt.user_id == current_user.id).first()
    
    discount_range = {
        "min": float(discount_query.min_discount) if discount_query.min_discount else 0.0,
        "max": float(discount_query.max_discount) if discount_query.max_discount else 0.0
    }
    
    return ReceiptFilterOptions(
        markets=sorted(markets),
        branches=sorted(branches),
        date_range=date_range,
        total_range=total_range,
        discount_range=discount_range
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

    db.query(ReceiptProduct).filter(
        ReceiptProduct.receipt_id == receipt_id).delete()

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

    files_data = [('files', (filename, pdf_content, 'application/pdf'))]

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

            result = api_results[0]

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

            norm_total, norm_discount, norm_paid = _normalize_totals(
                receipt_data)

            db_receipt = Receipt(
                market=receipt_data["market"],
                branch=receipt_data["branch"],
                invoice=receipt_data.get("invoice"),
                date=receipt_date,
                total=norm_total,
                total_discount=norm_discount,
                total_paid=norm_paid,
                user_id=current_user.id
            )

            db.add(db_receipt)
            db.flush()
            logger.info(
                f"Created receipt with ID: {db_receipt.id} for {filename}")

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
    # Ensure database is initialized and get SessionLocal
    from ..database import SessionLocal
    if SessionLocal is None:
        init_database()
        from ..database import SessionLocal

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

                # Normalize totals to avoid NULLs and maintain constraints
                norm_total, norm_discount, norm_paid = _normalize_totals(
                    receipt_data)

                # Create receipt record
                try:
                    db_receipt = Receipt(
                        user_id=current_user.id,
                        market=receipt_data["market"],
                        branch=receipt_data["branch"],
                        invoice=receipt_data["invoice"],
                        total=norm_total,  # Total before discounts
                        total_discount=norm_discount,  # Total discount amount
                        # Total amount paid (after discounts)
                        total_paid=norm_paid,
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
                        total=norm_total,
                        total_discount=norm_discount,
                        total_paid=norm_paid,
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


@router.get("/export/csv")
def export_receipts_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export all user's receipts as CSV file"""

    # Get all receipts for the current user with products
    receipts = db.query(Receipt).options(selectinload(Receipt.products)).filter(
        Receipt.user_id == current_user.id
    ).order_by(Receipt.date.desc()).all()

    # Create CSV content in memory
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        'Date',
        'Market',
        'Branch',
        'Invoice',
        'Total Amount',
        'Total Discount',
        'Total Paid',
        'Products (Type||Name||Qty||Price||Disc1||Disc2||Total, separated by |)'
    ])

    # Write data rows
    for receipt in receipts:
        if receipt.products:
            # Join all products into single fields with custom separators
            # Format: product_type||product_name||quantity||price||discount||discount2||total
            product_lines = []
            for product in receipt.products:
                product_total = (product.price * product.quantity) - \
                    (product.discount + product.discount2)
                # Clean product data to avoid encoding issues
                clean_product_type = (product.product_type or "").replace(
                    "||", "|").replace("|", "-")
                clean_product_name = (product.product or "").replace(
                    "||", "|").replace("|", "-")
                product_line = f"{clean_product_type}||{clean_product_name}||{product.quantity:.2f}||{product.price:.2f}||{product.discount:.2f}||{product.discount2:.2f}||{product_total:.2f}"
                product_lines.append(product_line)

            # Join all product lines with | separator
            all_products = '|'.join(product_lines)

            writer.writerow([
                receipt.date.strftime('%Y-%m-%d'),
                receipt.market,
                receipt.branch or '',
                receipt.invoice or '',
                f"{receipt.total:.2f}",
                f"{receipt.total_discount:.2f}",
                f"{receipt.total_paid:.2f}",
                all_products  # All product details in one column
            ])
        else:
            # If receipt has no products, write receipt-only row
            writer.writerow([
                receipt.date.strftime('%Y-%m-%d'),
                receipt.market,
                receipt.branch or '',
                receipt.invoice or '',
                f"{receipt.total:.2f}",
                f"{receipt.total_discount:.2f}",
                f"{receipt.total_paid:.2f}",
                ''  # Empty products column
            ])

    # Get CSV content
    csv_content = output.getvalue()
    output.close()

    # Generate filename with current date
    filename = f"supermarket_receipts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    # Create streaming response with proper UTF-8 encoding
    return StreamingResponse(
        io.BytesIO(csv_content.encode('utf-8-sig')),
        media_type='text/csv; charset=utf-8',
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
