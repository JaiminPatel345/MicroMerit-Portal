# Course Hour Validation Implementation Summary

## What Was Implemented

✅ **Minimum and Maximum Hour Validation** for external credentials
- Credentials with course hours **below 7.5 hours** (MIN_HOUR_LEN) are rejected
- Credentials with course hours **above 30 hours** (MAX_HOUR_LEN) are rejected
- Rejected credentials are not added to the platform

## Changes Made

### 1. Environment Variables (`.env.example`)
```bash
# New configuration variables
MIN_HOUR_LEN=7.5    # Default: 7.5 hours
MAX_HOUR_LEN=30     # Default: 30 hours
```

**Location**: `/server/node-app/.env.example` (lines 96-99)

### 2. Service Updates (`service.ts`)
**Location**: `/server/node-app/src/modules/external-credential-sync/service.ts`

**Constructor Changes** (lines 19-26):
- Added `minHourLen` and `maxHourLen` properties
- Reads from environment variables with proper defaults
- Maintains backward compatibility with `POSSIBLE_MAX_HOUR`

**Validation Logic** (lines 145-175):
- Checks both `max_hr` and `min_hr` fields
- Validates against both minimum and maximum limits
- Provides detailed logging with credential information
- Throws descriptive error messages

### 3. Test Updates (`external-credential-sync.test.ts`)
**Location**: `/server/node-app/src/tests/external-credential-sync.test.ts`

**New Tests**:
1. ✅ `should skip processing if max_hr exceeds MAX_HOUR_LEN`
2. ✅ `should skip processing if hours are below MIN_HOUR_LEN`

**Test Results**: All 6 tests passing

### 4. Documentation
**New File**: `/docs/COURSE_HOUR_VALIDATION.md`

Comprehensive documentation including:
- Configuration guide
- Validation logic explanation
- Testing instructions
- Troubleshooting guide
- Best practices

## How It Works

### Validation Flow

```
External Credential Received
         ↓
Extract max_hr or min_hr
         ↓
    Check Hours
         ↓
    ┌─────┴─────┐
    ↓           ↓
Hours > 30?  Hours < 7.5?
    ↓           ↓
  REJECT      REJECT
    ↓           ↓
    └─────┬─────┘
          ↓
    7.5 ≤ Hours ≤ 30
          ↓
      ACCEPTED
```

### Example Scenarios

| Course Hours | Result | Reason |
|-------------|--------|--------|
| 5 hours | ❌ REJECTED | Below minimum (7.5) |
| 10 hours | ✅ ACCEPTED | Within range |
| 25 hours | ✅ ACCEPTED | Within range |
| 50 hours | ❌ REJECTED | Above maximum (30) |

## Configuration

### Required Steps

1. **Update `.env` file**:
   ```bash
   MIN_HOUR_LEN=7.5
   MAX_HOUR_LEN=30
   ```

2. **Restart the service**:
   ```bash
   cd server/node-app
   npm run dev
   ```

### Default Values

If environment variables are not set:
- `MIN_HOUR_LEN` defaults to **7.5 hours**
- `MAX_HOUR_LEN` defaults to **30 hours** (or `POSSIBLE_MAX_HOUR` if set)

## Testing

### Run Tests
```bash
cd server/node-app
npm test -- external-credential-sync.test.ts
```

### Expected Output
```
PASS  src/tests/external-credential-sync.test.ts
  External Credential Sync Service
    processCredential
      ✓ should process and create a new credential successfully
      ✓ should resolve learner by alternate email
      ✓ should create unclaimed credential if learner not found
      ✓ should skip processing if credential already exists
      ✓ should skip processing if max_hr exceeds MAX_HOUR_LEN
      ✓ should skip processing if hours are below MIN_HOUR_LEN

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

## Backward Compatibility

✅ **Fully backward compatible**:
- Old `POSSIBLE_MAX_HOUR` environment variable still works
- New variables take precedence when set
- Default values ensure safe operation

## Impact on Sync Operations

When credentials are rejected:
- **credentials_processed**: ✅ Incremented
- **credentials_skipped**: ✅ Incremented
- **credentials_created**: ❌ Not incremented
- **errors**: Not logged (treated as expected skip)

## Logging

### Debug Logs
```
Skipping credential with hours=50 > MAX_HOUR_LEN=30
{
  credential_title: "Web Development Course",
  max_hr: 50,
  min_hr: 40
}
```

### Error Messages
- **Too long**: `"Course hours (50) exceed maximum allowed (30)"`
- **Too short**: `"Course hours (5) below minimum required (7.5)"`

## Files Modified

1. ✏️ `/server/node-app/.env.example`
2. ✏️ `/server/node-app/src/modules/external-credential-sync/service.ts`
3. ✏️ `/server/node-app/src/tests/external-credential-sync.test.ts`
4. ➕ `/docs/COURSE_HOUR_VALIDATION.md` (new)

## Next Steps

1. **Update your `.env` file** with the new variables
2. **Restart your development server**
3. **Test with external credential sync** to verify filtering
4. **Monitor sync logs** for rejected credentials
5. **Adjust limits** if needed based on your requirements

## Support

For questions or issues:
- See full documentation: `/docs/COURSE_HOUR_VALIDATION.md`
- Review test file: `/server/node-app/src/tests/external-credential-sync.test.ts`
- Check service implementation: `/server/node-app/src/modules/external-credential-sync/service.ts`
