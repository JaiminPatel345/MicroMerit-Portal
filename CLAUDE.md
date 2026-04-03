# MicroMerit Portal — CLAUDE.md

## Project Owner
- **Name**: Jaimin Detroja
- **Student ID**: 22CP081
- **Context**: College final-year project submission

---

## Project Overview

MicroMerit Portal is a **Micro-Credential Aggregator Platform** powered by Blockchain, IPFS, and AI. It allows institutions (issuers) to issue verifiable digital credentials to students (learners), who can then share and present those credentials to employers or verifiers.

---

## Architecture — 6 Services

| Service | Directory | Port | Tech |
|---|---|---|---|
| Main Backend API | `server/node-app` | 3000 | Node.js + Express + TypeScript + Prisma + PostgreSQL + Redis/BullMQ |
| AI Service | `server/ai_groq_service` | 8000 | Python + FastAPI + Groq (llama-3.1-8b-instant) + Tesseract OCR |
| Blockchain Service | `server/blockchain` | 3001 | TypeScript + Hardhat + Ethers.js (Sepolia testnet) |
| Main App (Frontend) | `client/main-app` | 5173 | React + Vite + Tailwind CSS |
| Admin Dashboard | `client/admin` | 5174 | React + Vite + TypeScript |
| Dummy Server | `server/dummy-server` | 4000 | Node.js (mock credential provider — acts like Credly/NSDC/Udemy) |

---

## User Roles

- **Learner (Student)**: Owns credentials. Cannot issue credentials. Can link external credentials from providers like Credly via the External Sync feature.
- **Issuer (Verifier/Institution)**: Issues credentials via web portal, bulk upload, or REST API. Has API key management.
- **Employer**: Searches learner profiles by skills, NSQF level, location. Has an AI chatbot (currently broken — needs fix).
- **Admin**: Separate portal at `client/admin`. Approves/rejects issuers, monitors all credentials, controls external sync, verifies NSQF levels.

---

## Key Features & Status

### Working
- Blockchain anchoring of credentials (Sepolia testnet; mock mode available via `BLOCKCHAIN_MOCK_ENABLED=true`)
- IPFS storage via Filebase (S3-compatible API) — **in reports/docs always call it "IPFS", never mention Filebase**
- Multi-role auth: JWT + OTP verification + Google OAuth + DigiLocker OAuth
- Credential issuance (single, via web), verification by credential_id / tx_hash / ipfs_cid / QR code
- External credential sync from providers (NSDC, Udemy, Credly-like) via connector pattern
- AI OCR: extract credential details from PDF/image using Tesseract + Groq
- **AI Document Comparison** (Google Gemini 2.5 Flash): User uploads a scanned/photo copy of a credential + provides Credential ID → system fetches the original PDF from IPFS → Gemini compares both documents field-by-field → returns match result, confidence score, and list of mismatches. Useful when the exact original PDF is unavailable.
- **Dual Verification UI** (`/verify`): Two-tab interface — "Blockchain Verify" (cryptographic proof via tx_hash/credential_id/ipfs_cid or PDF checksum) and "AI Verification" (flexible document comparison via Gemini). Each tab is independently accessible via URL param `?ai=<credential_id>`.
- Admin portal: issuer approval, credential oversight, analytics
- Public learner profile pages (`/p/:slug`), public credential pages (`/c/:id`)
- **Bulk Issuance** (`issuer/bulk-upload`): Issuers upload a ZIP of JSON credential files; each file is processed by the adapter pattern (`IssuerBulkAdapterFactory`), anchored to blockchain with a proper canonical-JSON data_hash, and stored in DB. Progress tracked via batch polling UI.
- **Employer AI Chatbot** (`/employer/search`): Employer enters a learner's email and a natural-language question; backend fetches all that learner's verified credentials and sends them as context to the LLM (`POST /employer/chat`), which returns an AI-generated answer, relevant skills, referenced certificates, and confidence score. Displayed in a chat panel on the Search page.
- **Employer Globe Search** (`/employer/search`): Filter candidates by skills, certificate title, issuer, student name, and location. AI candidate comparison (up to 3 at once) with CSV export.
- **Employer Verification Portal** (`/employer/verify`): Single credential verification (same as public `/verify` — by ID/tx_hash/IPFS CID, PDF upload, or AI document comparison) + bulk ZIP verification (each PDF verified individually via `POST /credentials/verify-pdf`).
- **Learner Pathways / Roadmap** (`/roadmap`, `/pathway`): AI-powered career roadmap using Google Gemini 2.5 Flash. Based on the learner's verified credentials, generates: current standing summary, future goals with skill breakdowns (basic/intermediate/advanced), strategic career pivots, stackable pathways with progress tracking (completed vs missing skills), and job opportunities with match percentages and salary ranges. Learners can regenerate their roadmap anytime via a "Refresh Roadmap" button (`POST /learner/roadmap/regenerate`). Also generates a Skill Profile with proficiency levels, field analysis, and job readiness. Data stored in `LearnerRoadmap` and `LearnerSkillProfile` tables as JSONB.

