@echo off
cd /d %~dp0frontend
echo Installing frontend dependencies...
call npm install
echo.
echo Frontend installation complete!
pause
