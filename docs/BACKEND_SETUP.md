# Backend Setup Guide - MicroMerit Portal

Complete guide to set up the backend server for MicroMerit Portal.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Server](#running-the-server)
6. [Database Seeding](#database-seeding)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher
  ```bash
  node --version  # Should be >= 18.0.0
  ```

- **npm or yarn**: Latest version
  ```bash
  npm --version   # Should be >= 9.0.0
  ```

- **PostgreSQL**: v14.0 or higher
  ```bash
  psql --version  # Should be >= 14.0
  ```

- **Git**: For cloning the repository
  ```bash
  git --version
  ```

### Optional but Recommended

- **AWS Account**: For S3 storage (PDF certificates)
- **Gmail Account**: For email notifications (with App Password)
- **Twilio Account**: For SMS OTP (optional)
- **Google OAuth Credentials**: For Google sign-in
- **DigiLocker API Access**: For DigiLocker integration

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/JaiminPatel345/MicroMerit-Portal.git
cd MicroMerit-Portal/server/node-app
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install
```

This will install all required packages including:
- Express.js
- Prisma ORM
- TypeScript
- JWT, bcrypt
- AWS SDK, Nodemailer, Twilio
- And more...

## 🗄️ Database Setup

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
Download and install from [PostgreSQL Official Website](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE micromerit;

# Create user (optional)
CREATE USER micromerit_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE micromerit TO micromerit_user;

# Exit
\q
```

### 3. Verify Database Connection

```bash
psql -U postgres -d micromerit -c "SELECT version();"
```

## ⚙️ Environment Configuration

### 1. Create Environment File

```bash
cd server/node-app
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your configuration:

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=development
PORT=3000

# ============================================
# DATABASE CONFIGURATION
# ============================================
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://postgres:password@localhost:5432/micromerit

# For production with connection pooling:
# DATABASE_URL=postgresql://user:password@host:5432/micromerit?connection_limit=10&pool_timeout=10

# ============================================
# JWT CONFIGURATION
# ============================================
# Generate secure secrets: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# ============================================
# EMAIL CONFIGURATION (Nodemailer)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM_NAME=MicroMerit Portal
SMTP_FROM_EMAIL=noreply@micromerit.com

# ============================================
# SMS CONFIGURATION (Twilio) - Optional
# ============================================
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# ============================================
# OAUTH CONFIGURATION
# ============================================
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/learner/oauth/google/callback

# DigiLocker
DIGILOCKER_CLIENT_ID=your-digilocker-client-id
DIGILOCKER_CLIENT_SECRET=your-digilocker-client-secret
DIGILOCKER_CALLBACK_URL=http://localhost:3000/api/auth/learner/oauth/digilocker/callback

# ============================================
# AWS S3 CONFIGURATION
# ============================================
AWS_REGION=us-east-1
AWS_S3_BUCKET=micromerit-certificates
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# ============================================
# APPLICATION CONFIGURATION
# ============================================
APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# OTP CONFIGURATION
# ============================================
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
```

### 3. Gmail App Password Setup

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable 2-Step Verification
3. Go to "App passwords"
4. Generate password for "Mail"
5. Use this password in `SMTP_PASS`

### 4. AWS S3 Setup (Optional)

1. Create AWS account
2. Create S3 bucket: `micromerit-certificates`
3. Set bucket policy for public read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::micromerit-certificates/*"
    }
  ]
}
```

4. Create IAM user with S3 permissions
5. Get Access Key ID and Secret Access Key

## 🚀 Running the Server

### 1. Generate Prisma Client

```bash
npx prisma generate
```

This generates the Prisma Client based on your schema.

### 2. Run Database Migrations

```bash
npx prisma migrate dev
```

This will:
- Create all database tables
- Apply any pending migrations
- Automatically run the seed script

**What migrations do:**
- Creates `issuer` table
- Creates `learner` table
- Creates `admin` table
- Creates `registration_session` table
- Creates `email_verification_session` table
- Creates `issuer_registration_session` table
- Creates `credential` table
- Creates `blockchain_record` table
- Creates `pdf_certificate` table
- Creates `issuer_api_key` table

### 3. Seed Default Admin (if not auto-seeded)

```bash
npx prisma db seed
```

This creates a default admin user:
- **Email**: `admin@micromerit.com`
- **Password**: `admin123`

### 4. Start Development Server

```bash
# Using npm
npm run dev

# Or using yarn
yarn dev
```

Server will start on `http://localhost:3000`

### 5. Verify Server is Running

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

## 🌱 Database Seeding

### Default Admin User

The seed script automatically creates:
- **Email**: `admin@micromerit.com`
- **Password**: `admin123` (hashed with bcrypt)

### Manual Seeding

```bash
npx prisma db seed
```

### Reset Database (Careful!)

```bash
# This will delete all data and re-run migrations + seed
npx prisma migrate reset
```

### View Database

```bash
npx prisma studio
```

Opens Prisma Studio at `http://localhost:5555` for visual database management.

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Test Structure

```
src/tests/
├── setup.ts                    # Test configuration
├── admin.test.ts              # Admin authentication tests
├── issuer.test.ts             # Issuer tests
├── learner.test.ts            # Learner tests
├── learner-registration.test.ts  # Registration flow tests
├── learner-oauth.test.ts      # OAuth tests
├── apiKey.test.ts             # API key tests
├── pdf.test.ts                # PDF generation tests
└── verification.test.ts       # Credential verification tests
```

## 📊 Database Schema Overview

### Main Tables

1. **issuer** - Organization accounts
2. **learner** - Individual user accounts
3. **admin** - Platform administrators
4. **credential** - Digital credentials
5. **issuer_api_key** - API keys for issuers
6. **registration_session** - Learner registration OTP sessions
7. **email_verification_session** - Email addition OTP sessions
8. **issuer_registration_session** - Issuer registration OTP sessions
9. **pdf_certificate** - PDF certificate records
10. **blockchain_record** - Blockchain transaction records

### View Schema

```bash
# View in terminal
cat prisma/schema.prisma

# Visual editor
npx prisma studio
```

## 🔍 Troubleshooting

### Issue: Database Connection Failed

**Error:**
```
Can't reach database server at localhost:5432
```

**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql -U postgres -d micromerit
```

### Issue: Prisma Client Generation Failed

**Error:**
```
Prisma schema file not found
```

**Solution:**
```bash
# Ensure you're in the correct directory
cd server/node-app

# Regenerate client
npx prisma generate
```

### Issue: Migration Failed

**Error:**
```
Migration failed to apply
```

**Solution:**
```bash
# Reset migrations (WARNING: Deletes all data)
npx prisma migrate reset

# Or manually fix:
# 1. Drop database
dropdb micromerit
# 2. Recreate database
createdb micromerit
# 3. Run migrations
npx prisma migrate dev
```

### Issue: Port Already in Use

**Error:**
```
Port 3000 is already in use
```

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Issue: Gmail Authentication Failed

**Error:**
```
Invalid login: 535 Authentication failed
```

**Solution:**
1. Enable 2-Step Verification in Google Account
2. Generate App Password (not your regular password)
3. Use App Password in `SMTP_PASS`

### Issue: AWS S3 Access Denied

**Error:**
```
Access Denied when uploading to S3
```

**Solution:**
1. Check IAM user has S3 permissions
2. Verify bucket name matches `AWS_S3_BUCKET`
3. Check bucket policy allows uploads
4. Verify AWS credentials are correct

## 📝 Development Commands

```bash
# Development
npm run dev              # Start dev server with hot reload

# Building
npm run build            # Compile TypeScript to JavaScript
npm start               # Run compiled JavaScript (production)

# Database
npx prisma generate     # Generate Prisma Client
npx prisma migrate dev  # Run migrations
npx prisma db seed      # Seed database
npx prisma studio       # Visual database editor
npx prisma migrate reset # Reset database (deletes data!)

# Testing
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report

# Type Checking
npm run type-check     # Check TypeScript types without compiling
```

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change default admin password
- [ ] Use strong JWT secrets (min 32 characters)
- [ ] Enable HTTPS/TLS
- [ ] Set `NODE_ENV=production`
- [ ] Use environment-specific database
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Review and update security headers
- [ ] Set up database backups
- [ ] Monitor logs and errors
- [ ] Use connection pooling for database
- [ ] Rotate API keys regularly

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [API Documentation](./README.md)
- [Project README](../README.md)

## 🆘 Getting Help

If you encounter issues:

1. Check this guide
2. Review error logs: `npm run dev` shows detailed errors
3. Check database: `npx prisma studio`
4. Test API endpoints using Postman or curl
5. Create an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)

---

**Last Updated**: November 18, 2025
**Version**: 1.0.0
