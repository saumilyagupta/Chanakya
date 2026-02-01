@echo off
setlocal

echo ============================================
echo Chanakya - Setup
echo ============================================

REM Check Python 3.11+
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.11+ from https://www.python.org/downloads/
    exit /b 1
)
python -c "import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)" 2>nul
if errorlevel 1 (
    echo ERROR: Python 3.11+ is required. Check with: python --version
    exit /b 1
)
echo [OK] Python 3.11+

REM Check Node 18+
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 18+ from https://nodejs.org/
    exit /b 1
)
node -e "const v=process.versions.node.split('.'); process.exit(parseInt(v[0],10)>=18?0:1)" 2>nul
if errorlevel 1 (
    echo ERROR: Node.js 18+ is required. Check with: node --version
    exit /b 1
)
echo [OK] Node.js 18+

REM Create virtual environment
echo.
echo Creating Python virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create venv
    exit /b 1
)

REM Activate venv and install Python dependencies
call venv\Scripts\activate.bat
echo.
echo Installing Python dependencies (root)...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install root requirements
    exit /b 1
)
echo Installing Python dependencies (Server)...
pip install -r Server\requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Server requirements
    exit /b 1
)

REM Install frontend dependencies
echo.
echo Installing frontend dependencies...
cd Client_F\front_chanak
npm install
if errorlevel 1 (
    echo ERROR: Failed to run npm install
    cd ..\..
    exit /b 1
)
cd ..\..

REM Check .env
if not exist .env (
    echo.
    echo NOTE: .env not found. Copy .env.example to .env and add your API keys.
    echo   Required: GEMINI_API_KEY, VITE_SARVAM_API_KEY
)

echo.
echo ============================================
echo Setup complete. Run run.bat to start the app.
echo ============================================
