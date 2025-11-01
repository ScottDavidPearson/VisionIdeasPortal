@echo off
echo Starting Vision Ideas Portal with auto-restart...
echo Press Ctrl+C to stop completely

:restart
echo.
echo ========================================
echo Starting server at %date% %time%
echo ========================================
node server.js
echo.
echo ========================================
echo Server stopped at %date% %time%
echo Restarting in 3 seconds...
echo Press Ctrl+C to stop completely
echo ========================================
timeout /t 3 /nobreak > nul
goto restart
