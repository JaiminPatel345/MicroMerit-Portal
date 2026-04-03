# Poster Content for MicroMerit Portal

---

## TITLE

MicroMerit Portal: A Blockchain and AI-Powered Credential Aggregator Platform

---

## ABSTRACT

MicroMerit Portal is a multi-role web platform that enables institutions to issue tamper-proof digital credentials, anchored on the Ethereum blockchain and stored on IPFS. The system implements dual verification: blockchain-backed cryptographic proof using SHA-256 canonical hashing with an on-chain smart contract, and AI-powered document comparison using Google Gemini 2.5 Flash for flexible verification of scanned or photographed certificates. Built as six independent microservices, the platform supports credential issuance (single, bulk, and API-based), external credential aggregation via a provider-agnostic connector pattern, AI-driven OCR extraction, an employer AI chatbot, and AI-generated career roadmaps for learners.

---

## INTRODUCTION

The rapid growth of digital learning platforms (Coursera, Udemy, NSDC, etc.) has created a fragmented credential landscape where certificates are scattered, easily forged, and difficult to verify. Traditional systems rely on centralized databases or paper certificates, both vulnerable to tampering and data loss. MicroMerit Portal addresses this by combining Blockchain immutability for tamper-proof anchoring, IPFS for decentralized storage, and AI for intelligent extraction, comparison, and career guidance, providing a unified platform where credentials can be issued, aggregated, verified, and presented across all stakeholders.

---

## OBJECTIVES

- Design a decentralized credential management system using Ethereum smart contracts and IPFS
- Implement dual verification: blockchain-based cryptographic proof and AI-powered document comparison
- Build a multi-role platform supporting Learners, Issuers, Employers, and Administrators
- Develop an AI-powered OCR pipeline for automated credential metadata extraction
- Create a provider-agnostic connector pattern for aggregating external credentials (Udemy, Credly, NSDC)
- Implement AI-driven career roadmap generation based on verified credentials

---

## TECH STACK

**Frontend:** React 18, Vite, Tailwind CSS, Redux Toolkit
**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Redis
**AI Services:** Python/FastAPI + Groq (Llama 3.1 8B) + Tesseract OCR; Google Gemini 2.5 Flash
**Blockchain:** Solidity, Hardhat, Ethers.js, Ethereum Sepolia Testnet
**Storage:** IPFS (decentralized, content-addressed)
**Auth:** JWT, bcrypt, Google OAuth 2.0, DigiLocker OAuth, OTP via Nodemailer

---

## BLOCK DIAGRAM & DESCRIPTION

The system follows a microservices architecture with six independent services:

1. **Client Layer** - React frontend (Main App + Admin Dashboard) communicating via REST APIs
2. **Server Layer** - Main Backend (Node.js/Express), AI Service (Python/FastAPI), Blockchain Service (Hardhat/Ethers.js), and Credential Provider Adapter
3. **Data Layer** - PostgreSQL (relational data), IPFS (credential PDFs), Ethereum Sepolia (on-chain anchoring via CredentialRegistry smart contract)
4. **External Services** - Google OAuth, Groq LLM API, Google Gemini, Nodemailer SMTP

Each credential undergoes: PDF embedding (credential_id via pdf-lib) -> SHA-256 checksum -> Canonical JSON with sorted keys -> SHA-256 data_hash -> On-chain anchoring + IPFS upload (background jobs).

> Diagram: See `poster-block-diagram.drawio` (created alongside this file)

---

## FLOWCHART

**Credential Issuance and Verification Flow:**

1. Issuer submits credential (PDF + metadata)
2. System generates UUID, embeds in PDF, computes SHA-256 checksum
3. Canonical JSON built (keys sorted alphabetically) -> SHA-256 = data_hash
4. Saved to DB (pending status), HTTP response returned immediately
5. Background: Blockchain anchoring (smart contract) + IPFS upload run in parallel
6. Credential fully anchored (confirmed + stored)

**Verification (two methods):**
- **Blockchain:** Re-compute canonical hash, verify against on-chain data_hash via smart contract
- **AI:** Upload any copy + Credential ID -> Gemini compares with original from IPFS field-by-field

> Diagram: See `poster-flowchart.drawio` (created alongside this file)

---

## OUTCOMES

- Successfully implemented tamper-proof credential anchoring on Ethereum Sepolia testnet with SHA-256 canonical hashing
- Dual verification system: cryptographic blockchain proof (100% deterministic) + AI document comparison (semantic, flexible)
- Automated OCR-based credential extraction from PDF/image uploads using Tesseract + Groq LLM
- External credential aggregation from multiple providers via connector pattern (Udemy, Credly, NSDC)
- AI-powered career roadmap generation with skill profiling, job matching, and progress tracking
- Employer search portal with AI chatbot for natural-language credential queries
- Bulk credential issuance via ZIP upload with adapter pattern processing

---

## APPLICATIONS

- **Educational Institutions:** Issue and manage verifiable digital credentials at scale
- **Students/Learners:** Aggregate all credentials in one place, share verifiable profiles with employers
- **Employers/Recruiters:** Search candidates by skills, verify credentials instantly via blockchain or AI
- **Government/Regulatory Bodies:** Verify NSQF-level qualifications with tamper-proof on-chain records
- **Credential Providers:** Integrate via REST API or connector pattern for cross-platform credential portability

---

## CONCLUSION

MicroMerit Portal demonstrates the practical integration of Blockchain, IPFS, and AI into a unified credential management ecosystem. The dual verification approach, combining blockchain immutability for legal proof with AI flexibility for real-world document comparison, addresses the full spectrum of credential verification needs. The microservices architecture ensures modularity, and the provider-agnostic connector pattern enables seamless aggregation of credentials from diverse external platforms. The project validates that decentralized, AI-enhanced credential management is both technically viable and practically valuable for the education and employment ecosystem.

---

## REFERENCES

[1] S. Nakamoto, "Bitcoin: A Peer-to-Peer Electronic Cash System," 2008.
[2] V. Buterin, "Ethereum: A Next-Generation Smart Contract and Decentralized Application Platform," Ethereum White Paper, 2014.
[3] J. Benet, "IPFS - Content Addressed, Versioned, P2P File System," arXiv:1407.3561, 2014.
[4] Solidity Documentation, Ethereum Foundation, https://docs.soliditylang.org
[5] Hardhat Development Framework, Nomic Foundation, https://hardhat.org
[6] React Documentation, Meta Open Source, https://react.dev
[7] Prisma ORM Documentation, Prisma Data Inc., https://www.prisma.io/docs
[8] Google Gemini API Documentation, Google DeepMind, https://ai.google.dev

---

## TEAM

**Student:** Jaimin Detroja (22CP081)
**Internal Guides:** Dr. Narendra M. Patel, Dr. Bhavesh A. Tanawala
**Project Convener:** Dr. Hemant D. Vasava
**Department:** Computer Engineering
**Institution:** Birla Vishvakarma Mahavidyalaya (BVM), Vallabh Vidyanagar
