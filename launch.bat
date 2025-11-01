@echo off
echo Starting Aha Ideas Portal...

REM Start backend server in background
start "Backend Server" cmd /c "call "C:\Program Files\nodejs\nodevars.bat" && node server.js"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server
echo Starting frontend...
call "C:\Program Files\nodejs\nodevars.bat"
cd client
npm start

pause
