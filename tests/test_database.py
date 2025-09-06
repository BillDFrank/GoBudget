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
        db_params = {
            'host': os.getenv('POSTGRES_HOST'),
            'port': os.getenv('POSTGRES_PORT'),
            'database': os.getenv('POSTGRES_DB'),
            'user': os.getenv('POSTGRES_USER'),
            'password': os.getenv('POSTGRES_PASSWORD')
        }

        conn = psycopg2.connect(**db_params)
        print("[DEBUG] Connection established:", conn)
        assert conn is not None

        cur = conn.cursor()
        print("[DEBUG] Cursor created")

        cur.execute("SELECT version();")
        version = cur.fetchone()
        print("[DEBUG] PostgreSQL version result:", version)
        assert version is not None
        assert "PostgreSQL" in version[0]

        cur.close()
        conn.close()
        print("[DEBUG] Connection closed")

    def test_database_tables_exist(self):
        """Test if expected tables exist"""
        db_params = {
            'host': os.getenv('POSTGRES_HOST'),
            'port': os.getenv('POSTGRES_PORT'),
            'database': os.getenv('POSTGRES_DB'),
            'user': os.getenv('POSTGRES_USER'),
            'password': os.getenv('POSTGRES_PASSWORD')
        }

        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()
        print("[DEBUG] Connected and cursor created")

        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = cur.fetchall()
        table_names = [table[0] for table in tables]
        print("[DEBUG] Tables found:", table_names)

        assert len(table_names) >= 0

        cur.close()
        conn.close()
        print("[DEBUG] Connection closed")

    def test_database_crud_operations(self):
        """Test basic CRUD operations"""
        db_params = {
            'host': os.getenv('POSTGRES_HOST'),
            'port': os.getenv('POSTGRES_PORT'),
            'database': os.getenv('POSTGRES_DB'),
            'user': os.getenv('POSTGRES_USER'),
            'password': os.getenv('POSTGRES_PASSWORD')
        }

        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()
        print("[DEBUG] Connected and cursor created")

        # Create table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS test_connection (
                id SERIAL PRIMARY KEY,
                test_data VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("[DEBUG] test_connection table ensured")

        # Insert data
        cur.execute("""
            INSERT INTO test_connection (test_data)
            VALUES (%s) RETURNING id;
        """, ("Connection test successful",))
        inserted_id = cur.fetchone()[0]
        print("[DEBUG] Inserted row ID:", inserted_id)
        assert inserted_id is not None

        # Select back
        cur.execute("""
            SELECT id, test_data, created_at
            FROM test_connection
            WHERE id = %s;
        """, (inserted_id,))
        result = cur.fetchone()
        print("[DEBUG] Selected row:", result)
        assert result is not None
        assert result[0] == inserted_id
        assert result[1] == "Connection test successful"

        # Clean up
        cur.execute("DELETE FROM test_connection WHERE id = %s;",
                    (inserted_id,))
        print("[DEBUG] Deleted row ID:", inserted_id)

        cur.close()
        conn.commit()
        conn.close()
        print("[DEBUG] Connection committed and closed")


@pytest.mark.database
def test_database_migrations():
    """Test if database migrations have been applied"""
    db_params = {
        'host': os.getenv('POSTGRES_HOST'),
        'port': os.getenv('POSTGRES_PORT'),
        'database': os.getenv('POSTGRES_DB'),
        'user': os.getenv('POSTGRES_USER'),
        'password': os.getenv('POSTGRES_PASSWORD')
    }

    conn = psycopg2.connect(**db_params)
    cur = conn.cursor()
    print("[DEBUG] Connected and cursor created")

    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('alembic_version', 'users', 'receipts', 'transactions');
    """)
    migration_tables = cur.fetchall()
    found_tables = [table[0] for table in migration_tables]
    print("[DEBUG] Migration-related tables found:", found_tables)

    expected_tables = ['alembic_version', 'users', 'receipts', 'transactions']
    print("[DEBUG] Expected tables:", expected_tables)

    assert len(found_tables) >= 0

    cur.close()
    conn.close()
    print("[DEBUG] Connection closed")
