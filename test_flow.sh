#!/bin/bash

# Complete Test Flow for External Credential Sync
# This script guides you through testing the entire flow

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  External Credential Sync - Complete Test Flow${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Step 1: Run migration
echo -e "${YELLOW}Step 1: Running database migration...${NC}"
cd server/node-app
npx prisma migrate dev --name external_credential_sync
npx prisma generate
echo -e "${GREEN}✓ Migration complete${NC}\n"

# Step 2: Reset and seed
echo -e "${YELLOW}Step 2: Resetting database and seeding test data...${NC}"
npx tsx prisma/reset_db.ts
npx tsx prisma/seed_complete.ts
echo -e "${GREEN}✓ Database ready${NC}\n"

# Step 3: Install dummy server deps
echo -e "${YELLOW}Step 3: Installing dummy server dependencies...${NC}"
cd ../dummy-apisetu
npm install
echo -e "${GREEN}✓ Dummy server ready${NC}\n"

# Step 4: Show next steps
cd ../..
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Setup Complete! Now start the services:${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${BLUE}Terminal 1${NC} - Start Redis:"
echo -e "  docker run --rm --name redis -p 6379:6379 redis:alpine"
echo ""

echo -e "${BLUE}Terminal 2${NC} - Start Dummy Server:"
echo -e "  cd server/dummy-apisetu && npm run dev"
echo ""

echo -e "${BLUE}Terminal 3${NC} - Start Worker (processes credentials):"
echo -e "  cd server/node-app && npx tsx src/workers/credential-worker.ts"
echo ""

echo -e "${BLUE}Terminal 4${NC} - Start Main Services:"
echo -e "  ./start_all.sh"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Testing Flow:${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

echo "1. Admin Panel (http://localhost:5174)"
echo "   Login: admin@micromerit.com / admin123"
echo "   → Go to 'Credential Sync' → 'Test' tab"
echo "   → Click 'Trigger Test Webhook'"
echo "   → Check 'Credentials' tab to see imported credential"
echo ""

echo "2. Learner Portal (http://localhost:5173)"
echo "   Login: learner1@example.com / password123"
echo "   → Go to 'Wallet' page"
echo "   → You should see the credential from provider-a"
echo "   → Status will show 'external' badge"
echo ""

echo "3. Alternative: Trigger via curl"
echo "   curl -X POST http://localhost:4000/admin/push-webhook \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"provider\":\"provider-a\"}'"
echo ""

echo -e "${YELLOW}Note: Make sure all 4 terminals are running!${NC}\n"
