#!/bin/bash

# 1. Login
echo "Logging in..."
LOGIN_RESP=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"melih.bulut@univera.com.tr", "password":"test123"}')

TOKEN=$(echo $LOGIN_RESP | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed!"
  echo "Response: $LOGIN_RESP"
  exit 1
fi
echo "Token received."

# 2. Create Task
echo "Creating Task..."
TASK_RESP=$(curl -s -X POST http://localhost:8080/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Backend Test Task", "projectId":1, "status":"todo", "priority":"medium"}')

TASK_ID=$(echo $TASK_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$TASK_ID" ]; then
  echo "Task creation failed!"
  echo "Response: $TASK_RESP"
  exit 1
fi
echo "Task Created. ID: $TASK_ID"

# 3. Add Subtask
echo "Adding Subtask..."
SUBTASK_RESP=$(curl -s -X POST http://localhost:8080/api/tasks/$TASK_ID/subtasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Backend Subtask", "isCompleted":false}')
echo "Subtask Response: $SUBTASK_RESP"

# 4. Add Comment
echo "Adding Comment..."
COMMENT_RESP=$(curl -s -X POST http://localhost:8080/api/tasks/$TASK_ID/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Backend Comment"}')
echo "Comment Response: $COMMENT_RESP"

# 5. GET Task to verify Includes
echo "Verifying Persistence..."
FINAL_RESP=$(curl -s -X GET http://localhost:8080/api/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN")

echo "Final Task Data:"
echo $FINAL_RESP

# Simple check
if [[ $FINAL_RESP == *"Backend Subtask"* ]]; then
  echo "SUCCESS: Subtask found in response."
else
  echo "FAILURE: Subtask NOT found in response."
fi

if [[ $FINAL_RESP == *"Backend Comment"* ]]; then
  echo "SUCCESS: Comment found in response."
else
  echo "FAILURE: Comment NOT found in response."
fi
