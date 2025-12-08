# External Credential Fields Update

## Changes Made

### 1. Database Schema (Prisma)
Added the following fields to the `Credential` model in `prisma/schema.prisma`:

- **certificate_code** (String?) - NPR code (e.g., "SSC/Q2601")
- **sector** (String?) - Sector name (e.g., "Information Technology")  
- **nsqf_level** (Int?) - NSQF Level (1-10)
- **max_hr** (Int?) - Maximum hours
- **min_hr** (Int?) - Minimum hours
- **awarding_bodies** (Json?) - Array of awarding body names
- **occupation** (String?) - Occupation/job role
- **tags** (Json?) - Tags array (e.g., ["digilocker", "nsdc"])

Added indexes for:
- certificate_code
- sector
- nsqf_level

### 2. Migration
Created migration: `20251208211412_add_external_credential_fields`
- Adds all new columns to the `Credential` table
- All fields are nullable (optional)

### 3. External Sync Service
Updated `modules/external-credential-sync/service.ts`:
- Modified `createCredential` call to pass external credential fields
- Fields are extracted from the canonical credential object
- Null values are used if fields are not present

### 4. Credential Repository
Updated `modules/credential-issuance/repository.ts`:
- Added optional external credential fields to `createCredential` method signature
- Fields are passed through to Prisma create operation

## Field Sources

These fields come from the dummy server's mock credentials which are based on real NSQF qualifications:
- **certificate_code**: NPR code from qualification
- **sector**: Sector field from qualification  
- **nsqf_level**: NSQF level (1-10)
- **max_hr / min_hr**: Credit hours from qualification
- **awarding_bodies**: Array of awarding body names
- **occupation**: Job role/occupation
- **tags**: Provider tags (nsdc, udemy, jaimin, digilocker, etc.)

## POSSIBLE_MAX_HOUR Filter

The external sync service already filters out credentials where `max_hr > POSSIBLE_MAX_HOUR`:
- Check happens in `processCredential` method (line 161-164)
- Default: 1000 hours (configurable via .env)
- Credentials exceeding this are skipped with a debug log

## Next Steps

1. **Restart node-app** to load the updated code
2. **Sync credentials** from admin panel
3. **Verify** that new fields are populated in the database

## Testing

Query to check if fields are being saved:
```sql
SELECT 
  credential_id,
  certificate_title,
  certificate_code,
  sector,
  nsqf_level,
  max_hr,
  min_hr,
  occupation,
  tags
FROM "Credential"
WHERE certificate_code IS NOT NULL
LIMIT 5;
```

## Testing

### External Credential Sync Tests
A new test file `src/tests/external-credential-sync.test.ts` has been created to cover the auto-issuance flow:
- **Field Mapping**: Verifies that new fields (`certificate_code`, `sector`, `nsqf_level`, etc.) are correctly mapped from the canonical format to the database.
- **Validation**: Checks that credentials with `max_hr` exceeding the threshold are skipped.
- **Duplicate Checking**: Ensures duplicates are identified and skipped.
- **Learner Resolution**: Verifies logic for finding learners by primary or alternate emails.

### Existing Tests
- `credential-issuance.test.ts`: Updated to support async blockchain processing (initial `tx_hash` is null) and fixed import paths.
- `credential-verification.test.ts`: Updated import paths for blockchain service client.
