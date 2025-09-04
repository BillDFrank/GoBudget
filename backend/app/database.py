from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Handle database connection more gracefully
try:
    engine = create_engine(DATABASE_URL)
    # Test the connection
    with engine.connect() as conn:
        pass
    print("Database connection successful")
except Exception as e:
    print(f"Warning: Database connection failed: {e}")
    print("Using None engine - database operations will fail gracefully")
    engine = None

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None

Base = declarative_base()

def get_db():
    if not SessionLocal:
        # Return a mock session that raises an exception on any operation
        class MockSession:
            def __enter__(self):
                return self
            def __exit__(self, exc_type, exc_val, exc_tb):
                pass
            def close(self):
                pass
            def commit(self):
                raise Exception("Database not available")
            def rollback(self):
                pass
            def add(self, obj):
                raise Exception("Database not available")
            def query(self, *args):
                raise Exception("Database not available")
            def execute(self, *args):
                raise Exception("Database not available")
        
        yield MockSession()
        return
        
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()