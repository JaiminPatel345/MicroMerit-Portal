import axios from 'axios';
import { PrismaClient } from '@prisma/client';

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
            const response = await axios.post(
                `${this.aiServiceUrl}/recommendations`,
                {
                    learner_email: learnerEmail,
                    certificates: certificates.map(cert => ({
                        certificate_title: cert.certificate_title,
                        issuer_name: cert.issuer.name,
                        issued_at: cert.issued_at,
                        metadata: cert.metadata
                    }))
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
        issuerName: string
    ): Promise<any> {
        try {
            const FormData = require('form-data');
            const formData = new FormData();

            formData.append('file', fileBuffer, filename);
            formData.append('learner_email', learnerEmail);
            formData.append('certificate_title', certificateTitle);
            formData.append('issuer_name', issuerName);

            const response = await axios.post(
                `${this.aiServiceUrl}/process-ocr`,
                formData,
                {
                    headers: formData.getHeaders(),
                    timeout: 30000
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('AI Service - OCR Error:', error.response?.data || error.message);
            throw {
                status: error.response?.status || 500,
                message: error.response?.data?.detail || 'Failed to process OCR'
            };
        }
    }

    /**
     * Health check for AI service
     */
    async healthCheck(): Promise<any> {
        try {
            const response = await axios.get(`${this.aiServiceUrl}/health`, {
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
}

export const aiService = new AIService();
