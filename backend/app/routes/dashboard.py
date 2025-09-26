from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from .auth import get_current_user
from ..models import User, Transaction

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
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # KPIs
    income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id, Transaction.type == 'Income').scalar() or 0
    expenses = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id, Transaction.type == 'Expense').scalar() or 0
    savings = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id, Transaction.type == 'Savings').scalar() or 0
    investments = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id, Transaction.type == 'Investment').scalar() or 0
    net_flow = income - expenses

    # For simplicity, no variance calculation yet

    # Charts
    income_by_category = db.query(Transaction.category, func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id, Transaction.type == 'Income').group_by(Transaction.category).all()
    expenses_by_category = db.query(Transaction.category, func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id, Transaction.type == 'Expense').group_by(Transaction.category).all()

    # For line chart, group by month
    net_flow_trend = db.query(func.date_trunc('month', Transaction.date), func.sum(Transaction.amount).label(
        'net')).filter(Transaction.user_id == current_user.id).group_by(func.date_trunc('month', Transaction.date)).all()

    return {
        "kpis": {
            "income": income,
            "expenses": expenses,
            "savings": savings,
            "investments": investments,
            "net_flow": net_flow
        },
        "charts": {
            "income_by_category": [{"category": cat, "amount": amt} for cat, amt in income_by_category],
            "expenses_by_category": [{"category": cat, "amount": amt} for cat, amt in expenses_by_category],
            "net_flow_trend": [{"month": str(month), "net": net} for month, net in net_flow_trend]
        }
    }
