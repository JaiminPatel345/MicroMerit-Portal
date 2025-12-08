/**
 * Dummy Credential Provider Server
 * Mimics external credential providers for development/testing
 * Runs on port 4000
 */

import express, { Application, Request, Response } from 'express';
import nsdcRoutes from './routes/nsdc.js';
import udemyRoutes from './routes/udemy.js';
import jaiminRoutes from './routes/jaimin.js';
import { getCredentials, getCredentialsByProvider } from './data/seed.js';

const app: Application = express();
const PORT = process.env.DUMMY_SERVER_PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for local development
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }

    next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'Dummy credential server is running',
        timestamp: new Date().toISOString(),
        providers: ['nsdc', 'udemy', 'jaimin'],
    });
});

// Provider routes
app.use('/nsdc', nsdcRoutes);
app.use('/udemy', udemyRoutes);
app.use('/jaimin', jaiminRoutes);

// Stats endpoint
app.get('/stats', (req: Request, res: Response) => {
    const allCreds = getCredentials();
    res.json({
        total_credentials: allCreds.length,
        by_provider: {
            nsdc: getCredentialsByProvider('nsdc').length,
            udemy: getCredentialsByProvider('udemy').length,
            jaimin: getCredentialsByProvider('jaimin').length,
        },
        test_users: [
            'test1@gmail.com',
            'test2@gmail.com',
            'test3@gmail.com',
            'test4@gmail.com',
            'test5@gmail.com',
        ],
    });
});

// Root endpoint with documentation
app.get('/', (req: Request, res: Response) => {
    res.json({
        name: 'Dummy Credential Provider Server',
        version: '1.0.0',
        description: 'Mock server for testing external credential sync',
        endpoints: {
            health: 'GET /health',
            stats: 'GET /stats',
            nsdc: {
                auth: 'POST /nsdc/auth',
                credentials: 'GET /nsdc/credentials?since=ISO_DATE&page=1&per_page=10',
                credential: 'GET /nsdc/credentials/:id',
            },
            udemy: {
                oauth: 'POST /udemy/oauth/token',
                certificates: 'GET /udemy/api/v1/certificates?completed_after=ISO_DATE&page=1&page_size=10',
                certificate: 'GET /udemy/api/v1/certificates/:id',
            },
            jaimin: {
                certs: 'GET /jaimin/api/certs?since=ISO_DATE&limit=20&offset=0',
                cert: 'GET /jaimin/api/certs/:id',
                verify: 'POST /jaimin/api/verify',
            },
        },
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Dummy Credential Server running on http://localhost:${PORT}`);
    console.log('\nAvailable providers:');
    console.log('  - NSDC:   POST /nsdc/auth, GET /nsdc/credentials');
    console.log('  - Udemy:  POST /udemy/oauth/token, GET /udemy/api/v1/certificates');
    console.log('  - Jaimin: GET /jaimin/api/certs (X-API-Key header required)\n');

    // Log stats
    const stats = {
        nsdc: getCredentialsByProvider('nsdc').length,
        udemy: getCredentialsByProvider('udemy').length,
        jaimin: getCredentialsByProvider('jaimin').length,
    };
    console.log(`📊 Loaded credentials: NSDC=${stats.nsdc}, Udemy=${stats.udemy}, Jaimin=${stats.jaimin}`);
});

export default app;