### Disabled / Future Scope (DO NOT enable or mention as current features)
- Course recommendations.

---

## Dummy Server (`server/dummy-server`)

Acts as a mock external credential provider (like Credly, NSDC, Udemy). In the report, describe it as:
> "An abstraction layer / adapter interface that handles different credential providers, each with their own request/response formats, authentication schemes, and data models."

The `connector.factory.ts` and `connectors/` directory in `server/node-app/src/modules/external-credential-sync/` implement the provider-agnostic connector pattern.

---

## Bulk Issuance Adapter Pattern

`server/node-app/src/adapters/issuerBulkAdapters/index.ts` — implements `IssuerBulkAdapter` interface:
- `identify()` — detect file type
- `extractMetadata()` — parse JSON / OCR PDF/image via AI
- `verify()` — validate credential data
- `normalize()` — map to standard `Credential` schema

`IssuerBulkAdapterFactory` selects the right adapter per file. Currently only `DefaultAdapter` exists.

---

## Blockchain Anchoring — Full Flow (for reports)

### How a Credential Gets Anchored

**Step 1 — Issuer submits credential** (PDF + metadata via web/API)

**Step 2 — PDF processing**
- A unique `credential_id` (UUID v4) is embedded into the PDF's Keywords metadata field using `pdf-lib`
- SHA-256 of that modified PDF = **checksum** (stored in DB, used for tamper detection)

**Step 3 — Canonical JSON + Data Hash**
- A canonical JSON is built with fixed fields: `credential_id`, `learner_id`, `learner_email`, `issuer_id`, `certificate_title`, `issued_at`, `ipfs_cid: null`, `tx_hash: null`, etc.
- All keys are **recursively sorted alphabetically** at every nesting level → serialized → SHA-256 hashed
- Result = **data_hash** (64-char hex) — this is what gets anchored on-chain

**Step 4 — Credential saved to DB** with `blockchain_status: pending`, `ipfs_status: pending`

**Step 5 — HTTP response returns immediately** (pending statuses) — user doesn't wait

**Step 6 — Background job (via `setImmediate`):**
- **Blockchain write:** Calls `POST /blockchain/write` on the blockchain service → smart contract `issueCredential(credential_id, dataHashBytes32, ipfsCid)` on Sepolia → returns `tx_hash` → DB updated
- **IPFS upload:** PDF uploaded to IPFS → CID retrieved → `ipfs_cid` + `pdf_url` updated in DB

### What Is Stored Where

| Data | Where | Why |
|---|---|---|
| `data_hash` (SHA-256 of canonical JSON) | **Blockchain (on-chain)** | Immutable proof of credential integrity |
| `ipfs_cid` | **Blockchain + DB** | Links on-chain record to IPFS file |
| `tx_hash` | **DB** | Reference to blockchain transaction |
| PDF file | **IPFS** | Decentralized, content-addressed storage |
| `checksum` (SHA-256 of PDF) | **DB metadata** | PDF tamper detection |
| Full credential data, AI-extracted fields | **DB** | Queryable off-chain data |
| Canonical JSON | **DB metadata** | Source of truth for hash recomputation |

