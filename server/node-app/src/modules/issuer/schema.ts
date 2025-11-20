import { z } from 'zod';

/**
 * Start Issuer registration schema (Step 1 - Send OTP)
 */
export const startIssuerRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(3, 'Name must be at least 3 characters').max(255),
  official_domain: z.string().optional().nullable(),
  website_url: z.string().url('Invalid URL').optional().nullable(),
  type: z.enum(['university', 'edtech', 'company', 'training_provider'], {
    errorMap: () => ({ message: 'Type must be one of: university, edtech, company, training_provider' }),
  }),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  contact_person_name: z.string().min(2).max(255),
  contact_person_designation: z.string().min(2).max(255),
  address: z.string().min(10).max(1000),
  kyc_document_url: z.string().url('Invalid URL'),
  logo_url: z.string().url('Invalid URL').optional().nullable(),
});

export type StartIssuerRegistrationInput = z.infer<typeof startIssuerRegistrationSchema>;

/**
 * Verify OTP for issuer registration (Step 2)
 */
export const verifyIssuerOTPSchema = z.object({
  sessionId: z.string().uuid(),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

export type VerifyIssuerOTPInput = z.infer<typeof verifyIssuerOTPSchema>;

/**
 * Issuer registration schema (Legacy - deprecated)
 */
export const issuerRegistrationSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(255),
  official_domain: z.string().url('Invalid URL').optional(),
  website_url: z.string().url('Invalid URL').optional(),
  type: z.enum(['university', 'edtech', 'company', 'training_provider'], {
    errorMap: () => ({ message: 'Type must be one of: university, edtech, company, training_provider' }),
  }),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  contact_person_name: z.string().min(2).max(255).optional(),
  contact_person_designation: z.string().min(2).max(255).optional(),
  address: z.string().min(10).max(1000).optional(),
  kyc_document_url: z.string().url('Invalid URL').optional(),
  logo_url: z.string().url('Invalid URL').optional(),
});

export type IssuerRegistrationInput = z.infer<typeof issuerRegistrationSchema>;

/**
 * Issuer login schema
 */
export const issuerLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type IssuerLoginInput = z.infer<typeof issuerLoginSchema>;

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * Update issuer profile schema
 */
export const updateIssuerProfileSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  official_domain: z.string().optional(),
  website_url: z.string().url('Invalid URL').optional(),
  type: z.enum(['university', 'edtech', 'company', 'training_provider']).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  contact_person_name: z.string().min(2).max(255).optional(),
  contact_person_designation: z.string().min(2).max(255).optional(),
  address: z.string().min(10).max(1000).optional(),
  kyc_document_url: z.string().url('Invalid URL').optional(),
  logo_url: z.string().url('Invalid URL').optional(),
});

export type UpdateIssuerProfileInput = z.infer<typeof updateIssuerProfileSchema>;
