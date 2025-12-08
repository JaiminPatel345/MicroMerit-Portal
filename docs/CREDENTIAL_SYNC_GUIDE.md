# Batch Credential Synchronization System

## Overview

This system enables automated fetching of credentials from external training platforms (MSDE-approved) and automatically syncing them to user accounts.

## How It Works

```
Every 24 hours (configurable)
    ↓
Scheduler triggers sync
    ↓
Orchestrator fetches all active platforms
    ↓
Creates sync jobs for each platform
    ↓
Workers process jobs in parallel
    ↓
Fetch credentials from platform API
    ↓
Match credentials to users (by email/phone)
    ↓
Store in database
    ↓
Update sync logs
```

## Architecture Components

### 1. Database Models

- **ExternalPlatform**: Platform configuration and credentials
- **PlatformSyncLog**: Sync history and statistics
- **ExternalCredential**: Fetched credentials (staging table)

### 2. Core Services

- **PlatformAdapter**: Base class for platform integrations
- **SyncOrchestrator**: Manages sync jobs and queue
- **SyncScheduler**: Cron-based scheduler
- **Platform Adapters**: NSQF, SWAYAM, etc.

### 3. Job Queue (BullMQ)

- **Redis-based**: Reliable job processing
- **Concurrency**: Process 5 platforms simultaneously
- **Retry Logic**: 3 attempts with exponential backoff
- **Rate Limiting**: 10 jobs per minute

##Installation

### Prerequisites

1. **Redis** (for job queue)
```bash
# Ubuntu
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# macOS
brew install redis
brew services start redis

# Verify
redis-cli ping  # Should return PONG
```

### Install Dependencies

```bash
cd server/node-app
yarn add bullmq ioredis node-cron
yarn add -D @types/node-cron
```

### Run Database Migration

```bash
npx prisma migrate dev --name add_external_platform_sync
npx prisma generate
```

### Environment Variables

Add to `.env`:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Sync Configuration
SYNC_AUTO_START=true
SYNC_CRON_EXPRESSION="0 2 * * *"  # Every day at 2 AM
SYNC_CONCURRENCY=5  # Process 5 platforms at once

# Platform API Credentials
NSQF_API_BASE_URL=https://api.nsdc.gov.in
NSQF_API_KEY=your_api_key
NSQF_API_SECRET=your_api_secret

# Add more platforms as needed
```

## Configuration

### Adding a New Platform

**Via API** (recommended):

```bash
curl -X POST http://localhost:3000/api/admin/platforms \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "nsqf",
    "display_name": "NSQF Portal",
    "platform_type": "government",
    "api_base_url": "https://api.nsdc.gov.in",
    "api_version": "v1",
    "auth_type": "oauth",
    "credentials": {
      "apiKey": "your_key",
      "apiSecret": "your_secret"
    },
    "sync_frequency_hours": 24,
    "config": {
      "pageSize": 100,
      "rateLimit": 1000
    }
  }'
```

**Via Database**:

```sql
INSERT INTO "ExternalPlatform" (
  name,
  display_name,
  platform_type,
  api_base_url,
  auth_type,
  credentials_encrypted,
  sync_frequency_hours,
  created_at,
  updated_at
) VALUES (
  'nsqf',
  'NSQF Portal',
  'government',
  'https://api.nsdc.gov.in',
  'oauth',
  '{"apiKey":"xxx","apiSecret":"yyy"}',  -- TODO: Encrypt this
  24,
  NOW(),
  NOW()
);
```

### Sync Schedule Configuration

**Cron Expression Examples**:

```bash
# Every 24 hours at 2 AM
SYNC_CRON_EXPRESSION="0 2 * * *"

# Every 12 hours (2 AM and 2 PM)
SYNC_CRON_EXPRESSION="0 2,14 * * *"

# Every 6 hours
SYNC_CRON_EXPRESSION="0 */6 * * *"

# Every hour (testing)
SYNC_CRON_EXPRESSION="0 * * * *"
```

## Usage

### Start the System

The scheduler starts automatically if `SYNC_AUTO_START=true` in your `.env`

```bash
cd server/node-app
yarn dev
```

You should see:
```
[INFO] Sync scheduler started
[INFO] Sync orchestrator initialized
```

### Manual Sync Trigger

**Trigger all platforms**:
```bash
curl -X POST http://localhost:3000/api/admin/sync/trigger \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Trigger specific platform**:
```bash
curl -X POST http://localhost:3000/api/admin/sync/trigger/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### View Sync Logs

```bash
curl http://localhost:3000/api/admin/sync/logs \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### View Statistics

```bash
curl http://localhost:3000/api/admin/sync/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### View External Credentials

```bash
# Pending (unmatched) credentials
curl "http://localhost:3000/api/admin/sync/external-credentials?status=pending" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Matched credentials
curl "http://localhost:3000/api/admin/sync/external-credentials?status=matched" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Scheduler Control

**Start scheduler**:
```bash
curl -X POST http://localhost:3000/api/admin/sync/scheduler/start \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cronExpression": "0 2 * * *"}'
```

**Stop scheduler**:
```bash
curl -X POST http://localhost:3000/api/admin/sync/scheduler/stop \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Check status**:
```bash
curl http://localhost:3000/api/admin/sync/scheduler/status \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Adding New Platform Adapters

### 1. Create Adapter File

