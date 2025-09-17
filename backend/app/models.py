from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    outlook_access_token = Column(String, nullable=True)
    outlook_refresh_token = Column(String, nullable=True)
    outlook_token_expires = Column(DateTime, nullable=True)
    outlook_state = Column(String, nullable=True)
    outlook_last_sync = Column(DateTime, nullable=True)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    type = Column(String)
    person = Column(String)
    category = Column(String)
    description = Column(String)
    amount = Column(Float)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User")


class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    market = Column(String, nullable=False)
    branch = Column(String, nullable=False)
    invoice = Column(String)
    date = Column(Date, nullable=False)
    total = Column(Float, nullable=False)  # Total amount before discounts
    total_discount = Column(Float, nullable=False, default=0)  # Total discount amount
    total_paid = Column(Float, nullable=False)  # Total amount actually paid (after discounts)
    # Prevent duplicate processing
    filename = Column(String, nullable=True, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User")
    products = relationship(
        "ReceiptProduct", back_populates="receipt", cascade="all, delete-orphan")


class ReceiptProduct(Base):
    __tablename__ = "receipt_products"

    id = Column(Integer, primary_key=True, index=True)
    product_type = Column(String, nullable=False)
    product = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    discount = Column(Float, default=0)
    discount2 = Column(Float, default=0)
    receipt_id = Column(Integer, ForeignKey("receipts.id"), nullable=False)

    receipt = relationship("Receipt", back_populates="products")
