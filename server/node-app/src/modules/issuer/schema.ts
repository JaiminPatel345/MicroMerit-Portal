import { z } from 'zod';

/**
 * Start Issuer registration schema (Step 1 - Send OTP)
 */
export const startIssuerRegistrationSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(255),
  official_domain: z.string().trim().regex(/^(?!-)[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/, 'Invalid domain name (e.g., example.com or subdomain.example.com)').optional(),
  website_url: z.string().trim().url('Invalid URL').optional(),
  type: z.enum(['university', 'edtech', 'company', 'training_provider'], {
    errorMap: () => ({ message: 'Type must be one of: university, edtech, company, training_provider' }),
  }),
  phone: z.string().trim().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  contact_person_name: z.string().trim().min(2).max(255).optional(),
  contact_person_designation: z.string().trim().min(2).max(255).optional(),
  address: z.string().trim().min(5).max(1000).optional(),
  kyc_document_url: z.string().trim().url('Invalid URL').optional(),
  logo_url: z.string().trim().url('Invalid URL').optional(),
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
  official_domain: z.string().regex(/^(?!-)[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/, 'Invalid domain name (e.g., example.com or subdomain.example.com)').optional(),
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
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type IssuerLoginInput = z.infer<typeof issuerLoginSchema>;

/**
 * Forgot password schema
 */
export const issuerForgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

export type IssuerForgotPasswordInput = z.infer<typeof issuerForgotPasswordSchema>;

/**
 * Reset password schema
 */
export const issuerResetPasswordSchema = z.object({
  sessionId: z.string().uuid(),
  otp: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export type IssuerResetPasswordInput = z.infer<typeof issuerResetPasswordSchema>;

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * Resend OTP schema
 */
export const resendOTPSchema = z.object({
  sessionId: z.string().uuid(),
});

export type ResendOTPInput = z.infer<typeof resendOTPSchema>;

/**
 * Update issuer profile schema
 * Note: logo comes from req.file (multipart/form-data), not req.body
 */
export const updateIssuerProfileSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  official_domain: z.string().regex(/^(?!-)[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/, 'Invalid domain name (e.g., example.com or subdomain.example.com)').optional(),
  website_url: z.string().url('Invalid URL').optional(),
  type: z.enum(['university', 'edtech', 'company', 'training_provider']).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  contact_person_name: z.string().min(2).max(255).optional(),
  contact_person_designation: z.string().min(2).max(255).optional(),
  address: z.string().min(10).max(1000).optional(),
  kyc_document_url: z.string().url('Invalid URL').optional(),
});

export type UpdateIssuerProfileInput = z.infer<typeof updateIssuerProfileSchema>;
