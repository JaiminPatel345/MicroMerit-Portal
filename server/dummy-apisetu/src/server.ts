/**
 * Dummy API-Setu Server
 * Mock server for local development testing
 * Simulates NSDC API-Setu endpoints for credential sync
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as jose from 'jose';

const app = express();

// CORS middleware - allow admin panel to call dummy server
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

app.use(express.json());

// In-memory storage
const credentials = new Map<string, any[]>();
const webhookSubscriptions = new Map<string, string>();
let accessTokens = new Set<string>();

// JWK key pair for signing (generated on startup)
let privateKey: jose.KeyLike;
let publicKey: jose.KeyLike;
const keyId = 'dummy-key-1';

// Initialize keys
async function initKeys() {
    const { publicKey: pub, privateKey: priv } = await jose.generateKeyPair('RS256');
    privateKey = priv;
    publicKey = pub;
    console.log('JWK keys initialized');
}

// Seed data for providers
function seedCredentials() {
    // Provider A - Webhook-enabled, JWS signed
    credentials.set('provider-a', [
        {
            id: 'cred-a-001',
            email: 'learner1@example.com',
            name: 'John Doe',
            title: 'Advanced Web Development',
            issued_at: '2024-01-15T10:00:00Z',
            qp_code: 'SSC/Q0101',
            nsqf_level: 5,
        },
        {
            id: 'cred-a-002',
            email: 'learner2@example.com',
            name: 'Jane Smith',
            title: 'Data Science Fundamentals',
            issued_at: '2024-02-20T14:30:00Z',
            qp_code: 'SSC/Q0201',
            nsqf_level: 4,
        },
        {
            id: 'cred-a-003',
            email: 'other.email@example.com',
            name: 'Bob Wilson',
            title: 'Cloud Computing Essentials',
            issued_at: '2024-03-10T09:00:00Z',
        },
    ]);

    // Provider B - Poll-only, paged
    credentials.set('provider-b', [
        {
            id: 'cred-b-001',
            phone: '+919876543210',
            name: 'Alice Johnson',
            title: 'Mobile App Development',
            issued_at: '2024-01-20T11:00:00Z',
        },
        {
            id: 'cred-b-002',
            email: 'newlearner@example.com',
            name: 'Charlie Brown',
            title: 'UI/UX Design',
            issued_at: '2024-02-25T16:00:00Z',
        },
    ]);

    // Provider C - PDF/DSC signatures
    credentials.set('provider-c', [
        {
            id: 'cred-c-001',
            email: 'learner3@example.com',
            name: 'Diana Prince',
            title: 'Cybersecurity Basics',
            issued_at: '2024-03-05T08:00:00Z',
            signature_type: 'PDF',
            signature_meta: { valid: true, signer: 'NSDC Authority' },
        },
    ]);

    console.log('Seed credentials loaded');
}

// OAuth token endpoint
app.post('/oauth/token', (req, res) => {
    const { grant_type, client_id, client_secret } = req.body;

    if (grant_type !== 'client_credentials') {
        return res.status(400).json({ error: 'invalid_grant' });
    }

    if (client_id === 'dev-client' && client_secret === 'dev-secret') {
        const token = `access_${uuidv4()}`;
        accessTokens.add(token);
        res.json({
            access_token: token,
            token_type: 'Bearer',
            expires_in: 3600,
        });
    } else {
        res.status(401).json({ error: 'invalid_client' });
    }
});

// JWKS endpoint
app.get('/.well-known/jwks.json', async (_req, res) => {
    const jwk = await jose.exportJWK(publicKey);
    res.json({
        keys: [{ ...jwk, kid: keyId, use: 'sig', alg: 'RS256' }],
    });
});

// List partners
app.get('/api/partners', (_req, res) => {
    res.json({
        data: [
            { id: 'provider-a', name: 'Provider A (Webhook)', supports_webhook: true },
            { id: 'provider-b', name: 'Provider B (Poll)', supports_webhook: false },
            { id: 'provider-c', name: 'Provider C (PDF)', supports_webhook: false },
        ],
    });
});

// Get credentials for a partner
app.get('/api/partners/:id/credentials', async (req, res) => {
    const providerId = req.params.id;
    const { cursor, page_size = '10', since } = req.query;

    const creds = credentials.get(providerId) || [];
    let filtered = creds;

    if (since) {
        const sinceDate = new Date(since as string);
        filtered = creds.filter(c => new Date(c.issued_at) > sinceDate);
    }

    const pageSize = parseInt(page_size as string);
    const startIdx = cursor ? parseInt(cursor as string) : 0;
    const page = filtered.slice(startIdx, startIdx + pageSize);

    // Sign credentials as JWS for providers that support it
    const signedCreds = await Promise.all(page.map(async (c) => {
        if (c.signature_type === 'PDF' || c.signature_type === 'DSC') {
            // PDF/DSC credentials don't get JWS signature
            return {
                credential_id: c.id,
                credential: c,
                signature_type: c.signature_type,
            };
        }

        // Sign as JWS
        const jws = await new jose.CompactSign(
            new TextEncoder().encode(JSON.stringify(c))
        )
            .setProtectedHeader({ alg: 'RS256', kid: keyId })
            .sign(privateKey);

        return {
            credential_id: c.id,
            credential: c,
            signed_credential: jws,
            signature_type: 'JWS',
        };
    }));

    res.json({
        data: signedCreds,
        next_cursor: startIdx + pageSize < filtered.length
            ? String(startIdx + pageSize)
            : null,
    });
});

// Subscribe to webhooks
app.post('/api/partners/:id/webhooks', (req, res) => {
    const providerId = req.params.id;
    const { callback_url } = req.body;

    if (providerId !== 'provider-a') {
        return res.status(400).json({
            error: 'Webhooks not supported for this provider'
        });
    }

    webhookSubscriptions.set(providerId, callback_url);
    res.json({
        webhook_id: uuidv4(),
        status: 'active',
    });
});

// Admin: Push a credential via webhook (for testing)
app.post('/admin/push-webhook', async (req, res) => {
    const { provider = 'provider-a', credential_id } = req.body;

    const providerCreds = credentials.get(provider);
    if (!providerCreds) {
        return res.status(404).json({ error: 'Provider not found' });
    }

    let cred = credential_id
        ? providerCreds.find(c => c.id === credential_id)
        : providerCreds[0];

    if (!cred) {
        return res.status(404).json({ error: 'Credential not found' });
    }

    const callbackUrl = webhookSubscriptions.get(provider);
    if (!callbackUrl) {
        return res.status(400).json({ error: 'No webhook subscription' });
    }

    try {
        // Sign the credential as JWS
        const jws = await new jose.CompactSign(
            new TextEncoder().encode(JSON.stringify(cred))
        )
            .setProtectedHeader({ alg: 'RS256', kid: keyId })
            .sign(privateKey);

        // Send to callback
        const response = await fetch(callbackUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': 'hmac-signature-placeholder',
            },
            body: JSON.stringify({
                event: 'credential.issued',
                partner_id: provider,
                credential_id: cred.id,
                signed_credential: jws,
                credential: cred,
            }),
        });

        res.json({
            success: true,
            callback_status: response.status,
            credential_id: cred.id,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Add a new credential
app.post('/admin/credentials/:provider', (req, res) => {
    const provider = req.params.provider;
    const cred = { ...req.body, id: req.body.id || `cred-${uuidv4()}` };

    if (!credentials.has(provider)) {
        credentials.set(provider, []);
    }
    credentials.get(provider)!.push(cred);

    res.json({ success: true, credential: cred });
});

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.DUMMY_APISETU_PORT || 4000;

async function start() {
    await initKeys();
    seedCredentials();

    // Auto-subscribe webhook for provider-a
    webhookSubscriptions.set('provider-a', 'http://localhost:3000/webhooks/nsdc');
    console.log('Auto-subscribed webhook for provider-a');

    app.listen(PORT, () => {
        console.log(`Dummy API-Setu server running on http://localhost:${PORT}`);
        console.log('Endpoints:');
        console.log('  POST /oauth/token - Get access token');
        console.log('  GET  /.well-known/jwks.json - JWKS');
        console.log('  GET  /api/partners - List providers');
        console.log('  GET  /api/partners/:id/credentials - Get credentials');
        console.log('  POST /api/partners/:id/webhooks - Subscribe webhook');
        console.log('  POST /admin/push-webhook - Trigger test webhook');
        console.log('\nWebhook subscribed: provider-a → http://localhost:3000/webhooks/nsdc');
    });
}

start().catch(console.error);
