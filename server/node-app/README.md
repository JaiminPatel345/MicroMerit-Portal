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

### Seed Default Admin User

```bash
# Automatically seeds default admin user
npx prisma db seed
```

**Default Admin Credentials:**
- Email: `admin@micromerit.com`
- Password: `admin123`

⚠️ **Important**: Change these credentials in production!

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

## License

MIT
