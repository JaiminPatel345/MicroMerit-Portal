# MicroMerit Portal

A comprehensive digital credential management system with blockchain integration, supporting multiple user roles and OAuth authentication.

## 🌟 Features

### Authentication & User Management
- **Multi-Role Authentication**: Issuer, Learner, and Admin roles
- **Two-Step OTP Verification**: For both Issuer and Learner registration
- **Email Management**: Verified email addition for learners
- **OAuth Integration**: Google and DigiLocker sign-in
- **API Key Management**: For programmatic issuer access

### Blockchain-Backed Credentials (New!)
- **Credential Issuance**: Issue verifiable credentials with blockchain anchoring
- **IPFS Integration**: Decentralized storage via Filebase for certificates
- **Multi-Identifier Verification**: Verify by credential_id, tx_hash, ipfs_cid, or QR code
- **QR Code Generation**: Generate shareable QR codes for credentials
- **Data Integrity**: SHA256 hashing ensures tamper-proof credentials
- **Unclaimed Credentials**: Support for pre-issuing credentials to unregistered learners

### Legacy Features
- **PDF Certificates**: Generate professional certificates with QR codes
- **Cloud Storage**: Amazon S3 integration for certificates

## 📁 Project Structure

```
MicroMerit-Portal/
├── client/                 # React + Vite frontend
├── server/
│   ├── node-app/          # Node.js + Express backend
│   └── ai-service/        # AI-related services (optional)
├── docs/                  # API documentation (OpenAPI specs)
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/JaiminPatel345/MicroMerit-Portal.git
cd MicroMerit-Portal
```

### 2. Backend Setup

See detailed backend setup instructions in [Backend Setup Guide](./docs/BACKEND_SETUP.md)

**Quick Setup:**

```bash
cd server/node-app

# Install dependencies
yarn install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Setup database
npx prisma generate
npx prisma migrate dev

# Seed default admin (admin@micromerit.com / admin123)
npx prisma db seed

# Start development server
yarn dev
```

Server will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd client

# Install dependencies
yarn install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
yarn dev
```

Frontend will run on `http://localhost:5173`

## 🔐 Default Admin Credentials

After seeding the database:

- **Email**: `admin@micromerit.com`
- **Password**: `admin123`

⚠️ **Important**: Change these credentials in production!

## 📚 Documentation

- **[API Documentation](./docs/README.md)** - Complete OpenAPI specifications
- **[Backend Setup Guide](./docs/BACKEND_SETUP.md)** - Detailed backend setup instructions
- **[API Structure](./docs/API_STRUCTURE.md)** - API endpoints quick reference
- **[Authentication Flow](docs/apis/auth.openapi.yml)** - Authentication API details
- **[Registration Flow](docs/apis/learner-registration.openapi.yml)** - Learner registration with OTP

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT, OAuth 2.0
- **Cloud Storage**: Amazon S3
- **Email**: Nodemailer
- **SMS**: Twilio

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: CSS/Tailwind (TBD)

## 🔄 Recent Updates (v1.0.0 - November 2025)

### Breaking Changes
- **Learner Registration**: Removed `other_emails` field from Step 3
- **Issuer Registration**: Now requires 2-step OTP verification

### New Features
- Email management system for learners (`/learner/add-email/*`)
- Issuer OTP verification before admin approval
- Enhanced security with mandatory email verification

## 🧪 Testing

```bash
cd server/node-app

# Run all tests
yarn test

```

## 📖 API Endpoints Overview

### Issuer
- `POST /api/auth/issuer/start-register` - Start registration with OTP
- `POST /api/auth/issuer/verify-register` - Verify OTP and complete registration
- `POST /api/auth/issuer/login` - Login
- `GET /api/auth/issuer/me` - Get profile

### Learner
- `POST /api/auth/learner/start-register` - Start registration
- `POST /api/auth/learner/verify-otp` - Verify OTP
- `POST /api/auth/learner/complete-register` - Complete registration
- `POST /api/auth/learner/login` - Login
- `POST /api/auth/learner/add-email/request` - Request to add email
- `POST /api/auth/learner/add-email/verify` - Verify and add email

### Admin
- `POST /api/auth/admin/login` - Login
- `GET /api/auth/admin/issuer/list` - List issuers
- `POST /api/auth/admin/issuer/approve/:id` - Approve issuer
- `POST /api/auth/admin/issuer/reject/:id` - Reject issuer

### Credentials
- `POST /api/credential/issue` - Issue credential
- `POST /api/credential/claim` - Claim credential
- `GET /api/credential/verify/:uid` - Verify credential

For complete API documentation, see [docs/README.md](./docs/README.md)

## 🔧 Environment Variables

