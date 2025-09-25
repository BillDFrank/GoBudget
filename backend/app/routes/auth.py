from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from ..database import get_db
from ..models import (
    User as UserModel, Category as CategoryModel, Person as PersonModel
)
from ..schemas import UserCreate, User

DEFAULT_CATEGORIES = [
    'Food & Dining', 'Groceries', 'Transportation', 'Shopping',
    'Entertainment',
    'Bills & Utilities', 'Income', 'Healthcare', 'Education', 'Other'
]

DEFAULT_PERSONS = ['Family']


def create_default_user_data(db: Session, user_id: int):
    """Create default categories and persons for a new user"""
    # Create default categories
    for category_name in DEFAULT_CATEGORIES:
        category = CategoryModel(
            name=category_name,
            user_id=user_id,
            is_default=True
        )
        db.add(category)

    # Create default persons
    for person_name in DEFAULT_PERSONS:
        person = PersonModel(
            name=person_name,
            user_id=user_id,
            is_default=True
        )
        db.add(person)

    db.commit()


SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET environment variable is required but not set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter()


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def authenticate_user(db: Session, username: str, password: str):
    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user:
        return False
    try:
        if not verify_password(password, user.hashed_password):
            return False
    except ValueError as e:
        # Handle bcrypt errors (like password too long)
        print(f"Password verification error for user {username}: {e}")
        return False
    except Exception as e:
        # Handle any other password verification errors
        print(f"Unexpected password verification error for user {username}: "
              f"{e}")
        return False
    return user


def get_current_user(token: str = Depends(oauth2_scheme),
                     db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(UserModel).filter(UserModel.username == username).first()
    if user is None:
        raise credentials_exception
    return user


@router.post("/register", response_model=User)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserModel).filter(
        UserModel.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    db_user = UserModel(username=user.username,
                        hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create default categories and persons for the new user
    create_default_user_data(db, db_user.id)

    return db_user


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(),
          db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=User)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/debug/user/{username}")
def debug_user(username: str, db: Session = Depends(get_db)):
    """Temporary debug endpoint to check user data"""
    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "username": user.username,
        "password_length": (
            len(user.hashed_password) if user.hashed_password else 0
        ),
        "password_starts_with": (user.hashed_password[:10]
                                 if user.hashed_password else None),
        "password_is_valid_bcrypt": (user.hashed_password.startswith('$2b$')
                                     if user.hashed_password else False)
    }
