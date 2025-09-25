from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..database import get_db
from ..models import Category as CategoryModel, User
from ..schemas import CategoryCreate, Category as CategorySchema
from .auth import get_current_user
from typing import List

router = APIRouter()


@router.get("/", response_model=List[CategorySchema])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all categories for the current user (including defaults)"""
    categories = db.query(CategoryModel).filter(
        CategoryModel.user_id == current_user.id
    ).all()
    return categories


@router.post("/", response_model=CategorySchema)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new category for the current user"""
    # Check if category already exists for this user
    existing = db.query(CategoryModel).filter(
        and_(
            CategoryModel.user_id == current_user.id,
            CategoryModel.name == category.name
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Category already exists"
        )

    db_category = CategoryModel(
        name=category.name,
        user_id=current_user.id,
        is_default=False
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.put("/{category_id}", response_model=CategorySchema)
def update_category(
    category_id: int,
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a category (only user-created categories can be updated)"""
    db_category = db.query(CategoryModel).filter(
        and_(
            CategoryModel.id == category_id,
            CategoryModel.user_id == current_user.id
        )
    ).first()

    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    if db_category.is_default:
        raise HTTPException(
            status_code=400,
            detail="Cannot update default categories"
        )

    # Check if new name conflicts with existing category
    existing = db.query(CategoryModel).filter(
        and_(
            CategoryModel.user_id == current_user.id,
            CategoryModel.name == category.name,
            CategoryModel.id != category_id
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Category name already exists"
        )

    db_category.name = category.name
    db.commit()
    db.refresh(db_category)
    return db_category


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a category (only user-created categories can be deleted)"""
    db_category = db.query(CategoryModel).filter(
        and_(
            CategoryModel.id == category_id,
            CategoryModel.user_id == current_user.id
        )
    ).first()

    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    if db_category.is_default:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete default categories"
        )

    db.delete(db_category)
    db.commit()
    return {"message": "Category deleted"}
