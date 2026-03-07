/**
 * test-checksum.ts — Standalone test to verify PDF checksum round-trip.
 *
 * Flow (mirrors issuance → verification):
 *   1. Create a simple PDF with pdf-lib
 *   2. normalizePdf(raw)   → normalizedBytes   → checksum
 *   3. embedPdfMetadata(normalizedBytes, metadata) → enrichedBytes
 *   4. stripPdfMetadata(enrichedBytes) → strippedBytes → recomputedChecksum
 *   5. Compare checksum === recomputedChecksum
 *
 * Run:  npx ts-node test-checksum.ts
 */

import { PDFDocument } from 'pdf-lib';
import crypto from 'crypto';

// ─── helpers (inline copies so we don't pull in logger, etc.) ───

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

async function stripMetadata(pdfBuffer: Buffer): Promise<Buffer> {
    const doc = await PDFDocument.load(pdfBuffer, { updateMetadata: false });
    doc.setKeywords([]);
    return Buffer.from(await doc.save());
}

// ─── main ───────────────────────────────────────────────────────

async function main() {
    console.log('=== PDF Checksum Round-Trip Test ===\n');

    // 1. Create a raw PDF
    const rawDoc = await PDFDocument.create();
    const page = rawDoc.addPage([600, 400]);
    page.drawText('MicroMerit Test Certificate', { x: 50, y: 350, size: 24 });
    page.drawText('This is a test credential PDF.', { x: 50, y: 310, size: 14 });
    const rawBytes = Buffer.from(await rawDoc.save());
    console.log(`[1] Created raw PDF: ${rawBytes.length} bytes`);
    console.log(`    Raw SHA-256: ${sha256(rawBytes)}`);

    // 2. Normalize (load + setKeywords([]) + save  —  with updateMetadata:false)
    const normalized = await normalizePdf(rawBytes);
    const checksum = sha256(normalized);
    console.log(`\n[2] Normalized PDF: ${normalized.length} bytes`);
    console.log(`    Normalized SHA-256 (THE checksum): ${checksum}`);

    // 2b. Normalize AGAIN to prove idempotency
    const normalized2 = await normalizePdf(rawBytes);
    const checksum2 = sha256(normalized2);
    console.log(`\n[2b] Re-normalized from raw: ${normalized2.length} bytes`);
    console.log(`     SHA-256: ${checksum2}`);
    console.log(`     Idempotent? ${checksum === checksum2 ? '✅ YES' : '❌ NO'}`);

    // 3. Embed metadata into the NORMALIZED bytes (mirrors blockchainQueue)
    const metadata = {
        canonical_json: {
            credential_id: 'test-123',
            learner_email: 'test@example.com',
            certificate_title: 'Test Certificate',
        },
        tx_hash: '0xabc123def456',
        checksum,
    };
    const enriched = await embedMetadata(normalized, metadata);
    console.log(`\n[3] Enriched PDF (metadata embedded): ${enriched.length} bytes`);
    console.log(`    Enriched SHA-256: ${sha256(enriched)}`);

    // 4. Strip metadata from enriched PDF (mirrors verification)
    const stripped = await stripMetadata(enriched);
    const recomputedChecksum = sha256(stripped);
    console.log(`\n[4] Stripped PDF (metadata removed): ${stripped.length} bytes`);
    console.log(`    Stripped SHA-256: ${recomputedChecksum}`);

    // 5. Compare
    console.log('\n=== RESULT ===');
    console.log(`Original checksum:    ${checksum}`);
    console.log(`Recomputed checksum:  ${recomputedChecksum}`);
    if (checksum === recomputedChecksum) {
        console.log('✅ MATCH — checksum round-trip is consistent!');
    } else {
        console.log('❌ MISMATCH — checksum round-trip FAILED');

        // Debug: compare byte-by-byte to find first difference
        const minLen = Math.min(normalized.length, stripped.length);
        console.log(`\n--- Debug ---`);
        console.log(`Normalized length: ${normalized.length}`);
        console.log(`Stripped length:   ${stripped.length}`);
        for (let i = 0; i < minLen; i++) {
            if (normalized[i] !== stripped[i]) {
                console.log(`First diff at byte ${i}: normalized=0x${normalized[i]!.toString(16)} stripped=0x${stripped[i]!.toString(16)}`);
                // Show surrounding context
                const start = Math.max(0, i - 20);
                const end = Math.min(minLen, i + 20);
                console.log(`Normalized[${start}..${end}]: ${normalized.subarray(start, end).toString('latin1')}`);
                console.log(`Stripped  [${start}..${end}]: ${stripped.subarray(start, end).toString('latin1')}`);
                break;
            }
        }
        if (normalized.length !== stripped.length) {
            console.log(`Length difference: ${normalized.length - stripped.length} bytes`);
        }
    }

    // 6. Additional test: does normalize(raw) === normalize(normalize(raw))?
    const doubleNormalized = await normalizePdf(normalized);
    const doubleChecksum = sha256(doubleNormalized);
    console.log(`\n[6] Double-normalized SHA-256: ${doubleChecksum}`);
    console.log(`    normalize(normalize(raw)) === normalize(raw)? ${checksum === doubleChecksum ? '✅ YES' : '❌ NO'}`);

    // 7. Test WITHOUT { updateMetadata: false } to show the problem
    console.log('\n=== Comparison: WITHOUT updateMetadata:false ===');
    const docBad1 = await PDFDocument.load(rawBytes); // no option!
    docBad1.setKeywords([]);
    const bad1 = Buffer.from(await docBad1.save());
    const badChecksum1 = sha256(bad1);

    // small delay to ensure different timestamp
    await new Promise(r => setTimeout(r, 50));

    const docBad2 = await PDFDocument.load(rawBytes); // no option!
    docBad2.setKeywords([]);
    const bad2 = Buffer.from(await docBad2.save());
    const badChecksum2 = sha256(bad2);

    console.log(`Without flag — call 1: ${badChecksum1}`);
    console.log(`Without flag — call 2: ${badChecksum2}`);
    console.log(`Same? ${badChecksum1 === badChecksum2 ? '✅ YES' : '❌ NO (proves the bug!)'}`);
}

main().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
