import { credentialIssuanceService } from '../modules/credential-issuance/service';
import { credentialIssuanceRepository } from '../modules/credential-issuance/repository';
import { nsqfVerificationSchema } from '../modules/credential-issuance/schema';
import { ValidationError, NotFoundError } from '../utils/errors';

// Mock uuid module
jest.mock('uuid', () => ({
    v4: () => '123e4567-e89b-12d3-a456-426614174000',
    __esModule: true,
    default: { v4: () => '123e4567-e89b-12d3-a456-426614174000' }
}));

jest.mock('../modules/credential-issuance/repository');
jest.mock('../modules/skill-knowledge-base/repository');
jest.mock('../utils/filebase');
jest.mock('../utils/blockchain');
jest.mock('../utils/logger');

describe('NSQF Verification Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('verifyNSQFAlignment - Approved Status', () => {
        it('should successfully approve and update NSQF alignment with edited data', async () => {
            const mockCredential = {
                credential_id: 'test-credential-id',
                issuer_id: 1,
                learner_email: 'learner@test.com',
                certificate_title: 'AWS Cloud Developer',
                metadata: {
                    ai_extracted: {
                        skills: [
                            { name: 'AWS Development', confidence: 0.9 },
                            { name: 'Cloud Architecture', confidence: 0.85 }
                        ],
                        nsqf_alignment: {
                            job_role: 'Cloud Developer',
                            qp_code: 'QP001',
                            nsqf_level: 5,
                            reasoning: 'Initial AI reasoning',
                            confidence: 0.87
                        }
                    }
                }
            };

            const verificationData = {
                status: 'approved',
                job_role: 'AWS Cloud Solutions Architect',
                qp_code: 'QP2101',
                nsqf_level: 6,
                skills: [
                    { name: 'AWS Development', confidence: 1.0 },
                    { name: 'Cloud Architecture', confidence: 1.0 },
                    { name: 'Serverless Computing', confidence: 0.9 }
                ],
                reasoning: 'Updated reasoning after issuer review'
            };

            (credentialIssuanceRepository.findCredentialById as jest.Mock).mockResolvedValue(mockCredential);
            (credentialIssuanceRepository.updateCredentialMetadata as jest.Mock).mockResolvedValue({
                success: true
            });

            const result = await credentialIssuanceService.verifyNSQFAlignment(
                'test-credential-id',
                1,
                verificationData
            );

            expect(credentialIssuanceRepository.findCredentialById).toHaveBeenCalledWith('test-credential-id');
            expect(credentialIssuanceRepository.updateCredentialMetadata).toHaveBeenCalled();

            const updateCall = (credentialIssuanceRepository.updateCredentialMetadata as jest.Mock).mock.calls[0];
            const updatedData = updateCall[1].ai_extracted;

            expect(updatedData.skills).toHaveLength(3);
            expect(updatedData.nsqf_alignment.job_role).toBe('AWS Cloud Solutions Architect');
            expect(updatedData.nsqf_alignment.qp_code).toBe('QP2101');
            expect(updatedData.nsqf_alignment.nsqf_level).toBe(6);
            expect(updatedData.nsqf_alignment.verification_status).toBe('approved');
            expect(updatedData.nsqf_alignment.verified_by_issuer).toBe(true);
            expect(updatedData.nsqf_alignment.verified_at).toBeDefined();
        });

        it('should preserve original data when only some fields are edited', async () => {
            const mockCredential = {
                credential_id: 'test-credential-id',
                issuer_id: 1,
                metadata: {
                    ai_extracted: {
                        skills: [{ name: 'Original Skill', confidence: 0.9 }],
                        nsqf_alignment: {
                            job_role: 'Original Role',
                            qp_code: 'QP001',
                            nsqf_level: 5,
                            reasoning: 'Original reasoning',
                            confidence: 0.87
                        }
                    }
                }
            };

            const verificationData = {
                status: 'approved',
                job_role: 'Updated Role',
                nsqf_level: 6
                // Note: qp_code, skills, and reasoning not provided
            };

            (credentialIssuanceRepository.findCredentialById as jest.Mock).mockResolvedValue(mockCredential);
            (credentialIssuanceRepository.updateCredentialMetadata as jest.Mock).mockResolvedValue({});

            await credentialIssuanceService.verifyNSQFAlignment(
                'test-credential-id',
                1,
                verificationData
            );

            const updateCall = (credentialIssuanceRepository.updateCredentialMetadata as jest.Mock).mock.calls[0];
            const updatedData = updateCall[1].ai_extracted;

            expect(updatedData.nsqf_alignment.job_role).toBe('Updated Role');
            expect(updatedData.nsqf_alignment.qp_code).toBe('QP001'); // Preserved
            expect(updatedData.nsqf_alignment.nsqf_level).toBe(6);
            expect(updatedData.nsqf_alignment.reasoning).toBe('Original reasoning'); // Preserved
        });
    });

    describe('verifyNSQFAlignment - Rejected Status', () => {
        it('should mark alignment as rejected and preserve original AI data', async () => {
            const mockCredential = {
                credential_id: 'test-credential-id',
                issuer_id: 1,
                metadata: {
                    ai_extracted: {
                        skills: [{ name: 'Python', confidence: 0.9 }],
                        nsqf_alignment: {
                            job_role: 'Data Scientist',
                            qp_code: 'QP005',
                            nsqf_level: 7,
                            reasoning: 'AI detected data science skills',
                            confidence: 0.85
                        }
                    }
                }
            };

            const verificationData = {
                status: 'rejected',
                reasoning: 'Certificate does not align with NSQF framework'
            };

            (credentialIssuanceRepository.findCredentialById as jest.Mock).mockResolvedValue(mockCredential);
            (credentialIssuanceRepository.updateCredentialMetadata as jest.Mock).mockResolvedValue({});

            await credentialIssuanceService.verifyNSQFAlignment(
                'test-credential-id',
                1,
                verificationData
            );

            const updateCall = (credentialIssuanceRepository.updateCredentialMetadata as jest.Mock).mock.calls[0];
            const updatedData = updateCall[1].ai_extracted;

            expect(updatedData.nsqf_alignment.verification_status).toBe('rejected');
            expect(updatedData.nsqf_alignment.rejection_reasoning).toBe('Certificate does not align with NSQF framework');
            expect(updatedData.nsqf_alignment.verified_by_issuer).toBe(true);
            expect(updatedData.nsqf_alignment.verified_at).toBeDefined();

            // Original AI data should be preserved
            expect(updatedData.nsqf_alignment.job_role).toBe('Data Scientist');
            expect(updatedData.nsqf_alignment.qp_code).toBe('QP005');
            expect(updatedData.nsqf_alignment.nsqf_level).toBe(7);
        });
    });

    describe('verifyNSQFAlignment - Error Handling', () => {
        it('should throw NotFoundError if credential does not exist', async () => {
            (credentialIssuanceRepository.findCredentialById as jest.Mock).mockResolvedValue(null);

            const verificationData = {
                status: 'approved',
                job_role: 'Test Role',
                nsqf_level: 5
            };

            await expect(
                credentialIssuanceService.verifyNSQFAlignment('non-existent-id', 1, verificationData)
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw ValidationError if credential does not belong to issuer', async () => {
            const mockCredential = {
                credential_id: 'test-credential-id',
                issuer_id: 2, // Different issuer
                metadata: { ai_extracted: {} }
            };

            (credentialIssuanceRepository.findCredentialById as jest.Mock).mockResolvedValue(mockCredential);

            const verificationData = {
                status: 'approved',
                job_role: 'Test Role',
                nsqf_level: 5
            };

            await expect(
                credentialIssuanceService.verifyNSQFAlignment('test-credential-id', 1, verificationData)
            ).rejects.toThrow(ValidationError);
        });
    });
});

