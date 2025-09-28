from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from ..database import get_db
from .auth import get_current_user
from ..models import User, Transaction
from datetime import datetime
from dateutil.relativedelta import relativedelta

router = APIRouter()


@router.get("/income/")
def get_income_data(
    start_months: int = Query(
        default=12,
        description="Number of months to look back from current month"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get income data for the income page.

    Returns:
    - This month's total income
    - Last month's total income
    - Average monthly income (trailing specified months)
    - Bar chart data: monthly income totals and subtotals by description
    """
    print(f"DEBUG: Received start_months parameter: {start_months}")

    current_date = datetime.now()
    current_month = current_date.month
    current_year = current_date.year

    # Calculate last month (handle year boundary)
    if current_month == 1:
        last_month = 12
        last_year = current_year - 1
    else:
        last_month = current_month - 1
        last_year = current_year

    # This month's total income
    this_month_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Income',
        extract('year', Transaction.date) == current_year,
        extract('month', Transaction.date) == current_month
    ).scalar() or 0

    # Last month's total income
    last_month_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Income',
        extract('year', Transaction.date) == last_year,
        extract('month', Transaction.date) == last_month
    ).scalar() or 0

    # Average monthly income (trailing specified months)
    months_ago = current_date - relativedelta(months=start_months)
    print(f"DEBUG: Looking back to: {months_ago}")

    # Get total income for the period
    total_income_period = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Income',
        Transaction.date >= months_ago
    ).scalar() or 0

    # Count actual months with data (not just selected months)
    actual_months_with_data = db.query(
        func.count(func.distinct(
            func.concat(
                extract('year', Transaction.date),
                '-',
                extract('month', Transaction.date)
            )
        ))
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Income',
        Transaction.date >= months_ago
    ).scalar() or 1

    print(f"DEBUG: Total income in period: {total_income_period}")
    print(f"DEBUG: Actual months with data: {actual_months_with_data}")

    average_monthly_income = total_income_period / actual_months_with_data

    # Bar chart data: Monthly income with subtotals by description
    # Get specified months of data
    monthly_data = db.query(
        extract('year', Transaction.date).label('year'),
        extract('month', Transaction.date).label('month'),
        Transaction.description,
        func.sum(Transaction.amount).label('amount')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Income',
        Transaction.date >= months_ago
    ).group_by(
        extract('year', Transaction.date),
        extract('month', Transaction.date),
        Transaction.description
    ).order_by(
        extract('year', Transaction.date),
        extract('month', Transaction.date)
    ).all()

    print(f"DEBUG: Found {len(monthly_data)} monthly data records")

    # Process data for bar chart format
    chart_data = {}
    descriptions_set = set()

    for year, month, description, amount in monthly_data:
        month_key = f"{int(year)}-{int(month):02d}"
        if month_key not in chart_data:
            chart_data[month_key] = {
                'month': month_key,
                'total': 0
            }

        chart_data[month_key][description or 'Other'] = float(amount)
        chart_data[month_key]['total'] += float(amount)
        descriptions_set.add(description or 'Other')

    # Convert to list format for frontend
    chart_data_list = list(chart_data.values())
    descriptions_list = list(descriptions_set)

    print(f"DEBUG: Generated {len(chart_data_list)} chart data points")
    print(f"DEBUG: Descriptions: {descriptions_list}")

    return {
        'cards': {
            'this_month': float(this_month_income),
            'last_month': float(last_month_income),
            'average_monthly': float(average_monthly_income)
        },
        'bar_chart': {
            'data': chart_data_list,
            'keys': descriptions_list
        }
    }


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


@router.get("/expenses/")
def get_expenses_data(
    start_months: int = Query(
        default=12,
        description="Number of months to look back from current month"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get expenses data for the expenses page.

    Returns:
    - This month's total expenses
    - Last month's total expenses
    - Average monthly expenses (trailing specified months)
    - Line chart data: monthly expense totals
    - Bar chart data: monthly expenses by categories
    """

    current_date = datetime.now()
    current_month = current_date.month
    current_year = current_date.year

    # Calculate last month (handle year boundary)
    if current_month == 1:
        last_month = 12
        last_year = current_year - 1
    else:
        last_month = current_month - 1
        last_year = current_year

    # This month's total expenses (make positive for display)
    this_month_expenses = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Expense',
        extract('year', Transaction.date) == current_year,
        extract('month', Transaction.date) == current_month
    ).scalar() or 0
    this_month_expenses = abs(float(this_month_expenses))

    # Last month's total expenses (make positive for display)
    last_month_expenses = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Expense',
        extract('year', Transaction.date) == last_year,
        extract('month', Transaction.date) == last_month
    ).scalar() or 0
    last_month_expenses = abs(float(last_month_expenses))

    # Average monthly expenses (trailing specified months)
    months_ago = current_date - relativedelta(months=start_months)
    print(f"DEBUG: Looking back to: {months_ago}")

    # Get total expenses for the period
    total_expenses_period = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Expense',
        Transaction.date >= months_ago
    ).scalar() or 0

    # Count actual months with data (not just selected months)
    actual_months_with_data = db.query(
        func.count(func.distinct(
            func.concat(
                extract('year', Transaction.date),
                '-',
                extract('month', Transaction.date)
            )
        ))
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Expense',
        Transaction.date >= months_ago
    ).scalar() or 1

    print(f"DEBUG: Total expenses in period: {total_expenses_period}")
    print(f"DEBUG: Actual months with data: {actual_months_with_data}")

    average_monthly_expenses = (
        abs(float(total_expenses_period)) / actual_months_with_data
    )

    # Line chart data: Monthly total expenses
    monthly_totals = db.query(
        extract('year', Transaction.date).label('year'),
        extract('month', Transaction.date).label('month'),
        func.sum(Transaction.amount).label('total_amount')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Expense',
        Transaction.date >= months_ago
    ).group_by(
        extract('year', Transaction.date),
        extract('month', Transaction.date)
    ).order_by(
        extract('year', Transaction.date),
        extract('month', Transaction.date)
    ).all()

    line_chart_data = [
        {
            'month': f"{int(year)}-{int(month):02d}",
            'total': abs(float(total_amount))
        }
        for year, month, total_amount in monthly_totals
    ]

    # Bar chart data: Monthly expenses with subtotals by category
    monthly_category_data = db.query(
        extract('year', Transaction.date).label('year'),
        extract('month', Transaction.date).label('month'),
        Transaction.category,
        func.sum(Transaction.amount).label('amount')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'Expense',
        Transaction.date >= months_ago
    ).group_by(
        extract('year', Transaction.date),
        extract('month', Transaction.date),
        Transaction.category
    ).order_by(
        extract('year', Transaction.date),
        extract('month', Transaction.date)
    ).all()

    print(f"DEBUG: Found {len(monthly_category_data)} monthly category "
          f"data records")

    # Process data for bar chart format
    chart_data = {}
    categories_set = set()

    for year, month, category, amount in monthly_category_data:
        month_key = f"{int(year)}-{int(month):02d}"
        if month_key not in chart_data:
            chart_data[month_key] = {
                'month': month_key,
                'total': 0
            }

        category_name = category or 'Other'
        chart_data[month_key][category_name] = abs(float(amount))
        chart_data[month_key]['total'] += abs(float(amount))
        categories_set.add(category_name)

    # Convert to list format for frontend
    chart_data_list = list(chart_data.values())
    categories_list = list(categories_set)

    print(f"DEBUG: Generated {len(chart_data_list)} chart data points")
    print(f"DEBUG: Categories: {categories_list}")

    return {
        'cards': {
            'this_month': this_month_expenses,
            'last_month': last_month_expenses,
            'average_monthly': average_monthly_expenses
        },
        'line_chart': {
            'data': line_chart_data
        },
        'bar_chart': {
            'data': chart_data_list,
            'keys': categories_list
        }
    }


@router.get("/")
def get_dashboard(
    year: int = Query(default=None, description="Year for dashboard data"),
    month: int = Query(default=None, description="Month for dashboard data"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get dashboard data for a specific month/year or current month if not
    specified.

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
