@echo off
cd /d %~dp0backend
echo Installing backend dependencies...
call npm install
echo.
echo Backend installation complete!
pause
