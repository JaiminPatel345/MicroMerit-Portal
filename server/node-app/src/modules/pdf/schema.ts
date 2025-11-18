import { z } from 'zod';

// Generate PDF Certificate Schema
export const generatePdfSchema = z.object({
  body: z.object({
    credentialUid: z.string().min(1),
    templateType: z.enum(['standard', 'achievement', 'course']).optional().default('standard'),
  }),
});

// Get PDF Certificate Schema
export const getPdfSchema = z.object({
  params: z.object({
    credentialUid: z.string().min(1),
  }),
});

// Types
export type GeneratePdfInput = z.infer<typeof generatePdfSchema>['body'];
export type GetPdfParams = z.infer<typeof getPdfSchema>['params'];
