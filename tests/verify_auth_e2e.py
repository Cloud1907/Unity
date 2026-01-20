import urllib.request
import urllib.error
import json
import ssl

# Configuration
API_URL = "http://localhost:8080/api"
ADMIN_EMAIL = "melih"
ADMIN_PASS = "test123"

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
        # Create context that ignores SSL verification if needed (though we use http)
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        with urllib.request.urlopen(req, context=ctx) as response:
            if response.status == 204:
                return {}
            resp_data = response.read().decode()
            if not resp_data:
                return {}
            return json.loads(resp_data)
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {endpoint}: {e.code} - {e.read().decode()}")
        return None
    except Exception as e:
        print(f"❌ Connection Error {endpoint}: {e}")
        return None

def login(email, password):
    data = {"email": email, "password": password}
    resp = make_request("POST", "/auth/login", data)
    if resp and "accessToken" in resp:
         return resp["accessToken"]
    # Case insensitive key check
    if resp and "accessToken" not in resp:
         # Try finding key case-insensitively
         for k in resp.keys():
             if k.lower() == "accesstoken":
                 return resp[k]
    return None

def create_user(admin_token, user_data):
    # Check if user exists first? api/users might fail if exists.
    # We'll just try to create and ignore error if it says 'exists'
    # Actually, let's just try login first.
    token = login(user_data["email"], user_data["password"])
    if token:
        print(f"User {user_data['email']} already exists. Logged in.")
        return token

    print(f"Creating user {user_data['email']}...")
    resp = make_request("POST", "/users", user_data, admin_token)
    if resp:
        # Created, now login
        return login(user_data["email"], user_data["password"])
    return None

def cleanup_data(admin_token, emails):
    print("Cleaning up test users...")
    users = make_request("GET", "/users", token=admin_token)
    if not users: return
    
    for u in users:
        if u.get("email") in emails:
            uid = u["id"]
            print(f"Deleting user {uid} ({u['email']})...")
            make_request("DELETE", f"/users/{uid}", token=admin_token)

# --- Tests ---
def run_tests():
    print("🚀 Starting E2E Auth Verification")

    # 1. Admin Login
    print("Step 1: Admin Login")
    admin_token = login(ADMIN_EMAIL, ADMIN_PASS)
    if not admin_token:
        print("❌ Admin Login Failed! Cannot proceed.")
        return
    print("✅ Admin Login Successful")

    # 2. Create Test Users
    user_hr = {
        "fullName": "Test HR User",
        "email": "test_hr_e2e@4flow.com",
        "password": "password123",
        "role": "member",
        "departments": [1], # Assuming 1 is HR or generic. We might need to fetch depts first.
        "jobTitle": "HR Specialist"
    } # Note: Departments handling in backend is tricky (list of ints or json). Sending [1].

    user_it = {
        "fullName": "Test IT User",
        "email": "test_it_e2e@4flow.com",
        "password": "password123",
        "role": "member",
        "departments": [2], # Assuming 2 is IT
        "jobTitle": "IT Specialist"
    }

    print("\nStep 2: Setup Test Users")
    # First cleanup if they exist from previous failed runs
    cleanup_data(admin_token, [user_hr["email"], user_it["email"]])

    token_hr = create_user(admin_token, user_hr)
    token_it = create_user(admin_token, user_it)

    if not token_hr or not token_it:
        print("❌ Failed to setup test users.")
        return
    print("✅ Test Users Setup Complete")

    # 3. Project Isolation Test & Department Check
    print("\nStep 3: Testing Project Isolation & Department Logic")
    
    # HR creates a project
    print("HR creating project 'Confidential HR Project'...")
    # HR is Dept 1.
    proj_data = {
        "name": "Confidential HR Project",
        "description": "Top Secret",
        "department": 1, # Dept ID
        "isPrivate": False
    }
    
    proj_resp = make_request("POST", "/projects", proj_data, token_hr)
    if not proj_resp:
        print("❌ HR Project creation failed.")
        return # Stop if project creation failed
    else:
        proj_id = proj_resp.get("id") or proj_resp.get("_id")
        created_dept = proj_resp.get("departmentId")
        print(f"✅ HR Project created (ID: {proj_id}, Dept: {created_dept})")
        
        if created_dept != 1:
            print(f"❌ FAIL: Project created in Wrong Department! Expected 1, Got {created_dept}")
        else:
             print("✅ PASS: Project Department matches User Department.")

        # IT tries to see it
        # Since IT is dept 2 and HR is dept 1, IT shouldn't see it (if logic enforces dept)
        
        print("IT listing projects...")
        it_projects = make_request("GET", "/projects", token=token_it)
        can_see = any(p.get("id") == proj_id or p.get("_id") == proj_id for p in (it_projects or []))
        
        if not can_see:
             print("✅ PASS: IT User CANNOT see HR Project.")
        else:
             print("❌ FAIL: IT User CAN see HR Project.")

    # 4. Task CRUD Test
    print("\nStep 4: Task CRUD (HR User)")
    if proj_resp:
        proj_id = proj_resp.get("id") or proj_resp.get("_id")
        task_data = {
            "title": "Hire new dev",
            "projectId": proj_id,
            "status": "todo",
            "priority": "high"
        }
        print("HR creating task...")
        task_resp = make_request("POST", "/tasks", task_data, token_hr)
        if task_resp:
             print(f"✅ Task created: {task_resp.get('title')}")
             
             # Update status
             task_id = task_resp.get("id") or task_resp.get("_id")
             print(f"Updating task {task_id} status...")
             
             new_status = "done"
             status_resp = make_request("PUT", f"/tasks/{task_id}/status?status={new_status}", None, token_hr)
             if status_resp and status_resp.get("status") == new_status:
                 print("✅ Task status updated.")
             else:
                  print(f"⚠️ Task status update failed. Resp: {status_resp}")
        else:
            print("❌ Task creation failed.")

    # 5. Label Creation Test
    print("\nStep 5: Label Creation Test")
    if proj_resp:
        lbl_data = {
            "name": "Urgent-Review",
            "color": "#FF0000",
            "projectId": proj_id
        }
        print(f"Creating label in project {proj_id}...")
        lbl_resp = make_request("POST", "/labels", lbl_data, token_hr)
        
        if lbl_resp:
            print(f"✅ Label created: {lbl_resp.get('name')} (ID: {lbl_resp.get('id')})")
        else:
             print("❌ Label creation FAILED.")
             
        # Verify Label List
        print("Listing labels...")
        labels_resp = make_request("GET", f"/labels/project/{proj_id}", token=token_hr)
        if labels_resp and len(labels_resp) > 0:
             print(f"✅ Label list retrieved: {len(labels_resp)} labels found.")
        else:
             print("❌ Label list empty or failed.")

    print("\n🏁 E2E Tests Completed.")

if __name__ == "__main__":
    run_tests()
