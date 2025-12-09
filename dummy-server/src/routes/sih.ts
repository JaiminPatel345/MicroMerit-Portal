/**
 * SIH (Smart India Hackathon) Provider Routes
 * Simple API key authentication
 */

import { Router, Request, Response } from 'express';
import { getCredentialsSince, getCredentialsByProvider } from '../data/seed.js';
import { SIHCredentialResponse } from '../types/index.js';
import { generatePDFFromCredential } from '../utils/pdf-generator.js';

const router = Router();

// Valid API keys (in production, these would be in a database)
const validApiKeys = new Set(['mock-api-key', 'sih-test-key', 'dev-key-123']);

/**
 * Middleware to verify API key
 */
function verifyApiKey(req: Request, res: Response, next: Function) {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
        res.status(401).json({
            success: false,
            error: 'API key required',
            message: 'Please provide X-API-Key header'
        });
        return;
    }

    if (!validApiKeys.has(apiKey)) {
        res.status(403).json({
            success: false,
            error: 'Invalid API key',
            message: 'The provided API key is not valid'
        });
        return;
    }

    next();
}

/**
 * GET /sih/api/credentials
 * Fetch credentials with API key auth
 */
router.get('/api/credentials', verifyApiKey, (req: Request, res: Response) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : new Date(0);
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const { credentials, total, hasMore } = getCredentialsSince('sih', since, limit, offset);

    // Transform to SIH format
    const sihCredentials: SIHCredentialResponse[] = credentials.map(c => ({
        credential_id: c.id,
        participant_email: c.learner_email,
        participant_name: c.learner_name,
        skill_title: c.certificate_title,
        skill_code: c.certificate_code,
        sector: c.sector,
        proficiency_level: c.nsqf_level,
        training_duration: c.max_hr,
        completion_date: c.issued_at.toISOString().split('T')[0], // YYYY-MM-DD format
        certifying_authority: c.awarding_bodies[0] || 'Smart India Hackathon',
        certificate_url: `${req.protocol}://${req.get('host')}/sih/api/credentials/${c.id}/pdf`,
    }));

    res.json({
        success: true,
        data: sihCredentials,
        meta: {
            total,
            limit,
            offset,
            has_more: hasMore,
            next_offset: hasMore ? offset + limit : null,
        },
    });
});

/**
 * GET /sih/api/credentials/:id
 * Get a specific credential
 */
router.get('/api/credentials/:id', verifyApiKey, (req: Request, res: Response) => {
    const credentials = getCredentialsByProvider('sih');
    const credential = credentials.find(c => c.id === req.params.id);

    if (!credential) {
        res.status(404).json({
            success: false,
            error: 'Not found',
            message: 'Credential not found'
        });
        return;
    }

    const sihCredential: SIHCredentialResponse = {
        credential_id: credential.id,
        participant_email: credential.learner_email,
        participant_name: credential.learner_name,
        skill_title: credential.certificate_title,
        skill_code: credential.certificate_code,
        sector: credential.sector,
        proficiency_level: credential.nsqf_level,
        training_duration: credential.max_hr,
        completion_date: credential.issued_at.toISOString().split('T')[0],
        certifying_authority: credential.awarding_bodies[0] || 'Smart India Hackathon',
        certificate_url: `${req.protocol}://${req.get('host')}/sih/api/credentials/${credential.id}/pdf`,
    };

    res.json({
        success: true,
        data: sihCredential,
    });
});

/**
 * GET /sih/api/credentials/:id/pdf
 * Download certificate PDF
 */
router.get('/api/credentials/:id/pdf', async (req: Request, res: Response) => {
    const credentials = getCredentialsByProvider('sih');
    const credential = credentials.find(c => c.id === req.params.id);

    if (!credential) {
        res.status(404).json({
            success: false,
            error: 'Not found',
            message: 'Credential not found'
        });
        return;
    }

    try {
        // Generate PDF
        const pdfBuffer = await generatePDFFromCredential(credential);

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `inline; filename="credential-${credential.id}.pdf"`
        );
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('PDF generation failed:', error);
        res.status(500).json({
            success: false,
            error: 'PDF generation failed',
            message: error.message
        });
    }
});

/**
 * POST /sih/api/verify
 * Verify a credential
 */
router.post('/api/verify', verifyApiKey, (req: Request, res: Response) => {
    const { credential_id, participant_email } = req.body;

    if (!credential_id) {
        res.status(400).json({
            success: false,
            error: 'Missing credential_id'
        });
        return;
    }

    const credentials = getCredentialsByProvider('sih');
    const credential = credentials.find(c => c.id === credential_id);

    if (!credential) {
        res.json({
            success: true,
            verified: false,
            reason: 'Credential not found in records',
        });
        return;
    }

    if (participant_email && credential.learner_email !== participant_email) {
        res.json({
            success: true,
            verified: false,
            reason: 'Email mismatch',
        });
        return;
    }

    res.json({
        success: true,
        verified: true,
        credential: {
            skill_title: credential.certificate_title,
            completion_date: credential.issued_at.toISOString().split('T')[0],
            certifying_authority: credential.awarding_bodies[0] || 'Smart India Hackathon',
        },
    });
});

export default router;
