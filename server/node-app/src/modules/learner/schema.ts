import { z } from 'zod';

/**
 * Learner registration schema
 */
export const learnerRegistrationSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  profileFolder: z.string().optional(),
  profileUrl: z.string().url('Invalid URL').optional(),
  external_digilocker_id: z.string().optional(),
  other_emails: z.array(z.string().email('Invalid email')).optional(),
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
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  password: z.string().min(1, 'Password is required'),
}).refine(
  (data) => data.email || data.phone,
  { message: 'Either email or phone is required' }
);

export type LearnerLoginInput = z.infer<typeof learnerLoginSchema>;

/**
 * Update learner profile schema
 */
export const updateLearnerProfileSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  profileFolder: z.string().optional(),
  profileUrl: z.string().url('Invalid URL').optional(),
  external_digilocker_id: z.string().optional(),
  other_emails: z.array(z.string().email('Invalid email')).optional(),
});

export type UpdateLearnerProfileInput = z.infer<typeof updateLearnerProfileSchema>;
