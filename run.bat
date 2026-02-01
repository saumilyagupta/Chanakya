@echo off
setlocal

REM Ensure we are in project root (script directory)
cd /d "%~dp0"

echo Starting Chanakya...
echo Backend and frontend will open in separate windows.
echo.

start "Chanakya Backend" cmd /k "cd /d "%~dp0" && venv\Scripts\activate.bat && python Server\Web_server\main.py"
start "Chanakya Frontend" cmd /k "cd /d "%~dp0Client_F\front_chanak" && npm run dev"

echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Close the Backend and Frontend windows to stop the application.
