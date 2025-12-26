#!/bin/bash

# Local development script
# Starts both frontend and backend in separate terminals

echo "Starting Diamond Auction Intelligence Platform..."

# Start backend
echo "Starting FastAPI backend on port 8000..."
cd api
source venv/bin/activate 2>/dev/null || python -m venv venv && source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting Next.js frontend on port 3000..."
cd ../web
npm install > /dev/null 2>&1
npm run dev &
FRONTEND_PID=$!

echo "Backend running on http://localhost:8000"
echo "Frontend running on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait










