# Credential Lifecycle — Issuance, Verification & Add Certificate

This document covers the full step-by-step flows for credential issuance, verification, and the "Add Certificate" lifecycle, with Mermaid diagrams.

---

## 1. Credential Issuance Flow (Issuer Portal)

When an issuer uploads a PDF certificate from the web portal.

```mermaid
sequenceDiagram
    participant Issuer as 🧑‍💼 Issuer (Web Portal)
    participant Frontend as ⚛️ React Frontend
    participant API as 🖥️ Node.js API
    participant DB as 🗄️ PostgreSQL
    participant AI as 🤖 AI Groq Service
    participant BC as ⛓️ Blockchain Service
    participant IPFS as 📦 Filebase (IPFS)
    participant Email as 📧 Email Service

    Issuer->>Frontend: Upload PDF + learner email + course name
    Frontend->>Frontend: AI Analysis (OCR → skill extraction → NSQF mapping)
    Frontend->>Frontend: Show analysis modal for issuer review
    Issuer->>Frontend: Approve / edit AI analysis
    Frontend->>API: POST /credentials/issue (FormData: PDF + metadata)

    Note over API: === Synchronous (HTTP request) ===

    API->>API: 1. Validate request (Zod schema)
    API->>DB: 2. Verify issuer exists & status = 'approved'
    API->>DB: 3. Find learner by email (or mark status = 'unclaimed')
    API->>API: 4. Compute PDF checksum (SHA-256 of raw bytes)
    API->>API: 5. Generate credential_id (UUID v4)
    API->>API: 6. Build canonical JSON (all mutable fields = null)
    API->>API: 7. Compute data_hash = SHA-256(canonical JSON)
    API->>DB: 8. Store credential (tx_hash=null, ipfs_cid=null, statuses=pending)
    API->>API: 9. Queue background job (setImmediate)
    API-->>Frontend: 200 OK (credential_id, data_hash, statuses=pending)
    Frontend-->>Issuer: Show success page with pending statuses

    Note over API: === Async Background (fire-and-forget) ===

    API-)AI: 10. AI processing (OCR → skills → NSQF → profile update)
    API-)Email: 11. Send "credential issued" email to learner

    Note over API: === Background Job (blockchain → IPFS) ===

    rect rgb(255, 245, 230)
        Note over API,IPFS: Background Processor (blockchainQueue.ts)
        API->>BC: Step 1: Write to blockchain (credential_id, data_hash)
        BC-->>API: tx_hash returned
        API->>DB: Update tx_hash + blockchain_status = 'confirmed'
        API->>API: Step 2: Embed {canonical_json, tx_hash, checksum} into PDF metadata
        API->>IPFS: Upload enriched PDF to Filebase
        IPFS-->>API: CID + gateway URL returned
        API->>DB: Update ipfs_cid, pdf_url + ipfs_status = 'confirmed'
    end

    Frontend->>API: Poll GET /credentials/:id/blockchain-status
    API->>DB: Read current statuses
    API-->>Frontend: { blockchain_status, ipfs_status, tx_hash, ipfs_cid, pdf_url }
    Frontend-->>Issuer: Update UI with confirmed statuses
```

### Canonical JSON Structure (used for hashing)

```json
{
  "credential_id": "uuid",
  "learner_id": "123",
  "learner_email": "user@example.com",
  "issuer_id": "1",
  "certificate_title": "AWS Cloud Developer",
  "issued_at": "2025-01-15T10:30:00.000Z",
  "ipfs_cid": null,
  "pdf_url": null,
  "blockchain": {
    "network": "sepolia",
    "contract_address": "0x...",
    "tx_hash": null
  },
  "meta_hash_alg": "sha256",
  "data_hash": null
}
```

> **Note:** `ipfs_cid`, `pdf_url`, `tx_hash`, and `data_hash` are **null** during hash computation, making `data_hash` deterministic at issuance time — before blockchain or IPFS results exist.

### PDF Metadata (embedded in Keywords field)

