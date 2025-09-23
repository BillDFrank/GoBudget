from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Transaction as TransactionModel, User
from ..schemas import TransactionCreate, Transaction as TransactionSchema
from .auth import get_current_user
import pandas as pd
import io
from datetime import datetime
from typing import List

router = APIRouter()


@router.get("/", response_model=list[TransactionSchema])
def get_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transactions = db.query(TransactionModel).filter(
        TransactionModel.user_id == current_user.id).all()
    return transactions


@router.post("/", response_model=TransactionSchema)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_transaction = TransactionModel(
        **transaction.dict(), user_id=current_user.id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.put("/{transaction_id}", response_model=TransactionSchema)
def update_transaction(transaction_id: int, transaction: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_transaction = db.query(TransactionModel).filter(
        TransactionModel.id == transaction_id, TransactionModel.user_id == current_user.id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for key, value in transaction.dict().items():
        setattr(db_transaction, key, value)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_transaction = db.query(TransactionModel).filter(
        TransactionModel.id == transaction_id, TransactionModel.user_id == current_user.id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(db_transaction)
    db.commit()
    return {"message": "Transaction deleted"}


@router.post("/import-csv")
async def import_csv_transactions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import transactions from a CSV file.

    Expected CSV columns:
    - date (required): Date in YYYY-MM-DD format or parseable date format
    - type (required): Transaction type (Income, Expense, Transfer)
    - person (optional): Person/entity, defaults to "Family" if not provided
    - category (required): Transaction category
    - description (required): Transaction description
    - amount (required): Transaction amount (negative for expenses, positive for income)
    """

    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV file")

    try:
        # Read the CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

        # Validate required columns
        required_columns = {'date', 'type',
                            'category', 'description', 'amount'}
        optional_columns = {'person'}
        all_valid_columns = required_columns | optional_columns

        # Check if required columns exist
        missing_columns = required_columns - set(df.columns)
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )

        # Check for any unexpected columns
        unexpected_columns = set(df.columns) - all_valid_columns
        if unexpected_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Unexpected columns found: {', '.join(unexpected_columns)}. Expected columns: {', '.join(all_valid_columns)}"
            )

        # Add default 'person' column if not present
        if 'person' not in df.columns:
            df['person'] = 'Family'
        else:
            # Fill empty person values with 'Family'
            df['person'] = df['person'].fillna('Family')
            df.loc[df['person'].str.strip() == '', 'person'] = 'Family'

        # Validate and process data
        errors = []
        valid_transactions = []

        # Valid transaction types and categories (based on frontend constants)
        valid_types = {'Income', 'Expense', 'Transfer'}
        valid_categories = {
            'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
            'Bills & Utilities', 'Income', 'Healthcare', 'Education', 'Other'
        }

        for index, row in df.iterrows():
            row_num = index + 2  # +2 because index starts at 0 and we have a header row
            row_errors = []

            # Validate date
            try:
                if pd.isna(row['date']) or str(row['date']).strip() == '':
                    row_errors.append(f"Row {row_num}: Date is required")
                else:
                    parsed_date = pd.to_datetime(row['date']).date()
            except Exception:
                row_errors.append(
                    f"Row {row_num}: Invalid date format. Expected YYYY-MM-DD or similar parseable format")

            # Validate type
            if pd.isna(row['type']) or str(row['type']).strip() == '':
                row_errors.append(f"Row {row_num}: Type is required")
            elif row['type'] not in valid_types:
                row_errors.append(
                    f"Row {row_num}: Invalid type '{row['type']}'. Must be one of: {', '.join(valid_types)}")

            # Validate category
            if pd.isna(row['category']) or str(row['category']).strip() == '':
                row_errors.append(f"Row {row_num}: Category is required")
            elif row['category'] not in valid_categories:
                row_errors.append(
                    f"Row {row_num}: Invalid category '{row['category']}'. Must be one of: {', '.join(valid_categories)}")

            # Validate description
            if pd.isna(row['description']) or str(row['description']).strip() == '':
                row_errors.append(f"Row {row_num}: Description is required")

            # Validate amount
            try:
                if pd.isna(row['amount']):
                    row_errors.append(f"Row {row_num}: Amount is required")
                else:
                    amount = float(row['amount'])
            except (ValueError, TypeError):
                row_errors.append(
                    f"Row {row_num}: Amount must be a valid number")

            # If there are errors for this row, add them to the errors list
            if row_errors:
                errors.extend(row_errors)
            else:
                # Create transaction data
                transaction_data = {
                    'date': parsed_date,
                    'type': str(row['type']).strip(),
                    'person': str(row['person']).strip(),
                    'category': str(row['category']).strip(),
                    'description': str(row['description']).strip(),
                    'amount': amount
                }
                valid_transactions.append(transaction_data)

        # If there are validation errors, return them
        if errors:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "CSV validation failed",
                    "errors": errors,
                    "valid_rows": len(valid_transactions),
                    "total_rows": len(df)
                }
            )

        # If no valid transactions, return error
        if not valid_transactions:
            raise HTTPException(
                status_code=400, detail="No valid transactions found in CSV file")

        # Save transactions to database
        created_transactions = []
        for transaction_data in valid_transactions:
            db_transaction = TransactionModel(
                **transaction_data, user_id=current_user.id)
            db.add(db_transaction)
            created_transactions.append(transaction_data)

        db.commit()

        return {
            "message": f"Successfully imported {len(created_transactions)} transactions",
            "imported_count": len(created_transactions),
            "total_rows": len(df),
            # Show first 3 transactions as preview
            "sample_data": created_transactions[:3]
        }

    except HTTPException:
        # Re-raise HTTPExceptions (validation errors)
        raise
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Error processing CSV file: {str(e)}"
        )


@router.post("/preview-csv")
async def preview_csv_transactions(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Preview transactions from a CSV file without importing them.
    This endpoint validates the CSV and returns the parsed transactions for review.
    """

    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV file")

    try:
        # Read the CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

        # Validate required columns
        required_columns = {'date', 'type',
                            'category', 'description', 'amount'}
        optional_columns = {'person'}
        all_valid_columns = required_columns | optional_columns

        # Check if required columns exist
        missing_columns = required_columns - set(df.columns)
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )

        # Check for any unexpected columns
        unexpected_columns = set(df.columns) - all_valid_columns
        if unexpected_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Unexpected columns found: {', '.join(unexpected_columns)}. Expected columns: {', '.join(all_valid_columns)}"
            )

        # Add default 'person' column if not present
        if 'person' not in df.columns:
            df['person'] = 'Family'
        else:
            # Fill empty person values with 'Family'
            df['person'] = df['person'].fillna('Family')
            df.loc[df['person'].str.strip() == '', 'person'] = 'Family'

        # Validate and process data
        errors = []
        valid_transactions = []

        # Valid transaction types and categories (based on frontend constants)
        valid_types = {'Income', 'Expense', 'Transfer'}
        valid_categories = {
            'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
            'Bills & Utilities', 'Income', 'Healthcare', 'Education', 'Other'
        }

        for index, row in df.iterrows():
            row_num = index + 2  # +2 because index starts at 0 and we have a header row
            row_errors = []

            # Validate date
            try:
                if pd.isna(row['date']) or str(row['date']).strip() == '':
                    row_errors.append(f"Row {row_num}: Date is required")
                else:
                    parsed_date = pd.to_datetime(row['date']).date()
            except Exception:
                row_errors.append(
                    f"Row {row_num}: Invalid date format. Expected YYYY-MM-DD or similar parseable format")

            # Validate type
            if pd.isna(row['type']) or str(row['type']).strip() == '':
                row_errors.append(f"Row {row_num}: Type is required")
            elif row['type'] not in valid_types:
                row_errors.append(
                    f"Row {row_num}: Invalid type '{row['type']}'. Must be one of: {', '.join(valid_types)}")

            # Validate category
            if pd.isna(row['category']) or str(row['category']).strip() == '':
                row_errors.append(f"Row {row_num}: Category is required")
            elif row['category'] not in valid_categories:
                row_errors.append(
                    f"Row {row_num}: Invalid category '{row['category']}'. Must be one of: {', '.join(valid_categories)}")

            # Validate description
            if pd.isna(row['description']) or str(row['description']).strip() == '':
                row_errors.append(f"Row {row_num}: Description is required")

            # Validate amount
            try:
                if pd.isna(row['amount']):
                    row_errors.append(f"Row {row_num}: Amount is required")
                else:
                    amount = float(row['amount'])
            except (ValueError, TypeError):
                row_errors.append(
                    f"Row {row_num}: Amount must be a valid number")

            # If there are errors for this row, add them to the errors list
            if row_errors:
                errors.extend(row_errors)
            else:
                # Create transaction data
                transaction_data = {
                    'date': str(parsed_date),
                    'type': str(row['type']).strip(),
                    'person': str(row['person']).strip(),
                    'category': str(row['category']).strip(),
                    'description': str(row['description']).strip(),
                    'amount': amount
                }
                valid_transactions.append(transaction_data)

        # Return preview data (even if there are some errors)
        return {
            "valid_transactions": valid_transactions,
            "errors": errors,
            "total_rows": len(df),
            "valid_count": len(valid_transactions),
            "error_count": len(errors)
        }

    except HTTPException:
        # Re-raise HTTPExceptions (validation errors)
        raise
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Error processing CSV file: {str(e)}"
        )
