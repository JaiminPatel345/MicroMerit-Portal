import { z } from 'zod';

// Verify Credential by UID Schema
export const verifyCredentialSchema = z.object({
  params: z.object({
    credential_uid: z.string().min(1),
  }),
});

// Verify PDF Upload Schema
export const verifyPdfSchema = z.object({
  file: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string().refine(
      (type) => type === 'application/pdf',
      { message: 'File must be a PDF' }
    ),
    buffer: z.instanceof(Buffer),
    size: z.number().max(10 * 1024 * 1024, 'PDF file must be less than 10MB'),
  }),
});

// Types
export type VerifyCredentialParams = z.infer<typeof verifyCredentialSchema>['params'];
export type VerifyPdfFile = z.infer<typeof verifyPdfSchema>['file'];
