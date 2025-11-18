# MicroMerit Portal - Authentication API

Complete authentication module with role-based access control (Admin, Issuer, Learner).

## Table of Contents
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [Running Tests](#running-tests)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Error Handling](#error-handling)

---

## Getting Started

### Prerequisites
- Node.js >= 18.x
- PostgreSQL >= 14.x
- Yarn or npm

### Installation

```bash
cd server/node-app
yarn install
```

---

## Environment Setup

Create a `.env` file in the `server/node-app` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/micromerit?schema=public"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# API Key Configuration
API_KEY_LENGTH=64
API_KEY_DEFAULT_RATE_LIMIT=60

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Bcrypt Configuration
BCRYPT_ROUNDS=10

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

---

## Database Setup

### Run Prisma Migrations

```bash
# Generate Prisma Client
yarn prisma:generate

# Run migrations (requires PostgreSQL to be running)
yarn prisma:migrate

# Open Prisma Studio (optional)
yarn prisma:studio
```

### Seed Admin User (Optional)

You can manually create an admin user in the database or use Prisma Studio.

---

## Running the Server

### Development Mode
```bash
yarn dev
```

### Production Mode
```bash
yarn build
yarn start
```

### Type Check
```bash
yarn type-check
```

---

## Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

---

## API Endpoints

### Base URL
```
http://localhost:3000
```

### Health Check
```
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-11-18T07:00:00.000Z"
}
```

---

## Issuer Endpoints

### 1. Register Issuer
```http
POST /auth/issuer/register
Content-Type: application/json

{
  "name": "Tech University",
  "type": "university",
  "email": "admin@techuniversity.edu",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "official_domain": "techuniversity.edu",
  "website_url": "https://techuniversity.edu",
  "contact_person_name": "John Doe",
  "contact_person_designation": "Administrator",
  "address": "123 University Ave, Tech City",
  "kyc_document_url": "https://example.com/kyc.pdf",
  "logo_url": "https://example.com/logo.png"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Issuer registered successfully. Account pending approval.",
  "data": {
    "issuer": {
      "id": 1,
      "name": "Tech University",
      "email": "admin@techuniversity.edu",
      "status": "pending",
      "is_blocked": false,
      "created_at": "2025-11-18T07:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "statusCode": 201
}
```

### 2. Login Issuer
```http
POST /auth/issuer/login
Content-Type: application/json

{
  "email": "admin@techuniversity.edu",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "issuer": {
      "id": 1,
      "name": "Tech University",
      "email": "admin@techuniversity.edu",
      "status": "approved",
      "is_blocked": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "statusCode": 200
}
```

### 3. Refresh Token
```http
POST /auth/issuer/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "statusCode": 200
}
```

### 4. Get Issuer Profile
```http
GET /auth/issuer/me
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "name": "Tech University",
    "email": "admin@techuniversity.edu",
    "type": "university",
    "status": "approved",
    "is_blocked": false,
    "created_at": "2025-11-18T07:00:00.000Z"
  },
  "statusCode": 200
}
```

### 5. Update Issuer Profile
```http
PUT /auth/issuer/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Tech University Updated",
  "phone": "+9876543210"
}
```

---

## Issuer API Key Endpoints

### 1. Create API Key
```http
POST /auth/issuer/api-key/create
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Production API Key",
  "rate_limit_per_minute": 100,
  "expires_at": "2026-12-31T23:59:59Z",
  "allowed_ips": "192.168.1.1,192.168.1.2"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "API key created successfully. Store it securely as it won't be shown again.",
  "data": {
    "id": 1,
    "issuer_id": 1,
    "name": "Production API Key",
    "api_key": "mk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    "active": true,
    "rate_limit_per_minute": 100,
    "usage_count": 0,
    "created_at": "2025-11-18T07:00:00.000Z"
  },
  "statusCode": 201
}
```

### 2. List API Keys
```http
GET /auth/issuer/api-key/list
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "API keys retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Production API Key",
      "api_key": "mk_a1b2...x4y5z6",
      "active": true,
      "usage_count": 150,
      "last_used_at": "2025-11-18T06:55:00.000Z",
      "created_at": "2025-11-18T07:00:00.000Z"
    }
  ],
  "statusCode": 200
}
```

### 3. Revoke API Key
```http
POST /auth/issuer/api-key/revoke/1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "Security breach - rotating keys"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "API key revoked successfully",
  "data": {
    "id": 1,
    "active": false,
    "revoked_reason": "Security breach - rotating keys"
  },
  "statusCode": 200
}
```

---

## Learner Endpoints

### 1. Register Learner
```http
POST /auth/learner/register
Content-Type: application/json

{
  "email": "learner@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "other_emails": ["alternate@example.com"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Learner registered successfully",
  "data": {
    "learner": {
      "id": 1,
      "email": "learner@example.com",
      "phone": "+1234567890",
      "status": "active",
      "created_at": "2025-11-18T07:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "statusCode": 201
}
```

### 2. Login Learner
```http
POST /auth/learner/login
Content-Type: application/json

{
  "email": "learner@example.com",
  "password": "SecurePass123!"
}
```

### 3. Get Learner Profile
```http
GET /auth/learner/me
Authorization: Bearer <access_token>
```

---

## Admin Endpoints

### 1. Admin Login
```http
POST /auth/admin/login
Content-Type: application/json

{
  "email": "admin@micromerit.com",
  "password": "AdminPass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "id": 1,
      "email": "admin@micromerit.com",
      "created_at": "2025-11-18T07:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "statusCode": 200
}
```

### 2. Approve Issuer
```http
POST /auth/admin/issuer/approve/1
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "notes": "All documents verified"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Issuer approved successfully",
  "data": {
    "id": 1,
    "name": "Tech University",
    "email": "admin@techuniversity.edu",
    "status": "approved",
    "approved_at": "2025-11-18T07:00:00.000Z"
  },
  "statusCode": 200
}
```

### 3. Reject Issuer
```http
POST /auth/admin/issuer/reject/1
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "reason": "Invalid KYC documents provided"
}
```

### 4. Block Issuer
```http
POST /auth/admin/issuer/block/1
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "reason": "Violation of terms and conditions"
}
```

### 5. Unblock Issuer
```http
POST /auth/admin/issuer/unblock/1
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "notes": "Issue resolved"
}
```

### 6. List All Issuers
```http
GET /auth/admin/issuer/list?status=pending&is_blocked=false
Authorization: Bearer <admin_access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Issuers retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Tech University",
      "email": "admin@techuniversity.edu",
      "type": "university",
      "status": "pending",
      "is_blocked": false,
      "created_at": "2025-11-18T07:00:00.000Z"
    }
  ],
  "statusCode": 200
}
```

---

## Authentication

### JWT Tokens

The API uses JWT (JSON Web Tokens) for authentication. After login/registration, you'll receive:
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens

### Using Access Token

Include the access token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

### Using API Keys (Issuer Only)

Include the API key in the `X-API-Key` header:
```
X-API-Key: mk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE",
  "statusCode": 400
}
```

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | BAD_REQUEST | Invalid request data |
| 401 | UNAUTHORIZED | Missing or invalid authentication |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | DUPLICATE_ENTRY | Resource already exists |
| 422 | VALIDATION_ERROR | Request validation failed |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | SERVER_ERROR | Internal server error |

---

## Rate Limiting

### Default Limits
- General API: 100 requests per minute
- Auth endpoints (login): 5 requests per 15 minutes
- Registration: 3 requests per hour
- API Key operations: 10 requests per hour

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700298000
```

---

## Testing

All endpoints have comprehensive test coverage. Run tests with:

```bash
yarn test
```

### Test Coverage
- ✅ Issuer registration, login, profile management
- ✅ API key creation, listing, revocation
- ✅ Learner registration, login, profile management
- ✅ Admin login, issuer approval/rejection/blocking
- ✅ Authentication middleware
- ✅ Role-based access control
- ✅ Error handling

---

## Folder Structure

```
src/
├── modules/
│   ├── issuer/
│   │   ├── controller.ts
│   │   ├── service.ts
│   │   ├── repository.ts
│   │   ├── schema.ts
│   │   ├── routes.ts
│   │   ├── apiKey.controller.ts
│   │   ├── apiKey.service.ts
│   │   └── apiKey.repository.ts
│   ├── learner/
│   │   ├── controller.ts
│   │   ├── service.ts
│   │   ├── repository.ts
│   │   ├── schema.ts
│   │   └── routes.ts
│   └── admin/
│       ├── controller.ts
│       ├── service.ts
│       ├── repository.ts
│       ├── schema.ts
│       └── routes.ts
├── middleware/
│   ├── auth.ts
│   ├── role.ts
│   ├── apiKey.ts
│   ├── error.ts
│   └── rateLimit.ts
├── utils/
│   ├── jwt.ts
│   ├── bcrypt.ts
│   ├── response.ts
│   ├── logger.ts
│   └── prisma.ts
├── tests/
│   ├── issuer.test.ts
│   ├── learner.test.ts
│   ├── admin.test.ts
│   ├── apiKey.test.ts
│   └── setup.ts
├── app.ts
└── server.ts
```

---

## License

MIT

---

## Support

For issues or questions, please contact the development team.
