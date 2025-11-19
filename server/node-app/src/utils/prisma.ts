import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

class PrismaClientSingleton {
  private static instance: PrismaClient | null = null;

  static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
      
      logger.info('Prisma Client initialized');
    }

    return PrismaClientSingleton.instance;
  }

  static async connect(): Promise<void> {
    const client = PrismaClientSingleton.getInstance();
    try {
      await client.$connect();
      // Test the connection with a simple query
      await client.$queryRaw`SELECT 1`;
      logger.info('Database connection established successfully');
    } catch (error) {
      logger.error('Failed to connect to the database', { error });
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
      PrismaClientSingleton.instance = null;
      logger.info('Prisma Client disconnected');
    }
  }
}

export const prisma = PrismaClientSingleton.getInstance();
export const connectPrisma = PrismaClientSingleton.connect;
export const disconnectPrisma = PrismaClientSingleton.disconnect;
