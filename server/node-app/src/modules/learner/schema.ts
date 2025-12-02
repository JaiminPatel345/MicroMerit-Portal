import { z } from 'zod';

/**
 * Learner registration schema
 */
export const learnerRegistrationSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^(\+?\d{1,3})?[6-9]\d{9}$/, 'Invalid phone number. Must be exactly 10 digits starting with 6-9').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  profileFolder: z.string().optional(),
  profileUrl: z.string().optional(), // Accept base64 or URL
  external_digilocker_id: z.string().optional(),
  other_emails: z.array(z.string().email('Invalid email')).optional(),
  dob: z.date().optional(),
  gender: z.enum(['Male', 'Female', 'Others', 'Not to disclose']).optional(),
}).refine(
  (data) => data.email || data.phone,
  { message: 'Either email or phone is required' }
);

export type LearnerRegistrationInput = z.infer<typeof learnerRegistrationSchema>;

/**
 * Learner login schema
 */
export const learnerLoginSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^(\+?\d{1,3})?[6-9]\d{9}$/, 'Invalid phone number. Must be exactly 10 digits starting with 6-9').optional(),
  password: z.string().min(1, 'Password is required'),
}).refine(
  (data) => data.email || data.phone,
  { message: 'Either email or phone is required' }
);

export type LearnerLoginInput = z.infer<typeof learnerLoginSchema>;

/**
 * Update learner profile schema
 * Note: profilePhoto comes from req.file (multipart/form-data), not req.body
 */
export const updateLearnerProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^(\+?\d{1,3})?[6-9]\d{9}$/, 'Invalid phone number. Must be exactly 10 digits starting with 6-9').optional(),
  dob: z.string().optional(), // ISO 8601 date string
  gender: z.enum(['Male', 'Female', 'Others', 'Not to disclose']).optional(),
});

export type UpdateLearnerProfileInput = z.infer<typeof updateLearnerProfileSchema>;

/**
 * Request to add email schema (Step 1)
 */
export const requestAddEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type RequestAddEmailInput = z.infer<typeof requestAddEmailSchema>;

/**
 * Verify email OTP schema (Step 2)
 */
export const verifyEmailOTPSchema = z.object({
  sessionId: z.string().uuid(),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

export type VerifyEmailOTPInput = z.infer<typeof verifyEmailOTPSchema>;

/**
 * Request to add primary email schema (for phone-registered users)
 */
export const requestAddPrimaryEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type RequestAddPrimaryEmailInput = z.infer<typeof requestAddPrimaryEmailSchema>;

/**
 * Verify and set primary email OTP schema
 */
export const verifyPrimaryEmailOTPSchema = z.object({
  sessionId: z.string().uuid(),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

export type VerifyPrimaryEmailOTPInput = z.infer<typeof verifyPrimaryEmailOTPSchema>;

/**
 * Request to add primary phone schema (for email-registered users)
 */
export const requestAddPrimaryPhoneSchema = z.object({
  phone: z.string().regex(/^(\+?\d{1,3})?[6-9]\d{9}$/, 'Invalid phone number. Must be exactly 10 digits starting with 6-9'),
});

export type RequestAddPrimaryPhoneInput = z.infer<typeof requestAddPrimaryPhoneSchema>;

/**
 * Verify and set primary phone OTP schema
 */
export const verifyPrimaryPhoneOTPSchema = z.object({
  sessionId: z.string().uuid(),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

export type VerifyPrimaryPhoneOTPInput = z.infer<typeof verifyPrimaryPhoneOTPSchema>;

/**
 * Unified contact verification request schema
 */
export const requestContactVerificationSchema = z.object({
  type: z.enum(['email', 'primary-email', 'primary-phone']),
  email: z.string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(254, 'Email must not exceed 254 characters')
    .optional(),
  phone: z.string()
    .regex(/^(\+?\d{1,3})?[6-9]\d{9}$/, 'Invalid phone number. Must be exactly 10 digits starting with 6-9')
    .optional(),
}).refine(
  (data) => {
    if (data.type === 'email' || data.type === 'primary-email') {
      return !!data.email;
    }
    if (data.type === 'primary-phone') {
      if (!data.phone) return false;
      // Extract last 10 digits and verify
      const last10Digits = data.phone.slice(-10);
      return last10Digits.length === 10 && /^[6-9]/.test(last10Digits);
    }
    return false;
  },
  { message: 'Valid email is required for email types, valid 10-digit phone number is required for phone type' }
);

export type RequestContactVerificationInput = z.infer<typeof requestContactVerificationSchema>;

/**
 * Unified contact verification schema
 */
export const verifyContactSchema = z.object({
  type: z.enum(['email', 'primary-email', 'primary-phone']),
  sessionId: z.string().uuid(),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

export type VerifyContactInput = z.infer<typeof verifyContactSchema>;
