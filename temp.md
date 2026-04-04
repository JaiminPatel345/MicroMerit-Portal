# MicroMerit Portal — Poster Content

**Title:** MicroMerit Portal: A Blockchain and AI-Powered Credential Aggregator Platform

---

## ABSTRACT

MicroMerit Portal is a credential aggregator platform that unifies issuance, storage, and verification of academic and vocational certificates using Blockchain, IPFS, and AI. Credentials are cryptographically anchored on Ethereum (Sepolia testnet) via a Solidity smart contract, with PDFs stored on IPFS for tamper-proof, decentralized access. The platform supports four user roles — Learners, Issuers, Employers, and Admins — and offers dual verification: blockchain-backed cryptographic proof for exact-match  , and Google Gemini AI for flexible document comparison when only scanned copies are available. Unlike traditional background verification companies that take days or weeks and charge significant fees, MicroMerit provides instant, free, and cryptographically guaranteed verification — making it a viable replacement for manual credential checks.

---

## INTRODUCTION

Traditional credential verification is slow, manual, and vulnerable to fraud. Background verification companies charge Rs. 500-2000 per credential and take 3-15 business days. Paper certificates can be forged, and centralized databases create single points of failure.

MicroMerit Portal solves this by anchoring every credential on a public blockchain — providing instant, free, tamper-proof verification that anyone can perform. The SHA-256 hash of each credential's canonical JSON is stored on-chain; any modification, even a single character, invalidates the hash and is immediately detected. IPFS provides decentralized storage, ensuring credentials remain accessible even if the issuing institution goes offline.

The platform also integrates AI for OCR-based metadata extraction during issuance, Gemini-powered document comparison for flexible verification, personalized career pathways for learners, and an AI chatbot for employer queries.

---

## OBJECTIVES

- Design a tamper-proof credential management system using blockchain (Ethereum) and IPFS
- Enable instant credential verification — replacing days-long manual background checks with sub-second cryptographic proof
- Support dual verification: blockchain (exact match) + AI (flexible document comparison via Google Gemini)
- Build a multi-role platform: Learners, Issuers, Employers, and Admins each with tailored interfaces
- Implement AI-powered OCR to extract credential metadata from PDFs/images automatically
- Provide AI-driven career pathways and skill profiling for learners based on their verified credentials
- Create a provider-agnostic external credential sync system (adapter pattern) for platforms like Udemy, NSDC, Credly

---

## BLOCK DIAGRAM & DESCRIPTION

> See diagram: `docs/poster/block_diagram.drawio`

The system consists of six independent microservices:

1. **React Frontend** (Port 5173) — Learner, Issuer, and Employer interfaces
2. **Node.js Backend** (Port 3000) — Core API with Express, TypeScript, Prisma, PostgreSQL
3. **Blockchain Service** (Port 3001) — Hardhat + Ethers.js, connects to Sepolia testnet
4. **AI Service** (Port 8000) — Python/FastAPI with Tesseract OCR + Groq LLM for metadata extraction
5. **Admin Dashboard** (Port 5174) — Separate React app for administration
6. **IPFS Storage** — Decentralized file storage for credential PDFs

Google Gemini 2.5 Flash is integrated directly in the Node.js backend for document comparison, candidate comparison, and career roadmap generation.

---

## FLOWCHART

> See diagram: `docs/poster/flowchart.drawio`

**Credential Issuance & Verification Flow:**

Issuance: Issuer uploads PDF + metadata -> AI extracts fields via OCR -> credential_id embedded in PDF -> SHA-256 checksum computed -> Canonical JSON built (keys sorted) -> SHA-256 data_hash -> Smart contract stores data_hash on-chain -> PDF uploaded to IPFS -> DB updated with tx_hash, ipfs_cid

Verification (Blockchain): Verifier provides credential_id/tx_hash/PDF -> System rebuilds canonical JSON -> Recomputes hash -> Queries smart contract -> Match = VALID

Verification (AI): Verifier uploads scanned copy + credential_id -> System fetches original from IPFS -> Gemini compares field-by-field -> Returns confidence score + mismatches

---

## OUTCOMES

- **Instant Verification**: Sub-second credential authentication vs. 3-15 days by traditional background verification companies
- **Zero Cost**: No per-verification fees — anyone can verify for free using blockchain
- **Tamper-Proof**: SHA-256 hashing + blockchain immutability — even 1-byte change is detected instantly
- **Dual Verification**: Blockchain for exact proof + AI for real-world flexibility (scanned copies, photos)
- **AI Career Guidance**: Personalized learning pathways generated from verified credentials using Google Gemini
- **Decentralized Storage**: Credentials on IPFS remain accessible even if the issuing institution shuts down
- **Employer Efficiency**: AI-powered candidate search, comparison (up to 3 at once), and chatbot for credential queries
- **Can Replace Background Verification Companies**: Faster, cheaper, and more reliable than manual verification processes — results are cryptographically guaranteed, not opinion-based

---

## APPLICATIONS

- **Universities & Colleges**: Issue blockchain-verified degrees and transcripts that employers can instantly verify
- **Professional Certification Bodies** (NSDC, NASSCOM, etc.): Issue tamper-proof skill certifications aligned with NSQF framework
- **HR Departments & Recruiters**: Instantly verify candidate credentials without waiting for third-party background checks — saving time and money
- **Online Learning Platforms** (Udemy, Coursera, etc.): Auto-sync course completion certificates into learners' unified portfolios
- **Government Agencies**: Verify skill certifications for employment schemes and skill development programs
- **Background Verification Replacement**: Organizations can eliminate dependency on expensive, slow third-party verification services entirely

---

## TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Redux Toolkit |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Blockchain | Solidity, Hardhat, Ethers.js, Ethereum Sepolia |
| Storage | IPFS (decentralized) |
| AI (OCR) | Python, FastAPI, Tesseract, Groq (Llama 3.1) |
| AI (Verification/Roadmap) | Google Gemini 2.5 Flash |
| Auth | JWT, OTP, Google OAuth, DigiLocker OAuth |

---

## CONCLUSION

MicroMerit Portal demonstrates a practical implementation of blockchain, IPFS, and AI technologies for credential management. The platform successfully anchors credentials on Ethereum with SHA-256 hashing, stores PDFs on IPFS, and offers dual verification (cryptographic + AI-based).

The key achievement is making credential verification instant and free — a significant improvement over traditional background verification processes that cost money and take days. The AI integration (Gemini) further adds flexibility for real-world scenarios where exact digital copies aren't available.

The microservices architecture (6 independent services) ensures scalability, while the adapter pattern enables easy integration with new credential providers.

---

## REFERENCES

[1] S. Nakamoto, "Bitcoin: A Peer-to-Peer Electronic Cash System," 2008.
[2] V. Buterin, "Ethereum: A Next-Generation Smart Contract and Decentralized Application Platform," 2014.
[3] J. Benet, "IPFS - Content Addressed, Versioned, P2P File System," arXiv:1407.3561, 2014.
[4] OpenZeppelin, "Smart Contract Security," https://docs.openzeppelin.com
[5] Hardhat, "Ethereum Development Environment," https://hardhat.org

---

## TEAM

**Student:** Jaimin Detroja (22CP081)
**Internal Guides:** Dr. Narendra M. Patel, Dr. Bhavesh A. Tanawala
**Project Convener:** Dr. Hemant D. Vasava
**Institution:** Birla Vishvakarma Mahavidyalaya (BVM), Vallabh Vidyanagar
