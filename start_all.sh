#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting MicroMerit Portal Development Environment...${NC}\n"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required commands
if ! command_exists npm; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

if ! command_exists yarn; then
    echo -e "${RED}Error: yarn is not installed${NC}"
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

# Start main-app
echo -e "${GREEN}[1/4] Starting client-main...${NC}"
(cd client/main-app && npm run dev 2>&1 | prefix_logs "${GREEN}" "client-main") &
MAIN_APP_PID=$!

# Start admin
echo -e "${BLUE}[2/4] Starting client-admin...${NC}"
(cd client/admin && yarn dev 2>&1 | prefix_logs "${BLUE}" "client-admin") &
ADMIN_PID=$!

# Start node-app
echo -e "${YELLOW}[3/4] Starting server-node...${NC}"
(cd server/node-app && yarn dev 2>&1 | prefix_logs "${YELLOW}" "server-node") &
NODE_APP_PID=$!

# Start ai_groq_service
echo -e "${MAGENTA}[4/4] Starting server-ai...${NC}"
(cd server/ai_groq_service && source .venv/bin/activate && uvicorn main:app --reload --port 8000 2>&1 | prefix_logs "${MAGENTA}" "server-ai") &
AI_SERVICE_PID=$!

echo -e "\n${CYAN}All services started!${NC}"
echo -e "${CYAN}Color Legend:${NC}"
echo -e "  ${GREEN}[client-main]${NC} - Main App"
echo -e "  ${BLUE}[client-admin]${NC} - Admin Panel"
echo -e "  ${YELLOW}[server-node]${NC} - Node Backend"
echo -e "  ${MAGENTA}[server-ai]${NC} - AI Service"
echo -e "\n${CYAN}Press Ctrl+C to stop all services${NC}\n"

# Trap Ctrl+C and kill all background processes
trap "echo -e '\n${RED}Stopping all services...${NC}'; kill $MAIN_APP_PID $ADMIN_PID $NODE_APP_PID $AI_SERVICE_PID 2>/dev/null; exit" INT

# Wait for all background processes
wait