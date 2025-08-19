/// <reference types="jest" />

// Set environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-12345';

import request from 'supertest';
import app from '../../src/app';
import { setupTestDb, teardownTestDb, testDb, createTestUser } from '../helpers/dbSetup';
import { AptitudeCategory, Position, DifficultyLevel } from '@prisma/client';
import jwt from 'jsonwebtoken';

describe('Aptitude Routes Integration', () => {
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    await setupTestDb();
    
    // Create test user and auth token
    testUser = await createTestUser();
    // Create token with email field as expected by TokenUtils
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email }, 
      process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-12345', 
      { expiresIn: '1h' }
    );

    // Create test questions
    await testDb.aptitudeQuestion.createMany({
      data: [
        {
          questionText: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctOption: 1,
          category: AptitudeCategory.QUANTITATIVE_APTITUDE,
          difficulty: DifficultyLevel.EASY
        },
        {
          questionText: 'Complete the sequence: A, C, E, G, ?',
          options: ['H', 'I', 'J', 'K'],
          correctOption: 1,
          category: AptitudeCategory.LOGICAL_REASONING,
          difficulty: DifficultyLevel.MEDIUM
        }
      ]
    });
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('GET /api/aptitude/questions', () => {
    it('should return random questions for authenticated user', async () => {
      const response = await request(app)
        .get('/api/aptitude/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ position: Position.BACKEND_DEVELOPER, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.questions).toHaveLength(2);
      expect(response.body.data.questions[0]).toHaveProperty('questionText');
      expect(response.body.data.questions[0]).toHaveProperty('options');
      expect(response.body.data.questions[0]).not.toHaveProperty('correctOption');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/aptitude/questions')
        .query({ position: Position.BACKEND_DEVELOPER })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/aptitude/start', () => {
    it('should create a new aptitude test', async () => {
      const response = await request(app)
        .post('/api/aptitude/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ position: Position.BACKEND_DEVELOPER })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('testId');
      expect(response.body.data.position).toBe(Position.BACKEND_DEVELOPER);

      // Verify test was saved to database
      const savedTest = await testDb.aptitudeTest.findUnique({
        where: { id: response.body.data.testId }
      });
      expect(savedTest).toBeTruthy();
      expect(savedTest?.userId).toBe(testUser.id);
    });
  });

  describe('POST /api/aptitude/:testId/answers', () => {
    it('should submit answer for a test question', async () => {
      // Create test first
      const testResponse = await request(app)
        .post('/api/aptitude/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ position: Position.BACKEND_DEVELOPER });

      const testId = testResponse.body.data.testId;
      
      // Get questions
      const questionsResponse = await request(app)
        .get('/api/aptitude/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ position: Position.BACKEND_DEVELOPER, limit: 1 });

      const questionId = questionsResponse.body.data.questions[0].id;

      const response = await request(app)
        .post(`/api/aptitude/${testId}/answers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ questionId, selectedOption: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('answerId');
    });
  });

  describe('POST /api/aptitude/:testId/complete', () => {
    it('should complete test and calculate results', async () => {
      // Create test
      const testResponse = await request(app)
        .post('/api/aptitude/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ position: Position.BACKEND_DEVELOPER });

      const testId = testResponse.body.data.testId;

      // Get a question and submit an answer
      const questionsResponse = await request(app)
        .get('/api/aptitude/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ position: Position.BACKEND_DEVELOPER, limit: 1 });

      const questionId = questionsResponse.body.data.questions[0].id;

      // Submit an answer first
      await request(app)
        .post(`/api/aptitude/${testId}/answers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ questionId, selectedOption: 1 });

      const response = await request(app)
        .post(`/api/aptitude/${testId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ timeTaken: 1800 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overallScore');
      expect(response.body.data).toHaveProperty('scores');
      
      // Verify test status updated
      const completedTest = await testDb.aptitudeTest.findUnique({
        where: { id: testId }
      });
      expect(completedTest?.status).toBe('COMPLETED');
    });
  });

  describe('GET /api/aptitude/history', () => {
    it('should return user test history', async () => {
      // Create and complete a test first
      const testResponse = await request(app)
        .post('/api/aptitude/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ position: Position.BACKEND_DEVELOPER });

      const testId = testResponse.body.data.testId;

      // Get a question and submit an answer
      const questionsResponse = await request(app)
        .get('/api/aptitude/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ position: Position.BACKEND_DEVELOPER, limit: 1 });

      const questionId = questionsResponse.body.data.questions[0].id;

      // Submit an answer
      await request(app)
        .post(`/api/aptitude/${testId}/answers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ questionId, selectedOption: 1 });

      // Complete the test
      await request(app)
        .post(`/api/aptitude/${testId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ timeTaken: 1800 });

      const response = await request(app)
        .get('/api/aptitude/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tests');
      expect(Array.isArray(response.body.data.tests)).toBe(true);
      expect(response.body.data.tests.length).toBeGreaterThan(0);
      expect(response.body.data.tests[0]).toHaveProperty('position');
      expect(response.body.data.tests[0]).toHaveProperty('overallScore');
    });
  });
});
