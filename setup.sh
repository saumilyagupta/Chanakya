#!/bin/bash
# ============================================
# Chanakya Project Setup Script (Unix/Linux/Mac)
# ============================================
# This script sets up the complete Chanakya project
# Run: chmod +x setup.sh && ./setup.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   Chanakya Project Setup Script${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ============================================
# Check Prerequisites
# ============================================
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    echo -e "${GREEN}✓ Python3 found${NC}"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    echo -e "${GREEN}✓ Python found${NC}"
else
    echo -e "${RED}✗ Python not found. Please install Python 3.9+${NC}"
    echo "  Download from: https://www.python.org/downloads/"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$($PYTHON_CMD -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo -e "  Python version: ${PYTHON_VERSION}"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js found: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    echo "  Download from: https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm found: ${NPM_VERSION}${NC}"
else
    echo -e "${RED}✗ npm not found. Please install Node.js which includes npm${NC}"
    exit 1
fi

echo ""

# ============================================
# Setup Python Virtual Environment
# ============================================
echo -e "${YELLOW}[2/6] Setting up Python virtual environment...${NC}"

VENV_DIR="venv"

if [ -d "$VENV_DIR" ]; then
    echo -e "  Virtual environment already exists, activating..."
else
    echo -e "  Creating virtual environment..."
    $PYTHON_CMD -m venv $VENV_DIR
fi

# Activate virtual environment
source $VENV_DIR/bin/activate
echo -e "${GREEN}✓ Virtual environment activated${NC}"

# Upgrade pip
echo -e "  Upgrading pip..."
pip install --upgrade pip 

echo ""

# ============================================
# Install Python Dependencies
# ============================================
echo -e "${YELLOW}[3/6] Installing Python dependencies...${NC}"

# Install root requirements
if [ -f "requirements.txt" ]; then
    echo -e "  Installing root requirements..."
    pip install -r requirements.txt  
fi

# Install server requirements
if [ -f "Server/requirements.txt" ]; then
    echo -e "  Installing server requirements..."
    pip install -r Server/requirements.txt      
fi

echo -e "${GREEN}✓ Python dependencies installed${NC}"
echo ""

# ============================================
# Install Frontend Dependencies
# ============================================
echo -e "${YELLOW}[4/6] Installing frontend dependencies...${NC}"

cd Client_F/front_chanak

if [ -d "node_modules" ]; then
    echo -e "  node_modules exists, checking for updates..."
    npm install 
else
    echo -e "  Installing npm packages..."
    npm install 
fi

cd ../..

echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

# ============================================
# Check Environment File
# ============================================
echo -e "${YELLOW}[5/6] Checking environment configuration...${NC}"

if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file found (root)${NC}"
else
    echo -e "${YELLOW}! .env file not found${NC}"
    if [ -f ".env.example" ]; then
        echo -e "  Creating .env from root .env.example..."
        cp .env.example .env
        echo -e "${YELLOW}! Please edit .env with your API keys${NC}"
    elif [ -f "Server/.env.example" ]; then
        echo -e "  Creating .env from Server/.env.example..."
        cp Server/.env.example .env
        echo -e "${YELLOW}! Please edit .env with your API keys${NC}"
    fi
fi

echo ""

# ============================================
# Display Start Instructions
# ============================================
echo -e "${YELLOW}[6/6] Setup Complete!${NC}"
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   Setup Complete! 🎉${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "To start the project, run:"
echo ""
echo -e "  ${BLUE}./run.sh${NC}  - Start both backend and frontend"
echo ""
echo -e "Or start individually:"
echo ""
echo -e "  Backend:  ${BLUE}source venv/bin/activate && python Server/Web_server/main.py${NC}"
echo -e "  Frontend: ${BLUE}cd Client_F/front_chanak && npm run dev${NC}"
echo ""
echo -e "Application URLs:"
echo -e "  Frontend: ${BLUE}http://localhost:5173${NC}"
echo -e "  Backend:  ${BLUE}http://localhost:3000${NC}"
echo -e "  API Docs: ${BLUE}http://localhost:3000/docs${NC}"
echo ""
