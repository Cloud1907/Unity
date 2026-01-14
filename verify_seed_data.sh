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

# 2. Get Projects
echo "Fetching Projects..."
PROJECTS=$(curl -s -X GET "$BASE_URL/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Test-User-Id: $USER_ID")

if echo "$PROJECTS" | grep -q "Satış"; then
  echo "✅ Project 'Satış' found."
else
  echo "❌ Project 'Satış' NOT found."
fi

if echo "$PROJECTS" | grep -q "İK"; then
  echo "✅ Project 'İK' found."
else
  echo "❌ Project 'İK' NOT found."
fi

# 3. Get Users
echo "Fetching Users..."
USERS=$(curl -s -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $TOKEN")

if echo "$USERS" | grep -q "Elif"; then
  echo "✅ User 'Elif' found."
else
  echo "❌ User 'Elif' NOT found."
fi

# 4. Get Tasks (Debug)
echo "Fetching Tasks..."
TASKS=$(curl -s -X GET "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Test-User-Id: $USER_ID")

TASK_COUNT=$(echo $TASKS | grep -o '"id":' | wc -l)
echo "🔍 Total Visible Tasks for User $USER_ID: $TASK_COUNT"
echo "First 500 chars of Task Response: ${TASKS:0:500}..."

