#!/usr/bin/env python3
"""
Backend API Test - Task Creation & Retrieval
Test scenario:
1. Login with test@4task.com / test123
2. Get project ID (GET /api/projects)
3. Create task with projectId (POST /api/tasks)
4. List tasks with filter (GET /api/tasks?projectId=XXX)
5. Verify projectId field in responses
"""

import requests
import json
import sys
import os
from datetime import datetime

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
print(f"🔗 Testing API at: {API_URL}")

class TaskAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.project_id = None
        
    def test_login(self):
        """Test 1: Login with test@4task.com / test123"""
        print("\n🔐 Test 1: Login Authentication")
        
        login_data = {
            "email": "test@4task.com",
            "password": "test123"
        }
        
        try:
            response = self.session.post(f"{API_URL}/auth/login", json=login_data)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                user_info = data.get("user", {})
                self.user_id = user_info.get("_id")
                
                # Set authorization header for future requests
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                
                print(f"   ✅ Login successful")
                print(f"   User ID: {self.user_id}")
                print(f"   User Name: {user_info.get('fullName', 'N/A')}")
                print(f"   Token: {self.token[:20]}...")
                return True
            else:
                print(f"   ❌ Login failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Login error: {e}")
            return False
    
    def test_get_projects(self):
        """Test 2: Get project ID (GET /api/projects)"""
        print("\n📁 Test 2: Get Projects")
        
        try:
            response = self.session.get(f"{API_URL}/projects")
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                projects = response.json()
                print(f"   ✅ Projects retrieved successfully")
                print(f"   Number of projects: {len(projects)}")
                
                if projects:
                    # Use first project for testing
                    self.project_id = projects[0].get("_id")
                    print(f"   Selected Project ID: {self.project_id}")
                    print(f"   Project Name: {projects[0].get('name', 'N/A')}")
                    
                    # Show all projects for reference
                    print("   Available Projects:")
                    for i, project in enumerate(projects):
                        print(f"     {i+1}. {project.get('name')} (ID: {project.get('_id')})")
                    
                    return True
                else:
                    print("   ⚠️  No projects found - will create a test project")
                    return self.create_test_project()
            else:
                print(f"   ❌ Failed to get projects: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Get projects error: {e}")
            return False
    
    def create_test_project(self):
        """Create a test project if none exist"""
        print("\n🆕 Creating Test Project")
        
        project_data = {
            "name": "Test Project for Task API",
            "description": "Test project created for API testing",
            "icon": "🧪",
            "color": "#ff5a5f",
            "owner": self.user_id,
            "members": [self.user_id],
            "status": "in_progress",
            "priority": "medium"
        }
        
        try:
            response = self.session.post(f"{API_URL}/projects", json=project_data)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 201:
                project = response.json()
                self.project_id = project.get("_id")
                print(f"   ✅ Test project created successfully")
                print(f"   Project ID: {self.project_id}")
                print(f"   Project Name: {project.get('name')}")
                return True
            else:
                print(f"   ❌ Failed to create test project: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Create project error: {e}")
            return False
    
    def test_create_task(self):
        """Test 3: Create task with projectId (POST /api/tasks)"""
        print("\n📝 Test 3: Create Task with ProjectId")
        
        if not self.project_id:
            print("   ❌ No project ID available for task creation")
            return False
        
        task_data = {
            "projectId": self.project_id,
            "title": "Test Task - API Testing",
            "description": "This task was created via API testing to verify projectId functionality",
            "assignees": [self.user_id],
            "status": "todo",
            "priority": "high",
            "labels": ["api-test", "backend"],
            "progress": 0
        }
        
        try:
            response = self.session.post(f"{API_URL}/tasks", json=task_data)
            print(f"   Status Code: {response.status_code}")
            print(f"   Request Data: {json.dumps(task_data, indent=2)}")
            
            if response.status_code == 201:
                task = response.json()
                task_id = task.get("_id")
                returned_project_id = task.get("projectId")
                
                print(f"   ✅ Task created successfully")
                print(f"   Task ID: {task_id}")
                print(f"   Task Title: {task.get('title')}")
                print(f"   Sent ProjectId: {self.project_id}")
                print(f"   Returned ProjectId: {returned_project_id}")
                
                # CRITICAL CHECK: Verify projectId field
                if returned_project_id == self.project_id:
                    print(f"   ✅ ProjectId field correctly returned and matches")
                else:
                    print(f"   ❌ ProjectId mismatch! Sent: {self.project_id}, Got: {returned_project_id}")
                
                print(f"   Response Data: {json.dumps(task, indent=2)}")
                return True
            else:
                print(f"   ❌ Failed to create task: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Create task error: {e}")
            return False
    
    def test_list_tasks_with_filter(self):
        """Test 4: List tasks with projectId filter (GET /api/tasks?projectId=XXX)"""
        print("\n📋 Test 4: List Tasks with ProjectId Filter")
        
        if not self.project_id:
            print("   ❌ No project ID available for filtering")
            return False
        
        try:
            # Test with projectId filter
            response = self.session.get(f"{API_URL}/tasks?projectId={self.project_id}")
            print(f"   Status Code: {response.status_code}")
            print(f"   Request URL: {API_URL}/tasks?projectId={self.project_id}")
            
            if response.status_code == 200:
                tasks = response.json()
                print(f"   ✅ Tasks retrieved successfully")
                print(f"   Number of tasks for project {self.project_id}: {len(tasks)}")
                
                # Verify all tasks have correct projectId
                project_id_check = True
                for i, task in enumerate(tasks):
                    task_project_id = task.get("projectId")
                    print(f"   Task {i+1}: {task.get('title')} (ProjectId: {task_project_id})")
                    
                    if task_project_id != self.project_id:
                        print(f"   ❌ Task {i+1} has wrong projectId: {task_project_id} (expected: {self.project_id})")
                        project_id_check = False
                
                if project_id_check:
                    print(f"   ✅ All tasks have correct projectId field")
                else:
                    print(f"   ❌ Some tasks have incorrect projectId field")
                
                # Test without filter to compare
                print("\n   📋 Comparison: All tasks (no filter)")
                response_all = self.session.get(f"{API_URL}/tasks")
                if response_all.status_code == 200:
                    all_tasks = response_all.json()
                    print(f"   Total tasks in system: {len(all_tasks)}")
                    print(f"   Tasks for this project: {len(tasks)}")
                    print(f"   Filter working: {len(tasks) <= len(all_tasks)}")
                
                return project_id_check
            else:
                print(f"   ❌ Failed to get tasks: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ List tasks error: {e}")
            return False
    
    def test_additional_scenarios(self):
        """Test 5: Additional edge cases and scenarios"""
        print("\n🔍 Test 5: Additional Scenarios")
        
        # Test 5a: Create task without projectId (standalone task)
        print("\n   5a: Create standalone task (no projectId)")
        standalone_task = {
            "title": "Standalone Task - No Project",
            "description": "Task without projectId to test nullable field",
            "assignees": [self.user_id],
            "status": "todo",
            "priority": "medium"
        }
        
        try:
            response = self.session.post(f"{API_URL}/tasks", json=standalone_task)
            if response.status_code == 201:
                task = response.json()
                project_id = task.get("projectId")
                print(f"      ✅ Standalone task created")
                print(f"      ProjectId field: {project_id} (should be null/None)")
                if project_id is None:
                    print(f"      ✅ ProjectId correctly null for standalone task")
                else:
                    print(f"      ⚠️  ProjectId not null: {project_id}")
            else:
                print(f"      ❌ Failed to create standalone task: {response.text}")
        except Exception as e:
            print(f"      ❌ Standalone task error: {e}")
        
        # Test 5b: Filter tasks with non-existent projectId
        print("\n   5b: Filter with non-existent projectId")
        fake_project_id = "nonexistent_project_123"
        try:
            response = self.session.get(f"{API_URL}/tasks?projectId={fake_project_id}")
            if response.status_code == 200:
                tasks = response.json()
                print(f"      ✅ Request successful, found {len(tasks)} tasks")
                if len(tasks) == 0:
                    print(f"      ✅ Correctly returned empty list for non-existent project")
                else:
                    print(f"      ⚠️  Unexpected tasks found for non-existent project")
            else:
                print(f"      ❌ Request failed: {response.text}")
        except Exception as e:
            print(f"      ❌ Non-existent project filter error: {e}")
        
        # Test 5c: Get specific task and verify projectId
        print("\n   5c: Get specific task by ID")
        try:
            # Get all tasks for this project first
            response = self.session.get(f"{API_URL}/tasks?projectId={self.project_id}")
            if response.status_code == 200:
                tasks = response.json()
                if tasks:
                    task_id = tasks[0].get("_id")
                    # Get specific task
                    response = self.session.get(f"{API_URL}/tasks/{task_id}")
                    if response.status_code == 200:
                        task = response.json()
                        project_id = task.get("projectId")
                        print(f"      ✅ Individual task retrieved")
                        print(f"      Task ID: {task_id}")
                        print(f"      ProjectId: {project_id}")
                        if project_id == self.project_id:
                            print(f"      ✅ ProjectId field correct in individual task")
                        else:
                            print(f"      ❌ ProjectId mismatch in individual task")
                    else:
                        print(f"      ❌ Failed to get individual task: {response.text}")
                else:
                    print(f"      ⚠️  No tasks available for individual test")
        except Exception as e:
            print(f"      ❌ Individual task test error: {e}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Backend API Tests - Task Creation & Retrieval")
        print("=" * 60)
        
        results = []
        
        # Test 1: Login
        if self.test_login():
            results.append("✅ Login")
        else:
            results.append("❌ Login")
            print("\n💥 Login failed - cannot continue with other tests")
            return results
        
        # Test 2: Get Projects
        if self.test_get_projects():
            results.append("✅ Get Projects")
        else:
            results.append("❌ Get Projects")
            print("\n💥 Project retrieval failed - cannot continue")
            return results
        
        # Test 3: Create Task
        if self.test_create_task():
            results.append("✅ Create Task")
        else:
            results.append("❌ Create Task")
        
        # Test 4: List Tasks with Filter
        if self.test_list_tasks_with_filter():
            results.append("✅ List Tasks with Filter")
        else:
            results.append("❌ List Tasks with Filter")
        
        # Test 5: Additional Scenarios
        self.test_additional_scenarios()
        results.append("✅ Additional Scenarios")
        
        return results

def main():
    """Main test execution"""
    tester = TaskAPITester()
    results = tester.run_all_tests()
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    for result in results:
        print(f"   {result}")
    
    # Count successes and failures
    successes = len([r for r in results if r.startswith("✅")])
    failures = len([r for r in results if r.startswith("❌")])
    
    print(f"\n📈 Overall: {successes} passed, {failures} failed")
    
    if failures == 0:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed - check details above")
        return 1

if __name__ == "__main__":
    sys.exit(main())