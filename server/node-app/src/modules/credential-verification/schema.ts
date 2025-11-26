import { z } from 'zod';

/**
 * Credential verification schema
 * Accepts ONE of: credential_id, tx_hash, or ipfs_cid
 * 
 * Note: QR codes are NOT sent to backend. They are frontend-only and contain
 * a URL that opens the verification page with data pre-filled.
 */
export const verifyCredentialSchema = z.object({
    credential_id: z.string().uuid().optional(),
    tx_hash: z.string().optional(),
    ipfs_cid: z.string().optional(),
}).refine(
    (data) => {
        const fields = [data.credential_id, data.tx_hash, data.ipfs_cid].filter(Boolean);
        return fields.length === 1;
    },
    {
        message: 'Exactly one of credential_id, tx_hash, or ipfs_cid must be provided',
    }
);

export type VerifyCredentialInput = z.infer<typeof verifyCredentialSchema>;