### Smart Contract (`CredentialRegistry.sol` on Sepolia)

```solidity
struct Credential {
    bytes32 dataHash;   // SHA-256 of canonical JSON, converted to bytes32
    string ipfsCid;     // IPFS content identifier
    address issuer;     // Wallet that issued the credential
    uint256 timestamp;  // Block timestamp
    bool exists;        // Proof of existence
}

function issueCredential(string credentialId, bytes32 dataHash, string ipfsCid)
function verifyCredential(string credentialId, bytes32 dataHash) returns (bool)
function getCredential(string credentialId) returns (Credential)
```

### Verification — Two Methods (ALWAYS include both in reports)

#### Why Two Methods Exist
Blockchain verification is cryptographically absolute but requires the exact original file or a known identifier. AI verification fills the gap when a verifier only has a scanned photocopy, a printed-and-rescanned version, or a photo of a physical certificate — documents where byte-level hashing would fail even for genuine credentials. Together they cover the full real-world spectrum: **blockchain for legal proof, AI for practical flexibility**.

#### Method 1: Blockchain Verification (PRIMARY — always explain in detail)

**Sub-method A — By Identifier (credential_id / tx_hash / ipfs_cid)**
1. Verifier provides any one of: Credential ID, blockchain transaction hash, or IPFS CID
2. System fetches credential record from DB using whichever identifier was given
3. Rebuilds the canonical JSON (same fixed fields as at issuance — `ipfs_cid`, `tx_hash`, `data_hash` all set to `null`)
4. Recursively sorts all keys alphabetically → serializes → SHA-256 → compare with stored `data_hash` → **hash_match**
5. Calls blockchain service with `tx_hash` → queries `CredentialRegistry` smart contract on Sepolia → **blockchain_verified**
6. All checks must pass → `VALID`

**Sub-method B — By PDF Upload**
1. Verifier uploads the original PDF file
2. System extracts `credential_id` from PDF Keywords metadata field (embedded at issuance using `pdf-lib`)
3. SHA-256 of the entire uploaded PDF buffer → compare with `metadata.checksum` stored in DB → **checksum_match**
   - Any single-byte modification (tampering, re-save, watermark) → mismatch → `INVALID`
4. Calls blockchain service with `tx_hash` → **blockchain_verified**
5. Both must pass → `VALID`

> Key insight: The checksum is of the *already-modified* PDF (credential_id embedded). Any post-issuance change is instantly detected.

#### Method 2: AI Verification (SECONDARY — explain as flexible alternative)

**How it works:**
1. Verifier provides the Credential ID + uploads any copy of the document (photo, scan, printed copy)
2. System fetches the original PDF from IPFS using the credential's stored `ipfs_cid`
3. Both documents (original from IPFS + user-submitted copy) are sent to **Google Gemini 2.5 Flash**
4. Gemini performs field-by-field comparison: student name, institution, course/subject names, marks, grades, dates, roll numbers
5. Returns: `match` (true/false), `confidence` (0–100%), `mismatches` list, and a one-sentence `summary`
6. Result shown with confidence bar and mismatch details

**Why this matters for the report:**
- Blockchain hashing requires an exact byte-for-byte copy — a scanned photocopy will always fail hash verification even if genuine
- AI comparison is semantic, not byte-level — it reads and understands content, tolerating image quality differences, watermarks, and formatting changes
- Limitation: AI is probabilistic, not a legal proof. The UI explicitly states: *"for legal proof, use the blockchain-backed method"*
- Use case: employers verifying printed certificates from candidates, or institutions checking physical documents

### Mock Mode (for dev/demo)
- `BLOCKCHAIN_MOCK_ENABLED=true` in `server/blockchain/.env`
- `tx_hash` = `0x{credential_id without dashes}` (fake but consistent)
- IPFS upload still runs (real Filebase/IPFS)
- Switch to `false` for real Sepolia anchoring (needs `PRIVATE_KEY` + `SEPOLIA_RPC_URL`)

