/// <reference types="jest" />

// Set environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-12345';

// Mock Passport config before importing app
jest.mock('../../src/config/passport', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(() => (req: any, res: any, next: any) => next()),
    authenticate: jest.fn(() => (req: any, res: any, next: any) => next()),
    use: jest.fn(),
    serializeUser: jest.fn(),
    deserializeUser: jest.fn()
  }
}));

import request from 'supertest';
import app from '../../src/app';
import { setupTestDb, teardownTestDb, testDb } from '../helpers/dbSetup';
import { generateUniqueEmail } from '../helpers/testUtils';

// Mock Google OAuth
jest.mock('passport', () => ({
  authenticate: jest.fn(() => (req: any, res: any, next: any) => next()),
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn()
}));

describe('Auth Routes Integration', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user account', async () => {
      const userData = {
        email: generateUniqueEmail(),
        name: 'Test User',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.headers['set-cookie']).toBeDefined(); // Check refresh token cookie

      // Verify user was saved to database
      const savedUser = await testDb.user.findUnique({
        where: { email: userData.email }
      });
      expect(savedUser).toBeTruthy();
    });

    it('should reject invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const email = generateUniqueEmail();
      const userData = {
        email,
        name: 'Test User',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      // Create first user
      await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/signin', () => {
    it('should authenticate valid credentials', async () => {
      const email = generateUniqueEmail();
      const password = 'Password123!';
      
      // Create user first
      await request(app)
        .post('/api/auth/signup')
        .send({
          email,
          name: 'Test User',
          password,
          confirmPassword: password
        });

      const response = await request(app)
        .post('/api/auth/signin')
        .send({ email, password })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(email);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should generate new tokens with valid refresh token', async () => {
      const email = generateUniqueEmail();
      
      // Create user and get tokens
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email,
          name: 'Test User',
          password: 'Password123!',
          confirmPassword: 'Password123!'
        });

      const cookies = signupResponse.get('Set-Cookie') || [];
      const refreshTokenCookie = cookies.find((cookie: string) => 
        cookie.startsWith('refreshToken=')
      );
      const refreshToken = refreshTokenCookie?.split(';')[0].split('=')[1];

      expect(refreshToken).toBeDefined(); // Ensure we got the refresh token

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/signout', () => {
    it('should signout user and invalidate refresh token', async () => {
      const email = generateUniqueEmail();
      
      // Create user and get tokens
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email,
          name: 'Test User',
          password: 'Password123!',
          confirmPassword: 'Password123!'
        });

      const accessToken = signupResponse.body.data.accessToken;

      const response = await request(app)
        .post('/api/auth/signout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });
  });
});
