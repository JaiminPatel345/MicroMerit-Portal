import { employerRepository } from './repository';
import { hashPassword, comparePassword } from '../../utils/bcrypt';
import { generateTokens, TokenResponse } from '../../utils/jwt';
import { EmployerRegistrationInput, EmployerLoginInput, UpdateEmployerProfileInput, refreshTokenSchema } from './schema';
import { credentialVerificationService } from '../credential-verification/service';
import { logger } from '../../utils/logger';
import { uploadImageBufferToS3 } from '../../utils/imageUpload'; // Assuming we reuse this for docs/logos

export class EmployerService {
    async register(data: EmployerRegistrationInput) {
        const existing = await employerRepository.findByEmail(data.email);
        if (existing) {
            if (existing.status === 'unverified') {
                // For simplicity now, throw exist.
            }
            throw new Error('Employer with this email already exists');
        }

        const password_hash = await hashPassword(data.password);

        // Create employer with status 'unverified'
        const employer = await employerRepository.create({
            company_name: data.company_name,
            email: data.email,
            password_hash,
            phone: data.phone,
            company_website: data.company_website,
            company_address: data.company_address,
            industry_type: data.industry_type,
            company_size: data.company_size,
            contact_person: data.contact_person,
            pan_number: data.pan_number,
            status: 'unverified', // Wait for OTP
        });

        // Generate and Send OTP
        const { generateOTP, hashOTP, getOTPExpiry } = require('../../utils/otp');
        // const { sendOTP } = require('../../utils/notification');

        const otp = generateOTP(6);
        const otpHash = await hashOTP(otp);
        const expiresAt = getOTPExpiry(); // Usually 10 mins

        await employerRepository.createVerificationSession({
            session_type: 'employer_registration',
            employer_id: employer.id,
            email: employer.email,
            otp_hash: otpHash,
            expires_at: expiresAt
        });

        // await sendOTP('email', employer.email, otp);
        console.log('OTP:', otp);

        return {
            success: true,
            message: 'Registration successful. Please verify OTP sent to your email.',
            email: employer.email,
            id: employer.id
        };
    }

    async verifyRegistrationOtp(email: string, otp: string) {
        const employer = await employerRepository.findByEmail(email);
        if (!employer) throw new Error('Employer not found');
        if (employer.status !== 'unverified') throw new Error('Account already verified or processed');

        // Verify OTP
        const { prisma } = require('../../utils/prisma');
        const session = await prisma.verification_session.findFirst({
            where: {
                employer_id: employer.id,
                session_type: 'employer_registration',
                is_verified: false,
                expires_at: { gt: new Date() }
            },
            orderBy: { created_at: 'desc' }
        });

        if (!session) throw new Error('Invalid or expired OTP session');

        const { verifyOTP: verifyOTPUtil } = require('../../utils/otp');
        const isValid = await verifyOTPUtil(otp, session.otp_hash);
        if (!isValid) throw new Error('Invalid OTP');

        // Mark session verified
        await employerRepository.updateVerificationSession(session.id, { is_verified: true, verified_at: new Date() });

        // Update Employer Status to 'active' (Approved instantly)
        const updatedEmployer = await employerRepository.updateStatus(employer.id, 'active');

        // Generate tokens directly so they can login immediately
        const tokens = generateTokens({
            id: updatedEmployer.id,
            email: updatedEmployer.email,
            role: 'employer',
        });

        return {
            success: true,
            message: 'Email verified. Account is now active.',
            tokens,
            employer: this.sanitize(updatedEmployer)
        };
    }

    async login(data: EmployerLoginInput) {
        const employer = await employerRepository.findByEmail(data.email);
        if (!employer) {
            throw new Error('Invalid email or password');
        }

        const valid = await comparePassword(data.password, employer.password_hash);
        if (!valid) {
            throw new Error('Invalid email or password');
        }

        if (employer.status === 'unverified') {
            throw new Error('Email not verified. Please verify your email.');
        }

        // Removed pending check as approval is skipped, but kept rejected just in case
        if (employer.status === 'rejected') {
            throw new Error(`Account rejected. Reason: ${employer.rejected_reason}`);
        }

        const tokens = generateTokens({
            id: employer.id,
            email: employer.email,
            role: 'employer',
        });

        return {
            employer: this.sanitize(employer),
            tokens
        };
    }

    async refreshToken(token: string) {
        try {
            const jwt = require('jsonwebtoken');
            const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;

            if (payload.role !== 'employer') throw new Error('Invalid token type');

            const employer = await employerRepository.findById(payload.id);
            if (!employer) throw new Error('Employer not found');

            // Should also check status here? Yes.
            if (employer.status !== 'approved') throw new Error('Account not active/approved');

            // Generate NEW tokens
            const tokens = generateTokens({
                id: employer.id,
                email: employer.email,
                role: 'employer',
            });

            return tokens;

        } catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }

    async getProfile(id: number) {
        const employer = await employerRepository.findById(id);
        if (!employer) throw new Error('Employer not found');
        return this.sanitize(employer);
    }

    async updateProfile(id: number, data: UpdateEmployerProfileInput) {
        const updated = await employerRepository.update(id, data);
        return this.sanitize(updated);
    }

    async verifyCredential(employerId: number, verificationInput: any) {
        // 1. Verify credential
        const result = await credentialVerificationService.verifyCredential(verificationInput);

        // 2. Log activity
        // Extract an ID for logging if available, otherwise just use input string
        const credId = verificationInput.credential_id || verificationInput.tx_hash || verificationInput.ipfs_cid || 'unknown';
        await employerRepository.logActivity(employerId, 'verify', credId, { status: result.status });

        return result;
    }

    async bulkVerify(employerId: number, credentialIds: string[]) {
        // Limit batch size if needed
        if (credentialIds.length > 100) throw new Error('Bulk verification limited to 100 credentials at a time');

        const results = await Promise.all(credentialIds.map(async (id) => {
            try {
                const res = await credentialVerificationService.verifyCredential({ credential_id: id });
                return { 
                    id, 
                    status: res.status, 
                    valid: res.status === 'VALID',
                    credential: res.credential,
                    verified_fields: res.verified_fields,
                    reason: res.reason
                };
            } catch (e: any) {
                return { id, status: 'ERROR', error: e.message };
            }
        }));

        // Log bulk activity (summary)
        await employerRepository.logActivity(employerId, 'bulk_verify', undefined, {
            count: credentialIds.length,
            valid_count: results.filter(r => r.valid).length
        });

        return results;
    }

    async searchCandidates(employerId: number, filters: any) {
        const candidates = await employerRepository.searchCandidates(filters);

        // Log search (fix undefined details)
        await employerRepository.logActivity(employerId, 'search', undefined, filters);

        return candidates;
    }

    async getDashboardStats(employerId: number) {
        return employerRepository.getStats(employerId);
    }

    private sanitize(employer: any) {
        const { password_hash, ...rest } = employer;
        return rest;
    }
}

export const employerService = new EmployerService();
