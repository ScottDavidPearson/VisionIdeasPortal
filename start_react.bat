@echo off
echo Starting React Development Server on port 3001...
call "C:\Program Files\nodejs\nodevars.bat"
cd client
set PORT=3001
npm start
