#!/bin/bash

# Kill ports 3000 and 8000 to ensure clean start
echo "🧹 Cleaning up ports 3000 and 8000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null

echo "🚀 Starting 4Flow Development Environment..."

# Start Backend
echo "📦 Starting Backend on port 8000..."
cd backend
source venv/bin/activate
# Run in background, log to file
python -m uvicorn server:app --reload --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Start Frontend
echo "🎨 Starting Frontend on port 3000..."
cd ../frontend
# Run in background, log to file
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo "
🎉 System is starting up!
- Frontend: http://localhost:3000
- Backend:  http://localhost:8000
- Logs are being written to backend.log and frontend.log

Press Ctrl+C to stop servers.
"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
