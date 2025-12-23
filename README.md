# MicroMerit Portal

Micro Credential aggregator platform with Blockchain, IPFS and AI powered skill extraction.
> A comprehensive AI-powered Micro credential management system with blockchain integration, external credential sync, skill profiling, and employer matching capabilities.

## 🌟 Features

### 🔐 Authentication & User Management
- **Multi-Role Authentication**: Issuer, Learner, Employer, and Admin roles
- **Two-Step OTP Verification**: For Issuer and Learner registration
- **OAuth Integration**: Google and DigiLocker sign-in for learners
- **API Key Management**: For programmatic issuer access
- **Email Management**: Verified email addition for learners

### 🎓 Credential Management
- **Blockchain-Backed Credentials**: Issue verifiable credentials with blockchain anchoring
- **IPFS Integration**: Decentralized storage for certificates
- **Multi-Identifier Verification**: Verify by credential_id, tx_hash, ipfs_cid, or QR code
- **QR Code Generation**: Generate shareable QR codes for credentials
- **Data Integrity**: SHA256 hashing ensures tamper-proof credentials
- **Unclaimed Credentials**: Support for pre-issuing credentials to unregistered learners
- **External Credential Sync**: Automatic syncing from external providers (NSDC, Udemy, etc.)

### 🤖 AI-Powered Features
- **OCR Processing**: Extract credential details from PDF certificates using Tesseract
- **Skill Profile Generation**: AI-generated skill profiles from credentials
- **Learning Roadmap**: Personalized learning paths based on learner credentials
- **Employer AI Chatbot**: Query learner profiles, credentials, and skills via AI
- **Course Recommendations**: AI-powered course suggestions

### 👔 Employer Features
- **Candidate Search**: Search learners by skills, NSQF level, location, and credentials
- **AI Chatbot**: Ask questions about learner profiles and get intelligent answers
- **Profile Viewing**: View detailed learner profiles with credentials and skills

### 📊 Admin Dashboard
- **Issuer Management**: Approve/reject issuer registrations
- **Credential Oversight**: Monitor all credentials in the system
- **External Sync Control**: Force sync external credentials
- **NSQF Verification**: Verify and approve NSQF levels for credentials
- **Analytics**: View system statistics and metrics

## 📁 Project Structure

```
MicroMerit-Portal/
├── client/
│   ├── main-app/              # Main learner/issuer/employer frontend (React + Vite)
│   └── admin/                 # Admin dashboard (React + Vite)
├── server/
│   ├── node-app/              # Main backend API (Node.js + Express + TypeScript)
│   ├── ai_groq_service/       # AI service (Python + FastAPI + Groq)
│   ├── blockchain/            # Blockchain service (TypeScript + Hardhat + Ethers.js)
│   └── digilocker_handle_server/  # DigiLocker OAuth handler
├── dummy-server/              # Mock credential provider server for development
├── docs/                      # API documentation (OpenAPI specs)
└── README.md                  # This file
```

## 🚀 Quick Start

For detailed setup instructions, see [QUICKSTART.md](./QUICKSTART.md)

### Prerequisites

- **Node.js** 18+
- **Python** 3.8+
- **PostgreSQL** 14+
- **Redis** (for BullMQ queue)
- **Tesseract OCR** (for AI service)
- **Groq API Key** (for AI features)
- **Filebase Account** (for IPFS storage)

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/JaiminPatel345/MicroMerit-Portal.git
   cd MicroMerit-Portal
   ```

2. **Setup PostgreSQL database**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE micromerit;
   CREATE USER micromerit_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE micromerit TO micromerit_user;
   \q
   ```

3. **Setup and start all modules** (see [QUICKSTART.md](./QUICKSTART.md) for details)

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 14+ with Prisma ORM
- **Queue**: BullMQ with Redis
- **Authentication**: JWT, OAuth 2.0 (Google, DigiLocker)
- **Blockchain**: Ethers.js, Hardhat (Sepolia testnet)
- **Storage**: Amazon S3, Filebase IPFS
- **Email**: Nodemailer
- **SMS**: Twilio

### AI Service
- **Runtime**: Python 3.8+
- **Framework**: FastAPI
- **AI Model**: Groq (llama-3.1-8b-instant)
- **OCR**: Tesseract OCR, pytesseract
- **PDF Processing**: pdf2image, PyPDF2

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **State Management**: Redux Toolkit
- **Routing**: React Router v7
- **UI Components**: Lucide React, Framer Motion
- **Charts**: Recharts

### Blockchain Service
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Blockchain**: Ethers.js v6, Hardhat
- **Network**: Sepolia testnet

## 📦 Modules

