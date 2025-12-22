import requests
import json

BASE_URL = "http://localhost:8000/api"

def verify_project_updates():
    # Login
    login_data = {"email": "melih.bulut@4flow.com", "password": "test123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get a test user (use the one created in verify_user_creation if you have the ID, or just melih)
    # Let's find melih's ID
    me_resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    user_id = me_resp.json()["_id"]
    
    # Get all projects
    proj_resp = requests.get(f"{BASE_URL}/api/projects", headers=headers) # Note: some routes have /api some don't in my scripts?
    # Actually BASE_URL is /api
    proj_resp = requests.get(f"{BASE_URL}/projects", headers=headers)
    all_proj_ids = [p["_id"] for p in proj_resp.json()]
    
    print(f"Assigning {len(all_proj_ids)} projects to user {user_id}")
    
    # Update projects
    update_resp = requests.put(f"{BASE_URL}/users/{user_id}/projects", json=all_proj_ids, headers=headers)
    
    if update_resp.status_code == 200:
        print("Project update successful!")
        print(json.dumps(update_resp.json(), indent=2))
        
        # Verify projects in response
        if "projectIds" in update_resp.json():
            print(f"User now has {len(update_resp.json()['projectIds'])} projects")
    else:
        print(f"Project update failed: {update_resp.status_code}")
        print(update_resp.text)

if __name__ == "__main__":
    verify_project_updates()
