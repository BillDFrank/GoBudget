from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from .auth import get_current_user
from ..models import User, Transaction

router = APIRouter()

@router.get("/")
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # KPIs
    income = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == current_user.id, Transaction.type == 'income').scalar() or 0
    expenses = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == current_user.id, Transaction.type == 'expense').scalar() or 0
    savings = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == current_user.id, Transaction.type == 'savings').scalar() or 0
    investments = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == current_user.id, Transaction.type == 'investment').scalar() or 0
    net_flow = income - expenses

    # For simplicity, no variance calculation yet

    # Charts
    income_by_category = db.query(Transaction.category, func.sum(Transaction.amount)).filter(Transaction.user_id == current_user.id, Transaction.type == 'income').group_by(Transaction.category).all()
    expenses_by_category = db.query(Transaction.category, func.sum(Transaction.amount)).filter(Transaction.user_id == current_user.id, Transaction.type == 'expense').group_by(Transaction.category).all()

    # For line chart, group by month
    net_flow_trend = db.query(func.date_trunc('month', Transaction.date), func.sum(Transaction.amount).label('net')).filter(Transaction.user_id == current_user.id).group_by(func.date_trunc('month', Transaction.date)).all()

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