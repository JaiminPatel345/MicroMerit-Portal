import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Mock Prisma Client
jest.mock('../utils/prisma', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
  disconnectPrisma: jest.fn(),
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => 'mock.jwt.token'),
  verify: jest.fn((token, secret) => ({
    id: 1,
    email: 'test@example.com',
    role: 'issuer',
  })),
  decode: jest.fn((token) => ({
    id: 1,
    email: 'test@example.com',
    role: 'issuer',
  })),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn((password, rounds) => Promise.resolve('hashed_password')),
  compare: jest.fn((password, hash) => Promise.resolve(true)),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

export const prismaMock = jest.requireMock('../utils/prisma').prisma as DeepMockProxy<PrismaClient>;
