@echo off
call "C:\Program Files\nodejs\nodevars.bat"
echo Installing frontend dependencies...
cd client
npm install react-beautiful-dnd
echo Frontend dependencies installed!
cd ..
echo Starting backend server...
start "Backend Server" node server.js
echo Backend server started!
echo Starting frontend server...
cd client
start "Frontend Server" npm start
echo Frontend server starting...
echo.
echo ========================================
echo Vision Ideas Portal with Kanban Dashboard
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Login Credentials:
echo Username: admin
echo Password: admin123
echo ========================================
