import express, { Application } from 'express';
import 'dotenv/config';
import { errorHandler, notFoundHandler } from './middleware/error';
import { generalRateLimiter } from './middleware/rateLimit';
import { addSignedUrlsMiddleware } from './middleware/signedUrls';
import { logger } from './utils/logger';

// Import routes
import { issuerAuthRoutes, issuerResourceRoutes } from './modules/issuer/routes';
import { learnerAuthRoutes, learnerResourceRoutes } from './modules/learner/routes';
import { adminAuthRoutes, adminResourceRoutes } from './modules/admin/routes';
import { employerAuthRoutes, employerResourceRoutes } from './modules/employer/routes';
import pdfRoutes from './modules/pdf/routes';
import credentialIssuanceRoutes from './modules/credential-issuance/routes';
import credentialVerificationRoutes from './modules/credential-verification/routes';
import aiRoutes from './modules/ai/ai.routes';
import searchRoutes from './modules/search/routes';

// External credential sync routes (feature-flagged)
import { webhookRoutes, adminSyncRoutes } from './modules/external-credential-sync';
import { featureFlags } from './infrastructure/config/feature-flags';


const app: Application = express();

// Middleware
// Increase JSON body size limit to support base64 image uploads (up to 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Note: Static file serving for certificates is not needed as we use Amazon S3 for storage

// Apply rate limiting
app.use(generalRateLimiter);

// Apply signed URL middleware to automatically convert S3 URLs in responses
app.use(addSignedUrlsMiddleware);

// CORS configuration
app.use((req, res, next) => {
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5174'];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
// Authentication routes
app.use('/auth/issuer', issuerAuthRoutes);
app.use('/auth/learner', learnerAuthRoutes);
app.use('/auth/admin', adminAuthRoutes);
app.use('/auth/employer', employerAuthRoutes);

// Resource management routes
app.use('/issuer', issuerResourceRoutes);
app.use('/learner', learnerResourceRoutes);
app.use('/admin', adminResourceRoutes);
app.use('/employer', employerResourceRoutes);

// Other routes
app.use('/credentials', credentialIssuanceRoutes); // New credential issuance system
app.use('/credentials', credentialVerificationRoutes); // New credential verification system
app.use('/pdf', pdfRoutes);
app.use('/ai', aiRoutes); // AI-powered recommendations and OCR
app.use('/search', searchRoutes); // Global search

// External credential sync routes (feature-flagged)
if (featureFlags.externalSyncEnabled) {
  app.use('/webhooks', webhookRoutes);
  app.use('/admin/sync', adminSyncRoutes);
}

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MicroMerit Portal API',
    version: '1.0.0',
    endpoints: {
      auth: {
        issuer: '/auth/issuer',
        learner: '/auth/learner',
        admin: '/auth/admin',
      },
      resources: {
        issuer: '/issuer',
        learner: '/learner',
        admin: '/admin',
        credentials: '/credentials',
        pdf: '/pdf',
        ai: '/ai',
      },
      health: '/health',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
