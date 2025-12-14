# 🚀 Quick Start Guide - MicroMerit Portal

Complete setup guide for the MicroMerit AI-powered credential management system.

---

## 📋 Overview

MicroMerit Portal consists of **6 modules**:

1. **Main Backend** (`server/node-app`) - Port 3000
2. **AI Service** (`server/ai_groq_service`) - Port 8000
3. **Blockchain Service** (`server/blockchain`) - Port 3001
4. **Main App** (`client/main-app`) - Port 5173
5. **Admin Dashboard** (`client/admin`) - Port 5174
6. **Dummy Server** (`dummy-server`) - Port 4000 (for development/testing)

---

## ⚙️ Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ / Windows 10+ / macOS
- **Node.js**: v18 or higher
- **Python**: 3.8 or higher
- **PostgreSQL**: 14 or higher
- **Redis**: Latest version (for BullMQ queue)
- **Tesseract OCR**: Latest version (for AI service)

### Required Accounts & API Keys
- **Groq API Key** - Get from [console.groq.com](https://console.groq.com/)
- **Filebase Account** - Get from [filebase.com](https://filebase.com/) (for IPFS storage)
- **AWS S3** (optional) - For additional file storage
- **Twilio** (optional) - For SMS notifications
- **Google OAuth** (optional) - For Google sign-in

---

## 🔧 System Dependencies Installation

### Ubuntu/Debian

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3
sudo apt install -y python3 python3-pip python3-venv

# Install PostgreSQL 14
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Tesseract OCR
sudo apt install -y tesseract-ocr tesseract-ocr-eng

# Verify installations
node --version    # Should show v18+
python3 --version # Should show 3.8+
psql --version    # Should show 14+
redis-server --version
tesseract --version
```

### Windows

1. **Node.js**: Download from [nodejs.org](https://nodejs.org/)
2. **Python**: Download from [python.org](https://www.python.org/downloads/)
3. **PostgreSQL**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
4. **Redis**: Download from [redis.io](https://redis.io/download) or use WSL
5. **Tesseract**: Download from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
   - **Important**: Note the installation path (usually `C:\Program Files\Tesseract-OCR`)

### macOS

```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node python postgresql redis tesseract

# Start services
brew services start postgresql
brew services start redis

# Verify installations
node --version
python3 --version
psql --version
redis-server --version
tesseract --version
```

---

## 📥 Clone Repository

```bash
git clone https://github.com/JaiminPatel345/MicroMerit-Portal.git
cd MicroMerit-Portal
```

---

## 🗄️ Database Setup

### Start PostgreSQL

```bash
# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl enable postgresql

# macOS
brew services start postgresql

# Windows - PostgreSQL should start automatically
```

### Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Or on macOS/Windows
psql -U postgres
```

In PostgreSQL shell:
```sql
CREATE DATABASE micromerit;
CREATE USER micromerit_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE micromerit TO micromerit_user;
\q
```

---

## 🚀 Module Setup

### 1️⃣ Main Backend (`server/node-app`)

```bash
cd server/node-app

# Install dependencies
yarn install
# or: npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

**Configure `.env`:**
```env
# Database
DATABASE_URL="postgresql://micromerit_user:your_secure_password@localhost:5432/micromerit?schema=public"

# JWT Secrets (generate random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Service URLs
BLOCKCHAIN_SERVICE_URL=http://localhost:3001
AI_SERVICE_URL=http://127.0.0.1:8000
APP_URL=http://localhost:3000

# Filebase (IPFS) - Get from filebase.com
FILEBASE_ACCESS_KEY_ID=your_filebase_key
FILEBASE_SECRET_ACCESS_KEY=your_filebase_secret
FILEBASE_BUCKET_NAME=micromerit-credentials
FILEBASE_GATEWAY_URL=https://ipfs.filebase.io/ipfs/

# Blockchain
BLOCKCHAIN_MOCK_ENABLED=true
BLOCKCHAIN_NETWORK=sepolia

# External Credential Sync
ENABLE_EXTERNAL_SYNC=true
NSDC_ENABLED=true
NSDC_BASE_URL=http://localhost:4000/nsdc
UDEMY_ENABLED=true
UDEMY_BASE_URL=http://localhost:4000/udemy

# Email (optional - set SEND_SMAILS_AND_MESSAGES=false for dev)
SEND_SMAILS_AND_MESSAGES=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

**Setup database:**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with admin and test users
npx tsx prisma/seed.ts
```

**Start backend:**
```bash
yarn dev
# Backend runs on: http://localhost:3000
```

---

### 2️⃣ AI Service (`server/ai_groq_service`)

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

# Copy environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Configure `.env`:**

**For Ubuntu/Linux/macOS:**
```env
GROQ_API_KEY=your_groq_api_key_here
MODEL_NAME=llama-3.1-8b-instant
MOCK_MODE=false
GROQ_TIMEOUT_SECONDS=25

# Tesseract - NOT NEEDED (auto-detected)
```

**For Windows:**
```env
GROQ_API_KEY=your_groq_api_key_here
MODEL_NAME=llama-3.1-8b-instant
MOCK_MODE=false
GROQ_TIMEOUT_SECONDS=25

# Tesseract - REQUIRED
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

**Start AI service:**
```bash
python main.py
# AI Service runs on: http://localhost:8000
```

---

### 3️⃣ Blockchain Service (`server/blockchain`)

```bash
cd server/blockchain

# Install dependencies
yarn install
# or: npm install

# Copy environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Configure `.env`:**
```env
NODE_ENV=development
PORT=3001

BLOCKCHAIN_MOCK_ENABLED=true
BLOCKCHAIN_NETWORK=sepolia
BLOCKCHAIN_CONTRACT_ADDRESS=mock_contract

# For real blockchain (optional)
# SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
# PRIVATE_KEY=your_private_key_here
# CONTRACT_ADDRESS=0x...
```

**Start blockchain service:**
```bash
yarn dev
# Blockchain Service runs on: http://localhost:3001
```

---

### 4️⃣ Main App (`client/main-app`)

```bash
cd client/main-app

# Install dependencies
yarn install
# or: npm install

# Copy environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Configure `.env`:**
```env
VITE_BACKEND_URL=http://localhost:3000
VITE_AI_SERVICE_URL=http://localhost:8000
```

**Start main app:**
```bash
yarn dev
# Main App runs on: http://localhost:5173
```

---

### 5️⃣ Admin Dashboard (`client/admin`)

```bash
cd client/admin

# Install dependencies
yarn install
# or: npm install

# Copy environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Configure `.env`:**
```env
VITE_API_BASE_URL=http://localhost:3000
```

**Start admin dashboard:**
```bash
yarn dev
# Admin Dashboard runs on: http://localhost:5174
```

---

### 6️⃣ Dummy Server (`dummy-server`)

```bash
cd dummy-server

# Install dependencies
yarn install
# or: npm install

# No .env file needed - uses default config

# Start dummy server
yarn dev
# Dummy Server runs on: http://localhost:4000
```

---

## ✅ Verify Installation

### 1. Check Backend
```bash
curl http://localhost:3000/health
# Expected: {"success": true, "message": "Server is running", ...}
```

### 2. Check AI Service
```bash
curl http://localhost:8000/health
# Expected: {"status": "ok", "model": "llama-3.1-8b-instant", ...}
```

### 3. Check Blockchain Service
```bash
curl http://localhost:3001/health
# Expected: {"status": "ok", ...}
```

### 4. Check Frontend
Open browser: `http://localhost:5173`  
Should see the MicroMerit homepage.

### 5. Check Admin Dashboard
Open browser: `http://localhost:5174`  
Should see the admin login page.

### 6. Check Dummy Server
```bash
curl http://localhost:4000/health
# Expected: {"status": "ok", ...}
```

---

## 🔑 Default Credentials

After running the seed script, you can login with:

### Admin Dashboard (`http://localhost:5174`)
- **Email**: `admin@micromerit.com`
- **Password**: `admin123`

### Main App (`http://localhost:5173`)
- **Test Learner**: `learner@test.com` / `password123`
- **Test Issuer**: `issuer@test.com` / `password123`
- **Test Employer**: `employer@test.com` / `password123`

⚠️ **Important**: Change these credentials in production!

---

## 🏃 Running All Services

You need to run **5 services** simultaneously (dummy-server is optional):

### Option 1: Manual (5 separate terminals)

**Terminal 1 - Main Backend:**
```bash
cd server/node-app
yarn dev
```

**Terminal 2 - AI Service:**
```bash
cd server/ai_groq_service
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

**Terminal 3 - Blockchain Service:**
```bash
cd server/blockchain
yarn dev
```

**Terminal 4 - Main App:**
```bash
cd client/main-app
yarn dev
```

**Terminal 5 - Admin Dashboard:**
```bash
cd client/admin
yarn dev
```

**Terminal 6 (Optional) - Dummy Server:**
```bash
cd dummy-server
yarn dev
```

### Option 2: Using tmux (Linux/macOS)

```bash
# Start tmux session
tmux new -s micromerit

# Split into panes (Ctrl+b %)
# Run each service in different panes

# Detach: Ctrl+b d
# Attach: tmux attach -t micromerit
```

### Option 3: Using PM2 (Recommended for development)

```bash
# Install PM2 globally
npm install -g pm2

# Start all services
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Stop all
pm2 stop all
```

---

## 🔍 Troubleshooting

### Issue: Tesseract not found

**Ubuntu:**
```bash
which tesseract
# If not found:
sudo apt install tesseract-ocr
```

**Windows:**
1. Verify Tesseract is installed
2. Check the path in `.env` matches installation location
3. Common path: `C:\Program Files\Tesseract-OCR\tesseract.exe`

### Issue: PostgreSQL connection error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql

# Test connection
psql -U micromerit_user -d micromerit
```

### Issue: Redis connection error

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Start Redis
sudo systemctl start redis  # Ubuntu
brew services start redis   # macOS
```

### Issue: Port already in use

```bash
# Check what's using the port
sudo lsof -i :3000  # Backend
sudo lsof -i :8000  # AI Service
sudo lsof -i :3001  # Blockchain
sudo lsof -i :5173  # Main App
sudo lsof -i :5174  # Admin

# Kill process if needed
kill -9 <PID>
```

### Issue: Prisma migration errors

```bash
cd server/node-app

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name init
```

### Issue: Python virtual environment

```bash
# Deactivate current venv
deactivate

# Remove old venv
rm -rf venv

# Create new venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 📊 Quick Reference

| Service | URL | Port | Directory |
|---------|-----|------|-----------|
| Main Backend | http://localhost:3000 | 3000 | `server/node-app` |
| AI Service | http://localhost:8000 | 8000 | `server/ai_groq_service` |
| Blockchain | http://localhost:3001 | 3001 | `server/blockchain` |
| Main App | http://localhost:5173 | 5173 | `client/main-app` |
| Admin Dashboard | http://localhost:5174 | 5174 | `client/admin` |
| Dummy Server | http://localhost:4000 | 4000 | `dummy-server` |
| PostgreSQL | localhost | 5432 | - |
| Redis | localhost | 6379 | - |

---

## 🧪 Testing the System

### 1. Test Admin Login
1. Go to `http://localhost:5174`
2. Login with `admin@micromerit.com` / `admin123`
3. You should see the admin dashboard

### 2. Test Learner Registration
1. Go to `http://localhost:5173`
2. Click "Register as Learner"
3. Complete the registration flow

### 3. Test Credential Issuance
1. Login as issuer
2. Upload a test certificate PDF
3. AI should extract details via OCR
4. Credential should be issued and stored

### 4. Test External Sync
1. Login as admin
2. Go to "External Credentials"
3. Click "Force Sync"
4. Credentials should sync from dummy server

### 5. Test Employer Search
1. Login as employer
2. Go to "Search Candidates"
3. Search by skills, NSQF level, etc.
4. View learner profiles

---

## 🔐 Getting API Keys

### Groq API Key
1. Visit [console.groq.com](https://console.groq.com/)
2. Sign up / Sign in
3. Go to API Keys section
4. Create new key
5. Copy and paste into `server/ai_groq_service/.env`

### Filebase (IPFS)
1. Visit [filebase.com](https://filebase.com/)
2. Sign up for free account
3. Create an IPFS bucket
4. Go to Access Keys
5. Generate new access key
6. Copy credentials to `server/node-app/.env`

---

## 📚 Next Steps

1. ✅ All services running
2. ✅ Database seeded
3. ✅ Test admin login
4. ✅ Create issuer account
5. ✅ Upload test certificate
6. ✅ Create learner account
7. ✅ View credentials in wallet
8. ✅ Test employer search
9. ✅ Test AI chatbot

---

## 📖 Additional Resources

- **[README.md](./README.md)** - Project overview and features
- **[API Documentation](./docs/README.md)** - Complete API specs
- **[Architecture Docs](./docs/)** - System architecture

---

## 💡 Tips

- **Development Mode**: Set `BLOCKCHAIN_MOCK_ENABLED=true` and `SEND_SMAILS_AND_MESSAGES=false`
- **Database Reset**: Use `npx prisma migrate reset` to reset database
- **View Database**: Use `npx prisma studio` to view database in browser
- **Logs**: Check terminal output for each service for errors
- **Hot Reload**: All services support hot reload during development

---

## 🆘 Support

If you encounter issues:
1. Check all services are running
2. Verify `.env` configuration in each module
3. Check terminal logs for errors
4. Ensure all dependencies are installed
5. Try restarting services
6. Check [GitHub Issues](https://github.com/JaiminPatel345/MicroMerit-Portal/issues)

---

**Quick Start Status**: ✅ Ready to Go!

Start all services and visit `http://localhost:5173` to begin!