### Key Files
| What | Where |
|---|---|
| Hash computation | `server/node-app/src/modules/credential-issuance/canonicalJson.ts` |
| PDF embedding + checksum | `server/node-app/src/modules/credential-issuance/pdfMetadata.ts` |
| Background queue | `server/node-app/src/services/blockchainQueue.ts` |
| Blockchain client | `server/node-app/src/services/blockchainClient.ts` |
| IPFS upload (Filebase) | `server/node-app/src/services/filebase.ts` |
| Smart contract | `server/blockchain/contracts/CredentialRegistry.sol` |
| Blockchain HTTP service | `server/blockchain/src/utils/blockchain.ts` |

---

## Important Rules for This Project

### Code
- **No security hardening needed** — this is a college demo project. Do not add security warnings, rate limiting, input sanitization improvements, or auth hardening to code.
- **No scalability improvements** — do not refactor for scale.
- **Fix bugs when asked**.
- Do not add features, refactors, or "improvements" beyond what is asked.

### Documentation / Reports
- **IPFS**: Always say "IPFS" — never mention "Filebase" in any report or doc.
- **Security**: Can be mentioned positively in reports (blockchain immutability, IPFS content addressing, JWT auth, OTP verification) even if implementation is minimal.
- **Scalability**: Can be mentioned positively in reports (microservices architecture, Redis queues, horizontal scalability potential) as design intentions.
- **Pathways**: Now a working feature — include in reports as an implemented AI-powered career guidance tool.
- **Employer Chatbot**: Include as a feature (it will be fixed).
- **Blockchain**: Mention Ethereum/Solidity smart contracts on Sepolia testnet; in mock mode it simulates anchoring.

---

## Tech Stack Summary (for reports)

- **Frontend**: React 18, Vite, Tailwind CSS, Redux Toolkit + Redux Persist
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Redis, BullMQ
- **AI (OCR/Extraction)**: Python, FastAPI, Groq API (Llama 3.1 8B), Tesseract OCR — used for extracting credential fields from uploaded PDFs/images during issuance
- **AI (Document Comparison)**: Google Gemini 2.5 Flash (via `@google/generative-ai` in Node.js) — used for flexible AI-powered credential verification by comparing original IPFS PDF against user-submitted document
- **Blockchain**: Hardhat, Ethers.js, Solidity, Ethereum Sepolia Testnet
- **Storage**: IPFS (decentralized), AWS S3-compatible interface
- **Auth**: JWT, bcrypt, Nodemailer OTP, Google OAuth 2.0, DigiLocker OAuth

---

## Default Dev Credentials (after `npx tsx prisma/seed.ts`)

- Admin: `admin@micromerit.com` / `admin123`
- Learner: `learner@test.com` / `password123`
- Issuer: `issuer@test.com` / `password123`
- Employer: `employer@test.com` / `password123`

---

## Key File Locations

| What | Where |
|---|---|
| Main routes | `client/main-app/src/App.jsx` |
| Backend entry | `server/node-app/src/server.ts` |
| All backend modules | `server/node-app/src/modules/` |
| Bulk issuance adapter | `server/node-app/src/adapters/issuerBulkAdapters/index.ts` |
| External sync connectors | `server/node-app/src/modules/external-credential-sync/connectors/` |
| Connector factory | `server/node-app/src/modules/external-credential-sync/connector.factory.ts` |
| AI service (OCR) | `server/ai_groq_service/main.py` |
| AI service (Gemini - roadmap, compare, doc verify) | `server/node-app/src/modules/ai/ai.service.ts` |
| Blockchain contracts | `server/blockchain/contracts/` |
| Dummy server routes | `server/dummy-server/src/routes/` |
| Admin portal | `client/admin/src/` |
| Issuer pages | `client/main-app/src/pages/issuer/` |
| Learner pages | `client/main-app/src/pages/learner/` |
| Learner Pathways/Roadmap | `client/main-app/src/pages/learner/Roadmap.jsx` |
| Employer pages | `client/main-app/src/pages/employer/` |
