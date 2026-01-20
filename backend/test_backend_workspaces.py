import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://localhost:8080/api"
HEADERS = {
    "Content-Type": "application/json"
}

def print_step(msg):
    print(f"\n[TEST] {msg}...")

def make_request(url, method="GET", data=None, headers=None):
    if headers is None: headers = HEADERS
    
    req = urllib.request.Request(url, method=method)
    for k, v in headers.items():
        req.add_header(k, v)
        
    if data:
        jsondata = json.dumps(data).encode('utf-8')
        req.data = jsondata

    try:
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            body = response.read().decode('utf-8')
            if body:
                return status, json.loads(body)
            return status, None
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        return e.code, body
    except Exception as e:
        return 0, str(e)

def test_backend():
    print("Starting Backend Verification (Authenticated) on " + BASE_URL)

    # 0. Login to get Token
    print_step("Logging in as 'melih'")
    login_data = {
        "username": "melih",
        "password": "test123" # Password reset seen in startup logs
    }
    status, login_res = make_request(f"{BASE_URL}/auth/login", "POST", login_data)
    
    if status != 200 or not login_res.get('accessToken'):
        print(f"LOGIN FAILED. Status: {status}, Response: {login_res}")
        return

    token = login_res['accessToken']
    print("LOGIN SUCCESS. Token obtained.")
    HEADERS['Authorization'] = f"Bearer {token}"

    # 1. Get Users
    print_step("Fetching Users")
    status, users = make_request(f"{BASE_URL}/users")
    if status != 200:
        print("FAILED to get users. Status:", status)
        return
    
    if len(users) < 2:
        print("Need at least 2 users for this test. Found:", len(users))
        return
    
    # Identify IDs
    # API might return 'id' or '_id'
    creator = users[0]
    target = users[1]
    
    creator_id = creator.get('id') or creator.get('_id')
    target_user_id = target.get('id') or target.get('_id')
    
    # Ensure they are valid integers if backend expects int
    # Our backend Department/members expects int
    
    print(f"Creator ID: {creator_id}, Target Member ID: {target_user_id}")

    # 2. Create Workspace
    print_step("Creating Workspace 'Test-Lab-Authentic'")
    ws_data = {
        "name": "Test-Lab-Authentic",
        "description": "Backend Verification Workspace"
    }
    status, workspace = make_request(f"{BASE_URL}/departments", "POST", ws_data)
    if status != 201:
        print("FAILED to create workspace. Status:", status, workspace)
        return
    
    ws_id = workspace['id']
    print(f"SUCCESS. Workspace ID: {ws_id}")

    # 3. Add Member
    print_step(f"Adding User {target_user_id} to Workspace {ws_id}")
    status, res = make_request(f"{BASE_URL}/departments/{ws_id}/members", "POST", int(target_user_id))
    if status != 200:
        print("FAILED to add member. Status:", status, res)
    else:
        print("SUCCESS. Member added.")

    # 4. Remove Member
    print_step(f"Removing User {target_user_id} from Workspace {ws_id}")
    status, res = make_request(f"{BASE_URL}/departments/{ws_id}/members/{target_user_id}", "DELETE")
    if status != 200:
        print("FAILED to remove member. Status:", status, res)
    else:
        print("SUCCESS. Member removed.")

    # 5. Check Notifications
    print_step("Checking Notification Logs")
    status, logs = make_request(f"{BASE_URL}/notifications")
    if status != 200:
        print("FAILED to fetch notifications. Status:", status)
    else:
        # Logs are list of AuditLog
        print(f"Fetched {len(logs)} logs.")
        found_create = False
        found_add = False
        found_remove = False

        for log in logs:
            desc = log.get('description', '')
            if f"Created workspace 'Test-Lab-Authentic'" in desc: found_create = True
            if f"Added" in desc and f"Test-Lab-Authentic" in desc: found_add = True
            if f"Removed" in desc and f"Test-Lab-Authentic" in desc: found_remove = True
        
        print(f"Log Verification: Create={found_create}, Add={found_add}, Remove={found_remove}")

    # 6. Delete Workspace
    print_step("Cleaning up - Deleting Workspace")
    status, res = make_request(f"{BASE_URL}/departments/{ws_id}", "DELETE")
    if status == 204:
        print("SUCCESS. Workspace deleted.")
    else:
        print("FAILED to delete workspace. Status:", status)

if __name__ == "__main__":
    test_backend()
