# System Architecture - AI Integration

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Main App (React)              Admin App (React)                │
│  ├── Roadmap (Dynamic)         ├── Dashboard (Dynamic)          │
│  ├── Skill Profile (Dynamic)   ├── Issuers Management           │
│  ├── Wallet                    └── Analytics                    │
│  └── Dashboard                                                   │
│                                                                  │
└───────────────────┬──────────────────────────┬──────────────────┘
                    │                          │
                    │ HTTP/REST                │ HTTP/REST
                    │                          │
┌───────────────────▼──────────────────────────▼──────────────────┐
│                     Node.js API Layer (Express)                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Authentication Middleware                                        │
│  ├── Learner Auth                                                │
│  ├── Issuer Auth                                                 │
│  └── Admin Auth                                                  │
│                                                                   │
│  API Modules                                                      │
│  ├── /auth/*           - Authentication & Authorization          │
│  ├── /learner/*        - Learner resources                       │
│  ├── /issuer/*         - Issuer resources                        │
│  ├── /admin/*          - Admin operations                        │
│  ├── /credentials/*    - Certificate issuance & verification     │
│  ├── /pdf/*            - PDF generation                          │
│  └── /ai/*  ⭐NEW      - AI-powered features                     │
│      ├── POST /upload-certificate                                │
│      ├── GET  /recommendations                                   │
│      ├── POST /search-certificates                               │
│      └── POST /employer-chat                                     │
│                                                                   │
└─────┬────────────────────────────────────────┬──────────────────┘
      │                                        │
      │                                        │ HTTP Proxy
      │                                        │
      │                                   ┌────▼────────────────┐
      │                                   │  AI Groq Service    │
      │                                   │  (Python FastAPI)   │
      │                                   ├─────────────────────┤
      │                                   │  OCR Processing     │
      │                                   │  Skill Extraction   │
      │                                   │  LLM Integration    │
      │                                   │  (Groq API)         │
      │                                   └────┬────────────────┘
      │                                        │
      │                                        │
┌─────▼────────────────────────────────────────▼──────────────────┐
│                       Data Layer                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  PostgreSQL                          MongoDB                     │
│  ├── Users                           ├── Certificates (OCR)      │
│  ├── Issuers                         ├── Skills Data             │
│  ├── Credentials                     └── AI Metadata             │
│  ├── Profiles                                                    │
│  └── Audit Logs                                                  │
│                                                                   │
│  S3/Filebase (IPFS)                  Redis (Future)              │
│  ├── Certificate Files               └── Cache Layer             │
│  └── Images                                                      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. Certificate Upload & Processing Flow

```
┌─────────┐
│ Learner │
└────┬────┘
     │
     │ 1. Upload Certificate (PDF/Image)
     ▼
┌────────────────┐
│  Main App      │
│  (React)       │
└────┬───────────┘
     │
     │ 2. POST /ai/upload-certificate
     │    + File (FormData)
     │    + Auth Token
     ▼
┌─────────────────────┐
│  Node.js API        │
│  ai.controller      │
└────┬────────────────┘
     │
     │ 3. Validate & Forward
     │    Convert to FormData
     ▼
┌──────────────────────┐
│  AI Groq Service     │
│  main.py             │
│  /ocr-schema-ocr     │
└────┬─────────────────┘
     │
     │ 4. Process
     │    ├── Extract text (OCR)
     │    ├── Parse fields (LLM)
     │    └── Identify skills (LLM)
     ▼
┌──────────────┐
│  MongoDB     │
│  certificates│
└────┬─────────┘
     │
     │ 5. Store Certificate
     │    {
     │      certificate_id,
     │      learner_email,
     │      skills: [],
     │      ...
     │    }
     ▼
   Success
     │
     │ 6. Return structured data
     ▼
┌─────────────────────┐
│  Node.js API        │
│  Response to Client │
└────┬────────────────┘
     │
     │ 7. Display result
     ▼
┌────────────────┐
│  Main App      │
│  Success UI    │
└────────────────┘
```

---

### 2. Recommendations Generation Flow

```
┌─────────┐
│ Learner │
└────┬────┘
     │
     │ 1. Navigate to Roadmap
     ▼
┌────────────────┐
│  Main App      │
│  Roadmap.jsx   │
└────┬───────────┘
     │
     │ 2. useEffect → GET /ai/recommendations
     │    + Auth Token
     ▼
┌─────────────────────┐
│  Node.js API        │
│  ai.controller      │
└────┬────────────────┘
     │
     │ 3. Extract learner email from JWT
     │    Forward to AI service
     ▼
┌──────────────────────┐
│  AI Groq Service     │
│  main.py             │
│  /recommend-from-    │
│   skills             │
└────┬─────────────────┘
     │
     │ 4. Fetch all certificates
     ▼
┌──────────────┐
│  MongoDB     │
│  Query by    │
│  email_key   │
└────┬─────────┘
     │
     │ 5. Return certificates[]
     ▼
┌──────────────────────┐
│  AI Groq Service     │
│  LLM Processing      │
└────┬─────────────────┘
     │
     │ 6. Analyze with Groq LLM
     │    ├── Merge skills
     │    ├── Generate next skills
     │    ├── Suggest roles
     │    ├── Create learning path
     │    └── Find courses
     ▼
   {
     skills: [],
     recommended_next_skills: [],
     role_suggestions: [],
     learning_path: [],
     courses: [],
     nsqf_level: N,
     ...
   }
     │
     │ 7. Return recommendations
     ▼
┌─────────────────────┐
│  Node.js API        │
│  Response to Client │
└────┬────────────────┘
     │
     │ 8. Update UI state
     ▼
┌────────────────┐
│  Main App      │
│  Display:      │
│  - Skills      │
│  - Next Steps  │
│  - Roles       │
│  - Path        │
└────────────────┘
```

---

## 🔐 Authentication Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Login (email + password)
     ▼
┌──────────────────┐
│  Node.js API     │
│  /auth/*/login   │
└────┬─────────────┘
     │
     │ 2. Validate credentials
     │    Generate JWT tokens
     ▼
   {
     access_token: "eyJ...",
     refresh_token: "eyJ...",
     user: {...}
   }
     │
     │ 3. Store tokens in client
     ▼
