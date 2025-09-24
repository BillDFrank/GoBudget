from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..database import get_db
from ..models import Person as PersonModel, User
from ..schemas import PersonCreate, Person as PersonSchema
from .auth import get_current_user
from typing import List

router = APIRouter()


@router.get("/", response_model=List[PersonSchema])
def get_persons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all persons for the current user (including defaults)"""
    persons = db.query(PersonModel).filter(
        PersonModel.user_id == current_user.id
    ).all()
    return persons


@router.post("/", response_model=PersonSchema)
def create_person(
    person: PersonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new person for the current user"""
    # Check if person already exists for this user
    existing = db.query(PersonModel).filter(
        and_(
            PersonModel.user_id == current_user.id,
            PersonModel.name == person.name
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Person already exists"
        )

    db_person = PersonModel(
        name=person.name,
        user_id=current_user.id,
        is_default=False
    )
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    return db_person


@router.put("/{person_id}", response_model=PersonSchema)
def update_person(
    person_id: int,
    person: PersonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a person (only user-created persons can be updated)"""
    db_person = db.query(PersonModel).filter(
        and_(
            PersonModel.id == person_id,
            PersonModel.user_id == current_user.id
        )
    ).first()

    if not db_person:
        raise HTTPException(status_code=404, detail="Person not found")

    if db_person.is_default:
        raise HTTPException(
            status_code=400,
            detail="Cannot update default persons"
        )

    # Check if new name conflicts with existing person
    existing = db.query(PersonModel).filter(
        and_(
            PersonModel.user_id == current_user.id,
            PersonModel.name == person.name,
            PersonModel.id != person_id
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Person name already exists"
        )

    db_person.name = person.name
    db.commit()
    db.refresh(db_person)
    return db_person


@router.delete("/{person_id}")
def delete_person(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a person (only user-created persons can be deleted)"""
    db_person = db.query(PersonModel).filter(
        and_(
            PersonModel.id == person_id,
            PersonModel.user_id == current_user.id
        )
    ).first()

    if not db_person:
        raise HTTPException(status_code=404, detail="Person not found")

    if db_person.is_default:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete default persons"
        )

    db.delete(db_person)
    db.commit()
    return {"message": "Person deleted"}
