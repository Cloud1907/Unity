import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_user_creation():
    # Login as admin first to get token
    login_data = {
        "email": "melih.bulut@4flow.com",
        "password": "test123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create new user
    new_user = {
        "fullName": "Test User",
        "email": f"test_user_{json.loads(json.dumps(str(requests.utils.quote('test'))))}@example.com",
        "password": "password123",
        "role": "member",
        "department": "Engineering"
    }
    # Unique email
    import time
    new_user["email"] = f"test_{int(time.time())}@example.com"
    
    print(f"Creating user: {new_user['email']}")
    response = requests.post(f"{BASE_URL}/users", json=new_user, headers=headers)
    
    if response.status_code == 201:
        print("User creation successful!")
        print(json.dumps(response.json(), indent=2))
        return response.json()["_id"]
    else:
        print(f"User creation failed: {response.status_code}")
        print(response.text)
        return None

if __name__ == "__main__":
    test_user_creation()
