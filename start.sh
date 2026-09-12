#!/bin/bash

# Exit on any error
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "🚀 Starting Eduro: AI-Powered Personalized Learning Platform"
echo "=========================================================="

# 1. Source nvm if present
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
fi

# 2. Check Python venv
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment in backend/venv..."
    python3 -m venv backend/venv
    backend/venv/bin/pip install -r backend/requirements.txt
fi

# 3. Start Backend
echo "Starting Flask API backend on port 5001..."
PYTHONPATH=backend backend/venv/bin/python backend/app.py &
BACKEND_PID=$!

# Trap Ctrl+C to kill both services
cleanup() {
    echo ""
    echo "Shutting down Eduro platform..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Wait a moment for backend to warm up
sleep 2

# 4. Start Frontend
echo "Starting Next.js frontend on port 3000..."
cd frontend
npm run dev -- -p 3000 &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo "✨ Eduro is live!"
echo "   🌐 Web App:  http://localhost:3000"
echo "   🔌 API Docs: http://localhost:5001/api/health"
echo "=========================================================="
echo "Press Ctrl+C to stop both servers."

wait
