#!/bin/bash

BASE_URL="http://localhost:8000/api"
USERNAME="melih"
PASSWORD="123456"

# 1. Login
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo $LOGIN_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed. Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "Login successful. Token acquired. UserID: $USER_ID"

# 2. Update Task
TASK_ID="task-sb-1"
echo "Updating Task $TASK_ID..."
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Test-User-Id: $USER_ID" \
  -d '{
    "id": "task-sb-1",
    "title": "UPDATED VIA CURL",
    "status": "working",
    "priority": "low"
  }')

echo "Update Response: $UPDATE_RESPONSE"

if echo "$UPDATE_RESPONSE" | grep -q "UPDATED VIA CURL"; then
  echo "✅ Task update successful."
else
  echo "❌ Task update failed."
  exit 1
fi

# 3. Verify Update
echo "Verifying Update..."
GET_RESPONSE=$(curl -s -X GET "$BASE_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Test-User-Id: $USER_ID")

if echo "$GET_RESPONSE" | grep -q "UPDATED VIA CURL"; then
  echo "✅ Verified: Title updated."
else
  echo "❌ Verified: Title NOT updated."
fi
