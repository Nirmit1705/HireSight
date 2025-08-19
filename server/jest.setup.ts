/// <reference types="jest" />

import { PrismaClient } from '@prisma/client';

// Set environment variables FIRST before any other code
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-12345';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
// Use TEST_DATABASE_URL from environment, or default to a generic test DB URL
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/hiresight_test';

// Mock Redis before any imports that might use it
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    disconnect: jest.fn()
  };
  return {
    __esModule: true,
    default: jest.fn(() => mockRedis),
    Redis: jest.fn(() => mockRedis)
  };
});

// Mock Passport
jest.mock('passport', () => {
  const mockPassport = {
    use: jest.fn(),
    initialize: jest.fn(() => (req: any, res: any, next: any) => next()),
    authenticate: jest.fn(() => (req: any, res: any, next: any) => next()),
    serializeUser: jest.fn(),
    deserializeUser: jest.fn()
  };
  return {
    __esModule: true,
    default: mockPassport,
    ...mockPassport
  };
});

// Mock Redis client config
jest.mock('./src/config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    disconnect: jest.fn()
  }
}));

// Global test setup
beforeAll(async () => {
  // Ensure environment variables are set
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-12345';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  // Use TEST_DATABASE_URL from environment, fallback to generic test URL
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/hiresight_test';
});

afterAll(async () => {
  // Cleanup any global resources
});