describe('NSQF Verification Schema Validation', () => {
    describe('Valid Data', () => {
        it('should validate approved status with all required fields', () => {
            const validData = {
                status: 'approved',
                job_role: 'Software Developer',
                qp_code: 'QP2101',
                nsqf_level: 5,
                skills: [
                    { name: 'JavaScript', confidence: 0.95 },
                    { name: 'React', confidence: 0.9 }
                ],
                reasoning: 'Verified alignment with NSQF Level 5'
            };

            const result = nsqfVerificationSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should validate approved status with NSQF level as string', () => {
            const validData = {
                status: 'approved',
                job_role: 'Cloud Engineer',
                nsqf_level: '6'
            };

            const result = nsqfVerificationSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should validate rejected status without job_role and nsqf_level', () => {
            const validData = {
                status: 'rejected',
                reasoning: 'Does not meet NSQF criteria'
            };

            const result = nsqfVerificationSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('Invalid Data', () => {
        it('should reject approved status without job_role', () => {
            const invalidData = {
                status: 'approved',
                nsqf_level: 5
                // Missing job_role
            };

            const result = nsqfVerificationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject approved status without nsqf_level', () => {
            const invalidData = {
                status: 'approved',
                job_role: 'Developer'
                // Missing nsqf_level
            };

            const result = nsqfVerificationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject invalid NSQF level (below 1)', () => {
            const invalidData = {
                status: 'approved',
                job_role: 'Developer',
                nsqf_level: 0
            };

            const result = nsqfVerificationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject invalid NSQF level (above 10)', () => {
            const invalidData = {
                status: 'approved',
                job_role: 'Developer',
                nsqf_level: 11
            };

            const result = nsqfVerificationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject invalid status value', () => {
            const invalidData = {
                status: 'pending',
                job_role: 'Developer',
                nsqf_level: 5
            };

            const result = nsqfVerificationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject skill with empty name', () => {
            const invalidData = {
                status: 'approved',
                job_role: 'Developer',
                nsqf_level: 5,
                skills: [
                    { name: '', confidence: 0.9 }
                ]
            };

            const result = nsqfVerificationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject skill with confidence outside 0-1 range', () => {
            const invalidData = {
                status: 'approved',
                job_role: 'Developer',
                nsqf_level: 5,
                skills: [
                    { name: 'JavaScript', confidence: 1.5 }
                ]
            };

            const result = nsqfVerificationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
