import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("DATABASE_URL not found in environment variables")
    exit(1)

print(f"Attempting to connect to: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version()"))
        version = result.fetchone()
        print("Connection successful!")
        print(f"PostgreSQL version: {version[0]}")
except Exception as e:
    print(f"Connection failed: {e}")
    print("\nTroubleshooting:")
    print("1. Make sure PostgreSQL is running")
    print("2. Check if the host and port are correct")
    print("3. Verify username, password, and database name")
    print("4. Ensure PostgreSQL is accepting connections from localhost")
    print(f"5. Current DATABASE_URL: {DATABASE_URL}")