import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://localhost:5052/api"
HEADERS = {
    "Content-Type": "application/json",
    "X-Test-User-Id": "1" # Simulating Admin/User ID 1
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
    print("Starting Backend Verification (Strict) on " + BASE_URL)

    # 1. Get Users
    print_step("Fetching Users")
    status, users = make_request(f"{BASE_URL}/users")
    if status != 200:
        print("FAILED to get users. Is backend running? Status:", status)
        return
    
    if len(users) < 2:
        print("Need at least 2 users for this test. Found:", len(users))
        return
    
    creator_id = users[0]['id'] if 'id' in users[0] else users[0].get('_id')
    target_user_id = users[1]['id'] if 'id' in users[1] else users[1].get('_id')
    
    print(f"Creator ID: {creator_id}, Target Member ID: {target_user_id}")
    HEADERS["X-Test-User-Id"] = str(creator_id)

    # 2. Create Workspace
    print_step("Creating Workspace 'Test-Lab-1'")
    ws_data = {
        "name": "Test-Lab-1",
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
    status, res = make_request(f"{BASE_URL}/departments/{ws_id}/members", "POST", target_user_id)
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
        print(f"Fetched {len(logs)} logs.")
        found_create = False
        found_add = False
        found_remove = False

        for log in logs:
            desc = log.get('description', '')
            if f"Created workspace 'Test-Lab-1'" in desc: found_create = True
            if f"Added" in desc and f"Test-Lab-1" in desc: found_add = True
            if f"Removed" in desc and f"Test-Lab-1" in desc: found_remove = True
        
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
