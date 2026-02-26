#!/bin/bash

# Configuration
API_URL="http://localhost:8000/api"
MAGIC_TOKEN="d31a70d7b24c4732af2b97a4a4ca7e7b"
PROJECT_NAME="mb todo"

echo "---------------------------------------------------"
echo "🚀 Simulating Frontend Logic (Create -> Update without Fetch)"
echo "---------------------------------------------------"

# 1. Login
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/magic-login" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$MAGIC_TOKEN\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo "❌ Login Failed! Token not found."
    exit 1
fi

# 2. Get Project ID
PROJECTS_RESPONSE=$(curl -s -X GET "$API_URL/projects" -H "Authorization: Bearer $TOKEN")
PROJECT_ID=$(python3 -c "import sys, json; 
try:
    data = json.load(sys.stdin)
    projects = data.get('projects', []) if isinstance(data, dict) else data
    match = next((p for p in projects if p['name'].lower() == '$PROJECT_NAME'.lower()), None)
    print(match['id']) if match else print('')
except: print('')" <<< "$PROJECTS_RESPONSE")

if [ -z "$PROJECT_ID" ]; then
    echo "⚠️ Project '$PROJECT_NAME' not found."
    exit 1
fi

# 3. Create Task (Frontend style: createTask action)
echo "📝 Creating Task 'Frontend Flow Task'..."
CREATE_RES=$(curl -s -X POST "$API_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": $PROJECT_ID,
    \"title\": \"Frontend Flow Task\",
    \"status\": \"todo\",
    \"priority\": \"medium\"
  }")

TASK_ID=$(echo $CREATE_RES | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")

if [ -z "$TASK_ID" ]; then
    echo "❌ Create Failed"
    exit 1
fi
echo "✅ Task Created (ID: $TASK_ID)"

# 4. Immediate Rename (Frontend style: updateTask action)
# In frontend, this happens without refetching the list.
echo "✏️ Renaming to 'Instant Rename Success'..."
UPDATE_RES=$(curl -s -X PUT "$API_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{ \"title\": \"Instant Rename Success\" }")

UPDATED_TITLE=$(echo $UPDATE_RES | python3 -c "import sys, json; print(json.load(sys.stdin).get('title', ''))")

if [ "$UPDATED_TITLE" == "Instant Rename Success" ]; then
    echo "✅ Frontend Simulation SUCCESS: Task created and renamed instantly."
else
    echo "❌ Rename Failed."
    exit 1
fi
