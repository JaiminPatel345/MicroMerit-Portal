# API Route Restructuring

## Overview
The API routes have been restructured to follow REST best practices by separating authentication endpoints from resource management endpoints.

## Key Changes

### 1. **Unified Contact Verification for Learners**
Previously scattered across 6 separate endpoints, now consolidated to 2 unified endpoints:

**New Routes:**
- `POST /learner/contacts/request` - Send OTP for email/phone verification
- `POST /learner/contacts/verify` - Verify OTP and add contact

### 2. **Separation of Auth and Resource Management**

#### **Authentication Routes (`/auth/*`)**
Only for login, register, and token refresh:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/issuer/start-register` | POST | Start issuer registration |
| `/auth/issuer/verify-register` | POST | Verify OTP and complete registration |
| `/auth/issuer/login` | POST | Issuer login |
| `/auth/issuer/refresh` | POST | Refresh access token |
| `/auth/learner/start-register` | POST | Start learner registration |
| `/auth/learner/verify-otp` | POST | Verify OTP |
| `/auth/learner/complete-register` | POST | Complete registration |
| `/auth/learner/login` | POST | Learner login |
| `/auth/learner/refresh` | POST | Refresh access token |
| `/auth/learner/oauth/google` | GET | Google OAuth login |
| `/auth/learner/oauth/google/callback` | GET | Google OAuth callback |
| `/auth/learner/oauth/digilocker` | GET | DigiLocker OAuth |
| `/auth/learner/oauth/digilocker/callback` | GET | DigiLocker callback |
| `/auth/admin/login` | POST | Admin login |
| `/auth/admin/refresh` | POST | Refresh access token |

#### **Resource Management Routes**

##### **Learner Resources (`/learner/*`)**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/learner/profile` | GET | Get learner profile |
| `/learner/profile` | PUT | Update learner profile |
| `/learner/contacts/request` | POST | Request contact verification (unified) |
| `/learner/contacts/verify` | POST | Verify contact OTP (unified) |

##### **Issuer Resources (`/issuer/*`)**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/issuer/profile` | GET | Get issuer profile |
| `/issuer/profile` | PUT | Update issuer profile |
| `/issuer/api-keys` | POST | Create new API key |
| `/issuer/api-keys` | GET | List all API keys |
| `/issuer/api-keys/:id` | GET | Get API key details |
| `/issuer/api-keys/:id` | DELETE | Revoke API key |

##### **Admin Resources (`/admin/*`)**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/profile` | GET | Get admin profile |
| `/admin/issuers` | GET | List all issuers |
| `/admin/issuers/:id/approve` | POST | Approve issuer |
| `/admin/issuers/:id/reject` | POST | Reject issuer |
| `/admin/issuers/:id/block` | POST | Block issuer |
| `/admin/issuers/:id/unblock` | POST | Unblock issuer |

## Migration Guide

### For Learner Contact Verification

**Usage:**
```json
// Add email
POST /learner/contacts/request
{ 
  "type": "email",
  "email": "new@example.com"
}

POST /learner/contacts/verify
{ 
  "type": "email",
  "sessionId": "...",
  "otp": "123456"
}
```

**Benefits:**
- Single endpoint to remember
- Consistent interface for all contact types
- Easier to extend in the future
- Better API documentation

### Contact Verification Types

The `type` parameter can be:
- `email` - Add secondary email to learner account
- `primary-email` - Set primary email (for phone-registered users)
- `primary-phone` - Set primary phone (for email-registered users)

### For Profile Management

**Current:**
```
GET /learner/profile
PUT /learner/profile
```

### For Issuer API Keys

**Current:**
```
POST /issuer/api-keys
GET /issuer/api-keys
GET /issuer/api-keys/:id
DELETE /issuer/api-keys/:id
```

### For Admin Issuer Management

**Current:**
```
GET /admin/issuers
POST /admin/issuers/:id/approve
POST /admin/issuers/:id/reject
POST /admin/issuers/:id/block
POST /admin/issuers/:id/unblock
```

## Benefits of New Structure

1. **Clear Separation of Concerns**
   - `/auth/*` - Authentication only
   - `/learner/*`, `/issuer/*`, `/admin/*` - Resource management

2. **RESTful Best Practices**
   - Resource-based URLs
   - Proper HTTP methods (GET, POST, PUT, DELETE)
   - Logical grouping

3. **Better Developer Experience**
   - Easier to understand and remember
   - Consistent naming conventions
   - Self-documenting URLs

4. **Reduced Endpoint Clutter**
   - 6 learner verification endpoints → 2 unified endpoints
   - Cleaner API surface

5. **Future-Proof**
   - Easy to extend with new features
   - Clear patterns for adding new resources
   - Scalable architecture

## Examples

### Complete Learner Contact Verification Flow

```bash
# 1. Request OTP for adding secondary email
curl -X POST http://localhost:3000/api/learner/contacts/request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "email": "secondary@example.com"
  }'

# Response:
# {
#   "success": true,
#   "message": "OTP sent successfully",
#   "data": {
#     "sessionId": "123e4567-e89b-12d3-a456-426614174005",
#     "expiresAt": "2025-11-20T10:15:00Z"
#   }
# }

# 2. Verify OTP
curl -X POST http://localhost:3000/api/learner/contacts/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "sessionId": "123e4567-e89b-12d3-a456-426614174005",
    "otp": "123456"
  }'

# Response:
# {
#   "success": true,
#   "message": "Email added successfully",
#   "data": {
#     "email": "secondary@example.com"
#   }
# }
```

### Update Issuer Profile

```bash
curl -X PUT http://localhost:3000/api/issuer/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated University Name"}'
```

### Admin Approve Issuer

```bash
curl -X POST http://localhost:3000/api/admin/issuers/123/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

## Testing

Run the test suite to ensure all endpoints work correctly:

```bash
cd server/node-app
npm test
```
