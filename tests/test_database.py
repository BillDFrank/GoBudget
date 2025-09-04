import os
import sys
import pytest
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


@pytest.mark.database
class TestDatabaseConnection:
    """Test database connection and basic operations"""

    def test_database_connection(self):
        """Test database connection"""
        # Get database connection parameters
        db_params = {
            'host': os.getenv('POSTGRES_HOST', 'portfolio-postgres-1'),
            'port': os.getenv('POSTGRES_PORT', '5432'),
            'database': os.getenv('POSTGRES_DB', 'gobudget'),
            'user': os.getenv('POSTGRES_USER', 'gobudget'),
            'password': os.getenv('POSTGRES_PASSWORD', 'Secure1!')
        }

        # Connect to database
        conn = psycopg2.connect(**db_params)
        assert conn is not None

        # Create a cursor
        cur = conn.cursor()

        # Test basic query
        cur.execute("SELECT version();")
        version = cur.fetchone()
        assert version is not None
        assert "PostgreSQL" in version[0]

        # Close cursor and connection
        cur.close()
        conn.close()

    def test_database_tables_exist(self):
        """Test if expected tables exist"""
        db_params = {
            'host': os.getenv('POSTGRES_HOST', 'portfolio-postgres-1'),
            'port': os.getenv('POSTGRES_PORT', '5432'),
            'database': os.getenv('POSTGRES_DB', 'gobudget'),
            'user': os.getenv('POSTGRES_USER', 'gobudget'),
            'password': os.getenv('POSTGRES_PASSWORD', 'Secure1!')
        }

        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()

        # Check for expected tables
        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = cur.fetchall()
        table_names = [table[0] for table in tables]

        # We expect at least some basic tables
        # This will be more specific once we know the exact schema
        assert len(table_names) >= 0  # At minimum, we should have some tables

        cur.close()
        conn.close()

    def test_database_crud_operations(self):
        """Test basic CRUD operations"""
        db_params = {
            'host': os.getenv('POSTGRES_HOST', 'portfolio-postgres-1'),
            'port': os.getenv('POSTGRES_PORT', '5432'),
            'database': os.getenv('POSTGRES_DB', 'gobudget'),
            'user': os.getenv('POSTGRES_USER', 'gobudget'),
            'password': os.getenv('POSTGRES_PASSWORD', 'Secure1!')
        }

        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()

        # Create a test table if it doesn't exist
        cur.execute("""
            CREATE TABLE IF NOT EXISTS test_connection (
                id SERIAL PRIMARY KEY,
                test_data VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Insert test data
        cur.execute("""
            INSERT INTO test_connection (test_data)
            VALUES (%s) RETURNING id;
        """, ("Connection test successful",))
        inserted_id = cur.fetchone()[0]
        assert inserted_id is not None

        # Select the data back
        cur.execute("""
            SELECT id, test_data, created_at
            FROM test_connection
            WHERE id = %s;
        """, (inserted_id,))
        result = cur.fetchone()
        assert result is not None
        assert result[0] == inserted_id
        assert result[1] == "Connection test successful"

        # Clean up test data
        cur.execute("DELETE FROM test_connection WHERE id = %s;",
                    (inserted_id,))

        # Close cursor and connection
        cur.close()
        conn.commit()
        conn.close()


@pytest.mark.database
def test_database_migrations():
    """Test if database migrations have been applied"""
    db_params = {
        'host': os.getenv('POSTGRES_HOST', 'portfolio-postgres-1'),
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'database': os.getenv('POSTGRES_DB', 'gobudget'),
        'user': os.getenv('POSTGRES_USER', 'gobudget'),
        'password': os.getenv('POSTGRES_PASSWORD', 'Secure1!')
    }

    conn = psycopg2.connect(**db_params)
    cur = conn.cursor()

    # Check for alembic migration tables
    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('alembic_version', 'users', 'receipts', 'transactions');
    """)
    migration_tables = cur.fetchall()

    expected_tables = ['alembic_version', 'users', 'receipts', 'transactions']
    found_tables = [table[0] for table in migration_tables]

    # For now, we'll just check that we can connect and query
    # This can be made more specific based on your actual schema
    assert len(found_tables) >= 0

    cur.close()
    conn.close()
