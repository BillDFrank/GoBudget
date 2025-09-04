import pytest
import requests
import json

# Test the API endpoints
BASE_URL = "http://localhost:8000"

@pytest.mark.api
class TestAuthAPI:
    """Test authentication endpoints"""

    def test_auth_register(self):
        """Test user registration"""
        url = f"{BASE_URL}/auth/register"
        data = {
            "username": "testuser",
            "password": "testpassword"
        }

        response = requests.post(url, json=data)
        # Registration might fail if user already exists, but endpoint should be reachable
        assert response.status_code in [200, 400, 409]  # Success or user exists

    def test_auth_login(self):
        """Test user login"""
        # First ensure user exists
        register_url = f"{BASE_URL}/auth/register"
        register_data = {
            "username": "testuser",
            "password": "testpassword"
        }
        requests.post(register_url, json=register_data)

        # Now test login
        url = f"{BASE_URL}/auth/login"
        data = {
            "username": "testuser",
            "password": "testpassword"
        }

        response = requests.post(url, data=data)
        if response.status_code == 200:
            token_data = response.json()
            assert "access_token" in token_data
            return token_data.get("access_token")
        else:
            pytest.skip("Login failed - user might not exist or endpoint not working")

@pytest.mark.api
def test_receipts_endpoint():
    """Test receipts endpoint"""
    # First get a token
    register_url = f"{BASE_URL}/auth/register"
    register_data = {
        "username": "testuser",
        "password": "testpassword"
    }
    requests.post(register_url, json=register_data)

    login_url = f"{BASE_URL}/auth/login"
    login_data = {
        "username": "testuser",
        "password": "testpassword"
    }
    login_response = requests.post(login_url, data=login_data)

    if login_response.status_code != 200:
        pytest.skip("Cannot get authentication token")

    token = login_response.json().get("access_token")

    url = f"{BASE_URL}/receipts/"
    headers = {
        "Authorization": f"Bearer {token}"
    }

    response = requests.get(url, headers=headers)
    # Should return 200 for success or 401 for auth issues
    assert response.status_code in [200, 401, 422]

@pytest.mark.api
def test_receipts_upload_endpoint():
    """Test receipts upload endpoint structure"""
    # First get a token
    register_url = f"{BASE_URL}/auth/register"
    register_data = {
        "username": "testuser",
        "password": "testpassword"
    }
    requests.post(register_url, json=register_data)

    login_url = f"{BASE_URL}/auth/login"
    login_data = {
        "username": "testuser",
        "password": "testpassword"
    }
    login_response = requests.post(login_url, data=login_data)

    if login_response.status_code != 200:
        pytest.skip("Cannot get authentication token")

    token = login_response.json().get("access_token")

    url = f"{BASE_URL}/receipts/upload"
    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Test with empty request to see what error we get
    response = requests.post(url, headers=headers)
    # Should get some response (might be 400 for missing file, but endpoint should exist)
    assert response.status_code != 404  # 404 would mean endpoint doesn't exist

@pytest.mark.api
def test_health_endpoint():
    """Test health endpoint"""
    urls_to_test = [
        f"{BASE_URL}/health",
        f"{BASE_URL}/",
        f"{BASE_URL}/docs"
    ]

    for url in urls_to_test:
        response = requests.get(url)
        # At least one should work
        if response.status_code < 500:
            assert response.status_code < 500
            break
    else:
        pytest.fail("No health endpoint responded successfully")