```json
{
  "canonical_json": { "...the full canonical JSON above..." },
  "tx_hash": "0xabc123...",
  "checksum": "sha256-of-original-pdf-bytes"
}
```

> **tx_hash** is always present because the PDF is only uploaded to IPFS **after** blockchain confirmation.
> **ipfs_cid** is NOT stored in the PDF metadata (it would create a circular dependency).

---

## 2. Why Blockchain Runs Before IPFS

### The Problem

If IPFS runs first, the raw PDF gets uploaded without `tx_hash` in its metadata. Users who download the PDF before the re-upload would get a PDF missing blockchain proof.

### The Solution

```mermaid
flowchart TD
    A[Start Background Job] --> B[Step 1: Write to Blockchain]
    B -->|Success| C[Got tx_hash ✅]
    B -->|Failure| D[Mark blockchain_status = failed ❌]
    D --> E[Mark ipfs_status = failed ❌]
    E --> Z[Abort — no PDF uploaded]

    C --> F[Step 2: Embed tx_hash into PDF metadata]
    F --> G[Upload enriched PDF to IPFS]
    G -->|Success| H[Update DB: ipfs_cid, pdf_url, ipfs_status = confirmed ✅]
    G -->|Failure| I[Mark ipfs_status = failed ❌]

    H --> J[Done ✅ — PDF on IPFS always has tx_hash]
    I --> K[Done — blockchain confirmed but IPFS failed]
```

### What about the CID in blockchain logs?

The smart contract stores `(credential_id, data_hash, ipfs_cid)`. Since blockchain runs **before** IPFS upload, the real CID doesn't exist yet. A **placeholder value** (`"pending-upload"`) is passed to the blockchain.

This is acceptable because:
- **Verification by identifier** looks up the credential in the DB (which has the real CID) and verifies the blockchain tx exists — it doesn't compare on-chain CID with DB CID.
- **Verification by PDF** extracts `tx_hash` from PDF metadata and verifies the tx exists on-chain.
- The `data_hash` on-chain is verified against the recomputed hash from the DB — CID is null in both cases.

---

## 3. Credential Verification Flow

Two modes: **by identifier** and **by PDF upload**.

### 3a. Verify by Identifier

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Frontend as ⚛️ React Frontend
    participant API as 🖥️ Node.js API
    participant DB as 🗄️ PostgreSQL
    participant BC as ⛓️ Blockchain Service

    User->>Frontend: Enter credential_id / tx_hash / ipfs_cid
    Frontend->>API: POST /credentials/verify { credential_id }

    API->>DB: 1. Find credential by identifier
    API->>API: 2. Get blockchain config (network, contract_address) from env
    API->>API: 3. Rebuild canonical JSON from DB fields (tx_hash=null, data_hash=null)
    API->>API: 4. Recompute data_hash = SHA-256(canonical JSON)
    API->>API: 5. Compare recomputed hash vs stored hash → hash_match

    API->>BC: 6. GET /blockchain/verify/:txHash
    BC-->>API: Transaction receipt exists? → blockchain_verified

    API->>API: 7. Compare provided ipfs_cid with stored → ipfs_cid_match
    API->>API: 8. Overall: VALID if all checks pass, INVALID otherwise
    API-->>Frontend: { status: VALID/INVALID, verified_fields, credential }
    Frontend-->>User: Show verification result with details
```

### 3b. Verify by PDF Upload

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Frontend as ⚛️ React Frontend
    participant API as 🖥️ Node.js API
    participant DB as 🗄️ PostgreSQL
    participant BC as ⛓️ Blockchain Service

    User->>Frontend: Upload PDF file
    Frontend->>API: POST /credentials/verify-pdf (FormData: PDF)

    API->>API: 1. Extract metadata from PDF Keywords field
    Note over API: {canonical_json, tx_hash, checksum}

    alt No metadata found
        API-->>Frontend: INVALID — "No MicroMerit metadata found"
    end

    API->>API: 2. Strip metadata from PDF → get clean PDF
    API->>API: 3. Compute checksum of clean PDF (SHA-256)
    API->>API: 4. Compare recomputed checksum vs stored checksum → checksum_match

    alt Checksum mismatch
        API-->>Frontend: INVALID — "PDF has been tampered with"
    end

    API->>BC: 5. Verify blockchain tx exists (tx_hash from metadata)
    BC-->>API: blockchain_verified

    API->>DB: 6. Optionally look up credential for additional info
    API->>API: 7. Overall: VALID if checksum + blockchain pass
    API-->>Frontend: { status: VALID/INVALID, verified_fields, credential }
    Frontend-->>User: Show verification result
```

