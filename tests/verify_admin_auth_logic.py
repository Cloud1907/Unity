import urllib.request
import urllib.error
import json
import uuid

API_URL = "http://localhost:8000/api"

# --- Helpers ---
def make_request(method, endpoint, data=None, token=None):
    url = f"{API_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    return make_request_with_id(method, endpoint, data, token, user_id=None)
        
def make_request_with_id(method, endpoint, data=None, token=None, user_id=None):
    url = f"{API_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if user_id:
        headers["X-Test-User-Id"] = user_id
    
    json_data = None
    if data:
        json_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=json_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 204:
                return {}
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {endpoint}: {e.code} - {e.read().decode()}")
        return None
    except Exception as e:
        print(f"❌ Connection Error {endpoint}: {e}")
        return None

def login(identifier, password):
    payload = {
        "email": identifier,
        "password": password
    }
    resp = make_request("POST", "/auth/login", payload)
    token = None
    user_id = None
    
    if resp:
        if "accessToken" in resp:
            token = resp["accessToken"]
        elif "access_token" in resp:
            token = resp["access_token"]
            
        if "user" in resp and "id" in resp["user"]:
            user_id = resp["user"]["id"]
            
    if token and user_id:
        return token, user_id
        
    print(f"Login failed: {resp}")
    return None, None

def create_user_as_admin(admin_token, admin_id, dept, role="member"):
    uid = str(uuid.uuid4())[:8]
    email = f"test_{uid}@example.com"
    password = "password123"
    
    user_data = {
        "fullName": f"Test User {uid}",
        "email": email,
        "password": password,
        "role": role,
        "departments": [dept]
    }
    
    print(f"Admin creating user: {email} ({dept})...")
    # Admin needs to authenticate with THEIR id
    resp = make_request_with_id("POST", "/users", user_data, admin_token, admin_id)
    
    if resp and "id" in resp:
        return email, password
    return None, None

def create_project(token, user_id, name, dept):
    data = {
        "name": name,
        "owner": "placeholder",
        "department": dept,
        "isPrivate": False
    }
    return make_request_with_id("POST", "/projects", data, token, user_id)

def get_projects(token, user_id):
    return make_request_with_id("GET", "/projects?limit=100", token=token, user_id=user_id)

# --- Main Test ---
def run_tests():
    print("🚀 Starting Admin-Context Auth Verification")

    # 1. Login as Admin
    print("Loggin in as Admin (melih)...")
    admin_token, admin_id = login("melih", "123456")
    if not admin_token:
        print("❌ Critical: Failed to login as Admin. Aborting.")
        return

    print(f"✅ Admin Logged In (ID: {admin_id}).")

    # 2. Create Users
    email_hr, pass_hr = create_user_as_admin(admin_token, admin_id, "Stokbar")
    email_it, pass_it = create_user_as_admin(admin_token, admin_id, "Enroute") # Enroute instead of IT for variety

    if not email_hr or not email_it:
        print("❌ Critical: Failed to create test users.")
        return

    # 3. Login as New Users
    print(f"Logging in as Stokbar ({email_hr})...")
    token_hr, id_hr = login(email_hr, pass_hr)
    
    print(f"Logging in as IT ({email_it})...")
    token_it, id_it = login(email_it, pass_it)

    if not token_hr or not token_it:
        print("❌ Failed to login with new users.")
        return

    # 4. Test Project Isolation
    print("\n--- TEST: Project Department Isolation ---")
    
    # Stokbar User creates a project in Stokbar dept
    proj_resp = create_project(token_hr, id_hr, "Confidential Stokbar Project", "Stokbar")
    if not proj_resp:
        print("❌ Failed to create Stokbar project")
    else:
        project_hr_id = proj_resp["id"]
        print(f"✅ Stokbar Project created (ID: {project_hr_id}).")

        # IT User lists projects
        it_projects = get_projects(token_it, id_it) or []
        # Check if IT user sees HR project
        # Note: Response might be list or wrapped in "data" depending on backend standard. 
        # But verify_auth_logic.py treated it as list.
        if isinstance(it_projects, dict) and 'items' in it_projects:
             it_projects = it_projects['items']
        
        it_sees_hr = any(p["id"] == project_hr_id for p in it_projects)

        if not it_sees_hr:
            print("✅ PASS: IT User (Enroute) CANNOT see Stokbar Project.")
        else:
            print("❌ FAIL: IT User (Enroute) CAN see Stokbar Project!")

    print("\n🏁 Custom Test Completed.")

if __name__ == "__main__":
    run_tests()
