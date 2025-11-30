#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "1. Registering User..."
USER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "user@test.com", "password": "password123"}')
echo $USER_RESPONSE
USER_TOKEN=$(echo $USER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "User Token: $USER_TOKEN"

echo -e "\n2. Registering Admin..."
ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Admin", "email": "admin@test.com", "password": "password123", "role": "admin"}')
echo $ADMIN_RESPONSE
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Admin Token: $ADMIN_TOKEN"

echo -e "\n3. User Submitting Result..."
SUBMIT_RESPONSE=$(curl -s -X POST $BASE_URL/results/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"score": 85}')
echo $SUBMIT_RESPONSE

echo -e "\n4. Admin Viewing All Results..."
ALL_RESULTS=$(curl -s -X GET $BASE_URL/results \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo $ALL_RESULTS

echo -e "\n5. User Viewing My Results..."
MY_RESULTS=$(curl -s -X GET $BASE_URL/results/my \
  -H "Authorization: Bearer $USER_TOKEN")
echo $MY_RESULTS
