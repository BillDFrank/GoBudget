from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
import logging
from .database import init_database, get_db
from . import models
from .routes import auth, transactions, dashboard, receipts, outlook

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
logger.info(f"Loading .env from: {env_path}")
load_dotenv(dotenv_path=env_path)

# Try to create tables, but don't fail if database is not available
try:
    engine = init_database()
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not create database tables: {e}")
    print("Tables will be created when database becomes available")

app = FastAPI(title="Go Budget", version="1.0.0",
              docs_url="/api/docs", redoc_url="/api/redoc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",  # Local development
        "https://gobudget.duckdns.org",  # Production domain
        "http://localhost:3000"  # Alternative local development port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(transactions.router,
                   prefix="/api/transactions", tags=["transactions"])
app.include_router(
    dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(receipts.router, prefix="/api/receipts", tags=["receipts"])
app.include_router(outlook.router, prefix="/api/outlook", tags=["outlook"])


@app.get("/")
def read_root():
    return {"message": "Welcome to Go Budget"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/api/health/db")
def db_health_check(db: Session = Depends(get_db)):
    try:
        # Try to execute a simple query with proper text() declaration
        from sqlalchemy import text
        result = db.execute(text("SELECT 1"))
        return {"status": "database healthy", "timestamp": datetime.now().isoformat()}
    except Exception as e:
        return {"status": "database error", "error": str(e), "timestamp": datetime.now().isoformat()}


@app.get("/api/debug/users")
def debug_users(db: Session = Depends(get_db)):
    try:
        user_count = db.query(models.User).count()
        users = db.query(models.User).all()
        return {
            "user_count": user_count,
            "users": [{"id": u.id, "username": u.username} for u in users],
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e), "timestamp": datetime.now().isoformat()}
