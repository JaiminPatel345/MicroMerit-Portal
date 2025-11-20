# MicroMerit Portal - API Documentation Structure

## Documentation Files

**One module = One OpenAPI file** - Each module has its own dedicated specification file.

```
docs/apis/
├── health.openapi.yml                  # System health check
├── learner.openapi.yml                 # Complete learner module (auth + profile + contacts)
├── issuer.openapi.yml                  # Complete issuer module (auth + profile + API keys)
├── admin.openapi.yml                   # Complete admin module (auth + issuer management)
├── oauth.openapi.yml                   # Google & DigiLocker OAuth (9.3 KB)
├── credentials.openapi.yml             # Credential lifecycle management (18 KB)
├── pdf-certificates.openapi.yml        # PDF generation with S3 (9.7 KB)
├── verification.openapi.yml            # Credential verification
└── blockchain.openapi.yml              # Blockchain integration placeholder (9.4 KB)
```

## Quick Reference

### By Module

| Module | Spec File | Endpoints | Description |
|--------|-----------|-----------|-------------|
| **Health** | `health.openapi.yml` | 1 | System health check |
| **Learner** | `learner.openapi.yml` | 10 | Complete learner module: auth, registration (3-step OTP), profile, contact verification, OAuth |
| **Issuer** | `issuer.openapi.yml` | 9 | Complete issuer module: auth, registration (2-step OTP), profile, API key management |
| **Admin** | `admin.openapi.yml` | 8 | Complete admin module: auth, profile, issuer management (approve/reject/block/unblock) |
| **OAuth** | `oauth.openapi.yml` | 4 | Google & DigiLocker social login |
| **Credentials** | `credentials.openapi.yml` | 7 | Issue, claim, revoke, verify credentials |
| **PDF Certs** | `pdf-certificates.openapi.yml` | 3 | Generate and download PDF certificates |
| **Verification** | `verification.openapi.yml` | - | Credential verification |
| **Blockchain** | `blockchain.openapi.yml` | 3 | Blockchain recording (placeholder) |

### By User Role

#### Issuer Endpoints
**File**: `issuer.openapi.yml`

- **Authentication**: 
  - Registration (2-step OTP): `POST /auth/issuer/start-register`, `POST /auth/issuer/verify-register`
  - Login: `POST /auth/issuer/login`
  - Refresh: `POST /auth/issuer/refresh`
- **Profile**: 
  - Get: `GET /issuer/profile`
  - Update: `PUT /issuer/profile`
- **API Keys**: 
  - List: `GET /issuer/api-keys`
  - Create: `POST /issuer/api-keys`
  - Get details: `GET /issuer/api-keys/{id}`
  - Revoke: `DELETE /issuer/api-keys/{id}`
- **Credentials** (see `credentials.openapi.yml`): 
  - Issue: `POST /credential/issue`
  - List: `GET /credential/issuer/list`
  - Revoke: `PATCH /credential/revoke/{uid}`
  - Stats: `GET /credential/issuer/stats`
- **PDF** (see `pdf-certificates.openapi.yml`): 
  - Generate: `POST /pdf/generate`

#### Learner Endpoints
**File**: `learner.openapi.yml`

- **Authentication**: 
  - Registration (3-step OTP): `POST /auth/learner/start-register`, `POST /auth/learner/verify-otp`, `POST /auth/learner/complete-register`
  - Login: `POST /auth/learner/login`
  - Refresh: `POST /auth/learner/refresh`
  - OAuth: `GET /auth/learner/oauth/google`, `GET /auth/learner/oauth/google/callback`
- **Profile**: 
  - Get: `GET /learner/profile`
  - Update: `PUT /learner/profile`
- **Contact Verification** (unified endpoints):
  - Request OTP: `POST /learner/contacts/request` (supports: email, primary-email, primary-phone)
  - Verify OTP: `POST /learner/contacts/verify`
- **Credentials** (see `credentials.openapi.yml`): 
  - Claim: `POST /credential/claim`
  - List: `GET /credential/learner/list`
  - Stats: `GET /credential/learner/stats`

#### Admin Endpoints
**File**: `admin.openapi.yml`

- **Authentication**: 
  - Login: `POST /auth/admin/login`
  - Refresh: `POST /auth/admin/refresh`
- **Profile**: 
  - Get: `GET /admin/profile`
- **Issuer Management**: 
  - List: `GET /admin/issuers` (supports filtering by status, is_blocked)
  - Approve: `POST /admin/issuers/{id}/approve`
  - Reject: `POST /admin/issuers/{id}/reject`
  - Block: `POST /admin/issuers/{id}/block`
  - Unblock: `POST /admin/issuers/{id}/unblock`

