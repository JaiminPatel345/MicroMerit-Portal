# 🚀 Quick Start Guide - MicroMerit AI Integration

## Overview

This guide will help you set up and run the complete MicroMerit system with AI integration.

---

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ / Windows 10+ / macOS
- **Node.js**: v18 or higher
- **Python**: 3.8 or higher
- **PostgreSQL**: 14 or higher
- **Tesseract OCR**: Latest version

### Accounts Needed
- Groq API Key (for AI features)
- Filebase Account (for IPFS storage)

---

## Installation Steps

### 1. Install System Dependencies

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python
sudo apt install -y python3 python3-pip python3-venv

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Tesseract OCR
sudo apt install -y tesseract-ocr tesseract-ocr-eng

# Verify installations
node --version  # Should show v18+
python3 --version  # Should show 3.8+
psql --version  # Should show 14+
tesseract --version  # Should show 4.x or 5.x
```

#### Windows
1. Install Node.js from: https://nodejs.org/
2. Install Python from: https://www.python.org/downloads/
3. Install PostgreSQL from: https://www.postgresql.org/download/windows/
4. Install Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki
   - **Important**: Note the installation path (usually `C:\Program Files\Tesseract-OCR`)

#### macOS
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node python postgresql tesseract

# Verify installations
node --version
python3 --version
psql --version
tesseract --version
```

---

## Setup Instructions

### Step 1: Clone Repository

```bash
cd ~/My/Dev/Projects/sih/
# Repository should already be at:
# /home/jaimin/My/Dev/Projects/sih/MicroMerit-Portal
```

---

### Step 2: Setup PostgreSQL Database

```bash
# Start PostgreSQL service (Ubuntu)
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql
```

In PostgreSQL shell:
```sql
CREATE DATABASE micromerit;
CREATE USER micromerit_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE micromerit TO micromerit_user;
\q
```

---

### Step 3: Setup Node.js Backend

```bash
cd server/node-app

# Install dependencies
yarn install

# Create .env file
cp .env.example .env

# Edit .env file
nano .env
```

Configure `.env`:
```bash
# Database
DATABASE_URL="postgresql://micromerit_user:your_secure_password@localhost:5432/micromerit"

# JWT Secrets
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# Filebase (IPFS)
FILEBASE_ACCESS_KEY_ID=your_filebase_key
FILEBASE_SECRET_ACCESS_KEY=your_filebase_secret
FILEBASE_BUCKET_NAME=micromerit-certificates

# AI Service
AI_SERVICE_URL=http://localhost:8000

# Blockchain (Optional)
BLOCKCHAIN_RPC_URL=your_blockchain_rpc_url
```

Setup database:
```bash
# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
nn


# Seed database (optional)
npm run seed
```

Start backend:
```bash
# Development mode
npm run dev

# Backend runs on: http://localhost:3000
```

---

### Step 4: Setup AI Service (Python)

```bash
cd server/ai_groq_service

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Ubuntu/Linux/macOS
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env
nano .env
```

Configure `.env`:

**For Ubuntu/Linux:**
```bash
GROQ_API_KEY=your_groq_api_key_here
MODEL_NAME=llama-3.1-8b-instant
MOCK_MODE=false
GROQ_TIMEOUT_SECONDS=25

# Tesseract - NOT NEEDED (auto-detected)
# TESSERACT_CMD=/usr/bin/tesseract
```

**For Windows:**
```bash
GROQ_API_KEY=your_groq_api_key_here
MODEL_NAME=llama-3.1-8b-instant
MOCK_MODE=false
GROQ_TIMEOUT_SECONDS=25

# Tesseract - REQUIRED
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

Start AI service:
```bash
# Development mode
python main.py

# Or with uvicorn
uvicorn main:app --reload --port 8000

# AI Service runs on: http://localhost:8000
```

---

### Step 5: Setup Frontend

```bash
cd client/main-app

# Install dependencies
yarn install

# Create .env file
cp .env.example .env

