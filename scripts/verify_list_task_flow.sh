#!/bin/bash

# Configuration
API_URL="http://localhost:8000/api"
MAGIC_TOKEN="56343d1027924b0fb353ca14484885bc"
PROJECT_NAME="mb todo"

echo "---------------------------------------------------"
echo "🚀 Starting List Task Flow Verification (Terminal)"
echo "---------------------------------------------------"

# 1. Login with Magic Token
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/magic-login" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$MAGIC_TOKEN\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo "❌ Login Failed! Token not found."
    exit 1
fi
echo "✅ Authenticated."

# 2. Get 'mb todo' Project ID
PROJECTS_RESPONSE=$(curl -s -X GET "$API_URL/projects" -H "Authorization: Bearer $TOKEN")
PROJECT_ID=$(python3 -c "import sys, json; 
try:
    data = json.load(sys.stdin)
    projects = data.get('projects', []) if isinstance(data, dict) else data
    match = next((p for p in projects if p['name'].lower() == '$PROJECT_NAME'.lower()), None)
    print(match['id']) if match else print('')
except: print('')" <<< "$PROJECTS_RESPONSE")

if [ -z "$PROJECT_ID" ]; then
    echo "⚠️ Project '$PROJECT_NAME' not found. Cannot proceed safely."
    exit 1
fi
echo "✅ Project ID: $PROJECT_ID"

# 3. Create Task (Simulating 'Just Add' behavior)
echo "📝 Creating Task 'Yeni Görev'..."
CREATE_TASK_RES=$(curl -s -X POST "$API_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": $PROJECT_ID,
    \"title\": \"Yeni Görev\",
    \"status\": \"todo\",
    \"priority\": \"medium\"
  }")

TASK_ID=$(echo $CREATE_TASK_RES | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")

if [ -z "$TASK_ID" ]; then
    echo "❌ Task Creation Failed!"
    echo "Response: $CREATE_TASK_RES"
    exit 1
fi
echo "✅ Task Created (ID: $TASK_ID)"

# 4. Rename Task (Simulating Inline Edit) - CRITICAL STEP
echo "✏️ Renaming Task to 'Terminal List Task' via PUT..."

UPDATE_RES=$(curl -s -X PUT "$API_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{ \"title\": \"Terminal List Task\" }")

# Check if successful (should return JSON with updated title)
UPDATED_TITLE=$(echo $UPDATE_RES | python3 -c "import sys, json; print(json.load(sys.stdin).get('title', ''))")

if [ "$UPDATED_TITLE" == "Terminal List Task" ]; then
    echo "✅ Rename SUCCESS via PUT! (Fix Verified)"
else
    echo "❌ Rename FAILED!"
    echo "Response: $UPDATE_RES"
    exit 1
fi

echo "---------------------------------------------------"
echo "🎉 List Flow Verified Successfully!"
