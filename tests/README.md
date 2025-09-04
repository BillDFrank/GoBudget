# GoBudget Test Suite

This directory contains comprehensive tests for the GoBudget application.

## Test Structure

```
tests/
├── test_api.py          # API endpoint tests
├── test_database.py     # Database connection and operations tests
├── test_upload.py       # File upload functionality tests
├── run_tests.py         # Comprehensive test runner
├── requirements.txt     # Test dependencies
└── README.md           # This file
```

## Test Categories

### 🔗 API Tests (`test_api.py`)

- User registration and login
- Authentication endpoints
- Receipts API endpoints
- Health check endpoints

### 🗄️ Database Tests (`test_database.py`)

- Database connection verification
- Table existence checks
- CRUD operations testing
- Migration verification

### 📤 Upload Tests (`test_upload.py`)

- PDF upload functionality
- File validation
- Upload endpoint testing
- Error handling

## Running Tests

### Local Development

1. **Install test dependencies:**

   ```bash
   pip install -r tests/requirements.txt
   ```

2. **Run all tests:**

   ```bash
   python tests/run_tests.py
   ```

3. **Run specific test categories:**

   ```bash
   # API tests only
   pytest tests/test_api.py -v

   # Database tests only
   pytest tests/test_database.py -v

   # Upload tests only
   pytest tests/test_upload.py -v
   ```

4. **Run with pytest markers:**

   ```bash
   # Run only database tests
   pytest -m database

   # Run only API tests
   pytest -m api

   # Run only upload tests
   pytest -m upload
   ```

### Prerequisites for Local Testing

1. **PostgreSQL Database:**

   - Ensure PostgreSQL is running
   - Database should be accessible with test credentials

2. **Environment Variables:**
   Create a `.env` file in the project root with:

   ```env
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=gobudget
   POSTGRES_PASSWORD=Secure1!
   POSTGRES_DB=gobudget
   DATABASE_URL=postgresql://gobudget:Secure1!@localhost:5432/gobudget
   ```

3. **Backend Service:**
   - Start the backend service on port 8000
   ```bash
   cd backend
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

## GitHub Actions Testing

The test suite runs automatically on:

- Push to `main` branch
- Pull requests to `main` branch
- Manual workflow dispatch

### CI/CD Test Flow

1. **Setup Environment:**

   - PostgreSQL service
   - Python dependencies
   - Test environment variables

2. **Database Tests:**

   - Connection verification
   - Schema validation

3. **Backend Tests:**

   - Start backend service
   - Health checks
   - API endpoint testing

4. **Upload Tests:**

   - File upload functionality
   - Validation testing

5. **Docker Tests:**
   - Build verification
   - Compose configuration validation

## Test Configuration

### pytest.ini

```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --tb=short
    --strict-markers
    --disable-warnings
markers =
    unit: Unit tests
    integration: Integration tests
    api: API endpoint tests
    database: Database tests
    upload: Upload functionality tests
```

## Writing New Tests

### Test File Naming

- Use `test_*.py` naming convention
- Group related tests in classes
- Use descriptive test method names

### Test Structure

```python
import pytest

@pytest.mark.category  # api, database, upload, etc.
def test_descriptive_name():
    """Test description"""
    # Arrange
    # Act
    # Assert
```

### Markers

- `@pytest.mark.api` - API endpoint tests
- `@pytest.mark.database` - Database tests
- `@pytest.mark.upload` - Upload functionality tests
- `@pytest.mark.integration` - Integration tests

## Troubleshooting

### Common Issues

1. **Database Connection Failed:**

   - Check PostgreSQL is running
   - Verify connection credentials
   - Ensure database exists

2. **API Tests Failing:**

   - Ensure backend is running on port 8000
   - Check authentication setup
   - Verify API endpoints exist

3. **Upload Tests Failing:**
   - Check file permissions
   - Verify upload directory exists
   - Ensure proper authentication

### Debug Mode

Run tests with detailed output:

```bash
pytest tests/ -v -s --tb=long
```

### Skipping Tests

Skip specific tests when dependencies aren't available:

```python
@pytest.mark.skipif(condition, reason="Reason for skipping")
def test_something():
    pass
```

## Test Coverage

To check test coverage:

```bash
pytest --cov=backend --cov-report=html
```

This generates an HTML report showing which lines are covered by tests.

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Add appropriate markers
4. Update this README if needed

## CI/CD Integration

The test suite is integrated with GitHub Actions and will:

- Run on every push/PR
- Fail the build if tests fail
- Provide detailed test reports
- Block deployment if tests fail
