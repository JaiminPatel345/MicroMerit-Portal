# API Request Examples

Collection of example requests for testing the MicroMerit Portal API.

## Environment Variables

Create these variables in your API client (Postman/Insomnia):

```
BASE_URL=http://localhost:3000
ISSUER_TOKEN=<your_issuer_access_token>
LEARNER_TOKEN=<your_learner_access_token>
ADMIN_TOKEN=<your_admin_access_token>
API_KEY=<your_api_key>
```

---

## 1. ISSUER FLOW

### Step 1: Register Issuer

```bash
curl -X POST {{BASE_URL}}/auth/issuer/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech University",
    "type": "university",
    "email": "admin@techuniversity.edu",
    "password": "SecurePass123!",
    "phone": "+1234567890",
    "official_domain": "techuniversity.edu",
    "website_url": "https://techuniversity.edu",
    "contact_person_name": "John Doe",
    "contact_person_designation": "Administrator",
    "address": "123 University Ave, Tech City, TC 12345",
    "kyc_document_url": "https://example.com/documents/kyc.pdf",
    "logo_url": "https://example.com/logos/tech-uni.png"
  }'
```

### Step 2: Login Issuer

```bash
curl -X POST {{BASE_URL}}/auth/issuer/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techuniversity.edu",
    "password": "SecurePass123!"
  }'
```

Save the `accessToken` as `ISSUER_TOKEN`.

### Step 3: Get Issuer Profile

```bash
curl -X GET {{BASE_URL}}/auth/issuer/me \
  -H "Authorization: Bearer {{ISSUER_TOKEN}}"
```

### Step 4: Update Issuer Profile

```bash
curl -X PUT {{BASE_URL}}/auth/issuer/me \
  -H "Authorization: Bearer {{ISSUER_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech University - Updated",
    "phone": "+9876543210",
    "website_url": "https://www.techuniversity.edu"
  }'
```

### Step 5: Refresh Token

```bash
curl -X POST {{BASE_URL}}/auth/issuer/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "{{REFRESH_TOKEN}}"
  }'
```

---

## 2. ISSUER API KEY FLOW

### Step 1: Create API Key

```bash
curl -X POST {{BASE_URL}}/auth/issuer/api-key/create \
  -H "Authorization: Bearer {{ISSUER_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production API Key",
    "rate_limit_per_minute": 100,
    "expires_at": "2026-12-31T23:59:59.999Z",
    "allowed_ips": "192.168.1.1,192.168.1.2"
  }'
```

Save the `api_key` as `API_KEY`.

### Step 2: List All API Keys

```bash
curl -X GET {{BASE_URL}}/auth/issuer/api-key/list \
  -H "Authorization: Bearer {{ISSUER_TOKEN}}"
```

### Step 3: Get API Key Details

```bash
curl -X GET {{BASE_URL}}/auth/issuer/api-key/1 \
  -H "Authorization: Bearer {{ISSUER_TOKEN}}"
```

### Step 4: Revoke API Key

```bash
curl -X POST {{BASE_URL}}/auth/issuer/api-key/revoke/1 \
  -H "Authorization: Bearer {{ISSUER_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Rotating keys for security purposes"
  }'
```

### Step 5: Use API Key (Example)

```bash
curl -X POST {{BASE_URL}}/api/certificates/issue \
  -H "X-API-Key: {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{
    "learner_id": 1,
    "course_name": "Advanced Node.js",
    "issue_date": "2025-11-18"
  }'
```

---

## 3. LEARNER FLOW

### Step 1: Register Learner (with Email)

```bash
curl -X POST {{BASE_URL}}/auth/learner/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "learner@example.com",
    "password": "LearnerPass123!",
    "phone": "+1234567890",
    "profileUrl": "https://example.com/profiles/learner1.jpg",
    "other_emails": ["alternate@example.com", "backup@example.com"]
  }'
```

### Step 2: Register Learner (with Phone Only)

```bash
curl -X POST {{BASE_URL}}/auth/learner/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+9876543210",
    "password": "LearnerPass123!"
  }'
```

### Step 3: Login Learner

```bash
curl -X POST {{BASE_URL}}/auth/learner/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "learner@example.com",
    "password": "LearnerPass123!"
  }'
```

Save the `accessToken` as `LEARNER_TOKEN`.

### Step 4: Get Learner Profile

```bash
curl -X GET {{BASE_URL}}/auth/learner/me \
  -H "Authorization: Bearer {{LEARNER_TOKEN}}"
```

### Step 5: Update Learner Profile

```bash
curl -X PUT {{BASE_URL}}/auth/learner/me \
  -H "Authorization: Bearer {{LEARNER_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "profileUrl": "https://example.com/profiles/updated.jpg",
    "external_digilocker_id": "DL123456789",
    "other_emails": ["new@example.com"]
  }'
```

---

## 4. ADMIN FLOW

### Step 1: Admin Login

```bash
curl -X POST {{BASE_URL}}/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@micromerit.com",
    "password": "AdminPass123!"
  }'
```

