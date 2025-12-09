#!/bin/bash

# Load Testing Script for Node-App Health Endpoint
# Tests the /health endpoint with increasing load to find maximum capacity

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  MicroMerit Node-App Load Test - /health endpoint${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Configuration
SERVER_URL="${1:-http://localhost:3000}"
ENDPOINT="/health"
FULL_URL="${SERVER_URL}${ENDPOINT}"

# Check if server is running
echo -e "${YELLOW}Checking if server is running...${NC}"
if ! curl -s -o /dev/null -w "%{http_code}" "$FULL_URL" | grep -q "200"; then
    echo -e "${RED}✗ Server is not responding at ${FULL_URL}${NC}"
    echo -e "${YELLOW}Please start the server first:${NC}"
    echo -e "  cd server/node-app && yarn dev"
    echo -e "  or"
    echo -e "  cd server/node-app && yarn start"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}\n"

# Check for load testing tools
HAS_AUTOCANNON=false
HAS_AB=false
HAS_WRENCH=false

if command -v autocannon &> /dev/null; then
    HAS_AUTOCANNON=true
    echo -e "${GREEN}✓ Found autocannon${NC}"
fi

if command -v ab &> /dev/null; then
    HAS_AB=true
    echo -e "${GREEN}✓ Found Apache Bench (ab)${NC}"
fi

if command -v wrk &> /dev/null; then
    HAS_WRENCH=true
    echo -e "${GREEN}✓ Found wrk${NC}"
fi

if [ "$HAS_AUTOCANNON" = false ] && [ "$HAS_AB" = false ] && [ "$HAS_WRENCH" = false ]; then
    echo -e "${YELLOW}⚠ No load testing tools found${NC}"
    echo -e "${YELLOW}Installing autocannon...${NC}"
    npm install -g autocannon
    HAS_AUTOCANNON=true
fi

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Starting Load Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Function to run autocannon test
run_autocannon_test() {
    local connections=$1
    local duration=$2
    
    echo -e "${CYAN}Test: ${connections} connections, ${duration}s duration${NC}"
    autocannon -c $connections -d $duration "$FULL_URL"
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Function to run Apache Bench test
run_ab_test() {
    local requests=$1
    local concurrency=$2
    
    echo -e "${CYAN}Test: ${requests} requests, ${concurrency} concurrent${NC}"
    ab -n $requests -c $concurrency "$FULL_URL"
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Function to run wrk test
run_wrk_test() {
    local connections=$1
    local duration=$2
    local threads=$3
    
    echo -e "${CYAN}Test: ${threads} threads, ${connections} connections, ${duration}s${NC}"
    wrk -t$threads -c$connections -d${duration}s "$FULL_URL"
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Run progressive load tests
if [ "$HAS_AUTOCANNON" = true ]; then
    echo -e "${GREEN}Using autocannon for load testing${NC}\n"
    
    # Light load
    echo -e "${YELLOW}═══ Light Load Test ═══${NC}"
    run_autocannon_test 10 10
    
    # Medium load
    echo -e "${YELLOW}═══ Medium Load Test ═══${NC}"
    run_autocannon_test 50 10
    
    # Heavy load
    echo -e "${YELLOW}═══ Heavy Load Test ═══${NC}"
    run_autocannon_test 100 10
    
    # Extreme load
    echo -e "${YELLOW}═══ Extreme Load Test ═══${NC}"
    run_autocannon_test 500 10
    
    # Maximum load
    echo -e "${YELLOW}═══ Maximum Load Test ═══${NC}"
    run_autocannon_test 1000 10

elif [ "$HAS_AB" = true ]; then
    echo -e "${GREEN}Using Apache Bench for load testing${NC}\n"
    
    # Light load
    echo -e "${YELLOW}═══ Light Load Test ═══${NC}"
    run_ab_test 1000 10
    
    # Medium load
    echo -e "${YELLOW}═══ Medium Load Test ═══${NC}"
    run_ab_test 5000 50
    
    # Heavy load
    echo -e "${YELLOW}═══ Heavy Load Test ═══${NC}"
    run_ab_test 10000 100
    
    # Extreme load
    echo -e "${YELLOW}═══ Extreme Load Test ═══${NC}"
    run_ab_test 50000 500

elif [ "$HAS_WRENCH" = true ]; then
    echo -e "${GREEN}Using wrk for load testing${NC}\n"
    
    # Light load
    echo -e "${YELLOW}═══ Light Load Test ═══${NC}"
    run_wrk_test 10 10 2
    
    # Medium load
    echo -e "${YELLOW}═══ Medium Load Test ═══${NC}"
    run_wrk_test 50 10 4
    
    # Heavy load
    echo -e "${YELLOW}═══ Heavy Load Test ═══${NC}"
    run_wrk_test 100 10 4
    
    # Extreme load
    echo -e "${YELLOW}═══ Extreme Load Test ═══${NC}"
    run_wrk_test 500 10 8
fi

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Load Testing Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${CYAN}Key Metrics to Review:${NC}"
echo -e "  • Requests per second (RPS)"
echo -e "  • Latency (p50, p95, p99)"
echo -e "  • Error rate"
echo -e "  • Throughput (bytes/sec)"
echo -e "\n${YELLOW}Note: Monitor server CPU and memory usage during tests${NC}\n"
