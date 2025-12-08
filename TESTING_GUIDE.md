# External Credential Sync - Complete Testing Guide

## 🎯 Overview
This system automatically imports credentials from external sources (NSDC, DigiLocker) using webhooks and polling, verifies signatures, matches them to learners, and displays them in the learner's wallet.

---

## ⚙️ Quick Setup

Run the automated setup script:
```bash
cd /home/jaimin/My/Dev/Projects/sih/MicroMerit-Portal
./test_flow.sh
```

Or follow manual steps below:

---

## 📋 Manual Setup Steps

### 1. Database Migration
```bash
cd server/node-app
npx prisma migrate dev --name external_credential_sync
npx prisma generate
```

### 2. Reset & Seed Database
```bash
npx tsx prisma/reset_db.ts
npx tsx prisma/seed_complete.ts
```

This creates:
- **Admin**: `admin@micromerit.com` / `admin123`
- **Learners**: 
  - `learner1@example.com` / `password123` → will receive "Advanced Web Development"
  - `learner2@example.com` / `password123` → will receive "Data Science Fundamentals"
  - `alice.j@example.com` / `password123` → will receive "Mobile App Development"
  - `learner3@example.com` / `password123` → will receive "Cybersecurity Basics"
  - `newlearner@example.com` / `password123` → will receive "UI/UX Design"

---

## 🚀 Start Services (**4 Terminals Required**)

### Terminal 1: Redis
```bash
docker run --rm --name redis -p 6379:6379 redis:alpine
```

### Terminal 2: Dummy API-Setu Server
```bash
cd server/dummy-apisetu
npm install  # First time only
npm run dev
```
**Runs on**: http://localhost:4000

### Terminal 3: Worker (Processes Credentials)
```bash
cd server/node-app
npx tsx src/workers/credential-worker.ts
```

### Terminal 4: Main Application
```bash
cd /home/jaimin/My/Dev/Projects/sih/MicroMerit-Portal
./start_all.sh
```

**Services:**
- Main App: http://localhost:5173
- Admin: http://localhost:5174
- Backend: http://localhost:3000
- Dummy Server: http://localhost:4000

---

## 🧪 Complete Testing Flow

### Method 1: Using Admin Panel (Recommended)

1. **Login to Admin Panel**: http://localhost:5174
   - Email: `admin@micromerit.com`
   - Password: `admin123`

2. **Navigate to Credential Sync**
   - Click "Credential Sync" in the header navigation

3. **Trigger Test Webhook**
   - Go to the **"Test"** tab
   - Click **"Trigger Test Webhook"** button
   - Wait 2 seconds

4. **Verify Import**
   - Go to the **"Credentials"** tab
   - You should see the imported credential with:
     - ✓ Signature Verified
     - Status: `verified`
     - Confidence: `100%`
     - Matched learner email

5. **Check DLQ** (if something fails)
   - Go to the **"DLQ"** tab
   - See failed jobs and retry them

---

### Method 2: Using Learner Portal

1. **Login as Learner**: http://localhost:5173
   - Email: `learner1@example.com`
   - Password: `password123`

2. **Navigate to Wallet**
   - Click "Wallet" in navigation

