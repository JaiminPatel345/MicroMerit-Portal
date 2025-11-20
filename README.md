# MicroMerit Portal

A comprehensive digital credential management system with blockchain integration, supporting multiple user roles and OAuth authentication.

## 🌟 Features

- **Multi-Role Authentication**: Issuer, Learner, and Admin roles
- **Two-Step OTP Verification**: For both Issuer and Learner registration
- **Email Management**: Verified email addition for learners
- **OAuth Integration**: Google and DigiLocker sign-in
- **Digital Credentials**: Issue, claim, revoke, and verify credentials
- **PDF Certificates**: Generate professional certificates with QR codes
- **Blockchain Integration**: Record credential hashes on blockchain
- **API Key Management**: For programmatic issuer access
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

## 🤝 Contributing

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
