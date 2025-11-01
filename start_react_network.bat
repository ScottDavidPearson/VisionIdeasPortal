@echo off
call "C:\Program Files\nodejs\nodevars.bat"
echo Starting React Development Server with Network Access...
cd client
set HOST=0.0.0.0
npm start
