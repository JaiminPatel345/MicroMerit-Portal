# NSQF Verification Modal - Backend Integration & Testing

## Overview
This document summarizes the complete backend integration for the editable NSQF Verification Modal, including validation schemas, service logic, and comprehensive testing.

## Changes Made

### 1. Schema Validation (`schema.ts`)

#### Enhanced Validations:
- **NSQF Level Validation**: Strict validation ensuring levels are between 1-10 (inclusive)
- **Skill Schema**: Validates skill names (non-empty, max 200 chars) and confidence (0-1 range)
- **NSQF Alignment Schema**: Comprehensive validation for job roles, QP codes, and reasoning
- **New `nsqfVerificationSchema`**: Dedicated schema for the verification endpoint

#### Key Features:
```typescript
- NSQF levels accept both numbers and strings ("5" or 5)
- Conditional validation: approved status requires job_role AND nsqf_level
- Rejected status doesn't require these fields
- Skills array properly validated with default confidence of 1.0
- Maximum lengths enforced (reasoning: 2000 chars, job_role: 500 chars)
```

### 2. Controller Updates (`controller.ts`)

#### `verifyNSQFAlignment` Method:
- Imports and uses `nsqfVerificationSchema` for validation
- Validates request body before processing
- Returns proper error responses for validation failures
- Maintains existing authorization checks (issuer_id verification)

#### Validation Flow:
1. Extract and validate issuer_id from request
2. Validate credential_id from URL params
3. Parse and validate request body using Zod schema
4. Call service method with validated data
5. Return success or error response

### 3. Service Logic (`service.ts`)

#### `verifyNSQFAlignment` Method Enhancement:

**For Approved Status:**
- Merges edited fields (job_role, qp_code, nsqf_level, skills, reasoning)
- Preserves original AI data for fields not provided
- Updates skills array if provided
- Adds verification audit trail:
  - `verified_at`: ISO timestamp
  - `verified_by_issuer`: true
  - `verification_status`: 'approved'

**For Rejected Status:**
- Marks alignment as rejected
- Preserves all original AI-generated data
- Adds rejection reasoning
- Maintains audit trail

#### Data Flow:
```
Frontend Modal (edits)
  ↓
Controller (validation)
  ↓
Service (business logic)
  ↓
Repository (database update)
```

### 4. Comprehensive Testing (`nsqf-verification.test.ts`)

#### Test Coverage (15 tests, all passing):

**Service Layer Tests:**
1. ✓ Approved status with full data update
2. ✓ Approved status with partial data (preserves original)
3. ✓ Rejected status (preserves AI data, adds rejection)
4. ✓ NotFoundError when credential doesn't exist
5. ✓ ValidationError when credential doesn't belong to issuer

**Schema Validation Tests:**
6. ✓ Valid approved status with all fields
7. ✓ Valid approved status with NSQF level as string
8. ✓ Valid rejected status without job_role/nsqf_level
9. ✓ Rejects approved without job_role
10. ✓ Rejects approved without nsqf_level
11. ✓ Rejects NSQF level below 1
12. ✓ Rejects NSQF level above 10
13. ✓ Rejects invalid status value
14. ✓ Rejects skill with empty name
15. ✓ Rejects skill with confidence outside 0-1 range

## API Endpoint Documentation

### POST /credentials/issue
**Description**: Issue a credential with optional pre-verified NSQF data

**Request Body (FormData)**:
```
- learner_email: string (email format)
- certificate_title: string
- issued_at: ISO datetime string
- file: PDF file
- ai_extracted_data: JSON string (optional)
- verification_status: JSON string (optional)
```

**ai_extracted_data Schema**:
```json
{
  "skills": [
    { "name": "JavaScript", "confidence": 0.95 }
  ],
  "nsqf_alignment": {
    "job_role": "Software Developer",
    "qp_code": "QP2101",
    "nsqf_level": 5,
    "reasoning": "Certificate aligns with Level 5 competencies",
    "confidence": 0.87
  }
}
```

**verification_status Schema**:
```json
{
  "aligned": true,
  "qp_code": "QP2101",
  "nos_code": null,
  "nsqf_level": 5,
  "confidence": 0.87,
  "reasoning": "Verified by issuer"
}
```

### PUT /credentials/:id/nsqf-verification
**Description**: Verify or reject NSQF alignment for an existing credential

**URL Parameters**:
- `id`: credential_id (UUID)

