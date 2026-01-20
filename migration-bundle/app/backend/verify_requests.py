import requests

BASE_URL = "http://localhost:8000/api"

def login(email, password):
    try:
        resp = requests.post(
            f"{BASE_URL}/auth/login", 
            json={"email": email, "password": password}
        )
        if resp.status_code == 200:
            return resp.json()["access_token"]
        print(f"Login failed: {resp.text}")
        return None
    except Exception as e:
        print(f"Connection error: {e}")
        return None

def verify():
    # 1. Admin
    print("\n--- ADMIN ---")
    token = login("melih.bulut@4flow.com", "test123")
    if token:
        resp = requests.get(f"{BASE_URL}/projects", headers={"Authorization": f"Bearer {token}"})
        if resp.status_code == 200:
            print([p["name"] for p in resp.json()])
        else:
            print(f"Error: {resp.text}")

    # 2. Manager
    print("\n--- MANAGER (Sales) ---")
    token = login("ahmet@4flow.com", "test123")
    if token:
        resp = requests.get(f"{BASE_URL}/projects", headers={"Authorization": f"Bearer {token}"})
        if resp.status_code == 200:
            print([p["name"] for p in resp.json()])
        else:
            print(f"Error: {resp.text}")

    # 3. Member
    print("\n--- MEMBER (Sales) ---")
    token = login("test@4flow.com", "test123")
    if token:
        resp = requests.get(f"{BASE_URL}/projects", headers={"Authorization": f"Bearer {token}"})
        if resp.status_code == 200:
            print([p["name"] for p in resp.json()])
        else:
            print(f"Error: {resp.text}")

    # 4. Member (Marketing)
    print("\n--- MEMBER (Marketing - Ayse) ---")
    token = login("ayse@4flow.com", "test123")
    if token:
        resp = requests.get(f"{BASE_URL}/projects", headers={"Authorization": f"Bearer {token}"})
        if resp.status_code == 200:
            print([p["name"] for p in resp.json()])
        else:
            print(f"Error: {resp.text}")

if __name__ == "__main__":
    verify()
