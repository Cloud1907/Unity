#!/bin/bash

# Cleanup script to free up ports 8080 (Backend) and 3000 (Frontend)
# and kill any orphaned dotnet watch or node processes.

echo "--- Starting Environment Cleanup ---"

# Kill processes on port 8080 (Unity.API)
echo "Cleaning up port 8080..."
PORT_8080_PIDS=$(lsof -ti:8080)
if [ ! -z "$PORT_8080_PIDS" ]; then
    echo "Killing processes on port 8080: $PORT_8080_PIDS"
    echo "$PORT_8080_PIDS" | xargs kill -9 2>/dev/null
else
    echo "Port 8080 is already free."
fi

# Kill processes on port 3000 (Frontend)
echo "Cleaning up port 3000..."
PORT_3000_PIDS=$(lsof -ti:3000)
if [ ! -z "$PORT_3000_PIDS" ]; then
    echo "Killing processes on port 3000: $PORT_3000_PIDS"
    echo "$PORT_3000_PIDS" | xargs kill -9 2>/dev/null
else
    echo "Port 3000 is already free."
fi

# Kill orphaned dotnet watch processes
echo "Cleaning up orphaned dotnet processes..."
pkill -f "dotnet watch" 2>/dev/null
pkill -f "dotnet run" 2>/dev/null

# Clean up orphaned node processes (be careful not to kill VS Code/Antigravity itself)
# We target 'npm start' or similar if possible, or processes in the frontend dir
echo "Cleaning up frontend-related node processes..."
# This is a safer way to kill only frontend node processes if they are started from the project dir
ps -ef | grep "node" | grep "frontend" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null

echo "--- Cleanup Complete ---"
