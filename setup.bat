@echo off
REM ============================================
REM Chanakya Project Setup Script (Windows)
REM ============================================
REM This script sets up the complete Chanakya project
REM Run: setup.bat

setlocal EnableDelayedExpansion

echo ============================================
echo    Chanakya Project Setup Script
echo ============================================
echo.

REM Get the directory where the script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM ============================================
REM Check Prerequisites
REM ============================================
echo [1/6] Checking prerequisites...

REM Check Python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found. Please install Python 3.9+
    echo   Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python found

REM Get Python version
for /f "tokens=*" %%i in ('python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"') do set PYTHON_VERSION=%%i
echo   Python version: %PYTHON_VERSION%

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    echo   Download from: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%

REM Check npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm not found. Please install Node.js which includes npm
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm found: %NPM_VERSION%

echo.

REM ============================================
REM Setup Python Virtual Environment
REM ============================================
echo [2/6] Setting up Python virtual environment...

set "VENV_DIR=venv"

if exist "%VENV_DIR%" (
    echo   Virtual environment already exists, activating...
) else (
    echo   Creating virtual environment...
    python -m venv %VENV_DIR%
)

REM Activate virtual environment
call %VENV_DIR%\Scripts\activate.bat
echo [OK] Virtual environment activated

REM Upgrade pip
echo   Upgrading pip...
python -m pip install --upgrade pip -q

echo.

REM ============================================
REM Install Python Dependencies
REM ============================================
echo [3/6] Installing Python dependencies...

REM Install root requirements
if exist "requirements.txt" (
    echo   Installing root requirements...
    pip install -r requirements.txt 
)

REM Install server requirements
if exist "Server\requirements.txt" (
    echo   Installing server requirements...
    pip install -r Server\requirements.txt 
)

echo [OK] Python dependencies installed
echo.

REM ============================================
REM Install Frontend Dependencies
REM ============================================
echo [4/6] Installing frontend dependencies...

cd Client_F\front_chanak

if exist "node_modules" (
    echo   node_modules exists, checking for updates...
    call npm install 
) else (
    echo   Installing npm packages...
    call npm install
)

cd ..\..

echo [OK] Frontend dependencies installed
echo.

REM ============================================
REM Check Environment File
REM ============================================
echo [5/6] Checking environment configuration...

if exist ".env" (
    echo [OK] .env file found
) else (
    echo [WARNING] .env file not found
    if exist "Server\.env.example" (
        echo   Creating .env from template...
        copy "Server\.env.example" ".env" >nul
        echo [WARNING] Please edit .env with your API keys
    )
)

echo.

REM ============================================
REM Display Start Instructions
REM ============================================
echo [6/6] Setup Complete!
echo.
echo ============================================
echo    Setup Complete!
echo ============================================
echo.
echo To start the project, run:
echo.
echo   run.bat  - Start both backend and frontend
echo.
echo Or start individually:
echo.
echo   Backend:  venv\Scripts\activate.bat ^&^& python Server\Web_server\main.py
echo   Frontend: cd Client_F\front_chanak ^&^& npm run dev
echo.
echo Application URLs:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000
echo   API Docs: http://localhost:3000/docs
echo.
pause
