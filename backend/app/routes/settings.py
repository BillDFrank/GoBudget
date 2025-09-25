from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from .auth import get_current_user

router = APIRouter()


@router.get("/", response_model=schemas.UserSettings)
async def get_user_settings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user settings, create default settings if none exist."""
    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create default settings for new user
        settings = models.UserSettings(
            user_id=current_user.id,
            currency="USD",
            date_format="MM/DD/YYYY",
            timezone="Eastern Time (ET)",
            dark_mode=False,
            email_notifications=True,
            budget_alerts=True,
            transaction_alerts=False,
            weekly_reports=True
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings


@router.put("/", response_model=schemas.UserSettings)
async def update_user_settings(
    settings_update: schemas.UserSettingsUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user settings."""
    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create settings if they don't exist
        settings = models.UserSettings(user_id=current_user.id)
        db.add(settings)
    
    # Update only provided fields
    update_data = settings_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    return settings


@router.post("/reset", response_model=schemas.UserSettings)
async def reset_user_settings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset user settings to defaults."""
    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        settings = models.UserSettings(user_id=current_user.id)
        db.add(settings)
    else:
        # Reset to defaults
        settings.currency = "USD"
        settings.date_format = "MM/DD/YYYY"
        settings.timezone = "Eastern Time (ET)"
        settings.dark_mode = False
        settings.email_notifications = True
        settings.budget_alerts = True
        settings.transaction_alerts = False
        settings.weekly_reports = True
    
    db.commit()
    db.refresh(settings)
    return settings