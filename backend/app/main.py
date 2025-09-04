from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from .database import engine
from . import models
from .routes import auth, transactions, dashboard, receipts

# Try to create tables, but don't fail if database is not available
try:
    if engine:
        models.Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    else:
        print("Database not available - skipping table creation")
except Exception as e:
    print(f"Warning: Could not create database tables: {e}")
    print("Tables will be created when database becomes available")

app = FastAPI(title="Go Budget", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(transactions.router,
                   prefix="/transactions", tags=["transactions"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(receipts.router, prefix="/receipts", tags=["receipts"])


@app.get("/")
def read_root():
    return {"message": "Welcome to Go Budget"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}
