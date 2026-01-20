@echo off
REM ============================================
REM Chanakya Project Run Script (Windows)
REM ============================================
REM This script starts both backend and frontend
REM Run: run.bat

setlocal EnableDelayedExpansion

echo ============================================
echo    Starting Chanakya Application
echo ============================================
echo.

REM Get the directory where the script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Check if venv exists
if not exist "venv" (
    echo [ERROR] Virtual environment not found. Run setup.bat first
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

echo Starting Backend Server...
start "Chanakya Backend" cmd /k "cd /d %SCRIPT_DIR% && venv\Scripts\activate.bat && python Server\Web_server\main.py"

REM Wait for backend to start
timeout /t 5 /nobreak > nul

echo Starting Frontend...
start "Chanakya Frontend" cmd /k "cd /d %SCRIPT_DIR%\Client_F\front_chanak && npm run dev"

echo.
echo ============================================
echo    Application Running!
echo ============================================
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000
echo   API Docs: http://localhost:3000/docs
echo.
echo Two terminal windows have been opened:
echo   - "Chanakya Backend" - Python server
echo   - "Chanakya Frontend" - Vite dev server
echo.
echo Close both windows to stop the application.
echo.
pause
