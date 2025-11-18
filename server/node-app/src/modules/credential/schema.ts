import { z } from 'zod';

// Issue Credential Schema
export const issueCredentialSchema = z.object({
  body: z.object({
    learnerEmail: z.string().email().optional(),
    learnerPhone: z.string().optional(),
    credentialUid: z.string().min(1),
    metadata: z.record(z.any()),
  }).refine(
    (data) => data.learnerEmail || data.learnerPhone,
    {
      message: 'Either learnerEmail or learnerPhone must be provided',
    }
  ),
});

// Claim Credential Schema
export const claimCredentialSchema = z.object({
  body: z.object({
    credentialUid: z.string().min(1),
  }),
});

// Revoke Credential Schema
export const revokeCredentialSchema = z.object({
  body: z.object({
    credentialUid: z.string().min(1),
    reason: z.string().optional(),
  }),
});

// Get Credential Schema
export const getCredentialSchema = z.object({
  params: z.object({
    credentialUid: z.string().min(1),
  }),
});

// Types
export type IssueCredentialInput = z.infer<typeof issueCredentialSchema>['body'];
export type ClaimCredentialInput = z.infer<typeof claimCredentialSchema>['body'];
export type RevokeCredentialInput = z.infer<typeof revokeCredentialSchema>['body'];
export type GetCredentialParams = z.infer<typeof getCredentialSchema>['params'];
