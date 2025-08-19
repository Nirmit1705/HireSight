/// <reference types="jest" />

import { AuthService } from '../../../src/services/authService';
import { setupTestDb, teardownTestDb, testDb, createTestUser } from '../../helpers/dbSetup';
import { generateUniqueEmail } from '../../helpers/testUtils';

// Mock dependencies
jest.mock('../../../src/config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn()
  }
}));

describe('AuthService', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('signUp', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: generateUniqueEmail(),
        name: 'Test User',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const result = await AuthService.signUp(userData);

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe(userData.email);
      expect(result.data?.user.name).toBe(userData.name);
      expect(result.data?.tokens).toHaveProperty('accessToken');
      expect(result.data?.tokens).toHaveProperty('refreshToken');
    });

    it('should reject invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'password123',
        confirmPassword: 'password123'
      };

      const result = await AuthService.signUp(userData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid email format');
    });

    it('should reject mismatched passwords', async () => {
      const userData = {
        email: generateUniqueEmail(),
        name: 'Test User',
        password: 'Password123!',
        confirmPassword: 'DifferentPass123!'
      };

      const result = await AuthService.signUp(userData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Passwords do not match');
    });

    it('should reject duplicate email', async () => {
      const email = generateUniqueEmail();
      await createTestUser({ email });

      const userData = {
        email,
        name: 'Test User',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const result = await AuthService.signUp(userData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('User with this email already exists');
    });
  });

  describe('signIn', () => {
    it('should authenticate valid credentials', async () => {
      const email = generateUniqueEmail();
      const password = 'Password123!';
      
      // Create user first
      await AuthService.signUp({
        email,
        name: 'Test User',
        password,
        confirmPassword: password
      });

      const result = await AuthService.signIn({ email, password });

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe(email);
      expect(result.data?.tokens).toHaveProperty('accessToken');
    });

    it('should reject invalid credentials', async () => {
      const result = await AuthService.signIn({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid email or password');
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens with valid refresh token', async () => {
      const email = generateUniqueEmail();
      const signUpResult = await AuthService.signUp({
        email,
        name: 'Test User',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });

      if (!signUpResult.success || !signUpResult.data) {
        throw new Error('Failed to create test user');
      }

      const refreshToken = signUpResult.data.tokens.refreshToken;
      const result = await AuthService.refreshToken(refreshToken);

      expect(result.success).toBe(true);
      expect(result.data?.tokens).toHaveProperty('accessToken');
      expect(result.data?.tokens).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const result = await AuthService.refreshToken('invalid-token');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid refresh token');
    });
  });
});
