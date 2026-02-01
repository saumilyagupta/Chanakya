#!/usr/bin/env bash
set -e

echo "============================================"
echo "Chanakya - Setup"
echo "============================================"

# Check Python 3.11+
if ! command -v python3 &>/dev/null && ! command -v python &>/dev/null; then
    echo "ERROR: Python not found. Please install Python 3.11+ from https://www.python.org/downloads/"
    exit 1
fi
PYTHON_CMD=$(command -v python3 2>/dev/null || command -v python 2>/dev/null)
if ! $PYTHON_CMD -c "import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)" 2>/dev/null; then
    echo "ERROR: Python 3.11+ is required. Check with: $PYTHON_CMD --version"
    exit 1
fi
echo "[OK] Python 3.11+"

# Check Node 18+
if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
if ! node -e "const v=process.versions.node.split('.'); process.exit(parseInt(v[0],10)>=18?0:1)" 2>/dev/null; then
    echo "ERROR: Node.js 18+ is required. Check with: node --version"
    exit 1
fi
echo "[OK] Node.js 18+"

# Create virtual environment
echo ""
echo "Creating Python virtual environment..."
$PYTHON_CMD -m venv venv

# Activate venv and install Python dependencies
source venv/bin/activate
echo ""
echo "Installing Python dependencies (root)..."
pip install -r requirements.txt
echo "Installing Python dependencies (Server)..."
pip install -r Server/requirements.txt

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd Client_F/front_chanak
npm install
cd ../..

# Check .env
if [ ! -f .env ]; then
    echo ""
    echo "NOTE: .env not found. Copy .env.example to .env and add your API keys."
    echo "  Required: GEMINI_API_KEY, VITE_SARVAM_API_KEY"
fi

echo ""
echo "============================================"
echo "Setup complete. Run ./run.sh to start the app."
echo "============================================"