┌────────────────┐
│  Client App    │
│  localStorage  │
└────┬───────────┘
     │
     │ 4. Every API request
     │    Header: Authorization: Bearer <token>
     ▼
┌──────────────────┐
│  Node.js API     │
│  Middleware      │
│  - Verify token  │
│  - Extract user  │
│  - req.user = {} │
└────┬─────────────┘
     │
     │ 5. Access protected routes
     ▼
  ┌─────────────────┐
  │ AI Controller   │
  │ req.user.email  │
  └─────────────────┘
```

---

## 📊 Component Interaction

### Roadmap Page Interaction

```
┌────────────────────────────────────────┐
│         Roadmap.jsx Component          │
├────────────────────────────────────────┤
│                                        │
│  State:                                │
│  ├── loading: true                     │
│  ├── recommendations: null             │
│  └── error: null                       │
│                                        │
│  useEffect(() => {                     │
│    fetchRecommendations()    ──────────┼──┐
│  }, [])                                │  │
│                                        │  │
│  Render Logic:                         │  │
│  ├── if loading → Spinner              │  │
│  ├── if error → Error box              │  │
│  └── else → Data display               │  │
│                                        │  │
└────────────────────────────────────────┘  │
                                            │
┌───────────────────────────────────────────┼────────┐
│  fetchRecommendations()                   │        │
├───────────────────────────────────────────▼────────┤
│                                                     │
│  1. setLoading(true)                               │
│  2. api.get('/ai/recommendations')                 │
│  3. Response received                              │
│  4. setRecommendations(response.data.data)        │
│  5. setLoading(false)                             │
│  6. Component re-renders with data                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🗂️ File Structure

```
MicroMerit-Portal/
│
├── server/
│   ├── node-app/                    # Node.js API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── ai/  ⭐NEW
│   │   │   │   │   ├── ai.routes.ts
│   │   │   │   │   ├── ai.controller.ts
│   │   │   │   │   └── ai.service.ts
│   │   │   │   ├── learner/
│   │   │   │   ├── issuer/
│   │   │   │   └── admin/
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts  ⭐UPDATED
│   │   │   │   └── upload.ts  ⭐NEW
│   │   │   └── app.ts  ⭐UPDATED
│   │   └── .env.example  ⭐UPDATED
│   │
│   └── ai_groq_service/             # Python AI Service
│       └── main.py                  # FastAPI app
│
├── client/
│   ├── main-app/                    # Main React App
│   │   └── src/
│   │       └── pages/
│   │           └── learner/
│   │               ├── Roadmap.jsx  ⭐UPDATED
│   │               └── SkillProfile.jsx  ⭐UPDATED
│   │
│   └── admin/                       # Admin React App
│       └── src/
│           └── pages/
│               └── Dashboard.tsx    # Already dynamic
│
└── docs/
    ├── AI_INTEGRATION.md  ⭐NEW     # Integration guide
    ├── AI_API_DOCS.md  ⭐NEW        # API documentation
    ├── CHANGES_SUMMARY.md  ⭐NEW    # Summary of changes
    ├── QUICKSTART.md  ⭐NEW         # Quick start guide
    └── ARCHITECTURE.md  ⭐NEW       # This file
```

