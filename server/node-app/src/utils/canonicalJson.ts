import crypto from 'crypto';

/**
 * Credential canonical JSON structure
 * This is the deterministic JSON format used for hashing
 */
export interface CanonicalCredential {
    credential_id: string;
    learner_id: string | null;
    learner_email: string;
    issuer_id: string;
    certificate_title: string;
    issued_at: string; // ISO string
    ipfs_cid: string | null;
    pdf_url: string | null;
    blockchain: {
        network: string;
        contract_address: string;
        tx_hash: string | null;
    };
    meta_hash_alg: string;
    data_hash: string | null;
}

/**
 * Build canonical JSON for credential
 * Fields are ordered deterministically for consistent hashing
 */
export function buildCanonicalJson(params: {
    credential_id: string;
    learner_id: number | null;
    learner_email: string;
    issuer_id: number;
    certificate_title: string;
    issued_at: Date;
    network: string;
    contract_address: string;
    ipfs_cid?: string | null;
    pdf_url?: string | null;
    tx_hash?: string | null;
    data_hash?: string | null;
}): CanonicalCredential {
    return {
        credential_id: params.credential_id,
        learner_id: params.learner_id !== null ? params.learner_id.toString() : null,
        learner_email: params.learner_email,
        issuer_id: params.issuer_id.toString(),
        certificate_title: params.certificate_title,
        issued_at: params.issued_at.toISOString(),
        ipfs_cid: params.ipfs_cid || null,
        pdf_url: params.pdf_url || null,
        blockchain: {
            network: params.network,
            contract_address: params.contract_address,
            tx_hash: params.tx_hash || null,
        },
        meta_hash_alg: 'sha256',
        data_hash: params.data_hash || null,
    };
}

/**
 * Recursively sort all keys in an object for deterministic JSON serialization.
 * Unlike JSON.stringify's array replacer (which filters nested keys),
 * this preserves ALL keys at every nesting level.
 */
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

/**
 * Compute SHA256 hash of canonical JSON
 * The data_hash field should be null when computing the hash.
 *
 * Uses deepSortKeys to ensure ALL keys (including nested objects like
 * `blockchain`) are sorted deterministically before serialization.
 */
export function computeDataHash(canonicalJson: CanonicalCredential): string {
    // Create a copy with data_hash = null for hashing
    const jsonForHashing = { ...canonicalJson, data_hash: null };

    // Deep-sort keys at every nesting level, then stringify
    const sorted = deepSortKeys(jsonForHashing);
    const jsonString = JSON.stringify(sorted);

    // Compute SHA256 hash
    return crypto.createHash('sha256').update(jsonString).digest('hex');
}

/**
 * Verify credential integrity by recomputing hash
 */
export function verifyCredentialHash(
    credential: CanonicalCredential,
    expectedHash: string
): boolean {
    const recomputedHash = computeDataHash(credential);
    return recomputedHash === expectedHash;
}
