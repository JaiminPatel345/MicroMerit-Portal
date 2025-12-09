# Course Hour Validation

## Overview

The external credential sync service now validates that all incoming credentials have course hours within an acceptable range. Credentials with course hours outside this range will be **rejected** and **not added** to the platform.

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Course Hour Validation - credentials outside this range will be rejected
MIN_HOUR_LEN=7.5    # Minimum course hours (default: 7.5)
MAX_HOUR_LEN=30     # Maximum course hours (default: 30)
```

### Default Values

- **Minimum**: `7.5` hours
- **Maximum**: `30` hours
- **Deprecated**: `POSSIBLE_MAX_HOUR` (still supported for backward compatibility, defaults to 1000)

If `MAX_HOUR_LEN` is not set, the system will fall back to `POSSIBLE_MAX_HOUR` for backward compatibility.

## How It Works

### Validation Logic

When processing external credentials, the system:

1. **Extracts course hours** from the credential data:
   - First checks `max_hr` (maximum hours)
   - If `max_hr` is not available, checks `min_hr` (minimum hours)

2. **Validates against limits**:
   - If course hours **exceed** `MAX_HOUR_LEN` → credential is **REJECTED**
   - If course hours are **below** `MIN_HOUR_LEN` → credential is **REJECTED**
   - If course hours are within range → credential is **PROCESSED**

3. **Logs rejection reason**:
   - Debug logs include credential title and hour values
   - Error message clearly states the validation failure

### Code Location

The validation is implemented in:
- **Service**: `/server/node-app/src/modules/external-credential-sync/service.ts`
- **Method**: `processCredential()`

### Example Validation

```typescript
// Credential with 25 hours - ACCEPTED (7.5 <= 25 <= 30)
{ max_hr: 25, min_hr: 20 } ✅

// Credential with 50 hours - REJECTED (50 > 30)
{ max_hr: 50, min_hr: 40 } ❌ "Course hours (50) exceed maximum allowed (30)"

// Credential with 5 hours - REJECTED (5 < 7.5)
{ max_hr: 5, min_hr: 5 } ❌ "Course hours (5) below minimum required (7.5)"
```

## Testing

### Unit Tests

Tests are located in `/server/node-app/src/tests/external-credential-sync.test.ts`:

1. **Test: Max hour validation**
   - Verifies credentials exceeding `MAX_HOUR_LEN` are rejected
   - Checks appropriate error message is thrown

2. **Test: Min hour validation**
   - Verifies credentials below `MIN_HOUR_LEN` are rejected
   - Checks appropriate error message is thrown

### Running Tests

```bash
cd server/node-app
npm test -- external-credential-sync.test.ts
```

## Impact on Sync Results

When a credential is rejected due to hour validation:

- **credentials_processed**: Incremented
- **credentials_skipped**: Incremented
- **credentials_created**: Not incremented
- **errors**: Not added (treated as expected skip, not an error)

The sync job will log:
```
[providerId] Skipped duplicate, { error: "Course hours (X) exceed maximum allowed (Y)" }
```

## Migration Guide

### Updating Existing Setup

1. **Add new environment variables** to your `.env` file:
   ```bash
   MIN_HOUR_LEN=7.5
   MAX_HOUR_LEN=30
   ```

2. **Optional**: Remove `POSSIBLE_MAX_HOUR` if you want to use the new system exclusively
   - If kept, it serves as a fallback for `MAX_HOUR_LEN`

3. **Restart the service** for changes to take effect

### Backward Compatibility

The system maintains backward compatibility:
- Old env var `POSSIBLE_MAX_HOUR` still works
- New env vars take precedence when set
- Default values ensure safe operation if env vars are missing

## Provider-Specific Notes

### NSDC Connector
- Uses `training_hours.max` and `training_hours.min` from API response
- Both values are validated

### Udemy Connector
- Typically provides course duration in hours
- Validated against the same limits

### Jaimin Connector
- Uses `duration_hours` field
- Single value used for both `max_hr` and `min_hr`

### Custom Connectors
Ensure your connector's `normalize()` method includes:
```typescript
max_hr: payload.course_hours || payload.duration_hours,
min_hr: payload.min_hours || payload.course_hours,
```

## Troubleshooting

### Credentials Being Rejected Unexpectedly

1. **Check credential hour values**:
   ```sql
   SELECT credential_id, certificate_title, max_hr, min_hr 
   FROM "Credential" 
   WHERE max_hr IS NOT NULL
   ORDER BY max_hr DESC;
   ```

2. **Review validation limits**:
   ```bash
   echo "MIN: $MIN_HOUR_LEN, MAX: $MAX_HOUR_LEN"
   ```

3. **Check sync logs** for rejection messages:
   ```bash
   grep "Skipping credential with hours" logs/app.log
   ```

### Adjusting Limits

If you need to adjust the validation range:

1. Update `.env`:
   ```bash
   MIN_HOUR_LEN=5     # Lower minimum to accept shorter courses
   MAX_HOUR_LEN=100   # Raise maximum for longer programs
   ```

2. Restart the service

3. Re-run sync for affected providers:
   ```bash
   curl -X POST http://localhost:3000/admin/external-sync/force-sync
   ```

## Best Practices

1. **Set realistic limits** based on your platform's requirements
2. **Monitor rejection rates** to ensure limits aren't too restrictive
3. **Document any custom limits** for your team
4. **Test with sample data** before deploying to production
5. **Keep `POSSIBLE_MAX_HOUR`** as a safety net (e.g., 1000 hours)

## See Also

- [External Credential Fields](./EXTERNAL_CREDENTIAL_FIELDS.md)
- [External Sync Service](../server/node-app/src/modules/external-credential-sync/)
- [Connector Implementation Guide](../server/node-app/src/modules/external-credential-sync/connectors/)
