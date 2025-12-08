/**
 * Jaimin Pvt Ltd Provider Routes
 * Simple API key authentication
 */

import { Router, Request, Response } from 'express';
import { getCredentialsSince, getCredentialsByProvider } from '../data/seed.js';
import { JaiminCredentialResponse } from '../types/index.js';

const router = Router();

// Valid API keys (in production, these would be in a database)
const validApiKeys = new Set(['mock-api-key', 'jaimin-test-key', 'dev-key-123']);

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
 * GET /jaimin/api/certs
 * Fetch certificates with API key auth
 */
router.get('/api/certs', verifyApiKey, (req: Request, res: Response) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : new Date(0);
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const { credentials, total, hasMore } = getCredentialsSince('jaimin', since, limit, offset);

    // Transform to Jaimin Pvt Ltd format
    const jaiminCredentials: JaiminCredentialResponse[] = credentials.map(c => ({
        cert_id: c.id,
        trainee_email: c.learner_email,
        trainee_name: c.learner_name,
        program_name: c.certificate_title,
        program_code: c.certificate_code,
        industry_sector: c.sector,
        skill_level: c.nsqf_level,
        duration_hours: c.max_hr,
        completed_on: c.issued_at.toISOString().split('T')[0], // YYYY-MM-DD format
        issued_by: c.awarding_body,
    }));

    res.json({
        success: true,
        data: jaiminCredentials,
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
 * GET /jaimin/api/certs/:id
 * Get a specific certificate
 */
router.get('/api/certs/:id', verifyApiKey, (req: Request, res: Response) => {
    const credentials = getCredentialsByProvider('jaimin');
    const credential = credentials.find(c => c.id === req.params.id);

    if (!credential) {
        res.status(404).json({
            success: false,
            error: 'Not found',
            message: 'Certificate not found'
        });
        return;
    }

    const jaiminCredential: JaiminCredentialResponse = {
        cert_id: credential.id,
        trainee_email: credential.learner_email,
        trainee_name: credential.learner_name,
        program_name: credential.certificate_title,
        program_code: credential.certificate_code,
        industry_sector: credential.sector,
        skill_level: credential.nsqf_level,
        duration_hours: credential.max_hr,
        completed_on: credential.issued_at.toISOString().split('T')[0],
        issued_by: credential.awarding_body,
    };

    res.json({
        success: true,
        data: jaiminCredential,
    });
});

/**
 * POST /jaimin/api/verify
 * Verify a certificate
 */
router.post('/api/verify', verifyApiKey, (req: Request, res: Response) => {
    const { cert_id, trainee_email } = req.body;

    if (!cert_id) {
        res.status(400).json({
            success: false,
            error: 'Missing cert_id'
        });
        return;
    }

    const credentials = getCredentialsByProvider('jaimin');
    const credential = credentials.find(c => c.id === cert_id);

    if (!credential) {
        res.json({
            success: true,
            verified: false,
            reason: 'Certificate not found in records',
        });
        return;
    }

    if (trainee_email && credential.learner_email !== trainee_email) {
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
        certificate: {
            program_name: credential.certificate_title,
            completed_on: credential.issued_at.toISOString().split('T')[0],
            issued_by: credential.awarding_body,
        },
    });
});

export default router;
