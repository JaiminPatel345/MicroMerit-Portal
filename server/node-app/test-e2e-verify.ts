/**
 * test-e2e-verify.ts — End-to-end test simulating issuance → verification.
 *
 * Tests:
 *   1. computeDataHash produces the same hash given the same canonical JSON
 *   2. normalizePdf → checksum is consistent
 *   3. embedPdfMetadata preserves canonical_json (no stripNulls mutation)
 *   4. stripPdfMetadata → checksum matches original
 *   5. Extracted canonical_json re-hashes to the same data_hash
 *
 * Run:  npx ts-node test-e2e-verify.ts
 */

import { PDFDocument } from 'pdf-lib';
import crypto from 'crypto';

// ─── Inline copies of production functions ───

function deepSortKeys(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(deepSortKeys);
    const sorted: Record<string, any> = {};
    for (const key of Object.keys(obj).sort()) {
        sorted[key] = deepSortKeys(obj[key]);
    }
    return sorted;
}

function computeDataHash(canonicalJson: any): string {
    const jsonForHashing = { ...canonicalJson, data_hash: null };
    const sorted = deepSortKeys(jsonForHashing);
    const jsonString = JSON.stringify(sorted);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
}

function sha256(buf: Buffer | Uint8Array): string {
    return crypto.createHash('sha256').update(buf).digest('hex');
}

async function normalizePdf(pdfBuffer: Buffer): Promise<Buffer> {
    const doc = await PDFDocument.load(pdfBuffer, { updateMetadata: false });
    doc.setKeywords([]);
    return Buffer.from(await doc.save());
}

async function embedMetadata(pdfBuffer: Buffer, meta: object): Promise<Buffer> {
    const doc = await PDFDocument.load(pdfBuffer, { updateMetadata: false });
    doc.setKeywords([JSON.stringify(meta)]);
    return Buffer.from(await doc.save());
}

async function extractMetadata(pdfBuffer: Buffer): Promise<any | null> {
    const doc = await PDFDocument.load(pdfBuffer, { updateMetadata: false });
    const kw = doc.getKeywords();
    if (!kw) return null;
    return JSON.parse(kw);
}

async function stripMetadata(pdfBuffer: Buffer): Promise<Buffer> {
    const doc = await PDFDocument.load(pdfBuffer, { updateMetadata: false });
    doc.setKeywords([]);
    return Buffer.from(await doc.save());
}

// ─── Main ───

