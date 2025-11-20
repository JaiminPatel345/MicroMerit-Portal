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
export const completeRegistrationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    phone : z.string().regex(/^\+?[1-9]\d{1,14}$/),
    email : z.string().email(),
    dateOfBirth : z.string().optional(), // ISO date string
    gender : z.enum(['male','female','other','prefer_not_to_say']).optional(),
    profilePhotoUrl: z.string().optional(), // Accept base64 or URL
    password: z.string().min(8),

  }),
});

// Types
export type StartRegistrationInput = z.infer<typeof startRegistrationSchema>['body'];
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>['body'];
export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>['body'];
