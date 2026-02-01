#!/usr/bin/env bash

# Ensure we are in project root (script directory)
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

BACKEND_PID=""
cleanup() {
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT
trap 'cleanup; exit 130' INT TERM

echo "Starting Chanakya..."
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both."
echo ""

# Start backend in background
(
    source venv/bin/activate
    python Server/Web_server/main.py
) &
BACKEND_PID=$!

# Give backend a moment to bind
sleep 2

# Start frontend in foreground
cd Client_F/front_chanak
npm run dev
