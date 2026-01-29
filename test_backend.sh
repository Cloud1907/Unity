#!/bin/bash

BASE_URL="http://127.0.0.1:8080/api"
EMAIL="test_curl_$(date +%s)@example.com"
PASSWORD="Password123!"

echo "--- Backend Persistence Test via CURL ---"

# 1. Authenticate (Admin)
echo "1. Authenticating as Admin..."
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "melih.bulut@univera.com.tr", "password": "test123"}')

TOKEN=$(echo $AUTH_RESPONSE | jq -r '.accessToken // .access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "Auth failed. Response: $AUTH_RESPONSE"
    exit 1
fi
echo "   Token received."

# 2. Get Project ID (needed for task)
echo "2. Getting Projects..."
PROJECTS_RES=$(curl -s -X GET "$BASE_URL/projects" -H "Authorization: Bearer $TOKEN")
PROJECT_ID=$(echo $PROJECTS_RES | jq -r '.[0].id // empty')

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "null" ]; then
    echo "   No project found. Creating one..."
    PROJ_RES=$(curl -s -X POST "$BASE_URL/projects" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"name": "Curl Project", "description": "Test", "color": "#000000"}')
    PROJECT_ID=$(echo $PROJ_RES | jq -r '.id')
fi
echo "   Project ID: $PROJECT_ID"

# 3. Create Task
echo "3. Creating Parent Task..."
TASK_RES=$(curl -s -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"projectId\": $PROJECT_ID, \"title\": \"Curl Task\", \"status\": \"todo\", \"priority\": \"medium\"}")

TASK_ID=$(echo $TASK_RES | jq -r '.id')
echo "   Task Created ID: $TASK_ID"

# 4. Add Subtask
echo "4. Adding Subtask..."
SUB_RES=$(curl -s -X POST "$BASE_URL/tasks/$TASK_ID/subtasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Curl Subtask", "isCompleted": false}')

SUB_ID=$(echo $SUB_RES | jq -r '.id')
echo "   Subtask Created ID: $SUB_ID"

# 5. Verify Persistence Immediately
echo "5. Verifying GET Task..."
GET_RES=$(curl -s -X GET "$BASE_URL/tasks/$TASK_ID" -H "Authorization: Bearer $TOKEN")

# Check if Subtask title is in response
if [[ "$GET_RES" == *"Curl Subtask"* ]]; then
    echo "SUCCESS: Subtask found in parent task response."
else
    echo "FAILURE: Subtask NOT found in parent response."
    echo "Response Snippet: ${GET_RES:0:500}..."
fi
