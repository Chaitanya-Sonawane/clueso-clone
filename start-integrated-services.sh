#!/bin/bash

# Clueso Integrated Services Startup Script
# This script starts both the backend (port 3000) and frontend (port 3000) with team collaboration features

echo "🎬 Starting Clueso Integrated Services..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}Port $port is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}Port $port is available${NC}"
        return 0
    fi
}

# Function to start backend
start_backend() {
    echo -e "\n${BLUE}🚀 Starting Backend Server (Port 3000)...${NC}"
    cd Clueso_Node_layer-main
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing backend dependencies...${NC}"
        npm install
    fi
    
    # Start backend server
    echo -e "${GREEN}Starting backend with team collaboration features...${NC}"
    npm start &
    BACKEND_PID=$!
    
    # Wait for backend to start
    echo "Waiting for backend to start..."
    sleep 5
    
    # Check if backend is running
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Backend server started successfully (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${RED}❌ Failed to start backend server${NC}"
        exit 1
    fi
    
    cd ..
}

# Function to start frontend
start_frontend() {
    echo -e "\n${BLUE}🎨 Starting Frontend (Port 3001)...${NC}"
    cd frontend-main
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing frontend dependencies...${NC}"
        npm install
    fi
    
    # Set environment variable for frontend port
    export PORT=3001
    
    # Start frontend server
    echo -e "${GREEN}Starting frontend with integrated collaboration UI...${NC}"
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for frontend to start
    echo "Waiting for frontend to start..."
    sleep 8
    
    # Check if frontend is running
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Frontend server started successfully (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${RED}❌ Failed to start frontend server${NC}"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    
    cd ..
}

# Function to display service information
show_services() {
    echo -e "\n${GREEN}🎉 All services started successfully!${NC}"
    echo "=================================="
    echo -e "${BLUE}Backend API Server:${NC} http://localhost:3000"
    echo -e "${BLUE}Frontend Dashboard:${NC} http://localhost:3001"
    echo -e "${BLUE}Demo Collaboration:${NC} http://localhost:3000/demo"
    echo -e "${BLUE}WebSocket Server:${NC} ws://localhost:3000"
    echo ""
    echo -e "${YELLOW}Team Collaboration Features:${NC}"
    echo "• Real-time video synchronization"
    echo "• Team member invitations"
    echo "• Live playback control sharing"
    echo "• Collaborative comments and feedback"
    echo "• Multi-user session management"
    echo ""
    echo -e "${YELLOW}Available Endpoints:${NC}"
    echo "• POST /api/collaboration/videos/:videoId/session - Create collaboration session"
    echo "• POST /api/collaboration/sessions/:sessionId/invite - Invite team members"
    echo "• GET /api/collaboration/sessions/:sessionId/participants - Get participants"
    echo "• WebSocket events: join_video, playback_control, authenticate"
    echo ""
    echo -e "${GREEN}Press Ctrl+C to stop all services${NC}"
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping services...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend server stopped${NC}"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend server stopped${NC}"
    fi
    
    echo -e "${GREEN}👋 All services stopped successfully${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
echo -e "${BLUE}Checking port availability...${NC}"

# Check if ports are available
if ! check_port 3000; then
    echo -e "${RED}Please stop the service using port 3000 and try again${NC}"
    exit 1
fi

if ! check_port 3001; then
    echo -e "${RED}Please stop the service using port 3001 and try again${NC}"
    exit 1
fi

# Start services
start_backend
start_frontend
show_services

# Keep script running
while true; do
    sleep 1
    
    # Check if services are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend server stopped unexpectedly${NC}"
        cleanup
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend server stopped unexpectedly${NC}"
        cleanup
    fi
done