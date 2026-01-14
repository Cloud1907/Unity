import urllib.request
import json
import urllib.error

BASE_URL = "http://localhost:8000/api"

def make_request(method, url, data=None, token=None):
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
        
    if data:
        json_data = json.dumps(data).encode('utf-8')
        req.data = json_data
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        return e.code, None

def get_auth_token():
    print("Attempting login...")
    email = "melih.bulut@4flow.com"
    password = "test123"
    
    status, res = make_request("POST", f"{BASE_URL}/auth/login", {
        "email": email,
        "password": password
    })
    
    if status == 200:
        print("Login successful.")
        return res["access_token"]
    
    print("Login failed, attempting registration...")
    status, res = make_request("POST", f"{BASE_URL}/auth/register", {
        "fullName": "Test User",
        "email": email,
        "password": password
    })
    
    if status == 201:
        print("Registration successful.")
        return res["access_token"]
        
    print("Authentication failed completely.")
    return None

def test_subtask_persistence():
    token = get_auth_token()
    if not token:
        return

    # 1. Create a task
    print("Creating task...")
    status, task = make_request("POST", f"{BASE_URL}/tasks", {
        "title": "Test Task for Subtasks",
        "status": "todo",
        "priority": "medium"
    }, token)
    
    if status != 201:
        print("Failed to create task")
        return
    
    task_id = task["_id"]
    print(f"Task created: {task_id}")

    # 2. Update task with subtasks (Embedded method)
    print("Updating task with embedded subtasks...")
    subtasks = [
        {"id": 1, "title": "Subtask 1", "completed": False},
        {"id": 2, "title": "Subtask 2", "completed": True}
    ]
    
    status, updated_task = make_request("PUT", f"{BASE_URL}/tasks/{task_id}", {
        "subtasks": subtasks
    }, token)
    
    if status != 200:
        print("Failed to update task")
        return

    # 3. Fetch task to verify
    print("Fetching task to verify...")
    status, task_data = make_request("GET", f"{BASE_URL}/tasks/{task_id}", None, token)
    
    saved_subtasks = task_data.get("subtasks", [])
    print(f"Saved subtasks: {saved_subtasks}")
    
    if len(saved_subtasks) == 2:
        print("SUCCESS: Embedded subtasks persisted.")
    else:
        print("FAILURE: Embedded subtasks NOT persisted.")

if __name__ == "__main__":
    test_subtask_persistence()