---

## 4. "Add Certificate" Lifecycle (Learner-Initiated)

When a learner adds a certificate from an external issuer (e.g., NPTEL, Credly).

```mermaid
sequenceDiagram
    participant Learner as 🎓 Learner
    participant Frontend as ⚛️ React Frontend
    participant API as 🖥️ Node.js API
    participant Ext as 🌐 External Issuer API
    participant DB as 🗄️ PostgreSQL
    participant BC as ⛓️ Blockchain Service
    participant IPFS as 📦 Filebase (IPFS)

    Learner->>Frontend: Click "Add Certificate"
    Frontend->>API: GET /credentials/ondemand/issuers
    API-->>Frontend: List of supported issuers (NPTEL, Credly, etc.)
    Frontend-->>Learner: Show issuer dropdown

    Learner->>Frontend: Select issuer + enter credential ID
    Frontend->>API: POST /credentials/ondemand/add { issuer_id, credential_id }

    Note over API: === On-Demand Service ===

    API->>API: 1. Find on-demand connector for issuer_id
    API->>Ext: 2. Fetch credential from external API
    Ext-->>API: Raw credential data (JSON ± base64 PDF)
    API->>API: 3. Normalize response fields (field mapping per issuer)
    API->>API: 4. Verify ownership (email compare or hash-based)

    alt Ownership mismatch
        API-->>Frontend: 403 — "This credential doesn't belong to your account"
    end

    alt Has base64 PDF
        API->>API: 5a. Decode base64 → PDF Buffer
    else No PDF (JSON-only API)
        API->>API: 5b. Generate fallback PDF from metadata
    end

    API->>API: 6. Call credentialIssuanceService.issueCredential()
    Note over API: (Same pipeline as issuer issuance — Steps 1-11 above)
    API-->>Frontend: { credential_id, statuses=pending }

    Note over API: === Background Processing ===

    rect rgb(255, 245, 230)
        API->>BC: Blockchain write → tx_hash
        API->>API: Embed tx_hash into PDF metadata
        API->>IPFS: Upload enriched PDF → CID
        API->>DB: Update all fields + statuses = confirmed
    end

    Frontend->>API: Poll blockchain-status
    API-->>Frontend: Updated statuses
    Frontend-->>Learner: Show confirmed credential in wallet
```

### Detailed Step-by-Step

| Step | What Happens | Where |
|------|-------------|-------|
| 1 | Learner selects issuer & enters external credential ID | Frontend |
| 2 | Find matching on-demand connector (NPTEL, Credly, etc.) | `ondemand.connectors.ts` |
| 3 | Fetch raw data from external issuer's API/endpoint | `ondemand.connectors.ts` |
| 4 | Normalize fields (title, email, dates, PDF) via connector | `connector.normalize()` |
| 5 | Verify ownership — email match or hash-based verification | `connector.verify()` |
| 6 | Get PDF: decode base64 or generate fallback PDF | `ondemand.service.ts` |
| 7 | Call `issueCredential()` — full pipeline | `credential-issuance/service.ts` |
| 8 | Compute checksum, data_hash, store in DB | `credential-issuance/service.ts` |
| 9 | Background: blockchain write → get tx_hash | `blockchainQueue.ts` |
| 10 | Background: embed tx_hash in PDF → upload to IPFS | `blockchainQueue.ts` |
| 11 | Update DB: ipfs_cid, pdf_url, statuses = confirmed | `blockchainQueue.ts` |
| 12 | AI processing (async): OCR → skills → NSQF | `ai_groq_service` |
| 13 | Send email notification to learner | `email.ts` |

