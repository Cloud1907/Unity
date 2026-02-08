#!/bin/bash

# Enhanced Development Startup Script with Process Monitoring
# Ensures clean startup and prevents orphaned processes

# Get the absolute path of the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCK_FILE="$PROJECT_DIR/.dev.lock"

# Function to cleanup on exit
cleanup_on_exit() {
    echo ""
    echo "Shutting down development environment..."
    
    # Kill child processes
    if [ -f "$LOCK_FILE" ]; then
        BACKEND_PID=$(grep "BACKEND_PID" "$LOCK_FILE" | cut -d'=' -f2)
        FRONTEND_PID=$(grep "FRONTEND_PID" "$LOCK_FILE" | cut -d'=' -f2)
        
        if [ ! -z "$BACKEND_PID" ]; then
            echo "Stopping backend (PID: $BACKEND_PID)..."
            kill -15 $BACKEND_PID 2>/dev/null
        fi
        
        if [ ! -z "$FRONTEND_PID" ]; then
            echo "Stopping frontend (PID: $FRONTEND_PID)..."
            kill -15 $FRONTEND_PID 2>/dev/null
        fi
        
        sleep 2
        
        # Force kill if still running
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null
        fi
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null
        fi
        
        rm -f "$LOCK_FILE"
    fi
    
    echo "Cleanup complete."
}

# Set trap to cleanup on script exit
trap cleanup_on_exit EXIT INT TERM

# Check if already running
if [ -f "$LOCK_FILE" ]; then
    echo "⚠ Warning: Lock file exists. Another instance may be running."
    echo "Lock file: $LOCK_FILE"
    cat "$LOCK_FILE"
    echo ""
    read -p "Do you want to force cleanup and continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./cleanup_enhanced.sh
        rm -f "$LOCK_FILE"
    else
        echo "Aborting. Please stop the existing instance first."
        exit 1
    fi
fi

# Run enhanced cleanup
echo "Running enhanced cleanup..."
./cleanup_enhanced.sh

# Rotate logs to prevent massive files
if [ -f "start_dev.log" ]; then
    mv start_dev.log start_dev.log.old
fi

echo ""
echo "Starting Backend (Unity.API)..."
cd dotnet-backend/Unity.API

# Start backend with hot reload enabled
DOTNET_WATCH_SUPPRESS_LAUNCH_BROWSER=1 \
DOTNET_WATCH_RESTART_ON_RUDE_EDIT=true \
dotnet watch run --urls=http://localhost:8080 > ../../start_dev.log 2>&1 &
BACKEND_PID=$!
cd ../..

echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
echo "Waiting for Backend to initialize (8080)..."
MAX_RETRIES=30
COUNT=0
while ! lsof -i:8080 > /dev/null 2>&1; do
    # Check if backend process is still running
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "Error: Backend process died during startup."
        echo "Last 50 lines of log:"
        tail -n 50 start_dev.log
        exit 1
    fi
    
    sleep 1
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "Error: Backend failed to start on port 8080 within $MAX_RETRIES seconds."
        echo "Last 50 lines of log:"
        tail -n 50 start_dev.log
        kill -9 $BACKEND_PID 2>/dev/null
        exit 1
    fi
done

echo "✓ Backend started successfully."

# Verify backend is responding
sleep 2
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health 2>/dev/null || echo "000")
if [ "$HEALTH_CHECK" == "000" ]; then
    echo "⚠ Warning: Backend health check failed (no health endpoint configured)"
else
    echo "✓ Backend health check: HTTP $HEALTH_CHECK"
fi

echo ""
echo "Starting Frontend..."
cd frontend
npm start >> ../start_dev.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "Frontend started with PID: $FRONTEND_PID"

# Create lock file with process information
cat > "$LOCK_FILE" << EOF
BACKEND_PID=$BACKEND_PID
FRONTEND_PID=$FRONTEND_PID
STARTED_AT=$(date +"%Y-%m-%d %H:%M:%S")
PROJECT_DIR=$PROJECT_DIR
EOF

echo ""
echo "------------------------------------------------"
echo "Development Environment Started Successfully"
echo "------------------------------------------------"
echo "Backend PID:  $BACKEND_PID (Port 8080)"
echo "Frontend PID: $FRONTEND_PID (Port 3000)"
echo "Started at:   $(date +"%Y-%m-%d %H:%M:%S")"
echo "Lock file:    $LOCK_FILE"
echo "Logs:         start_dev.log"
echo "------------------------------------------------"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Monitor processes
while true; do
    # Check if backend is still running
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "⚠ Backend process died unexpectedly!"
        echo "Last 50 lines of log:"
        tail -n 50 start_dev.log
        break
    fi
    
    # Check if frontend is still running
    if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "⚠ Frontend process died unexpectedly!"
        echo "Last 50 lines of log:"
        tail -n 50 start_dev.log
        break
    fi
    
    sleep 5
done

# Wait for processes to finish (if they exit normally)
wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
