#!/bin/bash

# Function to kill process on port
kill_port() {
  local port=$1
  local pid=$(lsof -t -i:$port)
  if [ -n "$pid" ]; then
    echo "Killing process on port $port (PID: $pid)..."
    kill -9 $pid
  fi
}

echo "🧹 Cleaning up old processes..."
kill_port 3000
kill_port 3001

echo "🚀 Starting Xandeum Web Analytics..."

# Start Backend
echo "📦 Starting Backend (NestJS)..."
cd backend
npm run start:dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "⏳ Waiting for Backend to be ready..."
sleep 5

# Start Frontend
echo "💻 Starting Frontend (Next.js)..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "------------------------------------------------"
echo "✅ System Started!"
echo "------------------------------------------------"
echo "👉 Backend API:   http://localhost:3001"
echo "👉 Dashboard UI:  http://localhost:3000"
echo "------------------------------------------------"
echo "📝 Logs are being written to backend.log and frontend.log"
echo "Press Ctrl+C to stop all servers."

# Trap Ctrl+C to kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Keep script running
wait