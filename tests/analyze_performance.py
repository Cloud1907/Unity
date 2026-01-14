import urllib.request
import urllib.error
import urllib.parse
import json
import time
import os

# Try to import pymongo, but don't fail if missing
try:
    import pymongo
    from pymongo import MongoClient
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False

# Configuration
API_URL = "http://localhost:8000/api"
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "univera") 

# Colors
class Colors:
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_status(message, status="INFO"):
    if status == "SUCCESS":
        print(f"{Colors.OKGREEN}✅ {message}{Colors.ENDC}")
    elif status == "FAIL":
        print(f"{Colors.FAIL}❌ {message}{Colors.ENDC}")
    elif status == "WARN":
        print(f"{Colors.WARNING}⚠️ {message}{Colors.ENDC}")
    else:
        print(f"{Colors.BOLD}ℹ️ {message}{Colors.ENDC}")

# Helper for API requests
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
        start_time = time.time()
        with urllib.request.urlopen(req) as response:
            duration = (time.time() - start_time) * 1000 # ms
            content = json.loads(response.read().decode())
            return content, duration
    except Exception as e:
        print(f"Error {endpoint}: {e}")
        return None, 0

def check_indexes():
    if not PYMONGO_AVAILABLE:
        print_status("pymongo not installed/found. Skipping direct index check.", "WARN")
        return

    print_status("Checking MongoDB Indexes...", "INFO")
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        # 1. Projects Collection
        print("\n--- Projects Collection ---")
        indexes = db.projects.index_information()
        recommended = ["department_1", "members_1", "owner_1", "isPrivate_1"]
        
        for idx in recommended:
            found = False
            for key in indexes:
                if idx.split("_")[0] in key: 
                    found = True
                    break
            
            if found:
                print_status(f"Index found/covered: {idx}", "SUCCESS")
            else:
                print_status(f"Missing Index: {idx}", "WARN")
                
        # 2. Tasks Collection
        print("\n--- Tasks Collection ---")
        indexes = db.tasks.index_information()
        recommended = ["projectId_1", "assignees_1", "assignedBy_1", "isPrivate_1"]
        
        for idx in recommended:
             found = False
             for key in indexes:
                if idx.split("_")[0] in key:
                    found = True
                    break
             if found:
                 print_status(f"Index found/covered: {idx}", "SUCCESS")
             else:
                 print_status(f"Missing Index: {idx}", "WARN")

        client.close()
    except Exception as e:
        print_status(f"DB Connection failed: {e}", "FAIL")

def measure_api_latency():
    print_status("\nMeasuring API Latency...", "INFO")
    
    api_token = None
    
    # Register/Login Temp User
    uid = str(time.time())[-6:]
    user_data = {
        "fullName": "Perf Tester",
        "email": f"perf_{uid}@test.com",
        "password": "password",
        "department": "IT"
    }
    
    # Register JSON
    reg_url = f"{API_URL}/auth/register"
    try:
         req = urllib.request.Request(reg_url, data=json.dumps(user_data).encode(), headers={"Content-Type": "application/json"}, method="POST")
         with urllib.request.urlopen(req) as resp:
             print_status("Temp user created.", "SUCCESS")

         # Login JSON
         login_data = {"email": user_data["email"], "password": user_data["password"]}
         login_req = urllib.request.Request(f"{API_URL}/auth/login", data=json.dumps(login_data).encode(), headers={"Content-Type": "application/json"}, method="POST")
         with urllib.request.urlopen(login_req) as resp:
             data = json.loads(resp.read().decode())
             api_token = data.get("access_token")
             print_status("Token acquired.", "SUCCESS")
             
    except Exception as e:
        print_status(f"Auth failed, cannot measure API: {e}", "FAIL")
        return

    if not api_token:
        return

    # Measure Projects
    print("Fetching projects...")
    _, p_duration = make_request("GET", "/projects", token=api_token)
    print(f"GET /projects latency: {p_duration:.2f} ms")
    
    if p_duration > 200:
        print_status("Projects endpoint is SLOW (>200ms)", "WARN")
    else:
        print_status("Projects endpoint is FAST", "SUCCESS")

    # Measure Tasks (Empty project filter)
    print("Fetching tasks...")
    _, t_duration = make_request("GET", "/tasks", token=api_token)
    print(f"GET /tasks (all) latency: {t_duration:.2f} ms")
    
    if t_duration > 200:
         print_status("Tasks endpoint is SLOW (>200ms)", "WARN")
    else:
         print_status("Tasks endpoint is FAST", "SUCCESS")

if __name__ == "__main__":
    check_indexes()
    measure_api_latency()
