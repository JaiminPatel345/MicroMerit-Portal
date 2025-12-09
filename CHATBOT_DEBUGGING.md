# Debugging Guide for Employer Chatbot

## Issue: Getting "I am unable to process your question at this time" error

### Step-by-Step Debugging:

## 1. Check if AI Service is Running

```bash
# Check if Python AI service is running on port 8000
curl http://localhost:8000/health

# Expected response:
# {"status":"ok","model":"llama-3.3-70b-versatile","mock":false,"key_loaded":true}
```

**If service is not running:**
```bash
cd server/ai_groq_service
python -m uvicorn app.main:app --reload --port 8000
```

## 2. Check Node.js Backend Logs

Watch the Node.js console for these logs:
```
[AI Service] Chat request for learner@example.com
[AI Service] Question: Does this candidate have Docker skills?
[AI Service] Credentials count: 5
```

**Look for error messages like:**
- `ECONNREFUSED` - AI service is not running
- `404` - Endpoint not found
- `500` - AI service error

## 3. Check Python AI Service Logs

Watch the Python console for:
```
INFO: Built skills context with 5 credentials
INFO: Calling Groq service for employer chat...
INFO: Groq response received: {"answer":"Yes, the candidate...
INFO: Successfully parsed JSON response
```

**Common errors:**
- `No GROQ_API_KEY found` - Environment variable not set
- `Groq API error` - API key invalid or rate limited
- `JSON decode error` - Response not in valid JSON format

## 4. Test the AI Service Directly

```bash
# Test employer chat endpoint directly
curl -X POST http://localhost:8000/employer-chat \
  -H "Content-Type: application/json" \
  -d '{
    "learner_email": "test@example.com",
    "question": "What skills does this candidate have?",
    "credentials": [
      {
        "certificate_title": "Python Development",
        "issuer_name": "TestUniversity",
        "metadata": {
          "ai_extracted": {
            "skills": [
              {"name": "Python", "category": "Programming", "confidence": 0.95}
            ],
            "keywords": ["Python", "Programming", "Development"]
          }
        }
      }
    ]
  }'
```

**Expected**: JSON response with answer, skills, certificates, and confidence

## 5. Check Environment Variables

**AI Service (.env in ai_groq_service/):**
```bash
cd server/ai_groq_service
cat .env | grep -E "GROQ_API_KEY|MOCK_MODE"
```

Should show:
```
GROQ_API_KEY=gsk_...
MOCK_MODE=false
```

**Node.js Service (.env in node-app/):**
```bash
cd server/node-app
cat .env | grep AI_SERVICE_URL
```

Should show:
```
AI_SERVICE_URL=http://127.0.0.1:8000
```

## 6. Common Fixes

### Fix 1: Restart Services
```bash
# Kill all services
pkill -f uvicorn
pkill -f "npm run dev"

# Restart AI service
cd server/ai_groq_service
python -m uvicorn app.main:app --reload --port 8000 &

# Restart Node.js
cd server/node-app
npm run dev &
```

### Fix 2: Check Groq API Key
```bash
cd server/ai_groq_service
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
key = os.getenv('GROQ_API_KEY')
print(f'API Key loaded: {bool(key)}')
print(f'First 10 chars: {key[:10] if key else None}')
"
```

### Fix 3: Test Groq Connection
```bash
cd server/ai_groq_service
python -c "
from app.services.groq_service import groq_service
messages = [
    {'role': 'system', 'content': 'You are helpful.'},
    {'role': 'user', 'content': 'Say hello in JSON format with a greeting field.'}
]
response = groq_service.chat_completion(messages, use_json_mode=True)
print(response)
"
```

### Fix 4: Check Learner Has Credentials
Make sure the learner you're testing with actually has credentials in the database:
```bash
cd server/node-app
npx prisma studio
# Browse to Credential table and check for learner_email
```

## 7. Enable Detailed Logging

**In Python (app/main.py):**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

**In Node.js (add to employer/service.ts):**
```typescript
console.log('Credentials being sent:', JSON.stringify(credentialsData, null, 2));
```

## 8. Check Network Connectivity

```bash
# From node-app, can it reach AI service?
curl -v http://127.0.0.1:8000/health

# Check if ports are listening
netstat -tulpn | grep -E "8000|3001"
```

## 9. Browser Console Debugging

Open browser DevTools (F12) and check:
1. **Network tab**: Look for `/employer/chat` request
2. **Check response**: Should be 200 OK with JSON data
3. **Console tab**: Look for any JavaScript errors

**Good response example:**
```json
{
  "success": true,
  "data": {
    "answer": "Yes, the candidate has...",
    "relevant_skills": [...],
    "certificates_referenced": [...],
    "confidence": 0.92
  }
}
```

**Error response example:**
```json
{
  "success": false,
  "message": "Chat Failed",
  "error": "..."
}
```

## 10. Quick Test Without Frontend

Use this script to test the full flow:

```bash
# Get auth token first (replace with your employer credentials)
TOKEN=$(curl -X POST http://localhost:3001/api/auth/employer/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employer@test.com","password":"password"}' \
  | jq -r '.data.tokens.accessToken')

# Test chat endpoint
curl -X POST http://localhost:3001/api/employer/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "learner_email": "learner@test.com",
    "question": "What are the key skills of this candidate?"
  }' | jq
```

## Still Not Working?

1. Check the console logs in both services for the exact error
2. Verify the learner exists and has issued credentials
3. Try with MOCK_MODE=true to test without API calls
4. Check if there are any firewall/network issues
5. Verify all dependencies are installed (npm install, pip install)

## Success Indicators

You'll know it's working when you see:
- ✅ Node.js logs: `[AI Service] Chat response received successfully`
- ✅ Python logs: `Successfully parsed JSON response`
- ✅ Browser: Chat message appears with AI answer
- ✅ No 500 errors in Network tab
