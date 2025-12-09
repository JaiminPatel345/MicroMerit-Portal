# Blockchain Queue Service

This service uses BullMQ to handle blockchain writes asynchronously and reliably.

## Overview

When credentials are issued or synced from external providers, blockchain writes are queued instead of executed synchronously. This provides:

- **Better performance**: API responses are immediate, not blocked by blockchain writes
- **Reliability**: Failed blockchain writes are automatically retried (up to 3 times)
- **Scalability**: Handles bulk credential creation without overwhelming the blockchain service
- **Monitoring**: Track job status and progress

## Architecture

```
Credential Issuance/Sync
         ↓
Queue Blockchain Write Job (BullMQ)
         ↓
Redis (Job Queue)
         ↓
BullMQ Worker (processes jobs)
         ↓
Blockchain Service
         ↓
Update Credential in DB
```

## Components

### 1. `blockchainQueue.ts`
- Defines the BullMQ queue and worker
- Handles job processing and retries
- Updates credential status in database

### 2. `blockchainClient.ts`
- `writeToBlockchainQueued()` - Queue a blockchain write (recommended)
- `writeToBlockchain()` - Synchronous write (deprecated, kept for backward compatibility)
- `getBlockchainWriteStatus()` - Check job status

### 3. Services
- `CredentialIssuanceService` - Uses queue for new credentials
- `ExternalCredentialSyncService` - Uses queue for synced credentials

## Setup

### Prerequisites

1. **Redis** must be running:
```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or install locally (Ubuntu/Debian)
sudo apt-get install redis-server
sudo systemctl start redis

# Or install locally (macOS)
brew install redis
brew services start redis
```

2. **Environment Variables** in `.env`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Configuration

### Queue Options

In `blockchainQueue.ts`:

```typescript
defaultJobOptions: {
  attempts: 3,              // Retry up to 3 times
  backoff: {
    type: 'exponential',
    delay: 5000,            // Start with 5s, then 10s, 20s
  },
  removeOnComplete: {
    age: 86400,             // Keep completed jobs for 24 hours
    count: 1000,            // Keep max 1000 completed jobs
  },
}
```

### Worker Options

```typescript
{
  concurrency: 5,           // Process 5 jobs concurrently
  limiter: {
    max: 10,                // Maximum 10 jobs
    duration: 1000,         // per second
  },
}
```

## Usage

### Queueing a Blockchain Write

```typescript
import { writeToBlockchainQueued } from '../../services/blockchainClient';

// Queue the write
const jobId = await writeToBlockchainQueued(
  credential_id,
  data_hash,
  ipfs_cid
);

// Job will be processed asynchronously
// Credential will be updated when complete
```

### Checking Job Status

```typescript
import { getBlockchainWriteStatus } from '../../services/blockchainClient';

const status = await getBlockchainWriteStatus(credential_id);
// Returns: { status: 'completed', result: {...} }
//       or { status: 'failed', error: '...' }
//       or { status: 'waiting' | 'active' | 'delayed' }
```

### Credential Status

Credentials have a `blockchain_status` field in metadata:
- `pending` - Job queued or processing
- `confirmed` - Successfully written to blockchain
- `failed` - Failed after all retries

## Monitoring

### Queue Events

The queue emits events that are logged:

```typescript
queueEvents.on('completed', ({ jobId }) => {
  logger.info('Blockchain job completed', { jobId });
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error('Blockchain job failed', { jobId, failedReason });
});
```

### Check Queue Stats

You can add a monitoring endpoint:

```typescript
import { blockchainQueue } from '../../services/blockchainQueue';

// Get queue counts
const counts = await blockchainQueue.getJobCounts();
// Returns: { waiting: 0, active: 2, completed: 100, failed: 3 }

// Get jobs
const waiting = await blockchainQueue.getWaiting();
const active = await blockchainQueue.getActive();
const failed = await blockchainQueue.getFailed();
```

## Error Handling

### Automatic Retries

Failed jobs are automatically retried:
1. First attempt fails → wait 5 seconds → retry
2. Second attempt fails → wait 10 seconds → retry
3. Third attempt fails → mark as failed

### Failed Job Handling

When a job fails after all retries:
1. Credential `blockchain_status` is set to `failed`
2. Error message is stored in `metadata.blockchain_error`
3. Job is kept in Redis for 7 days for debugging

## Performance

### Bulk Operations

When syncing many external credentials:
- Jobs are queued instantly (no blocking)
- Worker processes up to 5 jobs concurrently
- Rate limited to 10 jobs/second

### Memory Usage

- Completed jobs: kept for 24 hours or max 1000 jobs
- Failed jobs: kept for 7 days
- Adjust in `blockchainQueue.ts` if needed

## Testing

### With Mock Mode

```env
BLOCKCHAIN_MOCK_ENABLED=true
```
- Blockchain writes are skipped
- Useful for testing without blockchain service

### Integration Tests

```typescript
// Mock the queue
jest.mock('../../services/blockchainClient', () => ({
  writeToBlockchainQueued: jest.fn().mockResolvedValue('job-id'),
}));
```

## Graceful Shutdown

The server gracefully shuts down the queue:

```typescript
// In server.ts
process.on('SIGTERM', async () => {
  await shutdownBlockchainQueue();
  // ... other cleanup
});
```

This ensures:
- Active jobs finish processing
- Queue connections are closed
- No jobs are lost

## Troubleshooting

### Redis Connection Errors

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution**: Ensure Redis is running

### Jobs Not Processing

1. Check worker is running (started with server)
2. Check Redis connectivity
3. Check worker logs for errors

### Jobs Stuck in "Active"

This can happen if worker crashes. To fix:
```typescript
// Clean stalled jobs (add to startup)
await blockchainQueue.clean(0, 0, 'active');
```

## Migration from Old System

The old `processBlockchainAsync` methods are deprecated but still work:
- They now call `writeToBlockchainQueued` internally
- No breaking changes for existing code
- Gradual migration recommended

## Future Enhancements

Potential improvements:
- [ ] BullMQ Dashboard UI for monitoring
- [ ] Priority queue for urgent credentials
- [ ] Batch processing for multiple credentials
- [ ] Dead letter queue for permanently failed jobs
- [ ] Metrics and alerting integration
