@echo off
echo ===================================================
echo   🚀 Starting AI Electronics Simulator Setup...
echo ===================================================

echo.
echo [1/2] Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo [2/2] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo ⚡ Starting both servers...
echo (Two new terminal windows will open)
echo Backend will run on http://localhost:3001
echo Frontend will run on http://localhost:5173
echo.

start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend && npm run dev"

echo Done!
pause
