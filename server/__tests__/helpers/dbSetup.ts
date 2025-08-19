import { PrismaClient } from '@prisma/client';

export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

export const setupTestDb = async () => {
  // Clean up test data before each test
  await testDb.$transaction([
    testDb.feedback.deleteMany(),
    testDb.userAchievement.deleteMany(),
    testDb.interview.deleteMany(),
    testDb.aptitudeTest.deleteMany(),
    testDb.userProfile.deleteMany(),
    testDb.refreshToken.deleteMany(),
    testDb.user.deleteMany()
  ]);
};

export const teardownTestDb = async () => {
  await testDb.$disconnect();
};

export const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2a$10$abcdefghijklmnopqrstuvwx', // Mock hash
    isVerified: true,
    ...overrides
  };

  return await testDb.user.create({
    data: defaultUser
  });
};
