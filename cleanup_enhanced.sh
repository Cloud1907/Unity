#!/bin/bash

# Enhanced Cleanup Script with Process Verification
# Ensures all dotnet and node processes related to Unity development are properly terminated

echo "--- Starting Enhanced Environment Cleanup ---"

# Function to kill processes and verify termination
kill_and_verify() {
    local process_name=$1
    local pids=$(pgrep -f "$process_name")
    
    if [ ! -z "$pids" ]; then
        echo "Found $process_name processes: $pids"
        echo "$pids" | xargs kill -15 2>/dev/null  # Try graceful shutdown first
        sleep 2
        
        # Check if processes are still running
        local remaining=$(pgrep -f "$process_name")
        if [ ! -z "$remaining" ]; then
            echo "Force killing remaining $process_name processes: $remaining"
            echo "$remaining" | xargs kill -9 2>/dev/null
            sleep 1
        fi
        
        # Final verification
        local final_check=$(pgrep -f "$process_name")
        if [ -z "$final_check" ]; then
            echo "✓ All $process_name processes terminated"
        else
            echo "⚠ Warning: Some $process_name processes still running: $final_check"
        fi
    else
        echo "✓ No $process_name processes found"
    fi
}

# 1. Kill processes on specific ports first
echo ""
echo "Step 1: Cleaning up ports..."
PORT_8080_PIDS=$(lsof -ti:8080)
if [ ! -z "$PORT_8080_PIDS" ]; then
    echo "Killing processes on port 8080: $PORT_8080_PIDS"
    echo "$PORT_8080_PIDS" | xargs kill -9 2>/dev/null
    sleep 1
fi

PORT_3000_PIDS=$(lsof -ti:3000)
if [ ! -z "$PORT_3000_PIDS" ]; then
    echo "Killing processes on port 3000: $PORT_3000_PIDS"
    echo "$PORT_3000_PIDS" | xargs kill -9 2>/dev/null
    sleep 1
fi

# 2. Kill dotnet processes related to this project
echo ""
echo "Step 2: Cleaning up dotnet processes..."

# Get the absolute path of the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Find all dotnet processes running from this project directory
DOTNET_PIDS=$(ps aux | grep dotnet | grep "$PROJECT_DIR" | grep -v grep | awk '{print $2}')
if [ ! -z "$DOTNET_PIDS" ]; then
    echo "Found project-specific dotnet processes: $DOTNET_PIDS"
    echo "$DOTNET_PIDS" | xargs kill -15 2>/dev/null
    sleep 2
    
    # Force kill if still running
    REMAINING=$(ps aux | grep dotnet | grep "$PROJECT_DIR" | grep -v grep | awk '{print $2}')
    if [ ! -z "$REMAINING" ]; then
        echo "Force killing remaining dotnet processes: $REMAINING"
        echo "$REMAINING" | xargs kill -9 2>/dev/null
    fi
fi

# Also kill by process name patterns
kill_and_verify "dotnet watch"
kill_and_verify "dotnet run"
kill_and_verify "dotnet-watch.dll"
kill_and_verify "Unity.API"
kill_and_verify "MSBuild.dll"

# 3. Clean up frontend node processes
echo ""
echo "Step 3: Cleaning up frontend processes..."
FRONTEND_PIDS=$(ps aux | grep node | grep "$PROJECT_DIR/frontend" | grep -v grep | awk '{print $2}')
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo "Found frontend node processes: $FRONTEND_PIDS"
    echo "$FRONTEND_PIDS" | xargs kill -15 2>/dev/null
    sleep 2
    
    # Force kill if still running
    REMAINING=$(ps aux | grep node | grep "$PROJECT_DIR/frontend" | grep -v grep | awk '{print $2}')
    if [ ! -z "$REMAINING" ]; then
        echo "Force killing remaining node processes: $REMAINING"
        echo "$REMAINING" | xargs kill -9 2>/dev/null
    fi
fi

# 4. Verify ports are free
echo ""
echo "Step 4: Final verification..."
PORT_8080_CHECK=$(lsof -ti:8080)
PORT_3000_CHECK=$(lsof -ti:3000)

if [ -z "$PORT_8080_CHECK" ]; then
    echo "✓ Port 8080 is free"
else
    echo "⚠ Warning: Port 8080 still occupied by PID: $PORT_8080_CHECK"
fi

if [ -z "$PORT_3000_CHECK" ]; then
    echo "✓ Port 3000 is free"
else
    echo "⚠ Warning: Port 3000 still occupied by PID: $PORT_3000_CHECK"
fi

# 5. Check for any remaining dotnet processes
REMAINING_DOTNET=$(ps aux | grep dotnet | grep "$PROJECT_DIR" | grep -v grep | wc -l | tr -d ' ')
if [ "$REMAINING_DOTNET" -eq "0" ]; then
    echo "✓ No remaining project dotnet processes"
else
    echo "⚠ Warning: $REMAINING_DOTNET dotnet processes still running"
    ps aux | grep dotnet | grep "$PROJECT_DIR" | grep -v grep
fi

# 6. Optional: Clean build artifacts if requested
if [ "$1" == "--clean-build" ]; then
    echo ""
    echo "Step 5: Cleaning build artifacts..."
    rm -rf dotnet-backend/Unity.API/bin/Debug
    rm -rf dotnet-backend/Unity.API/obj/Debug
    rm -rf dotnet-backend/Unity.Infrastructure/bin/Debug
    rm -rf dotnet-backend/Unity.Infrastructure/obj/Debug
    rm -rf dotnet-backend/Unity.Core/bin/Debug
    rm -rf dotnet-backend/Unity.Core/obj/Debug
    echo "✓ Build artifacts cleaned"
fi

echo ""
echo "--- Enhanced Cleanup Complete ---"
echo ""
