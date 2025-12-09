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
            // const docFile = req.file; // From multer (Removed)

            const result = await employerService.register(data);
            sendSuccess(res, result, 'Registration successful', 201);

            // Registration is now step 1 (unverified), so no tokens yet.
            res.status(201).json({
                success: true,
                message: result.message,
                data: { email: result.email, id: result.id }
            });
        } catch (error: any) {
            logger.error('Employer registration failed', { error: error.message, stack: error.stack });

            // Handle different types of errors
            let userMessage = 'Registration failed. Please try again.';
            let statusCode = 400;

            // Prisma errors
            if (error.code === 'P2002') {
                // Unique constraint violation
                const field = error.meta?.target?.[0] || 'field';
                if (field === 'email') {
                    userMessage = 'An account with this email already exists.';
                } else if (field === 'pan_number') {
                    userMessage = 'This PAN number is already registered.';
                } else {
                    userMessage = `This ${field} is already registered.`;
                }
            } else if (error.code?.startsWith('P')) {
                // Other Prisma errors
                userMessage = 'Database error occurred. Please contact support if this persists.';
                statusCode = 500;
            } else if (error.name === 'ZodError') {
                // Validation errors
                userMessage = error.errors?.[0]?.message || 'Invalid input data.';
            } else if (error.message) {
                // Custom application errors
                userMessage = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message: userMessage
            });
        }
    }

    async verifyEmail(req: Request, res: Response) {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) throw new Error('Email and OTP are required');

            const result = await employerService.verifyRegistrationOtp(email, otp);

            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    tokens: result.tokens,
                    employer: result.employer
                }
            });
        } catch (error: any) {
            logger.error('Employer email verification failed', { error: error.message });

            let userMessage = 'Verification failed. Please try again.';
            let statusCode = 400;

            if (error.message.includes('not found')) {
                userMessage = 'Account not found. Please register first.';
            } else if (error.message.includes('already verified')) {
                userMessage = 'This account is already verified. Please login.';
            } else if (error.message.includes('Invalid or expired')) {
                userMessage = 'OTP has expired. Please request a new one.';
            } else if (error.message.includes('Invalid OTP')) {
                userMessage = 'Incorrect OTP. Please check and try again.';
            } else if (error.message) {
                userMessage = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message: userMessage
            });
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

    async extractCredentialId(req: Request, res: Response) {
        try {
            if (!req.user) return sendError(res, 'Unauthorized');
            if (!req.file) return sendError(res, 'No file uploaded', 'Validation Error', 400);

            // Import dynamically or assume aiService is globally available if imported at top
            const { aiService } = await import('../ai/ai.service');
            
            const result = await aiService.extractCredentialId(req.file.buffer, req.file.originalname);
            console.log('Extraction Result:', result);
            sendSuccess(res, result, 'Extraction Complete');
        } catch (error: any) {
            sendError(res, error.message, 'Extraction Failed', 500);
        }
    }

    async bulkVerifyUpload(req: Request, res: Response) {
        try {
            if (!req.user) return sendError(res, 'Unauthorized');
            if (!req.file) return sendError(res, 'No file uploaded', 'Validation Error', 400);

            const { aiService } = await import('../ai/ai.service');

            const file = req.file;
            const mimeType = file.mimetype;

            let credentialIds: string[] = [];
            const report: any = {
                processed_files: 0,
                successful_extractions: 0,
                failed_extractions: 0,
                extraction_errors: [],
                verification_results: []
            };

            // ---- CSV ----
            if (mimeType.includes('csv') || file.originalname.endsWith('.csv')) {
                const csvContent = file.buffer.toString('utf-8');

                credentialIds = csvContent
                    .split(/[\r\n,]+/)
                    .map(id => id.trim())
                    .filter(Boolean);

                report.processed_files = credentialIds.length;
                report.successful_extractions = credentialIds.length;
            }

            // ---- ZIP ----
            else if (mimeType.includes('zip') || file.originalname.endsWith('.zip')) {
                console.log('Processing ZIP file...');

                const extractionResult = await aiService.extractBulkIds(file.buffer, file.originalname);
                if (!extractionResult?.success) {
                    return sendError(res, 'Failed to process ZIP file', 'Processing Error', 500);
                }

                report.processed_files = extractionResult.total;

                const extractedResults = extractionResult.results || [];

                // Efficient streaming-style filtering
                const validExtractions = [];
                const errors = [];

                for (const r of extractedResults) {
                    if (r.certificate_number && (r.status === 'found' || r.status === 'needs_review')) {
                        validExtractions.push(r);
                    } else {
                        errors.push({ filename: r.filename, error: r.error || 'No ID found' });
                    }
                }

                credentialIds = validExtractions.map((r: any) => r.certificate_number);

                report.successful_extractions = credentialIds.length;
                report.failed_extractions = report.processed_files - report.successful_extractions;
                report.extraction_errors = errors;
            }

            else {
                return sendError(res, 'Unsupported file type. Upload CSV or ZIP only.', 'Validation Error', 400);
            }

            // No extracted IDs
            if (credentialIds.length === 0) {
                return sendSuccess(res, { report }, 'No valid credential IDs found to verify.');
            }

            // ---- Efficient parallel verify (chunk size 100) ----
            console.log(`Verifying ${credentialIds.length} IDs...`);

            const chunkSize = 100;
            const chunks = [];

            for (let i = 0; i < credentialIds.length; i += chunkSize) {
                chunks.push(credentialIds.slice(i, i + chunkSize));
            }

            const results = await Promise.allSettled(
                chunks.map(chunk => employerService.bulkVerify(req.user!.id, chunk))
            );

            // Flatten and filter errors
            report.verification_results = results.flatMap((r: any) =>
                r.status === 'fulfilled' ? r.value : [{ error: r.reason }]
            );

            return sendSuccess(res, { report }, 'Bulk Verification Processed');

        } catch (error: any) {
            logger.error('Bulk Verify Upload Error:', error);
            return sendError(res, error.message, 'Bulk Verification Failed', 500);
        }
    }
}

export const employerController = new EmployerController();
