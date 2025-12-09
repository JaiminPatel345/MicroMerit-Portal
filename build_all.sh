#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Building MicroMerit Portal - All Services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Track build status
BUILD_SUCCESS=0
BUILD_FAILED=0

# Function to build a service
build_service() {
    local service_name=$1
    local service_path=$2
    local build_command=$3
    local color=$4
    
    echo -e "${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${color}Building: ${service_name}${NC}"
    echo -e "${color}Path: ${service_path}${NC}"
    echo -e "${color}Command: ${build_command}${NC}"
    echo -e "${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    
    if [ -d "$service_path" ]; then
        (cd "$service_path" && eval "$build_command")
        if [ $? -eq 0 ]; then
            echo -e "\n${GREEN}✓ ${service_name} built successfully!${NC}\n"
            BUILD_SUCCESS=$((BUILD_SUCCESS + 1))
            return 0
        else
            echo -e "\n${RED}✗ ${service_name} build failed!${NC}\n"
            BUILD_FAILED=$((BUILD_FAILED + 1))
            return 1
        fi
    else
        echo -e "${RED}✗ Directory not found: ${service_path}${NC}\n"
        BUILD_FAILED=$((BUILD_FAILED + 1))
        return 1
    fi
}

# Build client-main
build_service \
    "Client - Main App" \
    "client/main-app" \
    "npm run build" \
    "${GREEN}"

# Build client-admin
build_service \
    "Client - Admin Panel" \
    "client/admin" \
    "yarn build" \
    "${BLUE}"

# Build server-node-app
build_service \
    "Server - Node Backend" \
    "server/node-app" \
    "yarn build" \
    "${YELLOW}"

# Build dummy-server (if it has TypeScript)
if [ -f "dummy-server/tsconfig.json" ]; then
    build_service \
        "Dummy Server" \
        "dummy-server" \
        "yarn build || npm run build" \
        "${CYAN}"
else
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Dummy Server: No build needed (JavaScript)${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
fi

# AI Service note
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}AI Service (Python): No build needed${NC}"
echo -e "${YELLOW}Ensure dependencies are installed:${NC}"
echo -e "  cd server/ai_groq_service"
echo -e "  python3 -m venv .venv"
echo -e "  source .venv/bin/activate"
echo -e "  pip install -r requirements.txt"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Build Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Successful builds: ${BUILD_SUCCESS}${NC}"
echo -e "${RED}Failed builds: ${BUILD_FAILED}${NC}"

if [ $BUILD_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ All builds completed successfully!${NC}"
    echo -e "\n${CYAN}You can now start the production environment with:${NC}"
    echo -e "  ${GREEN}./start_production.sh${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ Some builds failed. Please check the errors above.${NC}\n"
    exit 1
fi
