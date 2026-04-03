import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import FormData from 'form-data'; // Use import for FormData
import { GoogleGenerativeAI } from '@google/generative-ai';

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
                    sector: true,
                    nsqf_level: true,
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
                            sector: cert.sector,
                            nsqf_level: cert.nsqf_level,
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
     * Generate a career roadmap for a learner using Gemini
     */
    async generateRoadmap(certificates: any[], learnerProfile: any): Promise<any> {
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const certSummary = certificates.map(c => {
                const meta = (c.metadata as any) || {};
                const aiExtracted = meta.ai_extracted || {};
                return {
                    title: c.certificate_title,
                    issuer: c.issuer?.name || meta.issuer_name || 'Unknown',
                    issued_at: c.issued_at,
                    skills: aiExtracted.skills || aiExtracted.subjects || [],
                    grade: aiExtracted.grade || aiExtracted.percentage || null
                };
            });

            const prompt = `You are an expert career advisor for the Indian job market. Analyze this learner's verified credentials and generate a personalized career roadmap.

Learner: ${learnerProfile?.name || 'Student'}
Credentials (${certSummary.length}):
${JSON.stringify(certSummary, null, 2)}

Generate a JSON response with this EXACT structure:
{
  "current_status": "<2-3 sentence summary of where this learner stands based on their actual credentials — mention specific certificate names and skills they have>",
  "title": "<a short professional title like 'Aspiring Data Scientist' or 'Emerging Full-Stack Developer' based on their credentials>",
  "future_plans": [
    {
      "goal": "<specific, actionable goal>",
      "timeline": "<e.g. 3-6 months>",
      "description": "<why this goal matters and how to achieve it>",
      "skills_to_acquire": {
        "basic": ["<foundational skills>"],
        "intermediate": ["<core skills>"],
        "advanced": ["<expert skills>"]
      }
    }
  ],
  "conditional_paths": [
    {
      "path_name": "<career path name>",
      "condition": "<what the learner needs to do>",
      "outcome": "<what career this leads to>"
    }
  ],
  "stackable_pathways": [
    {
      "pathway_name": "<progression pathway title>",
      "description": "<brief description>",
      "progress_percentage": <0-100 based on how many required skills the learner already has>,
      "estimated_duration": "<time to complete remaining>",
      "required_skills": [
        { "skill": "<skill name>", "status": "completed" },
        { "skill": "<skill name>", "status": "missing" }
      ],
      "next_credential": "<specific certification to pursue next>"
    }
  ],
  "job_opportunities": [
    {
      "role": "<specific job title>",
      "match_percentage": <0-100>,
      "salary_range": "<range in LPA for Indian market>",
      "missing_skills": ["<skills needed to qualify>"]
    }
  ]
}

Rules:
- Generate 2-3 future_plans, 2-3 conditional_paths, 1-3 stackable_pathways, 3-5 job_opportunities
- Mark skills the learner already has (from their certificates) as "completed" in stackable_pathways
- Be specific — reference actual certificate names, real technologies, real job roles
- Salary ranges should reflect current Indian job market (in LPA)
- match_percentage for jobs should reflect how many required skills the learner already has
- Return ONLY valid JSON, no markdown fences`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim();
            const jsonText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

            try {
                return JSON.parse(jsonText);
            } catch {
                console.error('Failed to parse roadmap JSON from Gemini');
                return null;
            }
        } catch (error: any) {
            console.error('AI Service - Generate Roadmap Error:', error.message);
            return null;
        }
    }

    /**
     * Generate a skill profile for a learner using Gemini
     */
    async generateSkillProfile(certificates: any[]): Promise<any> {
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const certSummary = certificates.map(c => {
                const meta = (c.metadata as any) || {};
                const aiExtracted = meta.ai_extracted || {};
                return {
                    title: c.certificate_title,
                    issuer: c.issuer?.name || meta.issuer_name || 'Unknown',
                    skills: aiExtracted.skills || aiExtracted.subjects || [],
                    grade: aiExtracted.grade || aiExtracted.percentage || null
                };
            });

            const prompt = `You are an expert career analyst for the Indian job market. Analyze these verified credentials and generate a detailed skill profile.

Credentials (${certSummary.length}):
${JSON.stringify(certSummary, null, 2)}

Generate a JSON response with this EXACT structure:
{
  "current_skills": [
    { "skill": "<skill name>", "proficiency": <0-100>, "category": "Technical|Soft|Domain", "verified_by": "<issuer name that verified this>" }
  ],
  "ready_to_apply_jobs": [
    { "role": "<job title>", "match_percentage": <0-100>, "salary_range": "<in LPA>", "matching_skills": ["<skills the learner has for this role>"] }
  ],
  "field_analysis": {
    "current_field": "<primary field based on credentials>",
    "achievable_roles": [
      { "role": "<job title>", "gap_description": "<what's needed>", "missing_skills": ["<specific skills>"], "estimated_time": "<time to bridge gap>" }
    ]
  }
}

Rules:
- Extract ALL skills from the certificate titles and metadata
- Proficiency should reflect credential level (basic cert = 40-60, advanced = 70-90)
- Include 5-10 current_skills, 3-5 ready_to_apply_jobs, 3-5 achievable_roles
- Salary ranges should reflect current Indian market in LPA
- Return ONLY valid JSON, no markdown fences`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim();
            const jsonText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

            try {
                return JSON.parse(jsonText);
            } catch {
                console.error('Failed to parse skill profile JSON from Gemini');
                return null;
            }
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
    /**
     * Compare a user-uploaded document against the official IPFS PDF using Google Gemini.
     * Unlike checksum-based verification, this uses AI vision to compare core data fields,
     * making it useful when the user only has a photo/scan of the document.
     */
    async compareDocumentsWithGemini(
        userFileBuffer: Buffer,
        userFileMimeType: string,
        ipfsPdfUrl: string,
        credentialId: string
    ): Promise<{
        match: boolean;
        confidence: number;
        mismatches: string[];
        summary: string;
    }> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured on the server.');
        }

        // Fetch the original PDF from IPFS
        let originalPdfBuffer: Buffer;
        try {
            const response = await axios.get(ipfsPdfUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
            });
            originalPdfBuffer = Buffer.from(response.data);
        } catch (err: any) {
            throw new Error(`Failed to fetch original credential PDF from IPFS: ${err.message}`);
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `You are a strict document verification expert. You have been provided two documents: the "Original Credential" (the official credential on record from IPFS) and the "Submitted Copy" (uploaded by the user for verification).

Your task is to carefully compare the core credential data in both documents field by field. The fields to compare are:
- Student/Candidate full name
- Roll number / Index number / Enrollment number
- Institution / School / University / Board name
- All subject or course names
- All subject or course codes (if present)
- Marks or grades for each subject
- Total / aggregate marks
- Final percentage
- Percentile (if present)

Rules:
1. The comparison must be EXACT — even a single character difference (including spelling, spacing, or casing) means the documents do NOT match.
2. Ignore formatting differences, watermarks, logos, fonts, colors, or image quality.
3. If any field that is present in the Original Credential is different, missing, or illegible in the Submitted Copy, the documents do NOT match.

Return ONLY a valid JSON object with the following structure (no markdown, no extra text outside the JSON):
{
  "match": true or false,
  "confidence": <integer 0-100>,
  "mismatches": ["<description of mismatch 1>", ...],
  "summary": "<one sentence summary of your finding>"
}`;

        const originalPdfPart = {
            inlineData: {
                data: originalPdfBuffer.toString('base64'),
                mimeType: 'application/pdf',
            },
        };

        // Normalize user mime type — sometimes browsers send octet-stream for PDFs
        const normalizedUserMime =
            userFileMimeType === 'application/octet-stream' ||
            userFileMimeType === 'binary/octet-stream'
                ? 'application/pdf'
                : userFileMimeType;

        const userFilePart = {
            inlineData: {
                data: userFileBuffer.toString('base64'),
                mimeType: normalizedUserMime,
            },
        };

        const result = await model.generateContent([
            { text: 'Original Credential (Official record from IPFS):' },
            originalPdfPart,
            { text: 'Submitted Copy (Uploaded by user for verification):' },
            userFilePart,
            { text: prompt },
        ]);

        const responseText = result.response.text().trim();

        // Strip markdown code fences if Gemini wraps output
        const jsonText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

        let parsed: { match: boolean; confidence: number; mismatches: string[]; summary: string };
        try {
            parsed = JSON.parse(jsonText);
        } catch {
            throw new Error(`Gemini returned an unexpected response format: ${responseText.slice(0, 200)}`);
        }

        return {
            match: Boolean(parsed.match),
            confidence: Number(parsed.confidence) || 0,
            mismatches: Array.isArray(parsed.mismatches) ? parsed.mismatches : [],
            summary: parsed.summary || '',
        };
    }

    async compareCandidates(
        candidates: Array<{ learner_id: number; credentials: any[] }>,
        context?: { skills?: string[]; sector?: string }
    ): Promise<any> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured on the server.');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const contextStr = context
            ? `Focus on skills: ${context.skills?.join(', ') || 'any'}. Sector: ${context.sector || 'any'}.`
            : '';

        const prompt = `You are a talent assessment expert. Compare the following candidates based on their verified credentials and provide a structured analysis.

${contextStr}

Candidates:
${JSON.stringify(candidates, null, 2)}

Return a JSON object with this structure:
{
  "summary": "<overall comparison summary>",
  "ranking": [{ "learner_id": <id>, "rank": <1-based rank>, "fit_score": <integer 0-100>, "strengths": ["skill1", "skill2", ...], "gaps": ["..."] }],
  "recommendation": "<who to hire and why>"
}
fit_score is a percentage (0-100) indicating how well the candidate fits based on their credentials and the requested skills. strengths should list specific skill names extracted from their credentials.
Return only valid JSON, no markdown.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        const jsonText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

        try {
            return JSON.parse(jsonText);
        } catch {
            return { summary: responseText, ranking: [], recommendation: '' };
        }
    }
}

export const aiService = new AIService();
