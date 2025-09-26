from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from ..database import get_db
from .auth import get_current_user
from ..models import User, Transaction
from datetime import datetime
from typing import Optional

router = APIRouter()


@router.get("/income-overview/")
def get_income_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Calculate total income
    total_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Income'
    ).scalar() or 0

    # Calculate monthly average (assuming we have data for multiple months)
    monthly_count = db.query(func.count(func.distinct(func.date_trunc('month', Transaction.date)))).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Income'
    ).scalar() or 1

    average_income = total_income / monthly_count if monthly_count > 0 else 0

    # Monthly trend
    monthly_trend = db.query(
        func.date_trunc('month', Transaction.date).label('month'),
        func.sum(Transaction.amount).label('amount')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Income'
    ).group_by(func.date_trunc('month', Transaction.date)).order_by(func.date_trunc('month', Transaction.date)).all()

    # Category breakdown
    category_totals = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label('amount')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Income'
    ).group_by(Transaction.category).all()

    # Calculate percentages
    category_breakdown = []
    for category, amount in category_totals:
        percentage = (amount / total_income * 100) if total_income > 0 else 0
        category_breakdown.append({
            'category': category,
            'amount': float(amount),
            'percentage': percentage
        })

    return {
        'total': float(total_income),
        'average': float(average_income),
        'monthly_trend': [{'month': str(month), 'amount': float(amount)} for month, amount in monthly_trend],
        'category_breakdown': category_breakdown
    }


@router.get("/")
def get_dashboard(
    year: int = Query(default=None, description="Year for dashboard data"),
    month: int = Query(default=None, description="Month for dashboard data"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get dashboard data for a specific month/year or current month if not specified.

    Returns:
    - KPIs: Monthly sums for Income, Expense, Investment, Savings
    - Charts: Income by description and Expenses by category pie charts
    """
    # Default to current month/year if not provided
    current_date = datetime.now()
    target_year = year or current_date.year
    target_month = month or current_date.month

    # Base filter for the selected month and user
    base_filter = [
        Transaction.user_id == current_user.id,
        extract('year', Transaction.date) == target_year,
        extract('month', Transaction.date) == target_month
    ]

    # KPIs - Monthly sums by transaction type
    income = db.query(func.sum(Transaction.amount)).filter(
        *base_filter,
        Transaction.type == 'Income'
    ).scalar() or 0

    expenses = db.query(func.sum(Transaction.amount)).filter(
        *base_filter,
        Transaction.type == 'Expense'
    ).scalar() or 0

    investments = db.query(func.sum(Transaction.amount)).filter(
        *base_filter,
        Transaction.type == 'Investment'
    ).scalar() or 0

    savings = db.query(func.sum(Transaction.amount)).filter(
        *base_filter,
        Transaction.type == 'Savings'
    ).scalar() or 0

    # Chart data
    # Income by description (for pie chart)
    income_by_description = db.query(
        Transaction.description,
        func.sum(Transaction.amount).label('amount')
    ).filter(
        *base_filter,
        Transaction.type == 'Income'
    ).group_by(Transaction.description).all()

    # Expenses by category (for pie chart)
    expenses_by_category = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label('amount')
    ).filter(
        *base_filter,
        Transaction.type == 'Expense'
    ).group_by(Transaction.category).all()

    return {
        "month": target_month,
        "year": target_year,
        "kpis": {
            "income": float(income),
            # Make expenses positive for display
            "expenses": float(abs(expenses)),
            "investments": float(investments),
            "savings": float(savings)
        },
        "charts": {
            "income_by_description": [
                {"id": desc, "label": desc, "value": float(amount)}
                for desc, amount in income_by_description
            ],
            "expenses_by_category": [
                {"id": cat, "label": cat, "value": float(abs(amount))}
                for cat, amount in expenses_by_category
            ]
        }
    }
