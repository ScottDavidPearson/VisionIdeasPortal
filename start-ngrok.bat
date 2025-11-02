@echo off
echo Starting ngrok tunnel for Vision Ideas Portal...
echo.
echo Backend server should be running on port 5000
echo Ngrok will create tunnel with basic auth: jestais / secure123
echo.

REM Try common download locations for ngrok
if exist "C:\Users\%USERNAME%\Downloads\ngrok.exe" (
    echo Found ngrok in Downloads folder
    echo.
    echo You may need to set up ngrok authtoken first:
    echo 1. Go to https://dashboard.ngrok.com/signup
    echo 2. Sign up for free account
    echo 3. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
    echo 4. Run: "C:\Users\%USERNAME%\Downloads\ngrok.exe" config add-authtoken YOUR_TOKEN
    echo.
    echo Starting tunnel...
    "C:\Users\%USERNAME%\Downloads\ngrok.exe" http 5000 --basic-auth="jestais:secure123"
) else (
    echo ngrok.exe not found in Downloads folder
    echo Please ensure ngrok.exe is in your Downloads folder
    pause
)
