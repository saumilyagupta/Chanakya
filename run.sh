#!/bin/bash
# ============================================
# Chanakya Project Run Script (Unix/Linux/Mac)
# ============================================
# This script starts both backend and frontend
# Run: chmod +x run.sh && ./run.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   Starting Chanakya Application${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo -e "${RED}Virtual environment not found. Run ./setup.sh first${NC}"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Backend
echo -e "${YELLOW}Starting Backend Server...${NC}"
python Server/Web_server/main.py &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to start
sleep 3

# Start Frontend
echo -e "${YELLOW}Starting Frontend...${NC}"
cd Client_F/front_chanak
npm run dev &
FRONTEND_PID=$!
cd ../..
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   Application Running!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  Frontend: ${BLUE}http://localhost:5173${NC}"
echo -e "  Backend:  ${BLUE}http://localhost:3000${NC}"
echo -e "  API Docs: ${BLUE}http://localhost:3000/docs${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Wait for both processes
wait
