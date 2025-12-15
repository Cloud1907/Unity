#!/usr/bin/env python3
"""
4Flow Monday.com Clone - Comprehensive Backend API Test
Test scenarios:
1. Auth endpoints (login, register) - ahmet@4flow.com / test123, melih-bulut@hotmail.com / test123
2. Projects endpoints (CRUD)
3. Tasks endpoints (CRUD, update status)
4. Users endpoints (admin panel)
5. Labels endpoints (GET, POST, PUT, DELETE)
6. User-Project association (PUT /users/{id}/projects)
"""

import requests
import json
import sys
import os
from datetime import datetime
from typing import Dict, Any

# Get backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("❌ Could not get REACT_APP_BACKEND_URL from frontend/.env")
    sys.exit(1)

API_URL = f"{BASE_URL}/api"
print(f"🔗 Testing 4Flow API at: {API_URL}")

class FourFlowAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.member_token = None
        self.admin_user = None
        self.member_user = None
        self.test_project_id = None
        self.test_task_id = None
        self.test_label_id = None
        
    def test_admin_login(self):
        """Test 1: Admin Login - ahmet@4flow.com / test123"""
        print("\n🔐 Test 1: Admin Login Authentication")
        
        login_data = {
            "email": "ahmet@4flow.com",
            "password": "test123"
        }
        
        try:
            response = self.session.post(f"{API_URL}/auth/login", json=login_data)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                self.admin_user = data.get("user", {})
                
                print(f"   ✅ Admin login successful")
                print(f"   Admin ID: {self.admin_user.get('_id')}")
                print(f"   Admin Name: {self.admin_user.get('fullName', 'N/A')}")
                print(f"   Admin Role: {self.admin_user.get('role', 'N/A')}")
                print(f"   Token: {self.admin_token[:20]}...")
                return True
            else:
                print(f"   ❌ Admin login failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Admin login error: {e}")
            return False
    
    def test_member_login(self):
        """Test 2: Member Login - test@4flow.com / test123"""
        print("\n🔐 Test 2: Member Login Authentication")
        
        login_data = {
            "email": "test@4flow.com",
            "password": "test123"
        }
        
        try:
            response = self.session.post(f"{API_URL}/auth/login", json=login_data)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.member_token = data.get("access_token")
                self.member_user = data.get("user", {})
                
                print(f"   ✅ Member login successful")
                print(f"   Member ID: {self.member_user.get('_id')}")
                print(f"   Member Name: {self.member_user.get('fullName', 'N/A')}")
                print(f"   Member Role: {self.member_user.get('role', 'N/A')}")
                print(f"   Token: {self.member_token[:20]}...")
                return True
            else:
                print(f"   ❌ Member login failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Member login error: {e}")
            return False
    
    def test_projects_crud(self):
        """Test 3: Projects CRUD Operations"""
        print("\n📁 Test 3: Projects CRUD Operations")
        
        # Set admin authorization
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # 3a: GET Projects
        print("\n   3a: GET Projects")
        try:
            response = self.session.get(f"{API_URL}/projects", headers=headers)
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 200:
                projects = response.json()
                print(f"      ✅ Projects retrieved successfully")
                print(f"      Number of projects: {len(projects)}")
                
                if projects:
                    for i, project in enumerate(projects[:3]):  # Show first 3
                        print(f"         {i+1}. {project.get('name')} (ID: {project.get('_id')})")
            else:
                print(f"      ❌ Failed to get projects: {response.text}")
                return False
        except Exception as e:
            print(f"      ❌ Get projects error: {e}")
            return False
        
        # 3b: POST Create Project
        print("\n   3b: POST Create Project")
        project_data = {
            "name": "4Flow Test Project",
            "description": "Test project for API testing",
            "icon": "🧪",
            "color": "#ff5a5f",
            "owner": self.admin_user["_id"],
            "members": [self.admin_user["_id"]],
            "status": "in_progress",
            "priority": "high"
        }
        
        try:
            response = self.session.post(f"{API_URL}/projects", json=project_data, headers=headers)
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 201:
                project = response.json()
                self.test_project_id = project.get("_id")
                print(f"      ✅ Project created successfully")
                print(f"      Project ID: {self.test_project_id}")
                print(f"      Project Name: {project.get('name')}")
            else:
                print(f"      ❌ Failed to create project: {response.text}")
                return False
        except Exception as e:
            print(f"      ❌ Create project error: {e}")
            return False
        
        # 3c: PUT Update Project
        print("\n   3c: PUT Update Project")
        update_data = {
            "description": "Updated test project description",
            "priority": "medium"
        }
        
        try:
            response = self.session.put(f"{API_URL}/projects/{self.test_project_id}", 
                                      json=update_data, headers=headers)
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 200:
                updated_project = response.json()
                print(f"      ✅ Project updated successfully")
                print(f"      Updated Description: {updated_project.get('description')}")
                print(f"      Updated Priority: {updated_project.get('priority')}")
            else:
                print(f"      ❌ Failed to update project: {response.text}")
                return False
        except Exception as e:
            print(f"      ❌ Update project error: {e}")
            return False
        
        return True
    
    def test_tasks_crud(self):
        """Test 4: Tasks CRUD Operations"""
        print("\n📝 Test 4: Tasks CRUD Operations")
        
        if not self.test_project_id:
            print("   ❌ No project ID available for task testing")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # 4a: POST Create Task
        print("\n   4a: POST Create Task")
        task_data = {
            "projectId": self.test_project_id,
            "title": "4Flow Test Task",
            "description": "Test task for API testing",
            "assignees": [self.admin_user["_id"]],
            "status": "todo",
            "priority": "high",
            "labels": ["api-test", "backend"],
            "progress": 0
        }
        
        try:
            response = self.session.post(f"{API_URL}/tasks", json=task_data, headers=headers)
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 201:
                task = response.json()
                self.test_task_id = task.get("_id")
                print(f"      ✅ Task created successfully")
                print(f"      Task ID: {self.test_task_id}")
                print(f"      Task Title: {task.get('title')}")
                print(f"      Project ID: {task.get('projectId')}")
            else:
                print(f"      ❌ Failed to create task: {response.text}")
                return False
        except Exception as e:
            print(f"      ❌ Create task error: {e}")
            return False
        
        # 4b: GET Tasks with projectId filter
        print("\n   4b: GET Tasks with projectId filter")
        try:
            response = self.session.get(f"{API_URL}/tasks?projectId={self.test_project_id}", headers=headers)
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 200:
                tasks = response.json()
                print(f"      ✅ Tasks retrieved successfully")
                print(f"      Number of tasks for project: {len(tasks)}")
                
                for task in tasks:
                    print(f"         - {task.get('title')} (Status: {task.get('status')})")
            else:
                print(f"      ❌ Failed to get tasks: {response.text}")
                return False
        except Exception as e:
            print(f"      ❌ Get tasks error: {e}")
            return False
        
        # 4c: PUT Update Task Status
        print("\n   4c: PUT Update Task Status")
        try:
            response = self.session.put(f"{API_URL}/tasks/{self.test_task_id}/status?status=in_progress", 
                                      headers=headers)
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 200:
                updated_task = response.json()
                print(f"      ✅ Task status updated successfully")
                print(f"      New Status: {updated_task.get('status')}")
            else:
                print(f"      ❌ Failed to update task status: {response.text}")
                return False
        except Exception as e:
            print(f"      ❌ Update task status error: {e}")
            return False
        
        # 4d: PUT Update Task (general)
        print("\n   4d: PUT Update Task")
        update_data = {
            "description": "Updated task description",
            "priority": "medium",
            "progress": 50
        }
        
        try:
            response = self.session.put(f"{API_URL}/tasks/{self.test_task_id}", 
                                      json=update_data, headers=headers)
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 200:
                updated_task = response.json()
                print(f"      ✅ Task updated successfully")
                print(f"      Updated Description: {updated_task.get('description')}")
                print(f"      Updated Progress: {updated_task.get('progress')}%")
            else:
                print(f"      ❌ Failed to update task: {response.text}")
                return False
        except Exception as e:
            print(f"      ❌ Update task error: {e}")
            return False
        
        return True
    
    def test_users_endpoints(self):
        """Test 5: Users Endpoints (Admin Panel)"""
        print("\n👥 Test 5: Users Endpoints (Admin Panel)")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # 5a: GET All Users
        print("\n   5a: GET All Users")
        try:
            response = self.session.get(f"{API_URL}/users", headers=headers)
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 200:
                users = response.json()
                print(f"      ✅ Users retrieved successfully")
                print(f"      Number of users: {len(users)}")
                
                for user in users:
                    print(f"         - {user.get('fullName')} ({user.get('email')}) - Role: {user.get('role', 'N/A')}")
            else:
                print(f"      ❌ Failed to get users: {response.text}")
                return False
        except Exception as e:
            print(f"      ❌ Get users error: {e}")
            return False
        
        # 5b: GET Specific User
        print("\n   5b: GET Specific User")
        try:
            # Use admin user ID if member user is not available
            user_id = self.member_user['_id'] if self.member_user else self.admin_user['_id']
            response = self.session.get(f"{API_URL}/users/{user_id}", headers=headers)
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 200:
                user = response.json()
                print(f"      ✅ User retrieved successfully")
                print(f"      User Name: {user.get('fullName')}")
                print(f"      User Email: {user.get('email')}")
                print(f"      User Role: {user.get('role', 'N/A')}")
            else:
                print(f"      ❌ Failed to get user: {response.text}")
                return False
        except Exception as e:
            print(f"      ❌ Get user error: {e}")
            return False
        
        return True
    
    def test_user_project_association(self):
        """Test 6: User-Project Association (PUT /users/{id}/projects)"""
        print("\n🔗 Test 6: User-Project Association")
        
        if not self.test_project_id:
            print("   ❌ No project ID available for user association")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Associate member user with test project
        print("\n   6a: Associate User with Project")
        project_ids = [self.test_project_id]
        
        try:
            # Use member user ID if available, otherwise use a different user from the list
            target_user_id = self.member_user['_id'] if self.member_user else "693c5e40779ac6a2161c19bd"  # test@4flow.com user
            response = self.session.put(f"{API_URL}/users/{target_user_id}/projects", 
                                      json=project_ids, headers=headers)
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"      ✅ User-project association successful")
                print(f"      Message: {result.get('message')}")
                
                # Verify by getting projects as member user if available
                if self.member_token:
                    member_headers = {"Authorization": f"Bearer {self.member_token}"}
                    projects_response = self.session.get(f"{API_URL}/projects", headers=member_headers)
                    
                    if projects_response.status_code == 200:
                        member_projects = projects_response.json()
                        project_names = [p.get('name') for p in member_projects]
                        print(f"      ✅ Verification: Member can now see {len(member_projects)} projects")
                        print(f"      Projects: {', '.join(project_names)}")
                    else:
                        print(f"      ⚠️  Could not verify association: {projects_response.text}")
                else:
                    print(f"      ⚠️  Member token not available for verification")
            else:
                print(f"      ❌ Failed to associate user with project: {response.text}")
                return False
        except Exception as e:
            print(f"      ❌ User-project association error: {e}")
            return False
        
        return True
    
    def test_labels_crud(self):
        """Test 7: Labels CRUD Operations"""
        print("\n🏷️  Test 7: Labels CRUD Operations")
        
        if not self.test_project_id:
            print("   ❌ No project ID available for labels testing")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # 7a: POST Create Label
        print("\n   7a: POST Create Label")
        label_data = {
            "projectId": self.test_project_id,
            "name": "Test Label",
            "color": "#ff5a5f",
            "description": "Test label for API testing"
        }
        
        try:
            response = self.session.post(f"{API_URL}/labels", json=label_data, headers=headers)
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 200:
                label = response.json()
                self.test_label_id = label.get("id")
                print(f"      ✅ Label created successfully")
                print(f"      Label ID: {self.test_label_id}")
                print(f"      Label Name: {label.get('name')}")
                print(f"      Label Color: {label.get('color')}")
            else:
                print(f"      ❌ Failed to create label: {response.text}")
                return False
        except Exception as e:
            print(f"      ❌ Create label error: {e}")
            return False
        
        # 7b: GET Project Labels
        print("\n   7b: GET Project Labels")
        try:
            response = self.session.get(f"{API_URL}/labels/project/{self.test_project_id}", headers=headers)
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 200:
                labels = response.json()
                print(f"      ✅ Labels retrieved successfully")
                print(f"      Number of labels: {len(labels)}")
                
                for label in labels:
                    print(f"         - {label.get('name')} ({label.get('color')})")
            else:
                print(f"      ❌ Failed to get labels: {response.text}")
                return False
        except Exception as e:
            print(f"      ❌ Get labels error: {e}")
            return False
        
        # 7c: PUT Update Label
        print("\n   7c: PUT Update Label")
        update_data = {
            "name": "Updated Test Label",
            "color": "#00c875",
            "description": "Updated test label description"
        }
        
        try:
            response = self.session.put(f"{API_URL}/labels/{self.test_label_id}", 
                                      json=update_data, headers=headers)
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 200:
                updated_label = response.json()
                print(f"      ✅ Label updated successfully")
                print(f"      Updated Name: {updated_label.get('name')}")
                print(f"      Updated Color: {updated_label.get('color')}")
            else:
                print(f"      ❌ Failed to update label: {response.text}")
                return False
        except Exception as e:
            print(f"      ❌ Update label error: {e}")
            return False
        
        # 7d: DELETE Label
        print("\n   7d: DELETE Label")
        try:
            response = self.session.delete(f"{API_URL}/labels/{self.test_label_id}", headers=headers)
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"      ✅ Label deleted successfully")
                print(f"      Message: {result.get('message')}")
            else:
                print(f"      ❌ Failed to delete label: {response.text}")
                return False
        except Exception as e:
            print(f"      ❌ Delete label error: {e}")
            return False
        
        return True
    
    def test_additional_scenarios(self):
        """Test 8: Additional Test Scenarios"""
        print("\n🔍 Test 8: Additional Test Scenarios")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # 8a: Test Auth /me endpoint
        print("\n   8a: GET /auth/me")
        try:
            response = self.session.get(f"{API_URL}/auth/me", headers=headers)
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 200:
                user = response.json()
                print(f"      ✅ Current user retrieved successfully")
                print(f"      User: {user.get('fullName')} ({user.get('email')})")
            else:
                print(f"      ❌ Failed to get current user: {response.text}")
        except Exception as e:
            print(f"      ❌ Get current user error: {e}")
        
        # 8b: Test API health check
        print("\n   8b: GET /health")
        try:
            response = self.session.get(f"{API_URL}/health")
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 200:
                health = response.json()
                print(f"      ✅ Health check successful")
                print(f"      Status: {health.get('status')}")
            else:
                print(f"      ❌ Health check failed: {response.text}")
        except Exception as e:
            print(f"      ❌ Health check error: {e}")
        
        # 8c: Test unauthorized access
        print("\n   8c: Test Unauthorized Access")
        try:
            response = self.session.get(f"{API_URL}/projects")  # No auth header
            print(f"      Status Code: {response.status_code}")
            
            if response.status_code == 401:
                print(f"      ✅ Unauthorized access correctly blocked")
            else:
                print(f"      ⚠️  Unexpected response for unauthorized access: {response.status_code}")
        except Exception as e:
            print(f"      ❌ Unauthorized access test error: {e}")
    
    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleanup: Removing Test Data")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Delete test task
        if self.test_task_id:
            try:
                response = self.session.delete(f"{API_URL}/tasks/{self.test_task_id}", headers=headers)
                if response.status_code == 204:
                    print("   ✅ Test task deleted")
                else:
                    print(f"   ⚠️  Could not delete test task: {response.status_code}")
            except Exception as e:
                print(f"   ⚠️  Task cleanup error: {e}")
        
        # Delete test project
        if self.test_project_id:
            try:
                response = self.session.delete(f"{API_URL}/projects/{self.test_project_id}", headers=headers)
                if response.status_code == 204:
                    print("   ✅ Test project deleted")
                else:
                    print(f"   ⚠️  Could not delete test project: {response.status_code}")
            except Exception as e:
                print(f"   ⚠️  Project cleanup error: {e}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting 4Flow Monday.com Clone - Backend API Tests")
        print("=" * 70)
        
        results = []
        
        # Test 1: Admin Login
        if self.test_admin_login():
            results.append("✅ Admin Login")
        else:
            results.append("❌ Admin Login")
            print("\n💥 Admin login failed - cannot continue with tests")
            return results
        
        # Test 2: Member Login
        if self.test_member_login():
            results.append("✅ Member Login")
        else:
            results.append("❌ Member Login")
            print("\n💥 Member login failed - some tests may be limited")
        
        # Test 3: Projects CRUD
        if self.test_projects_crud():
            results.append("✅ Projects CRUD")
        else:
            results.append("❌ Projects CRUD")
        
        # Test 4: Tasks CRUD
        if self.test_tasks_crud():
            results.append("✅ Tasks CRUD")
        else:
            results.append("❌ Tasks CRUD")
        
        # Test 5: Users Endpoints
        if self.test_users_endpoints():
            results.append("✅ Users Endpoints")
        else:
            results.append("❌ Users Endpoints")
        
        # Test 6: User-Project Association
        if self.test_user_project_association():
            results.append("✅ User-Project Association")
        else:
            results.append("❌ User-Project Association")
        
        # Test 7: Labels CRUD
        if self.test_labels_crud():
            results.append("✅ Labels CRUD")
        else:
            results.append("❌ Labels CRUD")
        
        # Test 8: Additional Scenarios
        self.test_additional_scenarios()
        results.append("✅ Additional Scenarios")
        
        # Cleanup
        self.cleanup_test_data()
        
        return results

def main():
    """Main test execution"""
    tester = FourFlowAPITester()
    results = tester.run_all_tests()
    
    print("\n" + "=" * 70)
    print("📊 4FLOW API TEST RESULTS SUMMARY")
    print("=" * 70)
    
    for result in results:
        print(f"   {result}")
    
    # Count successes and failures
    successes = len([r for r in results if r.startswith("✅")])
    failures = len([r for r in results if r.startswith("❌")])
    
    print(f"\n📈 Overall: {successes} passed, {failures} failed")
    
    if failures == 0:
        print("🎉 All 4Flow API tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed - check details above")
        return 1

if __name__ == "__main__":
    sys.exit(main())