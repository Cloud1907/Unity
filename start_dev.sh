#!/bin/bash

# Kill ports 8000 (Backend) and 3000 (Frontend)
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo "Starting Backend (Unity.API)..."
cd dotnet-backend/Unity.API
dotnet run --urls=http://localhost:8080 &
BACKEND_PID=$!
cd ../..

echo "Waiting for Backend to start..."
sleep 5

echo "Starting Frontend..."
cd frontend
npm start &
FRONTEND_PID=$!

echo "Development Environment Started"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

wait $BACKEND_PID $FRONTEND_PID
