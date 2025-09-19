from pydantic import BaseModel
from datetime import date
from typing import Optional, List


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int

    class Config:
        from_attributes = True


class TransactionBase(BaseModel):
    date: date
    type: str
    person: str
    category: str
    description: str
    amount: float


class TransactionCreate(TransactionBase):
    pass


class Transaction(TransactionBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class ReceiptProductBase(BaseModel):
    product_type: str
    product: str
    quantity: float
    price: float
    discount: Optional[float] = 0
    discount2: Optional[float] = 0


class ReceiptProductCreate(ReceiptProductBase):
    pass


class ReceiptProduct(ReceiptProductBase):
    id: int
    receipt_id: int

    class Config:
        from_attributes = True


class ReceiptBase(BaseModel):
    market: str
    branch: str
    invoice: Optional[str] = None
    date: date
    total: float  # Total before discounts
    total_discount: Optional[float] = 0  # Total discount amount
    total_paid: float  # Total amount paid (after discounts)


class ReceiptCreate(ReceiptBase):
    products: List[ReceiptProductCreate]


class Receipt(ReceiptBase):
    id: int
    user_id: int
    products: List[ReceiptProduct]

    class Config:
        from_attributes = True


class ReceiptUploadResponse(BaseModel):
    success: bool
    receipt_id: Optional[int] = None
    message: str
    extracted_data: Optional[dict] = None


class SpendingSummary(BaseModel):
    period: str  # "week" or "month"
    start_date: date
    end_date: date
    total_spent: float
    receipt_count: int
    average_per_receipt: float
    top_categories: List[dict]  # [{"category": "Food", "amount": 100.50}, ...]


class PaginatedReceipts(BaseModel):
    items: List[Receipt]
    total: int
    page: int
    per_page: int
    pages: int
    has_next: bool
    has_prev: bool


class ReceiptFilterOptions(BaseModel):
    """Available filter options for receipts"""
    markets: List[str]
    branches: List[str]
    date_range: dict  # {"min": "2024-01-01", "max": "2024-12-31"}
    total_range: dict  # {"min": 0.0, "max": 500.0}
    discount_range: dict  # {"min": 0.0, "max": 100.0"}
