@echo off
call "C:\Program Files\nodejs\nodevars.bat"
echo Installing backend dependencies...
npm install jsonwebtoken bcrypt
echo Backend dependencies installed!
node server.js
