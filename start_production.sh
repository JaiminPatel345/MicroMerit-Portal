#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting MicroMerit Portal Production Environment...${NC}\n"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required commands
if ! command_exists npm; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}Error: node is not installed${NC}"
    exit 1
fi

if ! command_exists python3; then
    echo -e "${RED}Error: python3 is not installed${NC}"
    exit 1
fi

# Function to prefix logs with service name and color
prefix_logs() {
    local color=$1
    local service=$2
    while IFS= read -r line; do
        echo -e "${color}[${service}]${NC} $line"
    done
}

# Check if builds exist, if not, offer to build
echo -e "${YELLOW}Checking for built services...${NC}"

BUILD_NEEDED=0

if [ ! -d "client/main-app/dist" ]; then
    echo -e "${YELLOW}⚠ client/main-app/dist not found${NC}"
    BUILD_NEEDED=1
fi

if [ ! -d "client/admin/dist" ]; then
    echo -e "${YELLOW}⚠ client/admin/dist not found${NC}"
    BUILD_NEEDED=1
fi

if [ ! -d "server/node-app/dist" ]; then
    echo -e "${YELLOW}⚠ server/node-app/dist not found${NC}"
    BUILD_NEEDED=1
fi

if [ $BUILD_NEEDED -eq 1 ]; then
    echo -e "\n${RED}Some services are not built yet.${NC}"
    echo -e "${CYAN}Please run the build script first:${NC}"
    echo -e "  ${GREEN}./build_all.sh${NC}"
    echo -e "\n${CYAN}Or build manually:${NC}"
    echo -e "  cd client/main-app && npm run build"
    echo -e "  cd client/admin && yarn build"
    echo -e "  cd server/node-app && yarn build"
    echo ""
    read -p "Do you want to build now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "\n${CYAN}Building all services...${NC}\n"
        
        echo -e "${GREEN}Building client-main...${NC}"
        (cd client/main-app && npm run build) || exit 1
        
        echo -e "${BLUE}Building client-admin...${NC}"
        (cd client/admin && yarn build) || exit 1
        
        echo -e "${YELLOW}Building server-node...${NC}"
        (cd server/node-app && yarn build) || exit 1
        
        echo -e "\n${GREEN}✓ All builds completed!${NC}\n"
    else
        echo -e "${RED}Exiting. Please build the services first.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ All builds found!${NC}\n"

# Start serving built client apps with a simple http server
echo -e "${GREEN}[1/5] Starting client-main (production)...${NC}"
if command_exists serve; then
    (cd client/main-app && serve -s dist -l 5173 2>&1 | prefix_logs "${GREEN}" "client-main") &
    MAIN_APP_PID=$!
elif command_exists python3; then
    (cd client/main-app/dist && python3 -m http.server 5173 2>&1 | prefix_logs "${GREEN}" "client-main") &
    MAIN_APP_PID=$!
else
    echo -e "${YELLOW}Warning: No static server found. Install 'serve' with: npm install -g serve${NC}"
    echo -e "${YELLOW}Skipping client-main...${NC}"
fi

# Start admin
echo -e "${BLUE}[2/5] Starting client-admin (production)...${NC}"
if command_exists serve; then
    (cd client/admin && serve -s dist -l 5174 2>&1 | prefix_logs "${BLUE}" "client-admin") &
    ADMIN_PID=$!
elif command_exists python3; then
    (cd client/admin/dist && python3 -m http.server 5174 2>&1 | prefix_logs "${BLUE}" "client-admin") &
    ADMIN_PID=$!
else
    echo -e "${YELLOW}Warning: Skipping client-admin...${NC}"
fi

# Start node-app (production)
echo -e "${YELLOW}[3/5] Starting server-node (production)...${NC}"
(cd server/node-app && node dist/server.js 2>&1 | prefix_logs "${YELLOW}" "server-node") &
NODE_APP_PID=$!

# Start ai_groq_service
echo -e "${MAGENTA}[4/5] Starting server-ai (production)...${NC}"
if [ -d "server/ai_groq_service/.venv" ]; then
    (cd server/ai_groq_service && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 2>&1 | prefix_logs "${MAGENTA}" "server-ai") &
    AI_SERVICE_PID=$!
else
    echo -e "${YELLOW}Warning: .venv not found for AI service. Trying without venv...${NC}"
    (cd server/ai_groq_service && uvicorn main:app --host 0.0.0.0 --port 8000 2>&1 | prefix_logs "${MAGENTA}" "server-ai") &
    AI_SERVICE_PID=$!
fi

# Start dummy-server (production)
echo -e "${CYAN}[5/5] Starting dummy-server (production)...${NC}"
(cd dummy-server && node dist/index.js 2>&1 | prefix_logs "${CYAN}" "dummy-server") &
DUMMY_SERVER_PID=$!

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ All production services started!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${CYAN}Service URLs:${NC}"
echo -e "  ${GREEN}Main App:${NC}       http://localhost:5173"
echo -e "  ${BLUE}Admin Panel:${NC}    http://localhost:5174"
echo -e "  ${YELLOW}Node Backend:${NC}   http://localhost:3000"
echo -e "  ${MAGENTA}AI Service:${NC}     http://localhost:8000"
echo -e "  ${CYAN}Dummy Server:${NC}   http://localhost:4000"

echo -e "\n${CYAN}Color Legend:${NC}"
echo -e "  ${GREEN}[client-main]${NC}   - Main App (Production Build)"
echo -e "  ${BLUE}[client-admin]${NC}  - Admin Panel (Production Build)"
echo -e "  ${YELLOW}[server-node]${NC}   - Node Backend (Production)"
echo -e "  ${MAGENTA}[server-ai]${NC}     - AI Service (Production)"
echo -e "  ${CYAN}[dummy-server]${NC}  - Dummy Credential Providers"

echo -e "\n${YELLOW}Note: For client apps, install 'serve' for better production serving:${NC}"
echo -e "  ${GREEN}npm install -g serve${NC}"

echo -e "\n${CYAN}Press Ctrl+C to stop all services${NC}\n"

# Trap Ctrl+C and kill all background processes
trap "echo -e '\n${RED}Stopping all services...${NC}'; kill $MAIN_APP_PID $ADMIN_PID $NODE_APP_PID $AI_SERVICE_PID $DUMMY_SERVER_PID 2>/dev/null; exit" INT

# Wait for all background processes
wait
