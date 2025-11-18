# MicroMerit Portal - API Documentation Structure

## Documentation Files

```
docs/
├── README.md                           # Master index and overview
├── auth.openapi.yml                    # Core authentication (36 KB)
├── learner-registration.openapi.yml    # 3-step registration with OTP (11 KB)
├── oauth.openapi.yml                   # Google & DigiLocker OAuth (9.3 KB)
├── credentials.openapi.yml             # Credential lifecycle management (18 KB)
├── pdf-certificates.openapi.yml        # PDF generation with S3 (9.7 KB)
└── blockchain.openapi.yml              # Blockchain integration placeholder (9.4 KB)
```

## Quick Reference

### By Module

| Module | Spec File | Endpoints | Description |
|--------|-----------|-----------|-------------|
| **Core Auth** | `auth.openapi.yml` | 20+ | Issuer, Learner, Admin authentication |
| **Registration** | `learner-registration.openapi.yml` | 3 | 3-step learner registration with OTP |
| **OAuth** | `oauth.openapi.yml` | 4 | Google & DigiLocker social login |
| **Credentials** | `credentials.openapi.yml` | 7 | Issue, claim, revoke, verify credentials |
| **PDF Certs** | `pdf-certificates.openapi.yml` | 3 | Generate and download PDF certificates |
| **Blockchain** | `blockchain.openapi.yml` | 3 | Blockchain recording (placeholder) |

### By User Role

#### Issuer Endpoints
- Authentication (2-step with OTP): `POST /issuer/start-register`, `POST /issuer/verify-register`, `POST /issuer/login`
- Authentication (Legacy): `POST /issuer/register` (deprecated)
- Profile: `GET /issuer/me`, `PATCH /issuer/me`
- API Keys: `GET /issuer/api-keys`, `POST /issuer/api-keys`, `DELETE /issuer/api-keys/{id}`
- Credentials: `POST /credential/issue`, `GET /credential/issuer/list`, `PATCH /credential/revoke/{uid}`
- PDF: `POST /pdf/generate`
- Stats: `GET /credential/issuer/stats`

#### Learner Endpoints
- Authentication: `POST /learner/login`
- Registration (3-step with OTP): `POST /learner/start-register`, `POST /learner/verify-otp`, `POST /learner/complete-register`
- Registration (Legacy): `POST /learner/register` (deprecated)
- Email Management: `POST /learner/add-email/request`, `POST /learner/add-email/verify`
- OAuth: `GET /learner/oauth/google`, `GET /learner/oauth/digilocker`
- Profile: `GET /learner/me`, `PATCH /learner/me`
- Credentials: `POST /credential/claim`, `GET /credential/learner/list`
- Stats: `GET /credential/learner/stats`

#### Admin Endpoints
- Authentication: `POST /admin/login`
- Profile: `GET /admin/me`
- Issuer Management: `GET /admin/issuers`, `POST /admin/issuers/{id}/approve`, `POST /admin/issuers/{id}/reject`, `POST /admin/issuers/{id}/block`, `POST /admin/issuers/{id}/unblock`

#### Public Endpoints (No Auth)
- Health: `GET /health`
- Verification: `GET /credential/verify/{uid}`
- PDF: `GET /pdf/{uid}`, `GET /pdf/{uid}/download`
- Blockchain: `GET /blockchain/verify/{uid}`, `GET /blockchain/transaction/{hash}`

### By Feature

#### Authentication & Authorization
- **JWT Tokens**: 15min access, 7 days refresh
- **API Keys**: Custom rate limits per key
- **OAuth**: Google & DigiLocker
- **OTP**: Email/SMS verification (6-digit code, 10-minute expiry)
  - **Learner Registration**: 3-step process with OTP verification
  - **Issuer Registration**: 2-step process with email OTP verification before admin approval
  - **Email Addition**: Learners can add verified additional emails one at a time

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

# Add to Express app
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const authSpec = YAML.load('./docs/auth.openapi.yml');
app.use('/api-docs/auth', swaggerUi.serve, swaggerUi.setup(authSpec));
```

Then visit: `http://localhost:3000/api-docs/auth`

### Method 2: Postman
1. Open Postman
2. Import → Upload Files
3. Select any `.openapi.yml` file
4. Auto-generates collection with all endpoints

### Method 3: Redoc
```bash
# Install Redoc CLI
npm i -g redoc-cli

# Generate static HTML
redoc-cli bundle docs/auth.openapi.yml -o docs/auth.html
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

# Step 2: Verify OTP
curl -X POST http://localhost:3000/api/auth/learner/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "otp": "123456"
  }'

# Step 3: Complete registration (use tempToken from Step 2)
curl -X POST http://localhost:3000/api/auth/learner/complete-register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tempToken>" \
  -d '{
    "name": "John Doe",
    "password": "SecurePass123!"
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

### Add Email to Learner Account
```bash
# Step 1: Request to add email (send OTP)
curl -X POST http://localhost:3000/api/auth/learner/add-email/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "email": "alternate@example.com"
  }'

# Step 2: Verify OTP and add email
curl -X POST http://localhost:3000/api/auth/learner/add-email/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "sessionId": "123e4567-e89b-12d3-a456-426614174001",
    "otp": "123456"
  }'
```

### cURL
### cURL (Legacy Examples)
```bash
# Register issuer (deprecated - use 2-step process instead)
curl -X POST http://localhost:3000/api/issuer/register \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "Tech University",
    "email": "admin@techuni.edu",
    "password": "SecurePass123!",
    "contact_person_name": "John Doe",
    "phone_number": "+1234567890"
  }'
```

### HTTPie
```bash
# Login
http POST localhost:3000/api/issuer/login \
  email=admin@techuni.edu \
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
- **Current Version**: v1.0.0
- **Last Updated**: November 18, 2025
- **Next Update**: When new features are added

### Recent Changes (v1.0.0 - November 2025)
1. **Learner Registration**: Removed `other_emails` field from Step 3 (profile completion)
2. **Email Management**: Added two-step OTP verification for adding emails (`/learner/add-email/request` and `/learner/add-email/verify`)
3. **Issuer Registration**: Added mandatory 2-step OTP verification before admin approval (`/issuer/start-register` and `/issuer/verify-register`)
4. **Security Enhancement**: All email additions now require OTP verification to ensure email ownership
5. **Admin Workflow**: Issuers must verify their email via OTP before their application reaches admin for approval

## Contributing

When adding new endpoints:
1. Update the relevant `.openapi.yml` file
2. Follow existing schema patterns
3. Include examples for all request/response bodies
4. Document all error cases
5. Update this README's Quick Reference section
