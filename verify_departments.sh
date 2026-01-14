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

if [ -z "$TOKEN" ]; then
  echo "Login failed. Response: $LOGIN_RESPONSE"
  exit 1
fi

# 2. Get Departments
echo "Fetching Departments..."
DEPTS=$(curl -s -X GET "$BASE_URL/departments" \
  -H "Authorization: Bearer $TOKEN")

echo "Departments Response: $DEPTS"

if echo "$DEPTS" | grep -q "Stokbar"; then
  echo "✅ Department 'Stokbar' found."
else
  echo "❌ Department 'Stokbar' NOT found."
  exit 1
fi