# Edit .env
nano .env
```

Configure `.env`:
```bash
VITE_BACKEND_URL=http://localhost:3000
```

Start frontend:
```bash
# Development mode
yarn dev

# Frontend runs on: http://localhost:5173
```

---

## Verify Installation

### 1. Check Backend
```bash
curl http://localhost:3000/health

# Expected response:
# {
#   "success": true,
#   "message": "Server is running",
#   "timestamp": "..."
# }
```

### 2. Check AI Service
```bash
curl http://localhost:8000/health

# Expected response:
# {
#   "status": "ok",
#   "model": "llama-3.1-8b-instant",
#   "mock": false,
#   "key_loaded": true
# }
```

### 3. Check Frontend
Open browser: `http://localhost:5173`

Should see the MicroMerit homepage.

---

## Testing the AI Integration

### Test OCR Processing (via Backend)

```bash
# This will be called internally when issuer uploads certificate
# Create a test certificate PDF first

curl -X POST http://localhost:8000/process-ocr \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test_certificate.pdf" \
  -F "learner_email=test@example.com" \
  -F "certificate_title=Python Programming" \
  -F "issuer_name=TechUniversity"
```

### Test Recommendations (via Backend)

```bash
# Login as learner first to get token
# Then call:

curl http://localhost:3000/api/ai/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### Issue: Tesseract not found

**Ubuntu:**
```bash
# Check if installed
which tesseract

# If not found, install
sudo apt install tesseract-ocr

# Verify
tesseract --version
```

**Windows:**
1. Verify Tesseract is installed
2. Check the path in `.env` matches installation location
3. Common path: `C:\Program Files\Tesseract-OCR\tesseract.exe`

### Issue: AI Service connection refused

```bash
# Check if AI service is running
curl http://localhost:8000/health

# If not running, start it:
cd server/ai_groq_service
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

### Issue: PostgreSQL connection error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql

# Check connection
psql -U micromerit_user -d micromerit
```

### Issue: Port already in use

```bash
# Check what's using the port
sudo lsof -i :3000  # Backend
sudo lsof -i :8000  # AI Service
sudo lsof -i :5173  # Frontend

# Kill process if needed
kill -9 <PID>
```

---

## Running All Services

### Option 1: Manual (3 terminals)

**Terminal 1 - Backend:**
```bash
cd server/node-app
npm run dev
```

**Terminal 2 - AI Service:**
```bash
cd server/ai_groq_service
source venv/bin/activate
python main.py
```

**Terminal 3 - Frontend:**
```bash
cd client/main-app
yarn dev
```

### Option 2: Using tmux

```bash
# Start tmux session
tmux new -s micromerit

# Split panes (Ctrl+b %)
# Run each service in different panes

# Detach: Ctrl+b d
# Attach: tmux attach -t micromerit
```

---

## Quick Reference

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:5173 | 5173 |
| Backend | http://localhost:3000 | 3000 |
| AI Service | http://localhost:8000 | 8000 |
| PostgreSQL | localhost | 5432 |

---

## Next Steps

1. ✅ Create issuer account
2. ✅ Upload test certificate
3. ✅ Verify OCR extraction
4. ✅ Create learner account
5. ✅ View AI recommendations
6. ✅ Test complete flow

---

## Get Groq API Key

1. Visit: https://console.groq.com/
2. Sign up / Sign in
3. Go to API Keys section
4. Create new key
5. Copy and paste into `.env` file

---

## Additional Resources

- **Architecture**: See `ARCHITECTURE_CORRECTIONS.md`
- **API Docs**: See `docs/AI_API_DOCS.md`
- **Test Guide**: See `docs/AI_TESTS.md`
- **Complete Summary**: See `FINAL_REFACTOR_SUMMARY.md`

---

## Support

If you encounter issues:
1. Check logs in terminal
2. Verify all services are running
3. Check `.env` configuration
4. Ensure all dependencies are installed
5. Review error messages carefully

---

**Quick Start Status**: ✅ Ready to Go!

Start all three services and visit `http://localhost:5173` to begin!
