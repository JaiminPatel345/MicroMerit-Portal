import { z } from 'zod';

/**
 * Admin login schema
 */
export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

/**
 * Approve issuer schema
 */
export const approveIssuerSchema = z.object({
  notes: z.string().optional(),
});

export type ApproveIssuerInput = z.infer<typeof approveIssuerSchema>;

/**
 * Reject issuer schema
 */
export const rejectIssuerSchema = z.object({
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters').max(500),
});

export type RejectIssuerInput = z.infer<typeof rejectIssuerSchema>;

/**
 * Block issuer schema
 */
export const blockIssuerSchema = z.object({
  reason: z.string().min(10, 'Block reason must be at least 10 characters').max(500),
});

export type BlockIssuerInput = z.infer<typeof blockIssuerSchema>;

/**
 * Unblock issuer schema
 */
export const unblockIssuerSchema = z.object({
  notes: z.string().optional(),
});

export type UnblockIssuerInput = z.infer<typeof unblockIssuerSchema>;
