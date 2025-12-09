import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import FormData from 'form-data'; // Use import for FormData

const prisma = new PrismaClient();

export class AIService {
    private aiServiceUrl: string;

    constructor() {
        this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    }

    /**
     * Get AI-powered recommendations for a learner
     * Backend fetches certificates from PostgreSQL and sends to AI service
     */
    async getRecommendations(learnerEmail: string): Promise<any> {
        try {
            // Fetch learner's certificates from PostgreSQL
            const certificates = await prisma.credential.findMany({
                where: {
                    learner_email: learnerEmail,
                    status: 'issued'
                },
                select: {
                    certificate_title: true,
                    metadata: true,
                    issued_at: true,
                    issuer: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            // Send certificate data to AI service
            // Only send relevant data, exclude hashes, blockchain info, etc.
            const response = await axios.post(
                `${this.aiServiceUrl}/ai/recommendations`,
                {
                    learner_email: learnerEmail,
                    certificates: certificates.map(cert => {
                        const metadata = cert.metadata as any;

                        // Extract only relevant data for AI processing
                        const aiRelevantData: any = {
                            certificate_title: cert.certificate_title,
                            issuer_name: cert.issuer.name,
                            issued_at: cert.issued_at,
                            metadata: {}
                        };

                        // Include AI-extracted data if available
                        if (metadata?.ai_extracted) {
                            aiRelevantData.metadata.ai_extracted = {
                                skills: metadata.ai_extracted.skills || [],
                                nsqf: metadata.ai_extracted.nsqf || {},
                                keywords: metadata.ai_extracted.keywords || [],
                                description: metadata.ai_extracted.description || '',
                                certificate_metadata: metadata.ai_extracted.certificate_metadata || {}
                            };
                        }

                        // Include issuer name from metadata if available
                        if (metadata?.issuer_name) {
                            aiRelevantData.metadata.issuer_name = metadata.issuer_name;
                        }

                        return aiRelevantData;
                    })
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('AI Service - Get Recommendations Error:', error.response?.data || error.message);

            // If no certificates found or empty, return empty recommendations
            if (error.response?.status === 404) {
                return {
                    skills: [],
                    recommended_next_skills: [],
                    role_suggestions: [],
                    learning_path: [],
                    recommended_courses: [],
                    nsqf_level: 1,
                    nsqf_confidence: 0,
                    confidence: 0,
                    source: 'none'
                };
            }

            throw {
                status: error.response?.status || 500,
                message: error.response?.data?.detail || 'Failed to get recommendations'
            };
        }
    }

    /**
     * Process OCR for a certificate (called internally by credential issuance service)
     * Backend sends file data to AI service for processing
     */
    async processOCR(
        fileBuffer: Buffer,
        filename: string,
        learnerEmail: string,
        certificateTitle: string,
        issuerName: string,
        nsqfContext: any[] = [] // Default to empty array
    ): Promise<any> {
        try {
            const formData = new FormData();

            formData.append('file', fileBuffer, filename);
            formData.append('learner_email', learnerEmail);
            formData.append('certificate_title', certificateTitle);
            formData.append('issuer_name', issuerName);

            // Pass NSQF context as JSON string
            if (nsqfContext && nsqfContext.length > 0) {
                formData.append('nsqf_context', JSON.stringify(nsqfContext));
            }

            const response = await axios.post(
                `${this.aiServiceUrl}/ai/process-ocr`,
                formData,
                {
                    headers: formData.getHeaders(),
                    timeout: 30000
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('AI Service - OCR Error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            throw {
                status: error.response?.status || 500,
                message: error.response?.data?.detail || error.message || 'Failed to process OCR'
            };
        }
    }

    /**
     * Health check for AI service
     */
    async healthCheck(): Promise<any> {
        try {
            const response = await axios.get(`${this.aiServiceUrl}/ai/health`, {
                timeout: 5000
            });
            return response.data;
        } catch (error: any) {
            console.error('AI Service - Health Check Error:', error.message);
            return {
                status: 'error',
                message: 'AI service is not available'
            };
        }
    }
    /**
     * Generate a career roadmap for a learner
     */
    async generateRoadmap(certificates: any[], learnerProfile: any): Promise<any> {
        try {
            const response = await axios.post(
                `${this.aiServiceUrl}/ai/generate-roadmap`,
                {
                    certificates,
                    learner_profile: learnerProfile
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 45000 // Longer timeout for generation
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('AI Service - Generate Roadmap Error:', error.message);
            return null;
        }
    }

    /**
     * Generate a skill profile for a learner
     */
    async generateSkillProfile(certificates: any[]): Promise<any> {
        try {
            const response = await axios.post(
                `${this.aiServiceUrl}/ai/generate-skill-profile`,
                {
                    certificates
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 45000
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('AI Service - Generate Skill Profile Error:', error.message);
            return null;
        }
    }

    /**
     * Enrich credential metadata with job-related info
     */
    /**
     * Enrich credential metadata with job-related info
     */
    async enrichCredentialMetadata(certificateTitle: string, nosData: any): Promise<any> {
        try {
            const response = await axios.post(
                `${this.aiServiceUrl}/ai/enrich-credential`,
                {
                    certificate_title: certificateTitle,
                    nos_data: nosData
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                }
            );

            const data = response.data;

            // Transform to match frontend expectations
            return {
                job_recommendations: (data.related_job_roles || []).map((role: string) => ({
                    role: role,
                    match_percentage: 85 + Math.floor(Math.random() * 10), // Mock match % for now as AI doesn't return it
                    reasoning: data.job_recommendation || `Recommended based on your ${certificateTitle} certificate.`
                })),
                nos_data: {
                    qp_code: nosData?.qp_code || 'N/A',
                    nos_code: nosData?.nos_code || 'N/A',
                    description: nosData?.description || data.job_recommendation || 'Aligned with National Occupational Standards.'
                },
                ...data // Keep original data too
            };
        } catch (error: any) {
            console.error('AI Service - Enrich Credential Error:', error.message);
            return {};
        }
    }

    /**
     * Extract Credential ID from a PDF using the AI Service OCR
     */
    async extractCredentialId(fileBuffer: Buffer, filename: string): Promise<{ credential_id: string | null, found: boolean, status?: string, confidence?: number, message?: string }> {
        try {
            const formData = new FormData();
            formData.append('file', fileBuffer, filename);

            const response = await axios.post(
                `${this.aiServiceUrl}/ai/extract-certificate-id`,
                formData,
                {
                    headers: formData.getHeaders(),
                    timeout: 20000 // 20s timeout for OCR
                }
            );

            // Map new python response to old service interface + new fields
            const data = response.data;
            return {
                credential_id: data.certificate_number,
                found: data.status === 'found' || data.status === 'needs_review',
                status: data.status,
                confidence: data.confidence,
                message: data.status === 'not_found' ? 'No credential ID found' : undefined
            };

        } catch (error: any) {
            console.error('AI Service - Extract ID Error:', error.message);
            if (error.response) {
                console.error('AI Service Detailed Error:', JSON.stringify(error.response.data));
            }
            throw {
                status: error.response?.status || 500,
                message: error.response?.data?.detail || 'Failed to extract credential ID'
            };
        }
    }

    /**
     * Extract multiple Credential IDs from a ZIP file
     */
    async extractBulkIds(fileBuffer: Buffer, filename: string): Promise<{ success: boolean, total: number, results: any[] }> {
        try {
            const formData = new FormData();
            formData.append('file', fileBuffer, filename);

            const response = await axios.post(
                `${this.aiServiceUrl}/ai/extract-bulk-ids`,
                formData,
                {
                    headers: formData.getHeaders(),
                    timeout: 60000 // 60s timeout for bulk OCR
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('AI Service - Bulk Extract Error:', error.message);
            throw {
                status: error.response?.status || 500,
                message: error.response?.data?.detail || 'Failed to process bulk extraction'
            };
        }
    }

    /**
     * Analyze stackability for a qualification
     * Used for external credential sync to determine progression pathways
     */
    async analyzeStackability(stackabilityRequest: {
        code?: string;
        level?: number;
        progression_pathway?: string;
        qualification_type?: string;
        sector_name?: string;
        training_delivery_hours?: string;
        min_notational_hours?: number;
        max_notational_hours?: number;
        proposed_occupation?: string;
        skills?: string[];
    }): Promise<any> {
        try {
            const response = await axios.post(
                `${this.aiServiceUrl}/ai/stackability`,
                stackabilityRequest,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('AI Service - Stackability Analysis Error:', error.response?.data || error.message);
            // Return empty pathways on error instead of throwing
            return { pathways: [] };
        }
    }

    /**
     * Generate career pathway/roadmap for a credential
     * Used for external credential sync to provide career guidance
     */
    async generatePathway(certificates: any[], learnerProfile?: any): Promise<any> {
        try {
            const response = await axios.post(
                `${this.aiServiceUrl}/generate-roadmap`,
                {
                    certificates,
                    learner_profile: learnerProfile || {}
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 45000
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('AI Service - Pathway Generation Error:', error.response?.data || error.message);
            // Return null on error
            return null;
        }
    }

    /**
     * Chat with AI about a learner's credentials
     * Used by employers to ask questions about learner skills and qualifications
     */
    async chatWithLearnerProfile(learnerEmail: string, question: string, credentials: any[]): Promise<any> {
        try {
            console.log(`[AI Service] Chat request for ${learnerEmail}`);
            console.log(`[AI Service] Question: ${question}`);
            console.log(`[AI Service] Credentials count: ${credentials.length}`);

            const response = await axios.post(
                `${this.aiServiceUrl}/ai/employer-chat`,
                {
                    learner_email: learnerEmail,
                    question,
                    credentials
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                }
            );

            console.log(`[AI Service] Chat response received successfully`);
            return response.data;
        } catch (error: any) {
            console.error('[AI Service] Employer Chat Error:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: `${this.aiServiceUrl}/ai/employer-chat`
            });

            // Return a default response on error
            return {
                answer: 'I am unable to process your question at this time. Please try again later.',
                relevant_skills: [],
                certificates_referenced: [],
                confidence: 0.0
            };
        }
    }
}

export const aiService = new AIService();
