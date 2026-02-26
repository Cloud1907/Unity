#!/bin/bash

# Unity Project - Letta Memory Initialization Script

echo "======================================"
echo "🧠 Unity AI Memory Initialization (Venv Mode)"
echo "======================================"

# 0. Cleanup
echo "[0/5] Cleaning up previous processes..."
pkill -f "letta server" || true

# Letta Memory Configuration
export GEMINI_API_KEY="AIzaSyCL4GXWtzZ_6j7ZqdRI0__dSBWwODRtlso"

# 1. Setup Virtual Environment
echo "[1/5] Setting up Virtual Environment (.venv)..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "    Created .venv"
else
    echo "    Found existing .venv"
fi

# Activate Venv
source .venv/bin/activate

# 3. Configure Isolation
export LETTA_HOME="$(pwd)/.letta_data"
echo "[2.5/5] configured LETTA_HOME to $LETTA_HOME"

# Force SQLite via Environment Variable
# SQLite URI format: sqlite:///<absolute_path>
export LETTA_PG_URI="sqlite:///$LETTA_HOME/letta.db"
echo "[2.6/5] configured LETTA_PG_URI to $LETTA_PG_URI"
unset LETTA_PG_POOL_SIZE

# Ensure directory exists
mkdir -p "$LETTA_HOME"

# 2. Install Dependencies

# 2. Install Dependencies
echo "[2/5] Installing Letta & asyncpg..."
pip install --upgrade pip > /dev/null
pip install letta letta-client asyncpg pgvector
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Letta/asyncpg."
    exit 1
fi

# 3. Start Letta Server (Custom CLI with patched env)
echo "[3/5] Starting Letta Server (Custom CLI)..."
# We run the custom script which patches and inits DB in one go
nohup python run_letta_custom_cli.py > letta_server.log 2>&1 &
SERVER_PID=$!
echo "   PID: $SERVER_PID"
echo "   Waiting for server to startup (20s)..."
# Wait longer for first time DB creation
sleep 20
# 4. Verify Server
if ! ps -p $SERVER_PID > /dev/null; then
    echo "❌ Server process setup failed. Checking logs:"
    tail -n 30 letta_server.log
    exit 1
fi

# 5. Run Memory Bridge
echo "[4/5] Running Memory Bridge..."
python ai_memory_bridge.py

echo "======================================"
echo "✅ Initialization Process Finished."
echo "You can check 'letta_server.log' for server output."
echo "To stop the server later: pkill -f 'letta server'"
echo "To use the environment: source .venv/bin/activate"
echo "======================================"
