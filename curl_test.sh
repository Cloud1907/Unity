#!/bin/bash

echo "🔗 Backend URL: https://projecthub-162.preview.emergentagent.com/api"
echo ""

# Step 1: Login
echo "1️⃣ LOGIN TEST"
echo "curl -X POST /api/auth/login"
LOGIN_RESPONSE=$(curl -s -X POST "https://projecthub-162.preview.emergentagent.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@4task.com", "password": "test123"}')

echo "Response:"
echo "$LOGIN_RESPONSE" | python3 -m json.tool
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
echo "🔑 Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Get Projects
echo "2️⃣ GET PROJECTS TEST"
echo "curl -X GET /api/projects"
PROJECTS_RESPONSE=$(curl -s -X GET "https://projecthub-162.preview.emergentagent.com/api/projects" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo "$PROJECTS_RESPONSE" | python3 -m json.tool
echo ""

# Extract first project ID
PROJECT_ID=$(echo "$PROJECTS_RESPONSE" | python3 -c "import sys, json; projects=json.load(sys.stdin); print(projects[0]['_id'] if projects else 'none')")
echo "📁 Selected Project ID: $PROJECT_ID"
echo ""

# Step 3: Create Task
echo "3️⃣ CREATE TASK TEST"
echo "curl -X POST /api/tasks"
TASK_DATA="{
  \"projectId\": \"$PROJECT_ID\",
  \"title\": \"CURL Test Task\",
  \"description\": \"Task created via curl to test projectId field\",
  \"status\": \"todo\",
  \"priority\": \"medium\"
}"

echo "Request Data:"
echo "$TASK_DATA" | python3 -m json.tool
echo ""

CREATE_RESPONSE=$(curl -s -X POST "https://projecthub-162.preview.emergentagent.com/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$TASK_DATA")

echo "Response:"
echo "$CREATE_RESPONSE" | python3 -m json.tool
echo ""

# Step 4: List Tasks with Filter
echo "4️⃣ LIST TASKS WITH FILTER TEST"
echo "curl -X GET /api/tasks?projectId=$PROJECT_ID"
TASKS_RESPONSE=$(curl -s -X GET "https://projecthub-162.preview.emergentagent.com/api/tasks?projectId=$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo "$TASKS_RESPONSE" | python3 -m json.tool
echo ""

# Verification
echo "🔍 VERIFICATION"
echo "Checking if all returned tasks have correct projectId..."
echo "$TASKS_RESPONSE" | python3 -c "
import sys, json
tasks = json.load(sys.stdin)
project_id = '$PROJECT_ID'
print(f'Expected ProjectId: {project_id}')
print(f'Number of tasks: {len(tasks)}')
for i, task in enumerate(tasks):
    task_project_id = task.get('projectId')
    status = '✅' if task_project_id == project_id else '❌'
    print(f'Task {i+1}: {task.get(\"title\")} - ProjectId: {task_project_id} {status}')
"

