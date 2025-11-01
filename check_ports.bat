@echo off
echo Checking port usage...
echo.
echo Checking port 3000:
netstat -ano | findstr :3000
echo.
echo Checking port 3001:
netstat -ano | findstr :3001
echo.
echo Checking port 5000:
netstat -ano | findstr :5000
echo.
pause