Create `src/modules/credential-sync/adapters/swayam-adapter.ts`:

```typescript
import {
  PlatformAdapter,
  ExternalCredentialData,
  PlatformSyncResult,
} from './platform-adapter';

export class SwayamAdapter extends PlatformAdapter {
  constructor(config: { apiKey: string }) {
    super('SWAYAM', 'https://api.swayam.gov.in', 'v1');
    // Store credentials
  }

  async authenticate(credentials: any): Promise<void> {
    // Implement SWAYAM authentication
  }

  async fetchAllCredentials(): Promise<PlatformSyncResult> {
    // Implement SWAYAM credential fetching
  }

  protected parseCredentials(rawData: any[]): ExternalCredentialData[] {
    // Parse SWAYAM data format
    return rawData.map(item => ({
      external_id: item.id,
      learner_identifier: item.email,
      identifier_type: 'email',
      certificate_title: item.course_name,
      // ... map other fields
    }));
  }
}
```

### 2. Register in Orchestrator

Update `sync-orchestrator.service.ts`:

```typescript
private getPlatformAdapter(platformName: string, config: any): PlatformAdapter {
  switch (platformName.toLowerCase()) {
    case 'nsqf':
    case 'nsdc':
      return new NSQFAdapter(config);
    case 'swayam':
      return new SwayamAdapter(config);  // Add this
    default:
      throw new Error(`No adapter found for platform: ${platformName}`);
  }
}
```

## Monitoring

### Key Metrics to Monitor

1. **Sync Success Rate**: `GET /api/admin/sync/stats`
2. **Pending Credentials**: Credentials waiting to be matched
3. **Failed Syncs**: Check logs for errors
4. **Queue Status**: Monitor Redis queue

### Logs

All sync operations are logged to:
- Console (development)
- Log files (production)

Filter logs:
```bash
# View sync logs
grep "platform-sync" logs/app.log

# View errors
grep "ERROR" logs/app.log | grep "sync"
```

### Alerts

Set up alerts for:
- ❌ 3 consecutive failed syncs for a platform
- ⚠️ Sync duration > 10 minutes
- ⚠️ High number of unmatched credentials (> 20%)

## Troubleshooting

### Redis Connection Error

```bash
# Check if Redis is running
redis-cli ping

# Start Redis
sudo systemctl start redis  # Ubuntu
brew services start redis   # macOS
```

### Platform API Authentication Failed

1. Check API credentials in database
2. Verify credentials are not expired
3. Check platform API status
4. Review platform API documentation

### No Credentials Fetched

1. Check platform has issued credentials
2. Verify API endpoints are correct
3. Check rate limits
4. Review adapter implementation

### Credentials Not Matching Users

1. Verify email/phone format consistency
2. Check identifier types
3. Review matching logic in `matchLearner()`

### Sync Taking Too Long

1. Reduce `SYNC_CONCURRENCY`
2. Implement pagination limits
3. Add platform-specific rate limiting
4. Consider off-peak scheduling

## Performance Optimization

### Batch Processing

Credentials are processed in batches of 100 to avoid overwhelming the database.

### Indexing

Ensure these indexes exist (already in schema):
- `learner_identifier + identifier_type`
- `platform_id + external_id`
- `status`

### Concurrency Tuning

```bash
# Low load: Process more platforms
SYNC_CONCURRENCY=10

# High load: Reduce concurrency
SYNC_CONCURRENCY=3
```

### Rate Limiting

Configure per-platform limits:

```json
{
  "config": {
    "rateLimit": 1000,  // requests per hour
    "pageSize": 50,     // smaller pages for busy APIs
    "delayBetweenPages": 1000  // 1 second delay
  }
}
```

## Security Considerations

### API Credentials Encryption

**TODO**: Implement encryption for `credentials_encrypted` field

```typescript
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}
```

### Access Control

- All admin endpoints require admin authentication
- Platform credentials never exposed in API responses
- Audit log all platform management operations

## Testing

### Unit Tests

```bash
# Test platform adapter
yarn test platform-adapter.spec.ts

# Test sync orchestrator
yarn test sync-orchestrator.spec.ts
```

### Integration Test

```bash
# Test with mock platform
yarn test sync-integration.spec.ts
```

### Manual Testing

1. Add test platform with mock API
2. Trigger manual sync
3. Verify credentials in database
4. Check sync logs

## FAQ

**Q: How does user matching work?**
A: Credentials are matched to users by email or phone. If no match found, credential is stored as "pending" and can be claimed later.

**Q: What happens if sync fails?**
A: The job is retried 3 times with exponential backoff. After 3 failures, it's marked as failed and admin is alerted.

**Q: Can I sync specific time ranges?**
A: Yes, modify the adapter to accept date parameters and filter API results.

**Q: How to handle duplicate credentials?**
A: The system uses `platform_id + external_id` as unique constraint. Duplicates are updated, not recreated.

**Q: Can I sync only new credentials?**
A: Yes implement "last_sync_at" tracking in adapter to fetch only new credentials since last sync.

## Next Steps

1. ✅ Set up Redis
2. ✅ Run database migration
3. ✅ Configure platforms
4. ✅ Test with one platform
5. ⏳ Add more platform adapters
6. ⏳ Implement credential encryption
7. ⏳ Set up monitoring/alerts

## Contact

For questions or issues:
- Check logs first
- Review this documentation
- Contact: support@micromerit.com
