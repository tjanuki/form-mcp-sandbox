#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# PIDs to track background processes
LARAVEL_PID=""
MCP_PID=""
NGROK_PID=""

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down all services...${NC}"

    if [ ! -z "$LARAVEL_PID" ]; then
        echo -e "${BLUE}   Stopping Laravel API (PID: $LARAVEL_PID)${NC}"
        kill $LARAVEL_PID 2>/dev/null
    fi

    if [ ! -z "$MCP_PID" ]; then
        echo -e "${BLUE}   Stopping MCP Server (PID: $MCP_PID)${NC}"
        kill $MCP_PID 2>/dev/null
    fi

    if [ ! -z "$NGROK_PID" ]; then
        echo -e "${BLUE}   Stopping ngrok (PID: $NGROK_PID)${NC}"
        kill $NGROK_PID 2>/dev/null
    fi

    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    MCP Server Local Testing Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v php &> /dev/null; then
    echo -e "${RED}❌ PHP not found. Please install PHP.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Step 2: Start Laravel API
echo -e "${YELLOW}🚀 Starting Laravel API...${NC}"
cd "$PROJECT_ROOT/recruitment-app"

if [ ! -f "artisan" ]; then
    echo -e "${RED}❌ Laravel artisan not found. Are you in the correct directory?${NC}"
    exit 1
fi

# Check if port 8004 is already in use
if lsof -Pi :8004 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 8004 already in use, stopping existing process...${NC}"
    lsof -ti :8004 | xargs kill -9 2>/dev/null
    sleep 1
fi

php artisan serve --port=8004 > /tmp/laravel-api.log 2>&1 &
LARAVEL_PID=$!

# Wait for Laravel to start
sleep 3

# Check if Laravel is running
if ! kill -0 $LARAVEL_PID 2>/dev/null; then
    echo -e "${RED}❌ Failed to start Laravel API${NC}"
    echo -e "${RED}   Check logs: tail -f /tmp/laravel-api.log${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Laravel API started (PID: $LARAVEL_PID)${NC}"
echo -e "${BLUE}   URL: http://localhost:8004${NC}"
echo ""

# Step 3: Build MCP Server
echo -e "${YELLOW}🔨 Building MCP Server...${NC}"
cd "$PROJECT_ROOT/recruitment-mcp-server"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found in recruitment-mcp-server${NC}"
    cleanup
    exit 1
fi

npm run build > /tmp/mcp-build.log 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    echo -e "${RED}   Check logs: tail -f /tmp/mcp-build.log${NC}"
    cleanup
    exit 1
fi

echo -e "${GREEN}✅ MCP Server built successfully${NC}"
echo ""

# Step 4: Start MCP HTTP Server
echo -e "${YELLOW}🚀 Starting MCP HTTP Server...${NC}"

# Check if port 3000 is already in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 already in use, stopping existing process...${NC}"
    lsof -ti :3000 | xargs kill -9 2>/dev/null
    sleep 1
fi

npm run start:http > /tmp/mcp-server.log 2>&1 &
MCP_PID=$!

# Wait for MCP server to start
sleep 3

# Check if MCP server is running
if ! kill -0 $MCP_PID 2>/dev/null; then
    echo -e "${RED}❌ Failed to start MCP HTTP Server${NC}"
    echo -e "${RED}   Check logs: tail -f /tmp/mcp-server.log${NC}"
    cleanup
    exit 1
fi

echo -e "${GREEN}✅ MCP HTTP Server started (PID: $MCP_PID)${NC}"
echo -e "${BLUE}   URL: http://localhost:3000${NC}"
echo -e "${BLUE}   SSE: http://localhost:3000/sse${NC}"
echo ""

# Step 5: Test health endpoints
echo -e "${YELLOW}🏥 Testing health endpoints...${NC}"

# Test Laravel
LARAVEL_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" -H "Accept: application/json" http://localhost:8004/api/recruitments 2>/dev/null)
if [ "$LARAVEL_HEALTH" = "200" ] || [ "$LARAVEL_HEALTH" = "401" ]; then
    echo -e "${GREEN}✅ Laravel API responding${NC}"
else
    echo -e "${YELLOW}⚠️  Laravel API may not be ready (HTTP $LARAVEL_HEALTH)${NC}"
fi

