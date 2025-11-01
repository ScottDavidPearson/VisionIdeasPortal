@echo off
call "C:\Program Files\nodejs\nodevars.bat"
echo Installing PDF dependencies (this may take a few minutes)...
npm install puppeteer handlebars
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo Starting server...
node server.js
