@echo off
call "C:\Program Files\nodejs\nodevars.bat"
echo Installing PDF generation dependencies...
npm install puppeteer handlebars
echo Dependencies installed!
echo Starting backend server...
node server.js
