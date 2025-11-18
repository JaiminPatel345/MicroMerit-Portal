import { z } from 'zod';

// Google OAuth callback schema
export const googleCallbackSchema = z.object({
  query: z.object({
    code: z.string(),
    state: z.string().optional(),
  }),
});

// DigiLocker OAuth callback schema
export const digilockerCallbackSchema = z.object({
  query: z.object({
    code: z.string(),
    state: z.string().optional(),
  }),
});

// Types
export type GoogleCallbackQuery = z.infer<typeof googleCallbackSchema>['query'];
export type DigilockerCallbackQuery = z.infer<typeof digilockerCallbackSchema>['query'];