#### Public Endpoints (No Auth)
**Files**: `health.openapi.yml`, `verification.openapi.yml`, `pdf-certificates.openapi.yml`, `blockchain.openapi.yml`

- **Health**: `GET /health`
- **Verification**: `GET /credential/verify/{uid}`
- **PDF**: `GET /pdf/{uid}`, `GET /pdf/{uid}/download`
- **Blockchain**: `GET /blockchain/verify/{uid}`, `GET /blockchain/transaction/{hash}`

### By Feature

#### Authentication & Authorization
- **JWT Tokens**: 15min access, 7 days refresh
- **API Keys**: Custom rate limits per key
- **OAuth**: Google & DigiLocker (see `oauth.openapi.yml`)
- **OTP**: Email/SMS verification (6-digit code, 10-minute expiry)
  - **Learner Registration**: 3-step process with OTP verification (see `learner.openapi.yml`)
  - **Issuer Registration**: 2-step process with email OTP verification before admin approval (see `issuer.openapi.yml`)
  - **Contact Verification**: Unified endpoints for adding email/phone with OTP (see `learner.openapi.yml`)
    - Add secondary email
    - Add primary email (for phone-registered users)
    - Add primary phone (for email-registered users)

#### Credential Management
- **Issue**: Issuer creates credential for learner
- **Claim**: Learner accepts credential
- **Revoke**: Issuer invalidates credential
- **Verify**: Public verification of authenticity

#### PDF Certificates
- **Generation**: Professional PDF with QR code
- **Storage**: Amazon S3 cloud storage
- **Access**: Public URLs for viewing/downloading

#### Blockchain (Placeholder)
- **Record**: Store credential hash on-chain
- **Verify**: Check blockchain existence
- **Transaction**: Lookup transaction details

## Viewing Documentation

### Method 1: Swagger UI (Recommended)
```bash
# Install Swagger UI
yarn add swagger-ui-express

# Add to Express app (example for learner module)
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const learnerSpec = YAML.load('./docs/apis/learner.openapi.yml');
app.use('/api-docs/learner', swaggerUi.serve, swaggerUi.setup(learnerSpec));

// Repeat for other modules (issuer, admin, etc.)
```

Then visit: 
- `http://localhost:3000/api-docs/learner`
- `http://localhost:3000/api-docs/issuer`
- `http://localhost:3000/api-docs/admin`

### Method 2: Postman
1. Open Postman
2. Import → Upload Files
3. Select any `.openapi.yml` file
4. Auto-generates collection with all endpoints

### Method 3: Redoc
```bash
# Install Redoc CLI
npm i -g redoc-cli

# Generate static HTML for any module
redoc-cli bundle docs/apis/learner.openapi.yml -o docs/learner.html
redoc-cli bundle docs/apis/issuer.openapi.yml -o docs/issuer.html
redoc-cli bundle docs/apis/admin.openapi.yml -o docs/admin.html
```

### Method 4: VS Code
Install "OpenAPI (Swagger) Editor" extension and open any `.yml` file for live preview.

## API Base URLs

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.micromerit.com/api`

## Authentication Examples

### JWT Bearer Token
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:3000/api/issuer/me
```

### API Key
```bash
curl -H "X-API-Key: mmk_123456..." \
  http://localhost:3000/api/credential/issue
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
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

## Testing APIs

### Learner Registration (3-Step with OTP)
```bash
# Step 1: Start registration
curl -X POST http://localhost:3000/api/auth/learner/start-register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "learner@example.com"
  }'

# Step 2: Verify OTP (returns tempToken)
curl -X POST http://localhost:3000/api/auth/learner/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "otp": "123456"
  }'

# Step 3: Complete registration (use tempToken from Step 2)
# Option A: With base64 image (recommended for direct upload)
curl -X POST http://localhost:3000/api/auth/learner/complete-register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tempToken>" \
  -d '{
    "name": "John Doe",
    "password": "SecurePass123!",
    "profilePhotoUrl": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "dob": "1995-05-15T00:00:00.000Z",
    "gender": "Male"
  }'

# Option B: With image URL
curl -X POST http://localhost:3000/api/auth/learner/complete-register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tempToken>" \
  -d '{
    "name": "John Doe",
    "password": "SecurePass123!",
    "profilePhotoUrl": "https://example.com/photo.jpg",
    "dob": "1995-05-15T00:00:00.000Z",
    "gender": "Male"
  }'