**Request Body**:
```json
{
  "status": "approved",  // or "rejected"
  "job_role": "AWS Cloud Solutions Architect",  // required if approved
  "qp_code": "QP2101",  // optional
  "nsqf_level": 6,  // required if approved
  "skills": [  // optional
    { "name": "AWS", "confidence": 1.0 },
    { "name": "Cloud Architecture", "confidence": 0.95 }
  ],
  "reasoning": "Verified alignment after review"  // optional
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "NSQF alignment verified successfully",
  "data": {
    // Updated credential data
  }
}
```

**Validation Rules**:
- If `status === 'approved'`: `job_role` AND `nsqf_level` are required
- If `status === 'rejected'`: only `status` is required (reasoning optional)
- `nsqf_level` must be between 1 and 10 (inclusive)
- Skills must have non-empty names and confidence between 0 and 1

## Frontend Integration

### Data Flow:
1. User uploads certificate → AI analysis
2. Modal shows AI-extracted data (read-only)
3. User clicks "Edit Details" → enters edit mode
4. User modifies: skills, job_role, qp_code, nsqf_level, reasoning
5. User clicks "Approve & Verify" or "Reject Mapping"
6. Frontend sends edited data to `POST /credentials/issue`
7. Backend validates and merges edited data with verified flag

### Modified Data Structure from Modal:
```javascript
{
  status: 'approved',  // or 'rejected'
  skills: [
    { name: 'JavaScript', confidence: 1.0 }
  ],
  job_role: 'Full Stack Developer',
  qp_code: 'QP2101',
  nsqf_level: 5,
  reasoning: 'Issuer-verified reasoning',
  confidence: 0.87  // preserved from AI
}
```

## Testing Instructions

### Run NSQF Verification Tests:
```bash
cd server/node-app
npm test -- nsqf-verification.test.ts
```

### Run All Credential Tests:
```bash
npm test -- credential
```

### Expected Output:
```
PASS  src/tests/nsqf-verification.test.ts
  NSQF Verification Service
    ✓ 15 tests passing
  
Test Suites: 1 passed
Tests: 15 passed
```

## Security Considerations

1. **Authorization**: Only the credential's issuer can verify NSQF alignment
2. **Validation**: All inputs are validated using Zod schemas
3. **Audit Trail**: All verifications are timestamped and marked with issuer flag
4. **Immutability**: Rejected credentials preserve original AI data

## Database Schema

The credential metadata stores verification information:

```json
{
  "ai_extracted": {
    "skills": [...],
    "nsqf_alignment": {
      "job_role": "...",
      "qp_code": "...",
      "nsqf_level": 5,
      "reasoning": "...",
      "confidence": 0.87,
      "verified_at": "2024-01-15T10:30:00Z",
      "verified_by_issuer": true,
      "verification_status": "approved" // or "rejected"
    }
  }
}
```

## Error Handling

### Common Errors:

**400 Bad Request**:
- Invalid NSQF level (not between 1-10)
- Missing required fields for approved status
- Invalid skill confidence values
- Empty skill names

**401 Unauthorized**:
- Issuer ID missing from request context

**403 Forbidden**:
- Credential doesn't belong to the requesting issuer
- Issuer not approved to issue credentials

**404 Not Found**:
- Credential ID doesn't exist

## Future Enhancements

1. **Versioning**: Track history of NSQF verifications
2. **Bulk Verification**: Verify multiple credentials at once
3. **Auto-suggestions**: AI-powered job role suggestions during edit
4. **Notification**: Alert learners when NSQF alignment is verified
5. **Analytics**: Dashboard for verification statistics

## Files Modified

1. `server/node-app/src/modules/credential-issuance/schema.ts`
2. `server/node-app/src/modules/credential-issuance/controller.ts`
3. `server/node-app/src/modules/credential-issuance/service.ts`
4. `server/node-app/src/tests/nsqf-verification.test.ts` (new)
5. `client/main-app/src/components/NSQFVerificationModal.jsx`
6. `client/main-app/src/utils/nsqfData.js`
7. `client/main-app/src/pages/issuer/icons.jsx`

## Summary

✅ Backend validation implemented with strict Zod schemas  
✅ Service logic handles both approval and rejection workflows  
✅ Comprehensive test suite with 15 passing tests  
✅ Frontend integration maintains data flow  
✅ Audit trail and security measures in place  
✅ API endpoint properly documented  

The NSQF Verification Modal is now fully integrated with backend validation and testing complete.