---

## 5. Complete Credential State Machine

```mermaid
stateDiagram-v2
    [*] --> Issued: Credential created in DB

    state "Database Status" as dbstatus {
        Issued --> Unclaimed: Learner not registered
        Issued --> Claimed: Learner exists in system
        Unclaimed --> Claimed: Learner registers & claims
    }

    state "Blockchain Status" as bcstatus {
        BC_Pending: pending
        BC_Confirmed: confirmed
        BC_Failed: failed

        [*] --> BC_Pending: Created
        BC_Pending --> BC_Confirmed: tx_hash received
        BC_Pending --> BC_Failed: Write error
    }

    state "IPFS Status" as ipfsstatus {
        IPFS_Pending: pending
        IPFS_Confirmed: confirmed
        IPFS_Failed: failed

        [*] --> IPFS_Pending: Created
        IPFS_Pending --> IPFS_Confirmed: Enriched PDF uploaded (with tx_hash)
        IPFS_Pending --> IPFS_Failed: Upload error or blockchain failed
    }
```

---

## 6. Architecture Overview

```mermaid
flowchart TB
    subgraph Clients
        IssuerPortal[Issuer Web Portal]
        LearnerPortal[Learner Web Portal]
        EmployerVerify[Employer Verification]
    end

    subgraph NodeAPI[Node.js API Server]
        IssuanceModule[Credential Issuance]
        VerificationModule[Credential Verification]
        OnDemandModule[On-Demand Sync]
        BackgroundProcessor[Background Processor<br/>blockchainQueue.ts]
    end

    subgraph Services
        AIService[AI Groq Service<br/>OCR, Skills, NSQF]
        BlockchainService[Blockchain Service<br/>Ethers.js + Hardhat]
        EmailService[Email Service]
    end

    subgraph Storage
        DB[(PostgreSQL<br/>Prisma ORM)]
        IPFS[(Filebase / IPFS)]
        Blockchain[(Ethereum Sepolia<br/>CredentialRegistry.sol)]
    end

    IssuerPortal -->|Issue| IssuanceModule
    LearnerPortal -->|Add Certificate| OnDemandModule
    LearnerPortal -->|Verify| VerificationModule
    EmployerVerify -->|Verify| VerificationModule

    IssuanceModule --> DB
    IssuanceModule --> BackgroundProcessor
    OnDemandModule -->|Same pipeline| IssuanceModule
    VerificationModule --> DB
    VerificationModule --> BlockchainService

    BackgroundProcessor --> BlockchainService
    BackgroundProcessor --> IPFS
    BackgroundProcessor --> DB

    IssuanceModule -.->|async| AIService
    IssuanceModule -.->|async| EmailService

    BlockchainService --> Blockchain
```

---

## 7. Key File References

| Component | File |
|-----------|------|
| Issuance Service | `server/node-app/src/modules/credential-issuance/service.ts` |
| Issuance Controller | `server/node-app/src/modules/credential-issuance/controller.ts` |
| Background Processor | `server/node-app/src/services/blockchainQueue.ts` |
| Verification Service | `server/node-app/src/modules/credential-verification/service.ts` |
| On-Demand Service | `server/node-app/src/modules/external-credential-sync/ondemand.service.ts` |
| On-Demand Connectors | `server/node-app/src/modules/external-credential-sync/ondemand.connectors.ts` |
| PDF Metadata Utils | `server/node-app/src/utils/pdfMetadata.ts` |
| Canonical JSON Utils | `server/node-app/src/utils/canonicalJson.ts` |
| Filebase Upload | `server/node-app/src/utils/filebase.ts` |
| Blockchain Utils | `server/blockchain/src/utils/blockchain.ts` |
| Smart Contract | `server/blockchain/contracts/CredentialRegistry.sol` |
| Issuer Frontend | `client/main-app/src/pages/issuer/NewIssuance.jsx` |
| Learner Success Page | `client/main-app/src/pages/learner/CredentialAdded.jsx` |
