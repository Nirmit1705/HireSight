/// <reference types="jest" />

import { AptitudeService } from '../../../src/services/aptitudeService';
import { setupTestDb, teardownTestDb, testDb, createTestUser } from '../../helpers/dbSetup';
import { AptitudeCategory, Position, DifficultyLevel } from '@prisma/client';

describe('AptitudeService', () => {
  let aptitudeService: AptitudeService;
  let testUser: any;

  beforeEach(async () => {
    await setupTestDb();
    aptitudeService = new AptitudeService(testDb);
    testUser = await createTestUser();

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
          questionText: 'What is the capital of France?',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctOption: 2,
          category: AptitudeCategory.LOGICAL_REASONING,
          difficulty: DifficultyLevel.MEDIUM
        },
        {
          questionText: 'Complete the series: 1, 4, 9, 16, ?',
          options: ['20', '25', '30', '36'],
          correctOption: 1,
          category: AptitudeCategory.QUANTITATIVE_APTITUDE,
          difficulty: DifficultyLevel.HARD
        }
      ]
    });
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('getRandomQuestions', () => {
    it('should return random questions for a position', async () => {
      const questions = await aptitudeService.getRandomQuestions(Position.BACKEND_DEVELOPER, 2);

      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(2);
      expect(questions[0]).toHaveProperty('id');
      expect(questions[0]).toHaveProperty('questionText');
      expect(questions[0]).toHaveProperty('options');
      expect(questions[0]).toHaveProperty('category');
      expect(questions[0]).not.toHaveProperty('correctOption'); // Should not expose correct answer
    });

    it('should limit questions to requested amount', async () => {
      const questions = await aptitudeService.getRandomQuestions(Position.BACKEND_DEVELOPER, 1);
      expect(questions.length).toBeLessThanOrEqual(1);
    });

    it('should return questions when available', async () => {
      const questions = await aptitudeService.getRandomQuestions(Position.BACKEND_DEVELOPER, 100);
      expect(questions.length).toBeGreaterThan(0); // Should return available questions
    });
  });

  describe('createAptitudeTest', () => {
    it('should create a new test for user', async () => {
      const test = await aptitudeService.createAptitudeTest(testUser.id, Position.BACKEND_DEVELOPER, false);

      expect(test).toHaveProperty('id');
      expect(test.userId).toBe(testUser.id);
      expect(test.position).toBe(Position.BACKEND_DEVELOPER);
      expect(test.isPractice).toBe(false);
      expect(test.status).toBe('IN_PROGRESS');
    });

    it('should create practice test', async () => {
      const test = await aptitudeService.createAptitudeTest(testUser.id, Position.BACKEND_DEVELOPER, true);

      expect(test.isPractice).toBe(true);
    });
  });

  describe('submitAnswer', () => {
    it('should save answer for a test', async () => {
      const test = await aptitudeService.createAptitudeTest(testUser.id, Position.BACKEND_DEVELOPER);
      const questions = await aptitudeService.getRandomQuestions(Position.BACKEND_DEVELOPER, 1);
      
      const result = await aptitudeService.submitAnswer(test.id, questions[0].id, 1);

      expect(result).toHaveProperty('id');
      expect(result.testId).toBe(test.id);
      expect(result.questionId).toBe(questions[0].id);
      expect(result.selectedOption).toBe(1);
    });
  });

  describe('completeTest', () => {
    it('should mark test as completed', async () => {
      const test = await aptitudeService.createAptitudeTest(testUser.id, Position.BACKEND_DEVELOPER);
      
      // Get a question and submit an answer first
      const questions = await aptitudeService.getRandomQuestions(Position.BACKEND_DEVELOPER, 1);
      if (questions.length > 0) {
        await aptitudeService.submitAnswer(test.id, questions[0].id, 1);
      }
      
      const result = await aptitudeService.completeTest(test.id, 1800); // 30 minutes

      expect(result.status).toBe('COMPLETED');
      expect(result.timeTaken).toBe(1800);
      expect(result.completedAt).toBeTruthy();
    });
  });

  describe('getUserTestHistory', () => {
    it('should return user test history', async () => {
      // Create and complete a test first
      const test = await aptitudeService.createAptitudeTest(testUser.id, Position.BACKEND_DEVELOPER);
      
      // Get a question and submit an answer
      const questions = await aptitudeService.getRandomQuestions(Position.BACKEND_DEVELOPER, 1);
      if (questions.length > 0) {
        await aptitudeService.submitAnswer(test.id, questions[0].id, 1);
      }
      
      await aptitudeService.completeTest(test.id, 1800);

      const history = await aptitudeService.getUserTestHistory(testUser.id);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThanOrEqual(1);
      if (history.length > 0) {
        expect(history[0]).toHaveProperty('position');
        expect(history[0]).toHaveProperty('overallScore');
        expect(history[0]).toHaveProperty('completedAt');
      }
    });

    it('should return empty array for user with no tests', async () => {
      const newUser = await createTestUser({ email: 'newuser@example.com' });
      const history = await aptitudeService.getUserTestHistory(newUser.id);

      expect(Array.isArray(history)).toBe(true);
      expect(history).toHaveLength(0);
    });
  });
});
