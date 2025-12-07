import { Request, Response } from 'express';
import { employerService } from './service';
import { employerRegistrationSchema, employerLoginSchema, updateEmployerProfileSchema, refreshTokenSchema, bulkVerifySchema, candidateSearchSchema } from './schema';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';

export class EmployerController {
    async register(req: Request, res: Response) {
        try {
            // Parse body first (could be form-data)
            // If validation fails here, check if body is parsed correctly by multer/express
            const data = employerRegistrationSchema.parse(req.body);
            const docFile = req.file; // From multer

            const result = await employerService.register(data, docFile);
            sendSuccess(res, result, 'Registration successful', 201);

            // Registration is now step 1 (unverified), so no tokens yet.
            res.status(201).json({
                success: true,
                message: result.message,
                data: { email: result.email, id: result.id }
            });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async verifyEmail(req: Request, res: Response) {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) throw new Error('Email and OTP are required');

            const result = await employerService.verifyRegistrationOtp(email, otp);

            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const data = employerLoginSchema.parse(req.body);
            const result = await employerService.login(data);
            sendSuccess(res, result, 'Login successful');
        } catch (error: any) {
            logger.error('Employer login failed', error);
            sendError(res, error.message, 'Login failed', 401);
        }
    }

    async getMe(req: Request, res: Response) {
        try {
            if (!req.user) return sendError(res, 'Unauthorized', 'Unauthorized', 401);
            const result = await employerService.getProfile(req.user.id);
            sendSuccess(res, result, 'Profile retrieved');
        } catch (error: any) {
            sendError(res, error.message, 'Failed to get profile', 500);
        }
    }

    async updateMe(req: Request, res: Response) {
        try {
            if (!req.user) return sendError(res, 'Unauthorized', 'Unauthorized', 401);
            const data = updateEmployerProfileSchema.parse(req.body);
            const result = await employerService.updateProfile(req.user.id, data);
            sendSuccess(res, result, 'Profile updated');
        } catch (error: any) {
            sendError(res, error.message, 'Failed to update profile', 400);
        }
    }

    async refreshToken(req: Request, res: Response) {
        try {
            const { refreshToken } = refreshTokenSchema.parse(req.body);
            const tokens = await employerService.refreshToken(refreshToken);
            sendSuccess(res, tokens, 'Token refreshed');
        } catch (error: any) {
            // 401 ideally for auth failures
            sendError(res, error.message, 'Refresh failed', 401);
        }
    }

    async verify(req: Request, res: Response) {
        try {
            if (!req.user) return sendError(res, 'Unauthorized');
            console.log('Verify Request Body:', req.body);
            const { credential_id, tx_hash, ipfs_cid } = req.body;
            
            if (!credential_id && !tx_hash && !ipfs_cid) {
                return sendError(res, 'Credential ID, Transaction Hash, or IPFS CID is required', 'Validation Error', 400);
            }

            const verificationInput = { 
                credential_id, 
                tx_hash, 
                ipfs_cid 
            };

            const result = await employerService.verifyCredential(req.user.id, verificationInput);
            sendSuccess(res, result, 'Verification Complete');
        } catch (error: any) {
            sendError(res, error.message, 'Verification Failed', 500);
        }
    }

    async bulkVerify(req: Request, res: Response) {
        try {
            if (!req.user) return sendError(res, 'Unauthorized');
            const { credential_ids } = bulkVerifySchema.parse(req.body);

            const result = await employerService.bulkVerify(req.user.id, credential_ids);
            sendSuccess(res, result, 'Bulk Verification Complete');
        } catch (error: any) {
            sendError(res, error.message, 'Bulk Verification Failed', 500);
        }
    }

    async searchCandidates(req: Request, res: Response) {
        try {
            if (!req.user) return sendError(res, 'Unauthorized');
            // Parse query params
            const filters = candidateSearchSchema.parse(req.query);

            const result = await employerService.searchCandidates(req.user.id, filters);
            sendSuccess(res, result, 'Search Results');
        } catch (error: any) {
            sendError(res, error.message, 'Search Failed', 500);
        }
    }

    async getDashboardStats(req: Request, res: Response) {
        try {
            if (!req.user) return sendError(res, 'Unauthorized');
            const result = await employerService.getDashboardStats(req.user.id);
            sendSuccess(res, result, 'Dashboard Stats');
        } catch (error: any) {
            sendError(res, error.message, 'Failed to get stats', 500);
        }
    }
}

export const employerController = new EmployerController();
