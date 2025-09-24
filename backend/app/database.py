from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create a base for models
Base = declarative_base()

# Initialize engine and session variables
engine = None
SessionLocal = None


def init_database():
    """Initialize database engine and session factory"""
    global engine, SessionLocal

    if engine is not None:
        return engine

    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is not set")

    try:
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=engine)
        logger.info("Database engine created successfully")
        return engine
    except Exception as e:
        logger.error(f"Failed to create database engine: {e}")
        raise


# Only initialize database if DATABASE_URL is available AND we're not in test mode
# This allows models to be imported without requiring a database connection
# Database will be initialized when actually needed via get_db() or init_database()
if DATABASE_URL and not os.getenv("PYTEST_CURRENT_TEST"):
    init_database()


def get_db():
    # Ensure database is initialized before creating session
    if SessionLocal is None:
        init_database()

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
