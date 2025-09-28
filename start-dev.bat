@echo off
echo Starting Mini Chat Development Servers...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd mini-chat-backend && npm run dev"

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd moni.chat && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3002
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause > nul