3. **Verify Credential Appears**
   - You should see "Advanced Web Development" credential
   - Badge shows: `external` (to indicate it's from external source)
   - Credential details show provider info

---

### Method 3: Using cURL

```bash
# Trigger webhook
curl -X POST http://localhost:4000/admin/push-webhook \
  -H "Content-Type: application/json" \
  -d '{"provider":"provider-a"}'

# Check result
curl http://localhost:3000/admin/sync/external-credentials \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📊 What Happens Behind the Scenes

1. **Webhook Received** (Admin clicks "Trigger Test Webhook")
   - Dummy server sends a JWS-signed credential to → `POST /webhooks/nsdc`
   
2. **Quick Acknowledgement**
   - Webhook controller responds immediately with 200 OK
   - Job is enqueued to BullMQ

3. **Worker Processes** (Terminal 3)
   - Fetches credential from queue
   - Verifies JWS signature using JWKS from dummy server
   - Normalizes payload to canonical format
   - Encrypts raw payload using KMS
   - Matches learner by email (100% confidence)
   - Stores in `ExternalCredential` table with status `verified`

4. **Learner Views**
   - Learner logs in
   - `/learner/credentials` API now includes both:
     - Regular credentials (issued directly)
     - External credentials (imported and verified)
   - Both appear in the Wallet page

---

## 🎨 Credential Matching Logic

The system tries matching in this order:

1. **Exact Primary Email** (confidence: 1.0)
   - learner1@example.com → matches John Doe

2. **Other Emails** (confidence: 0.95)
   - other.email@example.com → matches Jane Smith (via other_emails array)

3. **Phone Number** (confidence: 0.9)
   - +919876543210 → matches Alice Johnson

4. **Fuzzy Name + DOB** (confidence: variable)
   - Uses Levenshtein distance for name matching
   - Requires DOB match within ±1 day

---

## 📁 Dummy Server Credentials

The dummy server has 3 providers with seed data:

### Provider A (webhook-enabled, JWS-signed)
- `cred-a-001`: John Doe, learner1@example.com → Advanced Web Development
- `cred-a-002`: Jane Smith, learner2@example.com → Data Science Fundamentals
- `cred-a-003`: Bob Wilson, other.email@example.com → Cloud Computing Essentials

### Provider B (poll-only)
- `cred-b-001`: Alice Johnson, +919876543210 → Mobile App Development
- `cred-b-002`: Charlie Brown, newlearner@example.com → UI/UX Design

### Provider C (PDF/DSC signatures)
- `cred-c-001`: Diana Prince, learner3@example.com → Cybersecurity Basics

---

## 🔍 Verification Steps

### 1. Check Worker Logs (Terminal 3)
```
Processing job 1: nsdc credential
✓ Credential processed: <uuid>
Job 1 completed
```

### 2. Check Database
```bash
cd server/node-app
npx prisma studio
```
Navigate to:
- `ExternalCredential` table → See imported credentials
- `ProcessedJob` table → See idempotency keys

### 3. Check Admin Dashboard
- Go to **Credential Sync** → **Overview** tab
- See stats: Total External, Verified, Pending, etc.
- Check individual issuers' sync status

---

## 🐛 Troubleshooting

### Webhook not working?
```bash
# Check if worker is running (Terminal 3)
# Check worker logs for errors

# Verify Redis is running
docker ps | grep redis

# Check if dummy server is running
curl http://localhost:4000/health
```

### Credential not appearing in learner wallet?
```bash
# Check if credential was created
curl http://localhost:3000/admin/sync/external-credentials \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Check matching confidence
# If < 0.85 (threshold), it won't be verified automatically

# Check DLQ for failures
# Admin Panel → Credential Sync → DLQ tab
```

### Worker not processing?
```bash
# Restart worker (Terminal 3)
# Ctrl+C, then:
cd server/node-app
npx tsx src/workers/credential-worker.ts
```

---

## 🎉 Success Criteria

✅ Admin can trigger webhook from Test tab  
✅ Credential appears in Admin → Credentials tab  
✅ Status shows `verified`  
✅ Signature shows ✓  
✅ Learner can login and see credential in Wallet  
✅ Credential has `external` badge  
✅ No items in DLQ  

---

## 📝 Notes

- **Feature Flag**: Set `EXTERNAL_SYNC_ENABLED=true` in `.env`
- **KMS**: Uses dev mock (AES-256-GCM) for encryption
- **Threshold**: Match confidence ≥ 0.85 for auto-verification
- **Idempotency**: Prevents duplicate processing of same credential
- **Audit Trail**: Raw signed payloads are encrypted and stored

Enjoy testing! 🚀