# Option C: Without photo
curl -X POST http://localhost:3000/api/auth/learner/complete-register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tempToken>" \
  -d '{
    "name": "John Doe",
    "password": "SecurePass123!",
    "dob": "1995-05-15T00:00:00.000Z",
    "gender": "Male"
  }'
```

### Issuer Registration (2-Step with OTP)
```bash
# Step 1: Start registration (send OTP)
curl -X POST http://localhost:3000/api/auth/issuer/start-register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech University",
    "email": "admin@techuni.edu",
    "password": "SecurePass123!",
    "type": "university",
    "contact_person_name": "John Doe",
    "phone": "+1234567890"
  }'

# Step 2: Verify OTP and complete registration
curl -X POST http://localhost:3000/api/auth/issuer/verify-register \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "123e4567-e89b-12d3-a456-426614174005",
    "otp": "123456"
  }'
```

### Learner Contact Verification (Unified Endpoints)
```bash
# Add secondary email
curl -X POST http://localhost:3000/api/learner/contacts/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "type": "email",
    "email": "secondary@example.com"
  }'

curl -X POST http://localhost:3000/api/learner/contacts/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "type": "email",
    "sessionId": "123e4567-e89b-12d3-a456-426614174001",
    "otp": "123456"
  }'

# Add primary email (for phone-registered users)
curl -X POST http://localhost:3000/api/learner/contacts/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "type": "primary-email",
    "email": "primary@example.com"
  }'

# Add primary phone (for email-registered users)
curl -X POST http://localhost:3000/api/learner/contacts/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "type": "primary-phone",
    "phone": "+1234567890"
  }'
```

### HTTPie
```bash
# Issuer login
http POST localhost:3000/api/auth/issuer/login \
  email=admin@techuni.edu \
  password=SecurePass123!

# Learner login
http POST localhost:3000/api/auth/learner/login \
  email=learner@example.com \
  password=SecurePass123!
```

### JavaScript Fetch
```javascript
// Issue credential
const response = await fetch('http://localhost:3000/api/credential/issue', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    learner_email_or_phone: 'learner@example.com',
    credential_type: 'Course Completion',
    metadata: {
      course: 'Web Development',
      grade: 'A+'
    }
  })
});

const data = await response.json();
```

## Validation Rules

### Common
- Email: Valid RFC 5322 format
- Phone: 10-15 digits with optional + prefix
- Password: Minimum 8 characters
- UUID: Valid UUID v4 format

### Specific
- Organization Name: 1-200 characters
- API Key Name: 1-100 characters
- Credential Type: 1-100 characters
- Revocation Reason: 1-500 characters

## Rate Limits

- **General API**: 100 requests/minute per IP
- **API Keys**: Custom (default 60/minute)
- **OAuth Callbacks**: No limit
- **Public Endpoints**: No limit

## Status Codes Reference

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PATCH/DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Authenticated but not allowed |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (email, phone) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

## Support

- **Email**: support@micromerit.com
- **GitHub**: [Report issues or request features]
- **Documentation**: See individual OpenAPI specs for details

## Updates

Documentation is versioned alongside the API:
- **Current Version**: v1.1.0
- **Last Updated**: November 20, 2025
- **Next Update**: When new features are added

### Recent Changes (v1.1.0 - November 2025)
1. **OpenAPI Reorganization**: Moved to module-based structure - one file per module
   - Created `learner.openapi.yml` - merged learner auth, registration, profile, and contact verification
   - Created `issuer.openapi.yml` - merged issuer auth, registration, profile, and API keys
   - Created `admin.openapi.yml` - merged admin auth, profile, and issuer management
   - Created `health.openapi.yml` - system health endpoint
   - Deleted `auth.openapi.yml` and `learner-registration.openapi.yml`
2. **Contact Verification**: Unified 6 endpoints into 2 with `type` parameter
   - `POST /learner/contacts/request` - supports email, primary-email, primary-phone
   - `POST /learner/contacts/verify` - unified OTP verification
3. **Route Restructuring**: Separated authentication from resource management
   - `/auth/*` - Authentication only (login, register, refresh)
   - `/learner/*`, `/issuer/*`, `/admin/*` - Resource management
4. **Security Enhancement**: Removed password_hash from all API responses
5. **Deprecated Routes**: Removed all legacy routes from codebase

## Contributing

When adding new endpoints:
1. Update the relevant module's `.openapi.yml` file (e.g., `learner.openapi.yml` for learner endpoints)
2. Follow existing schema patterns
3. Include examples for all request/response bodies
4. Document all error cases
5. Update this README's Quick Reference section
6. **Module separation**: Keep one module per file - don't mix learner/issuer/admin endpoints
