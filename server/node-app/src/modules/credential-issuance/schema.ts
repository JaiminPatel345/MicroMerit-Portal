import { z } from 'zod';

/**
 * Validation schema for credential issuance
 */
export const issueCredentialSchema = z.object({
    learner_email: z.string().email('Invalid email format').min(1, 'Learner email is required'),
    certificate_title: z.string().min(1, 'Certificate title is required').max(500),
    issued_at: z.string().datetime('Invalid date format').or(z.date()),
});

/**
 * Skill validation schema
 */
const skillSchema = z.object({
    name: z.string().min(1, 'Skill name cannot be empty').max(200, 'Skill name too long'),
    confidence: z.number().min(0).max(1).optional().default(1.0)
});

/**
 * NSQF Level validation - must be between 1 and 10
 */
const nsqfLevelSchema = z.union([
    z.number().int().min(1).max(10),
    z.string().refine((val) => {
        const num = parseInt(val);
        return !isNaN(num) && num >= 1 && num <= 10;
    }, { message: 'NSQF level must be between 1 and 10' })
]);

/**
 * NSQF Alignment validation schema
 */
const nsqfAlignmentSchema = z.object({
    job_role: z.string().min(1, 'Job role is required when providing NSQF alignment').max(500),
    qp_code: z.string().max(100).optional(),
    nsqf_level: nsqfLevelSchema.optional(),
    reasoning: z.string().max(2000).optional(),
    confidence: z.number().min(0).max(1).optional(),
    verified_at: z.string().datetime().optional(),
    verified_by_issuer: z.boolean().optional()
});

/**
 * AI Extracted Data validation schema
 */
export const aiExtractedDataSchema = z.object({
    skills: z.array(skillSchema).optional().default([]),
    nsqf_alignment: nsqfAlignmentSchema.optional(),
    keywords: z.array(z.string()).optional(),
    certificate_metadata: z.record(z.any()).optional(),
    description: z.string().optional()
}).passthrough();

/**
 * Verification Status schema for issuer approval/rejection
 */
export const verificationStatusSchema = z.object({
    aligned: z.boolean(),
    qp_code: z.string().nullable().optional(),
    nos_code: z.string().nullable().optional(),
    nsqf_level: nsqfLevelSchema.nullable().optional(),
    confidence: z.number().min(0).max(1).nullable().optional(),
    reasoning: z.string().max(2000).nullable().optional()
});

/**
 * Schema for NSQF verification endpoint (PUT /credentials/:id/nsqf-verification)
 */
export const nsqfVerificationSchema = z.object({
    status: z.enum(['approved', 'rejected'], {
        errorMap: () => ({ message: 'Status must be either "approved" or "rejected"' })
    }),
    job_role: z.string().min(1).max(500).optional(),
    qp_code: z.string().max(100).optional(),
    nsqf_level: nsqfLevelSchema.optional(),
    skills: z.array(skillSchema).optional(),
    reasoning: z.string().max(2000).optional()
}).refine(
    (data) => data.status === 'rejected' || (data.job_role && data.nsqf_level),
    {
        message: 'job_role and nsqf_level are required when status is "approved"',
        path: ['job_role']
    }
);

export type IssueCredentialInput = z.infer<typeof issueCredentialSchema>;
export type AIExtractedData = z.infer<typeof aiExtractedDataSchema>;
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;
export type NSQFVerification = z.infer<typeof nsqfVerificationSchema>;
