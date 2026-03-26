# Employer Module — Feature Documentation

> Use this section in the project report under the **Employer Module** or **Business Model** chapter.

---

## 4.x Employer Portal Overview

The Employer Portal is the primary **revenue-generating module** of MicroMerit. Employers (HR teams, recruiters, background-verification firms) pay for access to verified talent pools and credential verification tools. Unlike learners and issuers whose access is free, the employer tier is designed as a subscription or pay-per-verification model.

All employer features require registration with PAN card verification and administrator approval before access is granted.

---

## 4.x.1 Globe Search — Candidate Discovery

The Employer Search Portal (`/employer/search`) provides a powerful candidate discovery engine backed by blockchain-verified credential data.

### Search Bar (Broad Keyword)

A top-level keyword search runs across learner names, emails, credential titles, issuer names, and skill profile text simultaneously — giving employers a fast, all-in-one query mechanism.

### Advanced Filter Panel (5 Targeted Filters)

| Filter | What It Does |
|--------|--------------|
| **Skills** | Matches learners whose AI-generated skill profile contains the specified skills (comma-separated; e.g., `Java, Python`). Searches both `allSkills` and `topSkills` arrays in the learner's skill profile JSON. |
| **Certificate Title** | Finds learners who hold a credential whose title matches the search term (e.g., `AWS Cloud Practitioner`). |
| **Issuer Name** | Filters learners who have at least one credential issued by the specified organisation (e.g., `NSDC`, `Coursera`). |
| **Student Name** | Direct name search on the learner record (e.g., `Raj Mehta`). |
| **Location** | Matches location data embedded in the learner's AI-generated skill profile (e.g., `Mumbai`). |

All filters are combinable — an employer can narrow results to, for example, "Python developers from Mumbai certified by NSDC."

### Candidate Cards

Each result card shows:
- Learner name and email
- Verified credential title and issuer (from blockchain-verified data)
- Issue date
- Link to public learner profile

### AI Candidate Comparison

After selecting up to 3 candidates from search results, the employer can request an AI comparison. The system collects each candidate's full credential and skill profile, sends them to an LLM, and returns a structured comparison table showing:
- NSQF qualification level
- Total skill count
- Top skills list
- AI-computed fit score (percentage match to the employer's context)

Results can be exported as a CSV file for offline review.

---

## 4.x.2 Credential Verification Portal

See `EMPLOYER_VERIFICATION_FEATURES.md` for the full specification.

**Summary:**
- **Single Verification**: Identical to the public `/verify` page — supports blockchain verification by Credential ID / Transaction Hash / IPFS CID, PDF upload (checksum + blockchain), and AI document comparison (Google Gemini 2.5 Flash).
- **Bulk Verification (ZIP)**: Employer uploads a ZIP archive of PDF certificates. Each PDF is verified individually using PDF checksum integrity check + blockchain confirmation. Results shown as a summary report with individual cards filterable by Valid / Invalid / Errors.

---

## 4.x.3 AI Chatbot — Learner Profile Q&A

Employers can query an AI chatbot (`/employer/search`) with natural-language questions about a specific learner (identified by email). The chatbot fetches the learner's credentials, skill profile, and verified data from the database, then uses an LLM to generate answers such as:
- "What skills does this candidate have?"
- "Is this candidate qualified for a cloud architect role?"
- "What is this learner's highest verified credential?"

This feature allows rapid pre-screening without having to manually inspect each profile.

---

## 4.x.4 Revenue Model

The employer module is designed as the commercial engine of the platform:

| Tier | Description |
|------|-------------|
| **Free** | Learners (credential holders) and Issuers (institutions) have free access |
| **Paid — Employers** | Verification portal, globe search, AI comparison, and chatbot access are premium features targeted at HR teams, recruiting agencies, and background verification firms |

The value proposition for employers:
1. **Trust**: Credentials are anchored on Ethereum — tamper-proof and independently verifiable.
2. **Speed**: Bulk ZIP verification verifies 100 credentials in seconds vs. manual phone/email follow-up.
3. **Depth**: AI-powered skill profile search and candidate comparison goes beyond resume keyword matching.
4. **Flexibility**: AI document comparison handles physical certificates (photocopies, scans) that would fail hash verification.

---

## 4.x.5 Technical Implementation

| Feature | Implementation |
|---------|----------------|
| Candidate search API | `GET /employer/search/candidates` — Prisma raw SQL with dynamic `WHERE` conditions |
| Skills filter | `jsonb_array_elements` PostgreSQL query on `LearnerSkillProfile.data` JSON field |
| Location filter | Full-text `ILIKE` on skill profile JSON blob |
| AI comparison | `POST /employer/compare-candidates` — LLM-backed structured comparison |
| Chatbot | `POST /employer/chat-with-learner` — RAG-style Q&A over learner profile data |
| Single credential verify | `POST /credentials/verify` (public blockchain) + `POST /credentials/verify-pdf` + `POST /credentials/ai-compare` |
| Bulk ZIP verify | `POST /employer/bulk-verify-upload` — AdmZip extraction + `verifyCredentialFromPdf()` per PDF |
