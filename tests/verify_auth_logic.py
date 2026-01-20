import urllib.request
import urllib.error
import urllib.parse
import json
import uuid

API_URL = "http://localhost:8080/api"

# --- Helpers ---
def make_request(method, endpoint, data=None, token=None):
    url = f"{API_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
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

def get_unique_user(dept, role="member"):
    uid = str(uuid.uuid4())[:8]
    return {
        "fullName": f"Test User {uid}",
        "email": f"test_{uid}@example.com",
        "password": "password123",
        "department": dept,
        "role": role
    }

def register_and_login(user_data):
    # Register
    reg_data = user_data.copy()
    reg_data["departments"] = [user_data["department"]] if user_data.get("department") else []
    
    resp = make_request("POST", "/auth/register", reg_data)
    if not resp:
         # Try login assuming user exists
         pass

    # Login - Backend expects JSON LoginRequest at /auth/login, NOT form-data at /token
    login_payload = {
        "email": user_data["email"],
        "password": user_data["password"]
    }
    
    # Use make_request helper which handles JSON
    token_resp = make_request("POST", "/auth/login", login_payload)
    
    if token_resp and "access_token" in token_resp:
        return token_resp["access_token"]
    else:
        print(f"Login failed: {token_resp}")
        return None

def create_project(token, name, dept, is_private=False):
    data = {
        "name": name,
        "owner": "placeholder",
        "department": dept,
        "isPrivate": is_private
    }
    return make_request("POST", "/projects", data, token)

def get_projects(token):
    return make_request("GET", "/projects", token=token)

def create_task(token, project_id, title, is_private=False, assignee_id=None):
    data = {
        "title": title,
        "projectId": project_id,
        "isPrivate": is_private,
        "assignees": [assignee_id] if assignee_id else []
    }
    return make_request("POST", "/tasks", data, token)

def get_tasks(token, project_id):
    endpoint = f"/tasks?projectId={project_id}"
    return make_request("GET", endpoint, token=token)


# --- Tests ---
def run_tests():
    print("🚀 Starting Auth Logic Verification (urllib version)")

    # 1. Setup Users
    user_hr = get_unique_user("HR")
    user_it = get_unique_user("IT")
    
    print(f"Creating User HR ({user_hr['email']})...")
    token_hr = register_and_login(user_hr)
    
    print(f"Creating User IT ({user_it['email']})...")
    token_it = register_and_login(user_it)
    
    if not token_hr or not token_it:
        print("❌ Failed to create/login users. Aborting.")
        return

    # 2. Test Project Visibility (Department Isolation)
    print("\n--- TEST 1: Project Department Isolation ---")
    
    proj_resp = create_project(token_hr, "HR Confidential", "HR", is_private=False)
    
    if not proj_resp:
        print(f"❌ Failed to create project")
    else:
        project_hr_id = proj_resp["_id"]
        print("✅ HR Project created.")
        
        # IT User lists projects
        it_projects = get_projects(token_it) or []
        it_sees_hr = any(p["_id"] == project_hr_id for p in it_projects)
        
        if not it_sees_hr:
            print("✅ PASS: IT User CANNOT see HR Project.")
        else:
            print("❌ FAIL: IT User CAN see HR Project!")

        # HR User lists projects
        hr_projects = get_projects(token_hr) or []
        hr_sees_hr = any(p["_id"] == project_hr_id for p in hr_projects)
        if hr_sees_hr:
            print("✅ PASS: HR User CAN see HR Project.")
        else:
            print("❌ FAIL: HR User CANNOT see their own Project!")


    # 3. Test Private Task Visibility
    print("\n--- TEST 2: Private Task Visibility ---")
    
    # Create another HR user
    user_hr_2 = get_unique_user("HR")
    token_hr_2 = register_and_login(user_hr_2)
    
    # HR1 creates task in HR Project (Public)
    t_pub = create_task(token_hr, project_hr_id, "Public Task", is_private=False)
    # HR1 creates task in HR Project (Private)
    t_priv = create_task(token_hr, project_hr_id, "Private Task", is_private=True)
    
    if not t_priv:
         print(f"❌ Failed to create private task")
    else:
         t_priv_id = t_priv["_id"]
         
         # HR2 checks tasks
         tasks_hr_2 = get_tasks(token_hr_2, project_hr_id) or []
         found_priv = any(t["_id"] == t_priv_id for t in tasks_hr_2)
         
         if not found_priv:
             print("✅ PASS: HR Colleague CANNOT see Private Task.")
         else:
             print("❌ FAIL: HR Colleague CAN see Private Task!")
             
         # HR1 checks tasks (Creator)
         tasks_hr_1 = get_tasks(token_hr, project_hr_id) or []
         found_own = any(t["_id"] == t_priv_id for t in tasks_hr_1)
         
         if found_own:
             print("✅ PASS: Creator CAN see own Private Task.")
         else:
             print("❌ FAIL: Creator CANNOT see own Private Task!")

    print("\n🏁 Tests Completed.")

if __name__ == "__main__":
    run_tests()
