#!/bin/bash

# Configuration
API_URL="http://localhost:8000/api"
MAGIC_TOKEN="ea0457be036246669ec18b477c582d36"
PROJECT_NAME="mb todo"

echo "---------------------------------------------------"
echo "🚀 Starting Headless Test for 'melih.bulut'"
echo "---------------------------------------------------"

# 1. Login with Magic Token (Get JWT)
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/magic-login" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$MAGIC_TOKEN\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo "❌ Login Failed! Token not found."
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login Successful! Token acquired."

# 2. Get Projects and find 'mb todo' ID
PROJECTS_RESPONSE=$(curl -s -X GET "$API_URL/projects" \
  -H "Authorization: Bearer $TOKEN")

# Simple python script to extract ID robustly
PROJECT_ID=$(python3 -c "import sys, json
try:
    data = json.load(sys.stdin)
    # The API returns structured data, need to inspect structure.
    # If it's pure list: data
    # If wrapped: data['projects'] or similar.
    # Assuming list based on typical REST, or if wrapped check keys.
    projects = data.get('projects', []) if isinstance(data, dict) else data
    match = next((p for p in projects if p['name'].lower() == '$PROJECT_NAME'.lower()), None)
    if match:
        print(match['id'])
    else:
        print('')
except Exception as e:
    print('')" <<< "$PROJECTS_RESPONSE")

if [ -z "$PROJECT_ID" ]; then
    echo "⚠️ Project '$PROJECT_NAME' not found. Creating it..."
    
    CREATE_PROJ_RESPONSE=$(curl -s -X POST "$API_URL/projects" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{ \"name\": \"$PROJECT_NAME\", \"description\": \"Auto-created for testing\" }")
      
    PROJECT_ID=$(echo $CREATE_PROJ_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")
    
    if [ -z "$PROJECT_ID" ]; then
        echo "❌ Failed to create project!"
        echo "Response: $CREATE_PROJ_RESPONSE"
        exit 1
    fi
    echo "✅ Created Project '$PROJECT_NAME' (ID: $PROJECT_ID)"
else
    echo "✅ Found Project '$PROJECT_NAME' (ID: $PROJECT_ID)"
fi

# 3. Create Task
TASK_TITLE="Headless Test Task $(date +%H%M%S)"

CREATE_TASK_RESPONSE=$(curl -s -X POST "$API_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": $PROJECT_ID,
    \"title\": \"$TASK_TITLE\",
    \"description\": \"Created via automated test script\",
    \"status\": \"todo\",
    \"priority\": \"high\",
    \"assignees\": []  
  }")

TASK_ID=$(echo $CREATE_TASK_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")

if [ -z "$TASK_ID" ]; then
    echo "❌ Failed to create task!"
    echo "Response: $CREATE_TASK_RESPONSE"
    exit 1
fi

echo "✅ Task Created! (ID: $TASK_ID)"

# 4. Add Subtask
SUBTASK_RESPONSE=$(curl -s -X POST "$API_URL/tasks/$TASK_ID/subtasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{ \"title\": \"Verify API Response\" }")

if [[ $SUBTASK_RESPONSE == *"id"* ]]; then
    echo "✅ Subtask Added."
else
    echo "❌ Failed to add subtask. Response: $SUBTASK_RESPONSE"
fi

# 5. Add Comment (Original plan said comment, step 5)
COMMENT_RESPONSE=$(curl -s -X POST "$API_URL/tasks/$TASK_ID/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{ \"content\": \"Automated verification comment.\" }")

if [[ $COMMENT_RESPONSE == *"id"* ]]; then
    echo "✅ Comment Added."
else
    echo "❌ Failed to add comment. Response: $COMMENT_RESPONSE"
fi

# 6. Change Status
UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/tasks/$TASK_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{ \"status\": \"done\" }")


# Verify Status via GET
VERIFY_RESPONSE=$(curl -s -X GET "$API_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN")

NEW_STATUS=$(echo $VERIFY_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', ''))")

if [ "$NEW_STATUS" == "done" ]; then
    echo "✅ Status Updated to 'done'."
else
    echo "❌ Failed to update status. Current: '$NEW_STATUS'"
fi

echo "---------------------------------------------------"
echo "🎉 Test Complete!"
