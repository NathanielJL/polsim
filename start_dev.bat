@echo off
REM Start backend server (runs in background)
start "POLSIM Backend" cmd /k "cd /d %~dp0backend && npm run dev"

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak

REM Start frontend development server
start "POLSIM Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo POLSIM Development Servers Starting
echo ========================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Close these windows to stop the servers.
echo ========================================
