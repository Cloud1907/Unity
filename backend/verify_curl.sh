#!/bin/bash

BASE_URL="http://localhost:8000"

echo "--- 1. Testing ADMIN (melih.bulut@4flow.com) ---"
TOKEN=$(curl -s -X POST "$BASE_URL/auth/token" -H "Content-Type: application/x-www-form-urlencoded" -d "username=melih.bulut@4flow.com&password=test123" | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')
echo "Token: ${TOKEN:0:10}..."

if [ -n "$TOKEN" ]; then
    echo "Projects:"
    curl -s -X GET "$BASE_URL/projects" -H "Authorization: Bearer $TOKEN" | grep -o '"name":"[^"]*"'
else
    echo "Login failed"
fi

echo -e "\n\n--- 2. Testing MANAGER (ahmet@4flow.com - Sales) ---"
TOKEN=$(curl -s -X POST "$BASE_URL/auth/token" -H "Content-Type: application/x-www-form-urlencoded" -d "username=ahmet@4flow.com&password=test123" | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')
echo "Token: ${TOKEN:0:10}..."

if [ -n "$TOKEN" ]; then
    echo "Projects:"
    curl -s -X GET "$BASE_URL/projects" -H "Authorization: Bearer $TOKEN" | grep -o '"name":"[^"]*"'
else
    echo "Login failed"
fi

echo -e "\n\n--- 3. Testing MEMBER (test@4flow.com - Sales) ---"
TOKEN=$(curl -s -X POST "$BASE_URL/auth/token" -H "Content-Type: application/x-www-form-urlencoded" -d "username=test@4flow.com&password=test123" | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')
echo "Token: ${TOKEN:0:10}..."

if [ -n "$TOKEN" ]; then
    echo "Projects:"
    curl -s -X GET "$BASE_URL/projects" -H "Authorization: Bearer $TOKEN" | grep -o '"name":"[^"]*"'
else
    echo "Login failed"
fi
