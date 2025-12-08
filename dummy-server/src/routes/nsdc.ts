/**
 * NSDC Provider Routes
 * Mimics NSDC-style API for credential fetching
 */

import { Router, Request, Response } from 'express';
import { getCredentialsSince, getCredentialsByProvider } from '../data/seed.js';
import { NSDCCredentialResponse, PaginatedResponse } from '../types/index.js';

const router = Router();

// Mock tokens storage
const tokens: Map<string, { expires: Date; clientId: string }> = new Map();

/**
 * POST /nsdc/auth
 * Authenticate and get access token
 */
router.post('/auth', (req: Request, res: Response) => {
    const { client_id, client_secret } = req.body;

    // Accept any credentials for mock server
    if (!client_id || !client_secret) {
        res.status(400).json({ error: 'Missing client_id or client_secret' });
        return;
    }

    const token = `nsdc_token_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

    tokens.set(token, { expires, clientId: client_id });

    res.json({
        access_token: token,
        token_type: 'Bearer',
        expires_in: 3600,
    });
});

/**
 * Middleware to verify token
 */
function verifyToken(req: Request, res: Response, next: Function) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
    }

    const token = authHeader.slice(7);
    const tokenData = tokens.get(token);

    if (!tokenData || tokenData.expires < new Date()) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }

    next();
}

/**
 * GET /nsdc/credentials
 * Fetch credentials since a given timestamp
 */
router.get('/credentials', verifyToken, (req: Request, res: Response) => {
    const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 10;
    const offset = (page - 1) * perPage;

    const { credentials, total, hasMore } = getCredentialsSince('nsdc', since, perPage, offset);

    // Transform to NSDC format
    const nsdcCredentials: NSDCCredentialResponse[] = credentials.map(c => ({
        credential_id: c.id,
        candidate_name: c.learner_name,
        candidate_email: c.learner_email,
        qualification_title: c.certificate_title,
        qp_code: c.certificate_code,
        sector: c.sector,
        nsqf_level: c.nsqf_level,
        training_hours: {
            min: c.min_hr,
            max: c.max_hr,
        },
        awarding_bodies: c.awarding_bodies,
        occupation: c.occupation,
        tags: c.tags,
        issue_date: c.issued_at.toISOString(),
        certificate_url: `https://nsdc.example.com/cert/${c.id}`,
    }));

    const response: PaginatedResponse<NSDCCredentialResponse> = {
        data: nsdcCredentials,
        pagination: {
            page,
            per_page: perPage,
            total,
            total_pages: Math.ceil(total / perPage),
            next_page_token: hasMore ? `page_${page + 1}` : undefined,
        },
    };

    res.json(response);
});

/**
 * GET /nsdc/credentials/:id
 * Get a specific credential
 */
router.get('/credentials/:id', verifyToken, (req: Request, res: Response) => {
    const credentials = getCredentialsByProvider('nsdc');
    const credential = credentials.find(c => c.id === req.params.id);

    if (!credential) {
        res.status(404).json({ error: 'Credential not found' });
        return;
    }

    const nsdcCredential: NSDCCredentialResponse = {
        credential_id: credential.id,
        candidate_name: credential.learner_name,
        candidate_email: credential.learner_email,
        qualification_title: credential.certificate_title,
        qp_code: credential.certificate_code,
        sector: credential.sector,
        nsqf_level: credential.nsqf_level,
        training_hours: {
            min: credential.min_hr,
            max: credential.max_hr,
        },
        awarding_bodies: credential.awarding_bodies,
        occupation: credential.occupation,
        tags: credential.tags,
        issue_date: credential.issued_at.toISOString(),
        certificate_url: `https://nsdc.example.com/cert/${credential.id}`,
    };

    res.json(nsdcCredential);
});

export default router;
