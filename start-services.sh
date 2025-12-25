#!/bin/bash

echo "🚀 Starting Clueso Services..."

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Check ports
echo "Checking ports..."
check_port 3000
check_port 3001

# Kill existing processes if needed
echo "Cleaning up existing processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "node.*index.js" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

sleep 2

# Start backend
echo "🔧 Starting backend on port 3001..."
cd Clueso_Node_layer-main
npm run dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Test backend
echo "Testing backend..."
curl -s http://localhost:3001/api/v1/health || echo "Backend not ready yet"

# Start frontend
echo "🎨 Starting frontend on port 3000..."
cd ../frontend-main
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "🎉 Services started!"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo ""
echo "To stop services, run: kill $BACKEND_PID $FRONTEND_PID"
echo "Or use Ctrl+C to stop this script"

# Wait for user to stop
wait