/**
 * Udemy Provider Routes
 * Mimics Udemy-style OAuth2 API for credential fetching
 */

import { Router, Request, Response } from 'express';
import { getCredentialsSince, getCredentialsByProvider } from '../data/seed.js';
import { UdemyCredentialResponse, PaginatedResponse } from '../types/index.js';

const router = Router();

// Mock OAuth tokens storage
const oauthTokens: Map<string, { expires: Date; scope: string }> = new Map();

/**
 * POST /udemy/oauth/token
 * OAuth2 token endpoint
 */
router.post('/oauth/token', (req: Request, res: Response) => {
    const { grant_type, client_id, client_secret, code } = req.body;

    if (grant_type !== 'authorization_code' && grant_type !== 'client_credentials') {
        res.status(400).json({ error: 'unsupported_grant_type' });
        return;
    }

    if (!client_id || !client_secret) {
        res.status(400).json({ error: 'invalid_client' });
        return;
    }

    const accessToken = `udemy_access_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const refreshToken = `udemy_refresh_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const expires = new Date(Date.now() + 7200 * 1000); // 2 hours

    oauthTokens.set(accessToken, { expires, scope: 'read:certificates' });

    res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 7200,
        scope: 'read:certificates',
    });
});

/**
 * Middleware to verify OAuth token
 */
function verifyOAuthToken(req: Request, res: Response, next: Function) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'invalid_token', error_description: 'Missing authorization header' });
        return;
    }

    const token = authHeader.slice(7);
    const tokenData = oauthTokens.get(token);

    if (!tokenData || tokenData.expires < new Date()) {
        res.status(401).json({ error: 'invalid_token', error_description: 'Token expired or invalid' });
        return;
    }

    next();
}

/**
 * GET /udemy/api/v1/certificates
 * Fetch user certificates
 */
router.get('/api/v1/certificates', verifyOAuthToken, (req: Request, res: Response) => {
    const since = req.query.completed_after
        ? new Date(req.query.completed_after as string)
        : new Date(0);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.page_size as string) || 10;
    const offset = (page - 1) * pageSize;

    const { credentials, total, hasMore } = getCredentialsSince('udemy', since, pageSize, offset);

    // Transform to Udemy format
    const udemyCredentials: UdemyCredentialResponse[] = credentials.map(c => ({
        id: c.id,
        completion_date: c.issued_at.toISOString(),
        course: {
            id: c.certificate_code,
            title: c.certificate_title,
            description: c.description,
            category: c.sector,
            estimated_hours: c.max_hr,
            code: c.certificate_code,
        },
        user: {
            email: c.learner_email,
            display_name: c.learner_name,
        },
        certificate_url: `https://udemy.example.com/certificate/${c.id}`,
        metadata: {
            awarding_bodies: c.awarding_bodies,
            tags: c.tags,
            level: c.nsqf_level,
        },
    }));

    res.json({
        count: total,
        next: hasMore ? `/api/v1/certificates?page=${page + 1}&page_size=${pageSize}` : null,
        previous: page > 1 ? `/api/v1/certificates?page=${page - 1}&page_size=${pageSize}` : null,
        results: udemyCredentials,
    });
});

/**
 * GET /udemy/api/v1/certificates/:id
 * Get a specific certificate
 */
router.get('/api/v1/certificates/:id', verifyOAuthToken, (req: Request, res: Response) => {
    const credentials = getCredentialsByProvider('udemy');
    const credential = credentials.find(c => c.id === req.params.id);

    if (!credential) {
        res.status(404).json({ detail: 'Certificate not found' });
        return;
    }

    const udemyCredential: UdemyCredentialResponse = {
        id: credential.id,
        completion_date: credential.issued_at.toISOString(),
        course: {
            id: credential.certificate_code,
            title: credential.certificate_title,
            description: credential.description,
            category: credential.sector,
            estimated_hours: credential.max_hr,
            code: credential.certificate_code,
        },
        user: {
            email: credential.learner_email,
            display_name: credential.learner_name,
        },
        certificate_url: `https://udemy.example.com/certificate/${credential.id}`,
        metadata: {
            awarding_bodies: credential.awarding_bodies,
            tags: credential.tags,
            level: credential.nsqf_level,
        },
    };

    res.json(udemyCredential);
});

export default router;
