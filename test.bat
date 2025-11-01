@echo off
echo Testing Node.js...
call "C:\Program Files\nodejs\nodevars.bat"
node --version
npm --version
echo Starting server...
node server.js
pause
