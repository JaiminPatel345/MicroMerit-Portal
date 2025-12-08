import app from './app';
import { logger } from './utils/logger';
import { connectPrisma, disconnectPrisma } from './utils/prisma';
import { externalCredentialSyncScheduler } from './modules/external-credential-sync';

const PORT = process.env.PORT || 3000;

let server: any;

// Start server function with database connection check
const startServer = async () => {
  try {
    // Connect to database first
    try {
      await connectPrisma();
    } catch (error) {
      logger.error('Failed to connect to the database', { error });
      console.error('Failed to connect to the database, make sure postgreSQL is running and accessible', { error });
      process.exit(1);
    }

    // Start the server only if database connection is successful
    server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);

      // Start external credential sync scheduler if enabled
      if (process.env.ENABLE_EXTERNAL_SYNC === 'true') {
        externalCredentialSyncScheduler.start();
        logger.info('External credential sync scheduler started');
      }
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server immediately
startServer();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop the scheduler first
  externalCredentialSyncScheduler.stop();

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await disconnectPrisma();
      logger.info('Database connections closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', { error });
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  gracefulShutdown('UNHANDLED_REJECTION');
});