async function main() {
    let pass = 0, fail = 0;
    const assert = (label: string, ok: boolean, detail?: string) => {
        if (ok) { pass++; console.log(`  ✅ ${label}`); }
        else { fail++; console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`); }
    };

    console.log('\n=== End-to-End Verification Test ===\n');

    // ── Step 1: Create raw PDF ──
    console.log('[1] Creating raw PDF...');
    const rawDoc = await PDFDocument.create();
    const page = rawDoc.addPage([600, 400]);
    page.drawText('Test Certificate', { x: 50, y: 350, size: 24 });
    const rawPdf = Buffer.from(await rawDoc.save());
    console.log(`    Raw PDF: ${rawPdf.length} bytes\n`);

    // ── Step 2: Normalize + checksum (same as issuance service.ts) ──
    console.log('[2] Normalizing PDF & computing checksum...');
    const normalizedPdf = await normalizePdf(rawPdf);
    const checksum = sha256(normalizedPdf);
    console.log(`    Normalized: ${normalizedPdf.length} bytes`);
    console.log(`    Checksum: ${checksum}\n`);

    // ── Step 3: Build canonical JSON (same as issuance) ──
    console.log('[3] Building canonical JSON...');
    const canonicalJson = {
        credential_id: 'test-uuid-1234',
        learner_id: '1',
        learner_email: 'test@example.com',
        issuer_id: '1',
        certificate_title: 'Test Cert',
        issued_at: '2026-03-06T23:11:04.296Z',
        ipfs_cid: null,
        pdf_url: null,
        blockchain: {
            network: 'sepolia',
            contract_address: '0xa5A36eB55522FD75e6153d45D17416AbfFD57976',
            tx_hash: null,
        },
        meta_hash_alg: 'sha256',
        data_hash: null,
    };
    const data_hash = computeDataHash(canonicalJson);
    console.log(`    data_hash: ${data_hash}`);

    // Verify deep sort includes blockchain internals
    const sortedJson = deepSortKeys({ ...canonicalJson, data_hash: null });
    const jsonStr = JSON.stringify(sortedJson);
    console.log(`    Serialized for hashing: ${jsonStr}`);
    assert('blockchain.contract_address in hash input', jsonStr.includes('contract_address'));
    assert('blockchain.network in hash input', jsonStr.includes('"network":"sepolia"'));
    assert('blockchain.tx_hash in hash input', jsonStr.includes('"tx_hash":null'));
    console.log();

    // ── Step 4: Embed metadata into normalized PDF (same as blockchainQueue) ──
    console.log('[4] Embedding metadata into PDF...');
    const tx_hash = '0xfake_tx_hash_for_testing';
    const pdfMetadata = {
        canonical_json: canonicalJson,
        tx_hash,
        checksum,
        data_hash,
    };
    const enrichedPdf = await embedMetadata(normalizedPdf, pdfMetadata);
    console.log(`    Enriched PDF: ${enrichedPdf.length} bytes\n`);

    // ── Step 5: Extract metadata from enriched PDF (same as verification) ──
    console.log('[5] Extracting metadata from enriched PDF...');
    const extracted = await extractMetadata(enrichedPdf);
    assert('Metadata extracted', !!extracted);
    assert('tx_hash matches', extracted.tx_hash === tx_hash);
    assert('checksum matches', extracted.checksum === checksum);
    assert('data_hash matches', extracted.data_hash === data_hash);

    // Verify canonical_json preserved EXACTLY (including nulls)
    assert('canonical_json.ipfs_cid is null', extracted.canonical_json.ipfs_cid === null);
    assert('canonical_json.pdf_url is null', extracted.canonical_json.pdf_url === null);
    assert('canonical_json.data_hash is null', extracted.canonical_json.data_hash === null);
    assert('canonical_json.blockchain.tx_hash is null', extracted.canonical_json.blockchain?.tx_hash === null);
    assert('canonical_json.credential_id preserved', extracted.canonical_json.credential_id === 'test-uuid-1234');
    console.log();

    // ── Step 6: Re-hash canonical_json from PDF metadata (same as verify-by-PDF) ──
    console.log('[6] Re-computing data_hash from extracted canonical_json...');
    const recomputedDataHash = computeDataHash(extracted.canonical_json);
    assert('data_hash from extracted canonical matches', recomputedDataHash === data_hash,
        `stored=${data_hash} recomputed=${recomputedDataHash}`);
    console.log();

    // ── Step 7: Strip metadata and verify checksum (same as verification) ──
    console.log('[7] Stripping metadata from enriched PDF & re-checking checksum...');
    const strippedPdf = await stripMetadata(enrichedPdf);
    const recomputedChecksum = sha256(strippedPdf);
    assert('Checksum after strip matches', recomputedChecksum === checksum,
        `stored=${checksum} recomputed=${recomputedChecksum}`);
    console.log();

    // ── Step 8: Test idempotency ──
    console.log('[8] Testing idempotency...');
    const normalized2 = await normalizePdf(rawPdf);
    assert('normalizePdf idempotent', sha256(normalized2) === checksum);

    const stripped2 = await stripMetadata(enrichedPdf);
    assert('stripMetadata idempotent', sha256(stripped2) === checksum);

    const doubleStripped = await stripMetadata(strippedPdf);
    assert('double-strip idempotent', sha256(doubleStripped) === checksum);
    console.log();

    // ── Step 9: verify-by-credential-id simulation ──
    console.log('[9] Simulating verify-by-credential-id...');
    // This is what the verification service does — rebuild canonical from DB fields
    const rebuiltCanonical = {
        credential_id: 'test-uuid-1234',
        learner_id: '1',
        learner_email: 'test@example.com',
        issuer_id: '1',
        certificate_title: 'Test Cert',
        issued_at: '2026-03-06T23:11:04.296Z',
        ipfs_cid: null,
        pdf_url: null,
        blockchain: {
            network: 'sepolia',
            contract_address: '0xa5A36eB55522FD75e6153d45D17416AbfFD57976',
            tx_hash: null,
        },
        meta_hash_alg: 'sha256',
        data_hash: null,
    };
    const rebuiltHash = computeDataHash(rebuiltCanonical);
    assert('verify-by-id: recomputed hash matches', rebuiltHash === data_hash,
        `stored=${data_hash} rebuilt=${rebuiltHash}`);
    console.log();

    // ── Summary ──
    console.log(`\n=== RESULTS: ${pass} passed, ${fail} failed ===`);
    if (fail > 0) {
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
});
