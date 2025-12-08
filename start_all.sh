#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse arguments
DEV_MODE=false
CLEAN_MODE=false
NO_WORKERS=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dev) DEV_MODE=true ;;
        --clean) CLEAN_MODE=true ;;
        --no-start-workers) NO_WORKERS=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo -e "${BLUE}Starting MicroMerit Portal Development Environment...${NC}\n"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i ":$1" >/dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    local host=$1
    local port=$2
    local max_attempts=${3:-30}
    local attempt=1
    
    while ! nc -z "$host" "$port" 2>/dev/null; do
        if [ $attempt -ge $max_attempts ]; then
            echo -e "${RED}Timeout waiting for $host:$port${NC}"
            return 1
        fi
        echo -e "${YELLOW}Waiting for $host:$port... (attempt $attempt)${NC}"
        sleep 1
        ((attempt++))
    done
    echo -e "${GREEN}$host:$port is ready${NC}"
    return 0
}

# Function to prefix logs with service name and color
prefix_logs() {
    local color=$1
    local service=$2
    while IFS= read -r line; do
        echo -e "${color}[${service}]${NC} $line"
    done
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

# Start Redis if not running
if $DEV_MODE; then
    echo -e "${CYAN}Checking Redis...${NC}"
    if ! port_in_use 6379; then
        if command_exists docker; then
            echo -e "${CYAN}Starting Redis container...${NC}"
            docker run -d --name micromerit-redis -p 6379:6379 redis:alpine 2>/dev/null || \
                docker start micromerit-redis 2>/dev/null
            wait_for_service localhost 6379
        else
            echo -e "${YELLOW}Redis not running and Docker not available. Please start Redis manually.${NC}"
        fi
    else
        echo -e "${GREEN}Redis already running on port 6379${NC}"
    fi
fi

# Run migrations and seed if clean mode
if $CLEAN_MODE; then
    echo -e "${CYAN}Running Prisma migrations...${NC}"
    (cd server/node-app && npx prisma migrate dev --name external_sync 2>&1 | prefix_logs "${CYAN}" "prisma")
    
    echo -e "${CYAN}Seeding database...${NC}"
    (cd server/node-app && npx prisma db seed 2>&1 | prefix_logs "${CYAN}" "seed") || true
fi

# Install dependencies for dummy server if dev mode
if $DEV_MODE && [ -d "server/dummy-apisetu" ]; then
    echo -e "${CYAN}Installing dummy API-Setu dependencies...${NC}"
    (cd server/dummy-apisetu && npm install 2>&1 | prefix_logs "${CYAN}" "dummy-install")
fi

# Store PIDs for cleanup
PIDS=()

# Start dummy API-Setu server (dev mode only)
if $DEV_MODE && [ -d "server/dummy-apisetu" ]; then
    echo -e "${CYAN}[0/5] Starting dummy-apisetu...${NC}"
    (cd server/dummy-apisetu && npm run dev 2>&1 | prefix_logs "${CYAN}" "dummy-apisetu") &
    PIDS+=($!)
    sleep 2
fi

# Start main-app
echo -e "${GREEN}[1/5] Starting client-main...${NC}"
(cd client/main-app && npm run dev 2>&1 | prefix_logs "${GREEN}" "client-main") &
PIDS+=($!)

# Start admin
echo -e "${BLUE}[2/5] Starting client-admin...${NC}"
(cd client/admin && yarn dev 2>&1 | prefix_logs "${BLUE}" "client-admin") &
PIDS+=($!)

# Start node-app
echo -e "${YELLOW}[3/5] Starting server-node...${NC}"
(cd server/node-app && yarn dev 2>&1 | prefix_logs "${YELLOW}" "server-node") &
PIDS+=($!)

# Start ai_groq_service
echo -e "${MAGENTA}[4/5] Starting server-ai...${NC}"
(cd server/ai_groq_service && source .venv/bin/activate && uvicorn main:app --reload --port 8000 2>&1 | prefix_logs "${MAGENTA}" "server-ai") &
PIDS+=($!)

echo -e "\n${CYAN}All services started!${NC}"
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}Service URLs:${NC}"
echo -e "  ${GREEN}Main App:${NC}       http://localhost:5173"
echo -e "  ${BLUE}Admin Panel:${NC}    http://localhost:5174"
echo -e "  ${YELLOW}Node Backend:${NC}   http://localhost:3000"
echo -e "  ${MAGENTA}AI Service:${NC}     http://localhost:8000"
if $DEV_MODE; then
    echo -e "  ${CYAN}Dummy API-Setu:${NC} http://localhost:4000"
    echo -e "  ${CYAN}Redis:${NC}          localhost:6379"
fi
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}Color Legend:${NC}"
echo -e "  ${GREEN}[client-main]${NC} - Main App"
echo -e "  ${BLUE}[client-admin]${NC} - Admin Panel"
echo -e "  ${YELLOW}[server-node]${NC} - Node Backend"
echo -e "  ${MAGENTA}[server-ai]${NC} - AI Service"
if $DEV_MODE; then
    echo -e "  ${CYAN}[dummy-apisetu]${NC} - Dummy API-Setu"
fi
echo -e "\n${CYAN}Press Ctrl+C to stop all services${NC}\n"

# Trap Ctrl+C and kill all background processes
cleanup() {
    echo -e "\n${RED}Stopping all services...${NC}"
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null
    done
    exit
}
trap cleanup INT TERM

# Wait for all background processes
wait