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


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int
    user_id: int
    is_default: bool

    class Config:
        from_attributes = True


class PersonBase(BaseModel):
    name: str


class PersonCreate(PersonBase):
    pass


class Person(PersonBase):
    id: int
    user_id: int
    is_default: bool

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
    total_discount: Optional[float] = 0
    total_paid: float


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
    period: str
    start_date: date
    end_date: date
    total_spent: float
    receipt_count: int
    average_per_receipt: float
    top_categories: List[dict]


class PaginatedReceipts(BaseModel):
    items: List[Receipt]
    total: int
    page: int
    per_page: int
    pages: int
    has_next: bool
    has_prev: bool


class ReceiptFilterOptions(BaseModel):
    markets: List[str]
    branches: List[str]
    date_range: dict
    total_range: dict
    discount_range: dict
      

class UserSettingsBase(BaseModel):
    currency: str = "USD"
    date_format: str = "MM/DD/YYYY"
    timezone: str = "Eastern Time (ET)"
    dark_mode: bool = False
    email_notifications: bool = True
    budget_alerts: bool = True
    transaction_alerts: bool = False
    weekly_reports: bool = True


class UserSettingsCreate(UserSettingsBase):
    pass


class UserSettingsUpdate(BaseModel):
    currency: Optional[str] = None
    date_format: Optional[str] = None
    timezone: Optional[str] = None
    dark_mode: Optional[bool] = None
    email_notifications: Optional[bool] = None
    budget_alerts: Optional[bool] = None
    transaction_alerts: Optional[bool] = None
    weekly_reports: Optional[bool] = None


class UserSettings(UserSettingsBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
