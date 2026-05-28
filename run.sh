#!/bin/bash

echo "==================================================="
echo "  🚀 Starting AI Electronics Simulator Setup..."
echo "==================================================="

echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "⚡ Starting both servers (Press Ctrl+C to stop)..."
echo "Backend will run on http://localhost:3001"
echo "Frontend will run on http://localhost:5173"
echo ""

# Trap Ctrl+C (SIGINT) to close both servers when the script stops
trap 'echo "🛑 Stopping servers..."; kill 0' SIGINT

# Run both in the background
cd backend && npm run dev &
cd frontend && npm run dev &

# Wait for background processes to finish
wait