---

## 🌐 Network Communication

### Ports Used

| Service | Port | Purpose |
|---------|------|---------|
| Node.js API | 3000 | Main backend API |
| Python AI Service | 8000 | AI processing & OCR |
| Main App | 5173 | Learner frontend |
| Admin App | 5174 | Admin frontend |
| PostgreSQL | 5432 | Main database |
| MongoDB | 27017 | Certificate storage |

### External APIs

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Groq API | LLM for recommendations | `GROQ_API_KEY` |
| AWS S3 / Filebase | Certificate file storage | `AWS_*` env vars |
| Twilio | SMS/OTP | `TWILIO_*` env vars |
| Google OAuth | Social login | `GOOGLE_*` env vars |

---

## 🔧 Technology Stack

### Backend - Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (Prisma ORM)
- **Authentication:** JWT
- **File Upload:** Multer
- **HTTP Client:** Axios

### Backend - Python AI
- **Framework:** FastAPI
- **LLM:** Groq (llama-3.1-8b-instant)
- **OCR:** Tesseract + PyPDF2
- **Database:** MongoDB (PyMongo)
- **Image Processing:** Pillow

### Frontend
- **Framework:** React 18
- **State Management:** Redux Toolkit (Admin), React Hooks (Main)
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Animations:** Framer Motion

---

## 📈 Scalability Considerations

### Current Architecture
- Synchronous HTTP calls
- On-demand AI processing
- Direct MongoDB queries

### Future Enhancements
1. **Message Queue** (RabbitMQ/Redis)
   - Async certificate processing
   - Background recommendation generation

2. **Caching Layer** (Redis)
   - Cache recommendations (TTL: 1 hour)
   - Session management
   - Rate limiting

3. **Load Balancing**
   - Multiple Node.js instances
   - Multiple AI service instances
   - Database read replicas

4. **CDN Integration**
   - Static asset caching
   - Certificate file delivery

---

## 🔒 Security Layers

```
┌──────────────────────────────────────┐
│  1. Network Layer                    │
│  ├── HTTPS/TLS                       │
│  ├── CORS Configuration              │
│  └── Rate Limiting                   │
└──────────────────────────────────────┘
                ↓
┌──────────────────────────────────────┐
│  2. Authentication Layer             │
│  ├── JWT Verification                │
│  ├── Role-based Access (Middleware)  │
│  └── Token Expiry                    │
└──────────────────────────────────────┘
                ↓
┌──────────────────────────────────────┐
│  3. Authorization Layer              │
│  ├── Learner-only Endpoints          │
│  ├── Issuer-only Endpoints           │
│  └── Admin-only Endpoints            │
└──────────────────────────────────────┘
                ↓
┌──────────────────────────────────────┐
│  4. Data Validation Layer            │
│  ├── File Type Validation            │
│  ├── File Size Limits                │
│  ├── Input Sanitization              │
│  └── Schema Validation (Zod)         │
└──────────────────────────────────────┘
                ↓
┌──────────────────────────────────────┐
│  5. Data Layer Security              │
│  ├── Parameterized Queries           │
│  ├── Email-based Isolation           │
│  └── Encrypted Storage               │
└──────────────────────────────────────┘
```

---

## 📚 Key Design Decisions

1. **Separate MongoDB for AI Data**: Keeps AI-processed data isolated from main application data
2. **No .js Extensions**: Follows TypeScript best practices
3. **Yarn over npm**: Consistent package management
4. **Learner Email Mapping**: Uses email from JWT to associate certificates
5. **On-Demand Generation**: Recommendations generated fresh each time for accuracy
6. **Fallback Responses**: Graceful handling when no certificates exist
7. **30s Timeout**: Prevents long-hanging requests to AI service

---

This architecture provides a solid foundation for an AI-powered skill recommendation system while maintaining security, scalability, and maintainability.
