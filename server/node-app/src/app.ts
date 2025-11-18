import express, { Application } from 'express';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/error';
import { generalRateLimiter } from './middleware/rateLimit';
import { logger } from './utils/logger';

// Import routes
import issuerRoutes from './modules/issuer/routes';
import learnerRoutes from './modules/learner/routes';
import adminRoutes from './modules/admin/routes';

// Load environment variables
dotenv.config();

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use(generalRateLimiter);

// CORS configuration
app.use((req, res, next) => {
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];
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
app.use('/auth/issuer', issuerRoutes);
app.use('/auth/learner', learnerRoutes);
app.use('/auth/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MicroMerit Portal API',
    version: '1.0.0',
    endpoints: {
      issuer: '/auth/issuer',
      learner: '/auth/learner',
      admin: '/auth/admin',
      health: '/health',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
