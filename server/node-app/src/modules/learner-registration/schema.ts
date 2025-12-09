import { z } from 'zod';

// Start Registration Schema (Page 1)
export const startRegistrationSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  }).refine(
    (data) => data.email || data.phone,
    {
      message: 'Either email or phone must be provided',
    }
  ),
});

// Verify OTP Schema (Page 2)
export const verifyOTPSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid(),
    otp: z.string().length(6).regex(/^\d{6}$/),
  }),
});

// Complete Registration Schema (Page 3)
// Note: profilePhoto comes from req.file (multipart/form-data), not req.body
export const completeRegistrationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    password: z.string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
      .optional(),
    dob: z.string().datetime().optional(), // ISO 8601 date string
    gender: z.enum(['Male', 'Female', 'Others', 'Not to disclose']).optional(),
  }),
});

// Forgot Password Schema - Step 1: Request password reset
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  }).refine(
    (data) => data.email || data.phone,
    {
      message: 'Either email or phone must be provided',
    }
  ),
});

// Verify Reset OTP Schema - Step 2: Verify OTP for password reset
export const verifyResetOTPSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid(),
    otp: z.string().length(6).regex(/^\d{6}$/),
  }),
});

// Reset Password Schema - Step 3: Set new password
export const resetPasswordSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid(),
    otp: z.string().length(6).regex(/^\d{6}$/),
    newPassword: z.string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  }),
});

// Resend OTP Schema
export const resendOTPSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid(),
  }),
});

// Types
export type StartRegistrationInput = z.infer<typeof startRegistrationSchema>['body'];
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>['body'];
export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type VerifyResetOTPInput = z.infer<typeof verifyResetOTPSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type ResendOTPInput = z.infer<typeof resendOTPSchema>['body'];
