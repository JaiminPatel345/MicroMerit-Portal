# Employer Credential Verification — Feature Documentation

> Use this section in the project report under the **Employer Module** or **Credential Verification** chapter.

---

## 4.x Employer Verification Portal

The Employer Verification Portal provides employers with two verification modes accessible from a single unified page at `/employer/verify`.

---

### 4.x.1 Single Credential Verification

The single verification page combines two independent methods on one screen, giving employers full flexibility.

**Method A — Blockchain Verification (Primary)**

The employer enters any one of the following identifiers:
- **Credential ID** (e.g., `CRED-abc123`) — the platform's internal UUID
- **Transaction Hash** (e.g., `0x...`) — the Ethereum Sepolia blockchain transaction
- **IPFS CID** (e.g., `Qm...` or `bafy...`) — the content-addressed IPFS reference

The system auto-detects the identifier type and verifies it against the blockchain. The result shows:
- **Data Integrity check** — SHA-256 canonical JSON hash comparison
- **Blockchain verification** — smart contract query on Sepolia testnet
- **IPFS storage confirmation** — CID match validation
- Full credential details: certificate title, learner, issuer, issue date, links to blockchain explorer and original PDF

**Document Upload (Sub-method)** — The employer can upload the original PDF certificate directly. The system extracts the embedded `credential_id` from PDF metadata and performs the full blockchain verification automatically, without requiring the employer to know the ID.

**Camera Scan** — The employer can scan a physical certificate with their device camera. AI (Groq + Tesseract OCR) extracts the credential ID from the image, which is then verified.

**Method B — AI Document Comparison (Secondary)**

When only a photocopy, scan, or photograph of the certificate is available (where byte-level hash matching would fail), the employer can:
1. Enter the Credential ID
2. Upload any copy of the document (photo, scan, printed copy)

The system fetches the original PDF from IPFS and sends both documents to **Google Gemini 2.5 Flash** for semantic field-by-field comparison. The result includes:
- Match status (true/false)
- Confidence score (0–100%) with a visual progress bar
- List of detected mismatches (student name, dates, marks, grades, etc.)
- One-sentence summary

> **Note for report**: AI comparison is probabilistic, not cryptographic — it is explicitly labelled in the UI as a flexibility tool for physical documents. For legal proof, blockchain verification is recommended.

---

### 4.x.2 Bulk Credential Verification

The bulk verification tab allows employers to verify multiple credentials in a single operation, with two input modes:

**Mode A — ZIP Archive Upload (Primary)**

The employer uploads a ZIP file containing multiple PDF certificates. The system:
1. Extracts each PDF from the ZIP archive
2. Uses AI (Groq + Tesseract OCR) to extract the `credential_id` embedded in each PDF's metadata
3. Verifies each credential individually against the blockchain in parallel (up to 100 credentials per batch)
4. Returns a comprehensive verification report

**Mode B — Paste / CSV Import (Secondary)**

The employer pastes credential IDs directly (one per line or comma-separated) or imports a `.csv`/`.txt` file containing a list of IDs. All IDs are verified in parallel.

**Verification Report**

After processing, the system displays a rich summary report:

| Metric | Description |
|--------|-------------|
| **Total** | Total number of credentials submitted |
| **Valid** | Count of credentials successfully verified on-chain |
| **Invalid** | Count of credentials that failed verification |
| **Errors** | Count of credentials that could not be processed (e.g., unreadable PDF, ID not found) |
| **Success Rate** | Percentage of valid credentials with colour-coded progress bar (green ≥80%, orange ≥50%, red <50%) |

**Individual Results**

Each credential's result is displayed as a card showing:
- Credential ID (monospace)
- Certificate title and learner email (from blockchain-verified data)
- Status badge: `VALID` (green), `INVALID` (red), or `ERROR` (orange)
- For valid credentials: individual checks for Data Integrity ✓, Blockchain ✓, and IPFS ✓
- "Details" button opens a full credential modal with blockchain explorer and PDF links
- Failure reason or extraction error message for invalid/error records

**Filter Tabs**

Results can be filtered by: **All** | **Valid** | **Invalid** | **Errors** — each tab shows the count badge so employers can quickly focus on problem records.

---

### 4.x.3 Technical Implementation

| Component | Implementation |
|-----------|----------------|
| Single verification API | `POST /employer/verify` |
| Bulk ID verification API | `POST /employer/verify/bulk` (up to 100 IDs, parallel Promise.all) |
| ZIP upload + AI extraction API | `POST /employer/bulk-verify-upload` |
| ID extraction from PDF/image | Groq Llama 3.1 8B + Tesseract OCR via AI service |
| AI document comparison | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| Blockchain verification | `CredentialRegistry.sol` on Ethereum Sepolia testnet |

---

### 4.x.4 Use Cases in Practice

1. **Campus Recruitment**: An HR team uploads a ZIP of 50 candidate certificates after an interview drive. The system verifies all 50 in under a minute, showing 47 valid, 2 invalid (tampered), 1 error (unreadable scan). The HR team can view details of each flagged credential.

2. **Physical Document Check**: An employer receives a printed certificate at an interview. They photograph it with the portal's camera tool, the credential ID is extracted by AI, and blockchain verification confirms authenticity instantly.

3. **Background Verification**: An employer pastes a list of credential IDs from a candidate's profile and verifies all at once, with a downloadable-quality summary showing each credential's blockchain and IPFS status.
