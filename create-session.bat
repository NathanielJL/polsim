@echo off
echo ========================================
echo POLSIM - Create Session
echo ========================================
echo.

cd /d %~dp0backend

echo Checking Node modules...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Creating session...
node ..\create-session.js

pause
