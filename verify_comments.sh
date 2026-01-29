#!/bin/bash

# 1. Login
echo "Logging in..."
LOGIN_RESP=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"melih.bulut@univera.com.tr", "password":"test123"}')

TOKEN=$(echo $LOGIN_RESP | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed!"
  exit 1
fi
echo "Token received."

# 2. Create Task
echo "Creating Parent Task..."
TASK_RESP=$(curl -s -X POST http://localhost:8080/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task for Comments", "projectId": 0}')

TASK_ID=$(echo $TASK_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Parent Task ID: $TASK_ID"

# 3. Create Comment A
echo "Creating Comment A..."
COM_A_RESP=$(curl -s -X POST http://localhost:8080/api/tasks/$TASK_ID/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Comment A Content"}')

COM_A_ID=$(echo $COM_A_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Comment A ID: $COM_A_ID"

# 4. Create Comment B
echo "Creating Comment B..."
COM_B_RESP=$(curl -s -X POST http://localhost:8080/api/tasks/$TASK_ID/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Comment B Content"}')

COM_B_ID=$(echo $COM_B_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Comment B ID: $COM_B_ID"

# 5. Delete Comment A
echo "Deleting Comment A (ID: $COM_A_ID)..."
DELETE_RESP=$(curl -s -X DELETE http://localhost:8080/api/tasks/comments/$COM_A_ID \
  -H "Authorization: Bearer $TOKEN")
echo "Delete Response Code: $DELETE_RESP"

# 6. Verify Isolation
echo "Verifying Database State..."
FINAL_RESP=$(curl -s -X GET http://localhost:8080/api/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN")

if [[ $FINAL_RESP == *"$COM_A_ID"* ]]; then
  echo "FAILURE: Comment A still exists!"
else
  echo "SUCCESS: Comment A deleted."
fi

if [[ $FINAL_RESP == *"$COM_B_ID"* ]]; then
  echo "SUCCESS: Comment B still exists."
else
  echo "CRITICAL FAILURE: Comment B was ALSO deleted!"
fi