### 1. Main Backend (`server/node-app`)
- Port: `3000`
- Main API server handling authentication, credentials, employer search, etc.
- **Setup**: `cd server/node-app && yarn install && cp .env.example .env`
- **Run**: `yarn dev`

### 2. AI Service (`server/ai_groq_service`)
- Port: `8000`
- Handles OCR, skill profiling, roadmap generation, and AI chatbot
- **Setup**: `cd server/ai_groq_service && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cp .env.example .env`
- **Run**: `python main.py`

### 3. Blockchain Service (`server/blockchain`)
- Port: `3001`
- Handles blockchain interactions for credential anchoring
- **Setup**: `cd server/blockchain && yarn install && cp .env.example .env`
- **Run**: `yarn dev`

### 4. Main App (`client/main-app`)
- Port: `5173`
- Frontend for learners, issuers, and employers
- **Setup**: `cd client/main-app && yarn install && cp .env.example .env`
- **Run**: `yarn dev`

### 5. Admin Dashboard (`client/admin`)
- Port: `5174`
- Admin panel for system management
- **Setup**: `cd client/admin && yarn install && cp .env.example .env`
- **Run**: `yarn dev`

### 6. Dummy Server (`dummy-server`)
- Port: `4000`
- Mock external credential provider for development/testing
- **Setup**: `cd dummy-server && yarn install`
- **Run**: `yarn dev`

## 🔐 Default Credentials

After running the seed script (`npx tsx prisma/seed.ts` in `server/node-app`):

- **Admin**: `admin@micromerit.com` / `admin123`
- **Test Learner**: `learner@test.com` / `password123`
- **Test Issuer**: `issuer@test.com` / `password123`
- **Test Employer**: `employer@test.com` / `password123`

⚠️ **Important**: Change these credentials in production!

## 🔧 Environment Variables

Each module requires its own `.env` file. Copy `.env.example` to `.env` in each directory:

- `server/node-app/.env` - Main backend config
- `server/ai_groq_service/.env` - AI service config
- `server/blockchain/.env` - Blockchain service config
- `client/main-app/.env` - Main app config
- `client/admin/.env` - Admin dashboard config

See [QUICKSTART.md](./QUICKSTART.md) for detailed environment variable setup.

## 📖 Key Features Documentation

### External Credential Sync
Automatically syncs credentials from external providers:
> [!NOTE]  
> For adding any provider you have to get an endpoint and an API key from that provider for auto sync credentials. Configure in `server/node-app/.env` and create an new connector for that specific provider. 

- **NSDC**: National Skill Development Corporation
- **Udemy**: Online learning platform
- **Custom Providers**: Jaimin Pvt Ltd

### AI Chatbot for Employers
Employers can ask questions about learner profiles:
- "What skills does this learner have?"
- "Show me their blockchain certifications"
- "What is their NSQF level?"

### Skill Profile Generation
AI automatically generates skill profiles from credentials, including:
- Technical skills
- Soft skills
- Domain knowledge
- Proficiency levels

### Course Hour Validation
Credentials are validated for course duration:
```env
MIN_HOUR_LEN=7.5
MAX_HOUR_LEN=30
```

## 🧪 Testing

```bash
# Backend tests
cd server/node-app
yarn test
yarn test:coverage

# Run specific test suites
yarn test credential
yarn test auth
```

## 📚 API Documentation

- **[Complete API Docs](./docs/README.md)** - OpenAPI specifications
- **[Authentication Flow](./docs/apis/auth.openapi.yml)**
- **[Credential APIs](./docs/apis/credential.openapi.yml)**
- **[AI Service APIs](./docs/AI_API_DOCS.md)**

## 🏗️ Architecture

### Credential Workflow
1. **Issuance**: Issuer uploads PDF → OCR extraction → AI skill profiling → IPFS upload → Blockchain anchoring → Database storage
2. **Verification**: User provides identifier → Retrieve credential → Verify hash → Check blockchain → Return verification result
3. **External Sync**: Cron job polls external APIs → Validates credentials → Processes with AI → Stores in database

### Database Schema
- **Unified Credential Model**: Single table for internal and external credentials
- **Skill Knowledge Base**: NSQF qualifications and skill mappings
- **User Models**: Learner, Issuer, Employer, Admin



## 👥 Team

- **Project**: Smart India Hackathon 2025
- **Repository**: [github.com/JaiminPatel345/MicroMerit-Portal](https://github.com/JaiminPatel345/MicroMerit-Portal)
- **Team Members**: @JaiminPatel345, @Tarunnagpal7, @hastimovaliya55, @valiyaparth, @khushigohil11 and @sashi59
- **Mentor**: @Dharmesh177

## 📧 Support

For questions or issues:
- Create an issue on GitHub
- If any of us free, we will fix this. Else fix by your self and open an PR :). 

