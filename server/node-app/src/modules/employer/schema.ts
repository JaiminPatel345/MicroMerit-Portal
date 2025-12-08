import { z } from 'zod';

export const employerRegistrationSchema = z.object({
    company_name: z.string().min(2, 'Company name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    phone: z.string().optional(),
    company_website: z.string().url().optional().or(z.literal('')),
    company_address: z.string().optional(),
    industry_type: z.string().optional(),
    company_size: z.string().optional(),
    contact_person: z.string().min(2, 'Contact person name is required'),
    pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN Card Number'),
});

export const employerLoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const updateEmployerProfileSchema = z.object({
    company_name: z.string().min(2).optional(),
    company_website: z.string().url().optional().or(z.literal('')),
    company_address: z.string().optional(),
    industry_type: z.string().optional(),
    company_size: z.string().optional(),
    contact_person: z.string().optional(),
    phone: z.string().optional(),
});

export type EmployerRegistrationInput = z.infer<typeof employerRegistrationSchema>;
export type EmployerLoginInput = z.infer<typeof employerLoginSchema>;
export type UpdateEmployerProfileInput = z.infer<typeof updateEmployerProfileSchema>;

export const bulkVerifySchema = z.object({
    credential_ids: z.array(z.string()),
});

// Candidate Search Schema
export const candidateSearchSchema = z.object({
    keyword: z.string().optional(),
    skills: z.union([z.string(), z.array(z.string())]).optional(), // Comma separated
    sector: z.string().optional(),
    nsqf_level: z.string().or(z.number()).optional(),
    job_role: z.string().optional(),
    issuer: z.string().optional(),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string(),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