Save the `accessToken` as `ADMIN_TOKEN`.

### Step 2: Get Admin Profile

```bash
curl -X GET {{BASE_URL}}/auth/admin/me \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

### Step 3: List All Issuers

```bash
# All issuers
curl -X GET {{BASE_URL}}/auth/admin/issuer/list \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"

# Filter by status
curl -X GET "{{BASE_URL}}/auth/admin/issuer/list?status=pending" \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"

# Filter by blocked status
curl -X GET "{{BASE_URL}}/auth/admin/issuer/list?is_blocked=false" \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"

# Combined filters
curl -X GET "{{BASE_URL}}/auth/admin/issuer/list?status=approved&is_blocked=false" \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

### Step 4: Approve Issuer

```bash
curl -X POST {{BASE_URL}}/auth/admin/issuer/approve/1 \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "All documents verified successfully"
  }'
```

### Step 5: Reject Issuer

```bash
curl -X POST {{BASE_URL}}/auth/admin/issuer/reject/2 \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Invalid KYC documents provided. Please resubmit with proper documentation."
  }'
```

### Step 6: Block Issuer

```bash
curl -X POST {{BASE_URL}}/auth/admin/issuer/block/3 \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Violation of terms and conditions - issuing fraudulent certificates"
  }'
```

### Step 7: Unblock Issuer

```bash
curl -X POST {{BASE_URL}}/auth/admin/issuer/unblock/3 \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Issue resolved after investigation"
  }'
```

---

## 5. ERROR SCENARIOS

### Invalid Credentials

```bash
curl -X POST {{BASE_URL}}/auth/issuer/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techuniversity.edu",
    "password": "WrongPassword"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Login failed",
  "error": "Invalid email or password",
  "statusCode": 401
}
```

### Blocked Account Login

```bash
curl -X POST {{BASE_URL}}/auth/issuer/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "blocked@example.com",
    "password": "Password123!"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Login failed",
  "error": "Account is blocked. Reason: Terms violation",
  "statusCode": 401
}
```

### Unauthorized Access

```bash
curl -X GET {{BASE_URL}}/auth/issuer/me
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "error": "UNAUTHORIZED",
  "statusCode": 401
}
```

### Forbidden Access (Wrong Role)

```bash
curl -X POST {{BASE_URL}}/auth/admin/issuer/approve/1 \
  -H "Authorization: Bearer {{ISSUER_TOKEN}}"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "error": "FORBIDDEN",
  "statusCode": 403
}
```

### Validation Error

```bash
curl -X POST {{BASE_URL}}/auth/issuer/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TU",
    "email": "invalid-email",
    "password": "123"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "data": [
    {
      "path": "name",
      "message": "Name must be at least 3 characters"
    },
    {
      "path": "email",
      "message": "Invalid email address"
    },
    {
      "path": "password",
      "message": "Password must be at least 8 characters"
    }
  ],
  "statusCode": 422
}
```

### Rate Limit Exceeded

```bash
# Make 6 login attempts within 15 minutes
for i in {1..6}; do
  curl -X POST {{BASE_URL}}/auth/issuer/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "test"
    }'
done
```

**Expected Response (6th request):**
```json
{
  "success": false,
  "message": "Too many login attempts, please try again later",
  "error": "AUTH_RATE_LIMIT_EXCEEDED",
  "statusCode": 429
}
```

---

## 6. POSTMAN COLLECTION

To import into Postman:

1. Create a new collection named "MicroMerit Portal Auth API"
2. Create environment variables:
   - `BASE_URL`: http://localhost:3000
   - `ISSUER_TOKEN`: (will be set after login)
   - `LEARNER_TOKEN`: (will be set after login)
   - `ADMIN_TOKEN`: (will be set after login)
   - `API_KEY`: (will be set after creation)

3. Import all the above curl commands

---

## 7. TESTING CHECKLIST

### Issuer Registration & Login
- [ ] Register new issuer
- [ ] Login with registered issuer
- [ ] Verify token in response
- [ ] Access protected route with token
- [ ] Test invalid credentials
- [ ] Test blocked account login

### API Key Management
- [ ] Create API key (approved issuer)
- [ ] List all API keys
- [ ] View single API key details
- [ ] Revoke API key
- [ ] Test creating API key (pending issuer)
- [ ] Test max API keys limit

### Learner Registration & Login
- [ ] Register with email
- [ ] Register with phone
- [ ] Login with email
- [ ] Login with phone
- [ ] Update profile

### Admin Operations
- [ ] Admin login
- [ ] List all issuers
- [ ] Approve pending issuer
- [ ] Reject pending issuer
- [ ] Block issuer
- [ ] Unblock issuer
- [ ] Test unauthorized access

### Error Handling
- [ ] Validation errors
- [ ] Authentication errors
- [ ] Authorization errors
- [ ] Rate limiting
- [ ] Not found errors

---

## Notes

- Replace `{{variable}}` with actual values when testing
- Store tokens securely
- API keys should be stored securely and never committed to version control
- Rate limits are per IP address
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