# Test MCP Server
sleep 2
MCP_HEALTH=$(curl -s http://localhost:3000/health 2>/dev/null)
if [ ! -z "$MCP_HEALTH" ]; then
    echo -e "${GREEN}✅ MCP Server responding${NC}"
    echo -e "${BLUE}   Response: $MCP_HEALTH${NC}"
else
    echo -e "${YELLOW}⚠️  MCP Server may not be ready${NC}"
fi

echo ""

# Step 6: ngrok setup
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🌐 ngrok Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if command -v ngrok &> /dev/null; then
    echo -e "${GREEN}✅ ngrok is installed${NC}"
    echo ""
    echo -e "${YELLOW}Would you like to start ngrok now? (y/n)${NC}"
    read -p "> " START_NGROK

    if [ "$START_NGROK" = "y" ] || [ "$START_NGROK" = "Y" ]; then
        echo -e "${YELLOW}🚀 Starting ngrok...${NC}"
        ngrok http 3000 > /tmp/ngrok.log 2>&1 &
        NGROK_PID=$!

        sleep 3

        if kill -0 $NGROK_PID 2>/dev/null; then
            echo -e "${GREEN}✅ ngrok started (PID: $NGROK_PID)${NC}"
            echo ""
            echo -e "${BLUE}📡 ngrok Web Interface: ${GREEN}http://localhost:4040${NC}"
            echo -e "${BLUE}   View your public URL and request logs there${NC}"
            echo ""

            # Try to extract the public URL from ngrok API
            sleep 2
            NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)

            if [ ! -z "$NGROK_URL" ]; then
                echo -e "${GREEN}🌍 Your public MCP Server URL:${NC}"
                echo -e "${GREEN}   $NGROK_URL/sse${NC}"
                echo ""
                echo -e "${YELLOW}📋 ChatGPT Configuration:${NC}"
                echo -e "${BLUE}   1. Go to ChatGPT Settings → Connectors${NC}"
                echo -e "${BLUE}   2. Enable Developer Mode${NC}"
                echo -e "${BLUE}   3. Create new connector with URL: ${GREEN}$NGROK_URL/sse${NC}"
                echo -e "${BLUE}   4. Set Authentication: No Auth${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  ngrok failed to start${NC}"
            NGROK_PID=""
        fi
    else
        echo -e "${BLUE}ℹ️  To start ngrok manually, run:${NC}"
        echo -e "${GREEN}   ngrok http 3000${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  ngrok not found${NC}"
    echo -e "${BLUE}   Install with: ${GREEN}brew install ngrok${NC}"
    echo -e "${BLUE}   Or download from: ${GREEN}https://ngrok.com/download${NC}"
    echo ""
    echo -e "${BLUE}   After installing, run:${NC}"
    echo -e "${GREEN}   ngrok http 3000${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ All Services Running!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
echo -e "${GREEN}   Laravel API:    http://localhost:8004 (PID: $LARAVEL_PID)${NC}"
echo -e "${GREEN}   MCP Server:     http://localhost:3000 (PID: $MCP_PID)${NC}"
if [ ! -z "$NGROK_PID" ]; then
    echo -e "${GREEN}   ngrok:          http://localhost:4040 (PID: $NGROK_PID)${NC}"
fi
echo ""
echo -e "${BLUE}📝 Log Files:${NC}"
echo -e "${BLUE}   Laravel:        tail -f /tmp/laravel-api.log${NC}"
echo -e "${BLUE}   MCP Server:     tail -f /tmp/mcp-server.log${NC}"
if [ ! -z "$NGROK_PID" ]; then
    echo -e "${BLUE}   ngrok:          tail -f /tmp/ngrok.log${NC}"
fi
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running
while true; do
    sleep 1

    # Check if processes are still running
    if ! kill -0 $LARAVEL_PID 2>/dev/null; then
        echo -e "${RED}❌ Laravel API crashed!${NC}"
        cleanup
    fi

    if ! kill -0 $MCP_PID 2>/dev/null; then
        echo -e "${RED}❌ MCP Server crashed!${NC}"
        cleanup
    fi

    if [ ! -z "$NGROK_PID" ] && ! kill -0 $NGROK_PID 2>/dev/null; then
        echo -e "${YELLOW}⚠️  ngrok stopped${NC}"
        NGROK_PID=""
    fi
done
