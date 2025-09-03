import requests
import json

# Test the API endpoints
BASE_URL = "http://localhost:8000"

def test_auth_register():
    """Test user registration"""
    url = f"{BASE_URL}/auth/register"
    data = {
        "username": "testuser",
        "password": "testpassword"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Register Response Status: {response.status_code}")
        print(f"Register Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Register Error: {e}")
        return False

def test_auth_login():
    """Test user login"""
    url = f"{BASE_URL}/auth/login"
    data = {
        "username": "testuser",
        "password": "testpassword"
    }
    
    try:
        response = requests.post(url, data=data)
        print(f"Login Response Status: {response.status_code}")
        print(f"Login Response: {response.text}")
        
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get("access_token")
        return None
    except Exception as e:
        print(f"Login Error: {e}")
        return None

def test_receipts_endpoint(token):
    """Test receipts endpoint"""
    url = f"{BASE_URL}/receipts/"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Receipts Response Status: {response.status_code}")
        print(f"Receipts Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Receipts Error: {e}")
        return False

def test_receipts_upload_endpoint(token):
    """Test receipts upload endpoint structure"""
    url = f"{BASE_URL}/receipts/upload"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Test with empty request to see what error we get
    try:
        response = requests.post(url, headers=headers)
        print(f"Upload Response Status: {response.status_code}")
        print(f"Upload Response: {response.text}")
        return response.status_code
    except Exception as e:
        print(f"Upload Error: {e}")
        return None

if __name__ == "__main__":
    print("Testing API endpoints...")
    
    # Test registration
    print("\n1. Testing Registration...")
    register_success = test_auth_register()
    
    # Test login
    print("\n2. Testing Login...")
    token = test_auth_login()
    
    if token:
        print(f"Got token: {token[:20]}...")
        
        # Test receipts endpoint
        print("\n3. Testing Receipts Endpoint...")
        receipts_success = test_receipts_endpoint(token)
        
        # Test upload endpoint
        print("\n4. Testing Upload Endpoint...")
        upload_status = test_receipts_upload_endpoint(token)
        
        print(f"\nResults:")
        print(f"- Registration: {'✓' if register_success else '✗'}")
        print(f"- Login: {'✓' if token else '✗'}")
        print(f"- Receipts: {'✓' if receipts_success else '✗'}")
        print(f"- Upload endpoint reachable: {'✓' if upload_status else '✗'}")
    else:
        print("Could not get token, skipping other tests")
