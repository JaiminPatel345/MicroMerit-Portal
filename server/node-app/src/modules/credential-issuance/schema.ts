import { z } from 'zod';

/**
 * Validation schema for credential issuance
 */
export const issueCredentialSchema = z.object({
    learner_email: z.string().email('Invalid email format').min(1, 'Learner email is required'),
    issuer_id: z.string().uuid('Invalid issuer ID format').or(z.number().int().positive()),
    certificate_title: z.string().min(1, 'Certificate title is required').max(500),
    issued_at: z.string().datetime('Invalid date format').or(z.date()),
});

export type IssueCredentialInput = z.infer<typeof issueCredentialSchema>;
