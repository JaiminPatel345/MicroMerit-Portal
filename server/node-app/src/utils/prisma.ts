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

  static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
      PrismaClientSingleton.instance = null;
      logger.info('Prisma Client disconnected');
    }
  }
}

export const prisma = PrismaClientSingleton.getInstance();
export const disconnectPrisma = PrismaClientSingleton.disconnect;
