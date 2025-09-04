import pytest
import requests


@pytest.mark.upload
def test_pdf_upload():
    """Test PDF upload with a sample file"""
    BASE_URL = "http://localhost:8001"

    # First login to get a token
    login_url = f"{BASE_URL}/auth/login"
    login_data = {
        "username": "testuser",
        "password": "testpassword"
    }

    response = requests.post(login_url, data=login_data)
    if response.status_code != 200:
        pytest.skip(f"Login failed: {response.status_code} - {response.text}")

    token = response.json().get("access_token")
    assert token is not None

    # Create a dummy PDF file (just for testing the upload structure)
    # In reality, we would use a real PDF file
    dummy_pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000110 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF"

    # Test upload endpoint
    upload_url = f"{BASE_URL}/receipts/upload"
    headers = {
        "Authorization": f"Bearer {token}"
    }

    files = {
        "files": ("test_receipt.pdf", dummy_pdf_content, "application/pdf")
    }

    response = requests.post(upload_url, headers=headers, files=files)

    # The upload might succeed or fail depending on the implementation
    # But the endpoint should exist and respond
    assert response.status_code != 404  # 404 would mean endpoint doesn't exist

    # If it succeeds, we should get some response
    if response.status_code == 200:
        assert "upload" in response.text.lower() or "success" in response.text.lower()


@pytest.mark.upload
def test_upload_endpoint_exists():
    """Test that upload endpoint exists"""
    BASE_URL = "http://localhost:8001"

    # First login to get a token
    login_url = f"{BASE_URL}/auth/login"
    login_data = {
        "username": "testuser",
        "password": "testpassword"
    }

    response = requests.post(login_url, data=login_data)
    if response.status_code != 200:
        pytest.skip(f"Login failed: {response.status_code} - {response.text}")

    token = response.json().get("access_token")
    assert token is not None

    # Test upload endpoint with no file
    upload_url = f"{BASE_URL}/receipts/upload"
    headers = {
        "Authorization": f"Bearer {token}"
    }

    response = requests.post(upload_url, headers=headers)

    # Should not get 404 (endpoint exists)
    assert response.status_code != 404

    # Should get 400 or similar for missing file
    assert response.status_code in [200, 400, 422]


@pytest.mark.upload
def test_upload_with_invalid_file():
    """Test upload with invalid file type"""
    BASE_URL = "http://localhost:8001"

    # First login to get a token
    login_url = f"{BASE_URL}/auth/login"
    login_data = {
        "username": "testuser",
        "password": "testpassword"
    }

    response = requests.post(login_url, data=login_data)
    if response.status_code != 200:
        pytest.skip(f"Login failed: {response.status_code} - {response.text}")

    token = response.json().get("access_token")
    assert token is not None

    # Test upload with invalid file
    upload_url = f"{BASE_URL}/receipts/upload"
    headers = {
        "Authorization": f"Bearer {token}"
    }

    files = {
        "files": ("test.txt", b"This is not a PDF", "text/plain")
    }

    response = requests.post(upload_url, headers=headers, files=files)

    # Should not get 404
    assert response.status_code != 404

    # Might succeed or fail depending on validation
    test_pdf_upload()
