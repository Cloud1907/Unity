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
echo "Creating Parent Task..."
TASK_RESP=$(curl -s -X POST http://localhost:8080/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Parent Task", "projectId": 0}')

TASK_ID=$(echo $TASK_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Parent Task ID: $TASK_ID"

# 3. Create Subtask A (With Date and Assignee - mimicking what should be supported)
echo "Creating Subtask A (Target to Delete)..."
SUB_A_RESP=$(curl -s -X POST http://localhost:8080/api/tasks/$TASK_ID/subtasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Subtask A", "isCompleted":false, "dueDate":"2026-02-01T00:00:00Z"}')

SUB_A_ID=$(echo $SUB_A_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Subtask A ID: $SUB_A_ID"

# 4. Create Subtask B
echo "Creating Subtask B (Should Remain)..."
SUB_B_RESP=$(curl -s -X POST http://localhost:8080/api/tasks/$TASK_ID/subtasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Subtask B", "isCompleted":false, "dueDate":"2026-03-01T00:00:00Z"}')

SUB_B_ID=$(echo $SUB_B_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Subtask B ID: $SUB_B_ID"

# 5. Verify Fields (Data Loss Check)
# Fetch Task Details to see subtasks
echo "Fetching Task Details to Check Fields..."
DETAILS_RESP=$(curl -s -X GET http://localhost:8080/api/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN")

# Check if DueDate is preserved (Simple string check for demonstration)
if [[ $DETAILS_RESP == *"2026-02-01"* ]]; then
  echo "SUCCESS: Subtask A DueDate found."
else
  echo "FAILURE: Subtask A DueDate LOST or not saved."
fi

# 6. Delete Subtask A
echo "Deleting Subtask A (ID: $SUB_A_ID)..."
DELETE_RESP=$(curl -s -X DELETE http://localhost:8080/api/tasks/subtasks/$SUB_A_ID \
  -H "Authorization: Bearer $TOKEN")
echo "Delete Response Code: $DELETE_RESP" 

# 7. Final Verification
echo "Verifying Database State..."
FINAL_RESP=$(curl -s -X GET http://localhost:8080/api/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN")

if [[ $FINAL_RESP == *"$SUB_A_ID"* ]]; then
  echo "FAILURE: Subtask A still exists!"
else
  echo "SUCCESS: Subtask A deleted."
fi

if [[ $FINAL_RESP == *"$SUB_B_ID"* ]]; then
  echo "SUCCESS: Subtask B still exists."
else
  echo "CRITICAL FAILURE: Subtask B was ALSO deleted!"
fi
