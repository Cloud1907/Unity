#!/bin/bash

# Run robust cleanup first
echo "Cleaning up environment..."
./cleanup.sh

# Rotate logs to prevent massive files
if [ -f "start_dev.log" ]; then
    mv start_dev.log start_dev.log.old
fi

echo "Starting Backend (Unity.API)..."
cd dotnet-backend/Unity.API
# Redirect output to log file and run in background
dotnet watch run --urls=http://localhost:8080 > ../../start_dev.log 2>&1 &
BACKEND_PID=$!
cd ../..

echo "Waiting for Backend to initialize (8080)..."
# Wait up to 30 seconds for port 8080 to become active
MAX_RETRIES=30
COUNT=0
while ! lsof -i:8080 > /dev/null 2>&1; do
    sleep 1
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "Error: Backend failed to start on port 8080 within $MAX_RETRIES seconds."
        kill -9 $BACKEND_PID 2>/dev/null
        exit 1
    fi
done

echo "Backend started successfully."

echo "Starting Frontend..."
cd frontend
# Run frontend in background and append to the same log
npm start >> ../start_dev.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "------------------------------------------------"
echo "Development Environment Started Successfully"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Logs are available at: start_dev.log"
echo "------------------------------------------------"

# Keep the script running to monitor children
wait $BACKEND_PID $FRONTEND_PID

