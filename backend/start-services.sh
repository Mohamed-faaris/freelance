#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Freelance Backend Microservices...${NC}"

# Function to start a service
start_service() {
    local service_name=$1
    local port=$2
    local module=$3

    echo -e "${YELLOW}Starting $service_name on port $port...${NC}"

    # Start service in background
    python -m uvicorn $module --host 0.0.0.0 --port $port --reload &
    local pid=$!

    # Wait a moment for service to start
    sleep 2

    # Check if service is running
    if kill -0 $pid 2>/dev/null; then
        echo -e "${GREEN}✓ $service_name started successfully (PID: $pid)${NC}"
        echo "  URL: http://localhost:$port"
        echo "  API Docs: http://localhost:$port/docs"
    else
        echo -e "${RED}✗ Failed to start $service_name${NC}"
    fi

    echo ""
}

# Start services
start_service "Auth Service" 8001 "microServices.authMicrosService:app"
start_service "Permissions Service" 8002 "microServices.permissionsMicrosService:app"
start_service "Services Service" 8003 "microServices.servicesMicrosService:app"

echo -e "${GREEN}All services started!${NC}"
echo ""
echo "Service URLs:"
echo "  Auth:        http://localhost:8001"
echo "  Permissions: http://localhost:8002"
echo "  Services:    http://localhost:8003"
echo ""
echo "API Documentation:"
echo "  Auth:        http://localhost:8001/docs"
echo "  Permissions: http://localhost:8002/docs"
echo "  Services:    http://localhost:8003/docs"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for all background processes
wait