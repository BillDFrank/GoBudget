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
    total: float

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