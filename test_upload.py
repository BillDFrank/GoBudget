import requests

def test_pdf_upload():
    """Test PDF upload with a sample file"""
    BASE_URL = "http://localhost:8000"
    
    # First login to get a token
    login_url = f"{BASE_URL}/auth/login"
    login_data = {
        "username": "testuser",
        "password": "testpassword"
    }
    
    response = requests.post(login_url, data=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.status_code} - {response.text}")
        return
    
    token = response.json().get("access_token")
    print(f"Got token: {token[:20]}...")
    
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
    
    try:
        print("Testing upload endpoint...")
        response = requests.post(upload_url, headers=headers, files=files)
        print(f"Upload Response Status: {response.status_code}")
        print(f"Upload Response: {response.text}")
        
        if response.status_code == 200:
            print("✓ Upload endpoint is working correctly!")
        else:
            print(f"✗ Upload failed with status {response.status_code}")
            
    except Exception as e:
        print(f"Upload Error: {e}")

if __name__ == "__main__":
    test_pdf_upload()