### Backend Required Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/micromerit

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AWS S3
AWS_REGION=us-east-1
AWS_S3_BUCKET=micromerit-certificates
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

See [BACKEND_SETUP.md](./docs/BACKEND_SETUP.md) for complete environment configuration.

## 📜 API Endpoints

### Authentication
- `POST /auth/issuer/register` - Issuer registration
- `POST /auth/learner/start-register` -Start learner registration
- `POST /auth/admin/login` - Admin login

### Credentials (New!)
- `POST /credentials/issue` - Issue a new blockchain-backed credential
- `POST /credentials/verify` - Verify credential authenticity
- `GET /learner/:learner_id/credentials/:credential_id/qr` - Get QR code payload

### Legacy Endpoints
- `POST /pdf` - Generate PDF certificate
- `GET /pdf/:credentialUid` - Download PDF certificate

Full API documentation available in `/docs/apis/` directory.

---

## 🔐 Environment Variables

### New Required Variables (Credentials System)

```env
# Filebase IPFS Configuration
FILEBASE_ACCESS_KEY_ID=your_access_key
FILEBASE_SECRET_ACCESS_KEY=your_secret_key
FILEBASE_BUCKET_NAME=your_bucket_name
FILEBASE_GATEWAY_URL=https://ipfs.filebase.io/ipfs/

# Blockchain Configuration
BLOCKCHAIN_MOCK_ENABLED=true
BLOCKCHAIN_NETWORK=ethereum_testnet
BLOCKCHAIN_CONTRACT_ADDRESS=mock_contract
```

### Obtaining Filebase Credentials

1. Sign up at [Filebase.com](https://filebase.com)
2. Create an IPFS bucket
3. Generate Access Keys from dashboard
4. Add keys to `.env` file

---

## 🎯 Credential System Usage

### Issuing a Credential

```bash
curl -X POST http://localhost:3000/api/credentials/issue \
  -H "Authorization: Bearer YOUR_ISSUER_TOKEN" \
  -F "learner_email=learner@example.com" \
  -F "issuer_id=1" \
  -F "certificate_title=Web Development Certificate" \
  -F "issued_at=2024-01-15T10:00:00Z" \
  -F "original_pdf=@certificate.pdf"
```

### Verifying a Credential

```bash
# By credential ID
curl -X POST http://localhost:3000/api/credentials/verify \
  -H "Content-Type: application/json" \
  -d '{"credential_id": "123e4567-e89b-12d3-a456-426614174000"}'

# By transaction hash
curl -X POST http://localhost:3000/api/credentials/verify \
  -H "Content-Type: application/json" \
  -d '{"tx_hash": "0x123e4567e89b12d3a456426614174000"}'

# By QR payload (Base64 encoded JSON)
curl -X POST http://localhost:3000/api/credentials/verify \
  -H "Content-Type: application/json" \
  -d '{"qr_payload": "eyJjcmVkZW50aWFsX2lkIjoi..."}'
```

### Getting QR Code Data

```bash
curl -X GET http://localhost:3000/api/learner/42/credentials/123e4567.../qr \
  -H "Authorization: Bearer YOUR_LEARNER_TOKEN"
```

---

## 🏗️ Architecture

### Database Schema

**New Credential Model** (Consolidated):
- Replaces old `credential`, `blockchain_record`, and `pdf_certificate` tables
- Single source of truth for all credential data
- Includes blockchain tx_hash, IPFS CID, and data integrity hash

### Credential Workflow

1. **Issuance**: Issuer uploads PDF → System generates credential_id → PDF pinned to IPFS → Data hash computed → Mock blockchain write → Credential stored
2. **Verification**: User provides identifier → System retrieves credential → Canonical JSON reconstructed → Hash recomputed → Blockchain verified → Result returned
3. **QR Sharing**: Learner requests QR data → System returns JSON with all identifiers → Frontend generates QR code → Others scan to verify

---

## 🧪 Testing

### Running Tests

```bash
cd server/node-app
yarn test
```

### Manual Testing Checklist

- [ ] Issue credential with existing learner email
- [ ] Issue credential with unknown email (unclaimed)
- [ ] Verify credential by ID, tx_hash, and IPFS CID
- [ ] Generate QR code payload
- [ ] Test tampered credential detection

---

## 🤝 Contributors

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MicroMerit Portal - Proprietary Software
© 2025 MicroMerit Team. All rights reserved.

## 👥 Team

- **Project**: Smart India Hackathon 2025
- **Repository**: [github.com/JaiminPatel345/MicroMerit-Portal](https://github.com/JaiminPatel345/MicroMerit-Portal)

## 📧 Support

For questions or issues:
- Create an issue on GitHub
- Email: support@micromerit.com

---

**Note**: This project is under active development. Features and documentation are subject to change.
