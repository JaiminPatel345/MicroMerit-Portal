# MicroMerit Portal - API Documentation

Complete API documentation for the MicroMerit Portal platform.

## Overview

MicroMerit Portal is a comprehensive digital credential management system with support for:
- Multi-role authentication (Issuer, Learner, Admin)
- OAuth integration (Google, DigiLocker)
- Digital credential lifecycle management
- PDF certificate generation with QR codes
- Cloud storage with Amazon S3
- Blockchain integration (placeholder)

## OpenAPI Specifications

### Core Authentication
- **[Authentication API](./auth.openapi.yml)** - Core authentication for Issuer, Learner, and Admin roles
  - **Issuer**: Two-step registration with email OTP verification (start-register → verify-register), then admin approval required
  - Issuer login, profile management
  - **Learner**: Three-step registration (see Learner Registration Flow), login, profile management
  - **Admin**: Login and issuer management (approve, reject, block, unblock)
  - API key management for issuers
  - JWT token-based authentication
  - **Security**: Email verification mandatory for issuer registration before admin review

### Learner Registration Flow
- **[Learner Registration API](./learner-registration.openapi.yml)** - Three-step registration with OTP
  - Step 1: Start registration with email or phone
  - Step 2: Verify OTP sent via email/SMS
  - Step 3: Complete registration with name and password (other_emails removed - use add-email endpoints instead)
  - Session-based workflow with expiry
  - **Email Management**: Two-step verified email addition (request OTP → verify OTP)

### OAuth Authentication
- **[OAuth API](./oauth.openapi.yml)** - Social authentication and DigiLocker integration
  - Google OAuth 2.0 sign-in
  - DigiLocker authentication with certificate fetching
  - Automatic account creation or linking
  - JWT token generation

### Credential Management
- **[Credentials API](./credentials.openapi.yml)** - Digital credential lifecycle
  - Issue credentials to learners (issuer)
  - Claim issued credentials (learner)
  - Revoke credentials with reason (issuer)
  - Public credential verification
  - Statistics and filtering

### PDF Certificates
- **[PDF Certificates API](./pdf-certificates.openapi.yml)** - Certificate generation and storage
  - Generate PDF certificates with embedded QR codes
  - Amazon S3 cloud storage
  - Public certificate viewing and downloading
  - Professional certificate design

### Blockchain Integration
- **[Blockchain API](./blockchain.openapi.yml)** - Blockchain recording and verification (placeholder)
  - Record credential hashes on blockchain
  - Verify blockchain records
  - Transaction details lookup
  - Multi-chain support (Ethereum, Polygon, BSC)
  - **Note**: Currently placeholder implementation with mock data

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken), OAuth 2.0
- **Cloud Storage**: Amazon S3 (AWS SDK v3)
- **PDF Generation**: pdf-lib
- **QR Codes**: qrcode
- **Email**: Nodemailer (Gmail SMTP)
- **SMS**: Twilio

### Security
- Password hashing with bcrypt
- JWT access tokens (15 min) and refresh tokens (7 days)
- API key authentication with rate limiting
- Role-based access control (RBAC)
- CORS protection
- Rate limiting on sensitive endpoints

## Authentication Methods

### 1. JWT Bearer Token
Most endpoints require JWT authentication. Include the access token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Obtain tokens from:
- `/api/issuer/login`
- `/api/learner/login`
- `/api/admin/login`
- `/api/learner/oauth/google/callback`
- `/api/learner/oauth/digilocker/callback`
- `/api/learner/registration/complete`

Refresh expired tokens at:
- `/api/issuer/refresh`
- `/api/learner/refresh`
- `/api/admin/refresh`

### 2. API Key (Issuers Only)
Issuers can use API keys for programmatic access. Include the API key in the X-API-Key header:

```http
X-API-Key: mmk_1234567890abcdef1234567890abcdef
```

Create API keys at:
- `/api/issuer/api-keys` (POST)

## Rate Limiting

- **General**: 100 requests per minute per IP
- **API Keys**: Custom rate limit per key (default 60/min)
- **429 Response**: Rate limit exceeded

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized / Authentication Required
- `403` - Forbidden / Access Denied
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## User Roles

### Issuer
- Organizations that issue credentials
- Must be approved by admin before issuing
- Can create API keys for programmatic access
- Can issue, revoke, and manage credentials
- Can generate PDF certificates

### Learner
- Individual users who receive credentials
- Can register via email/phone with OTP
- Can sign in with Google or DigiLocker
- Can claim and view credentials
- Public profile with credential portfolio

### Admin
- Platform administrators
- Manage issuer applications (approve/reject/block/unblock)
- System oversight and moderation
- No credential operations

## Credential States

1. **issued** - Credential created by issuer but not yet claimed by learner
2. **claimed** - Credential accepted and owned by learner
3. **revoked** - Credential invalidated by issuer (with reason)

## Environment Configuration

Required environment variables:

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/micromerit

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-phone

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/learner/oauth/google/callback

DIGILOCKER_CLIENT_ID=your-digilocker-id
DIGILOCKER_CLIENT_SECRET=your-digilocker-secret
DIGILOCKER_CALLBACK_URL=http://localhost:3000/api/learner/oauth/digilocker/callback

# AWS S3
AWS_REGION=us-east-1
AWS_S3_BUCKET=micromerit-certificates
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Application
APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
```

## Testing

The project includes comprehensive test coverage:
- **61 tests** across 7 test suites
- Unit tests for all services
- Integration tests for API endpoints
- Mock implementations for external services (S3, email, SMS, OAuth)

Run tests:
```bash
yarn test
```

## API Clients

### Postman Collection
Import the OpenAPI specs into Postman for easy testing:
1. Open Postman
2. Import → Upload Files
3. Select any `.openapi.yml` file
4. Collection will be automatically generated

### Swagger UI
View interactive API documentation:
1. Install Swagger UI Express: `yarn add swagger-ui-express`
2. Configure in Express app
3. Access at `http://localhost:3000/api-docs`

## Support

For questions or issues:
- Email: support@micromerit.com
- Documentation: Check individual OpenAPI specs for detailed endpoint information
- GitHub Issues: Report bugs or request features

## Version History

- **v1.0.0** (November 2025 - Current)
  - **Breaking Changes**:
    - Learner registration Step 3: Removed `other_emails` field from profile completion
    - Issuer registration: Now requires 2-step OTP verification before admin approval
  - **New Features**:
    - Email management system: Learners can add verified emails one at a time
    - Two endpoints: `/learner/add-email/request` and `/learner/add-email/verify`
    - Issuer OTP verification: `/issuer/start-register` and `/issuer/verify-register`
  - **Security Enhancements**:
    - All email additions require OTP verification
    - Issuer email verification before admin review
    - Reduced spam and invalid registration requests
  - Previous features:
    - Authentication system (Issuer, Learner, Admin)
    - Three-step learner registration with OTP
    - OAuth integration (Google, DigiLocker)
    - Credential management system
    - PDF certificate generation with S3 storage
    - API key management
    - Comprehensive test coverage

## License

MicroMerit Portal - Proprietary Software
© 2024 MicroMerit Team. All rights reserved.
