import { PrismaClient, AptitudeCategory, Position, DifficultyLevel, TestStatus } from '@prisma/client';
import { 
  AptitudeQuestionForFrontend,
  AptitudeQuestionForPractice, 
  AptitudeTest, 
  CategoryScores,
  TestHistoryItem 
} from '../types/aptitudeTypes';

export class AptitudeService {
  constructor(private prisma: PrismaClient) {}

  async getRandomQuestions(position: Position, limit: number = 30): Promise<AptitudeQuestionForFrontend[]> {
    try {
      // Get all questions and shuffle them randomly
      const allQuestions = await this.prisma.aptitudeQuestion.findMany({
        select: {
          id: true,
          questionText: true,
          options: true,
          category: true,
          difficulty: true
        }
      });

      // Shuffle the questions randomly
      const shuffledQuestions = this.shuffleArray(allQuestions);
      
      // Take the first 'limit' questions
      return shuffledQuestions.slice(0, Math.min(limit, shuffledQuestions.length));
    } catch (error) {
      console.error('Error fetching random questions:', error);
      throw new Error('Failed to fetch aptitude questions');
    }
  }

  async getPracticeQuestions(position: Position, limit: number = 10): Promise<AptitudeQuestionForPractice[]> {
    try {
      // Get all questions with correct answers for practice mode
      const allQuestions = await this.prisma.aptitudeQuestion.findMany({
        select: {
          id: true,
          questionText: true,
          options: true,
          correctOption: true,
          category: true,
          difficulty: true
        }
      });

      // Shuffle the questions randomly
      const shuffledQuestions = this.shuffleArray(allQuestions);
      
      // Take the first 'limit' questions and add explanations
      return shuffledQuestions.slice(0, Math.min(limit, shuffledQuestions.length)).map(q => ({
        ...q,
        explanation: `The correct answer is "${q.options[q.correctOption]}" because it represents the most accurate solution for this ${q.category.toLowerCase().replace('_', ' ')} question.`
      }));
    } catch (error) {
      console.error('Error fetching practice questions:', error);
      throw new Error('Failed to fetch practice questions');
    }
  }

  async createAptitudeTest(userId: string, position: Position, isPractice: boolean = false): Promise<AptitudeTest> {
    try {
      return await this.prisma.aptitudeTest.create({
        data: {
          userId,
          position,
          isPractice,
          status: TestStatus.IN_PROGRESS,
          totalQuestions: 30,
          timeLimit: 30 // 30 minutes
        }
      });
    } catch (error) {
      console.error('Error creating aptitude test:', error);
      throw new Error('Failed to create aptitude test');
    }
  }

  async submitAnswer(testId: string, questionId: string, selectedOption: number) {
    try {
      // Get the question to check correct answer
      const question = await this.prisma.aptitudeQuestion.findUnique({
        where: { id: questionId }
      });

      if (!question) {
        throw new Error('Question not found');
      }

      const isCorrect = selectedOption === question.correctOption;

      // Save the answer
      return await this.prisma.aptitudeTestAnswer.create({
        data: {
          testId,
          questionId,
          selectedOption,
          isCorrect,
          correctOption: question.correctOption
        }
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw new Error('Failed to submit answer');
    }
  }

  async completeTest(testId: string, timeTaken: number) {
    try {
      // Get all answers for this test
      const answers = await this.prisma.aptitudeTestAnswer.findMany({
        where: { testId },
        include: { question: true }
      });

      if (answers.length === 0) {
        throw new Error('No answers found for this test');
      }

      // Calculate scores by category
      const categoryScores = this.calculateCategoryScores(answers);

      // Calculate overall score
      const correctAnswers = answers.filter(answer => answer.isCorrect).length;
      const overallScore = (correctAnswers / answers.length) * 100;

      // Update the test with completion data
      return await this.prisma.aptitudeTest.update({
        where: { id: testId },
        data: {
          status: TestStatus.COMPLETED,
          completedAt: new Date(),
          timeTaken,
          overallScore,
          domainKnowledgeScore: categoryScores.DOMAIN_KNOWLEDGE,
          quantitativeScore: categoryScores.QUANTITATIVE_APTITUDE,
          logicalReasoningScore: categoryScores.LOGICAL_REASONING,
          verbalAbilityScore: categoryScores.VERBAL_ABILITY
        }
      });
    } catch (error) {
      console.error('Error completing test:', error);
      throw new Error('Failed to complete test');
    }
  }

  async getTestResults(testId: string, userId: string) {
    try {
      const test = await this.prisma.aptitudeTest.findFirst({
        where: { 
          id: testId,
          userId: userId 
        },
        include: {
          answers: {
            include: {
              question: true
            }
          }
        }
      });

      if (!test) {
        throw new Error('Test not found or unauthorized');
      }

      return test;
    } catch (error) {
      console.error('Error fetching test results:', error);
      throw new Error('Failed to fetch test results');
    }
  }

  async getUserTestHistory(userId: string, limit: number = 10): Promise<TestHistoryItem[]> {
    try {
      console.log('getUserTestHistory called with userId:', userId, 'limit:', limit);
      
      const results = await this.prisma.aptitudeTest.findMany({
        where: { 
          userId,
          status: TestStatus.COMPLETED,
          isPractice: false // Only include actual tests, not practice
        },
        orderBy: { completedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          position: true,
          overallScore: true,
          completedAt: true,
          timeTaken: true,
          domainKnowledgeScore: true,
          quantitativeScore: true,
          logicalReasoningScore: true,
          verbalAbilityScore: true
        }
      });

      console.log('Database query results:', results);
      return results;
    } catch (error) {
      console.error('Error fetching user test history:', error);
      throw new Error('Failed to fetch test history');
    }
  }

  private calculateCategoryScores(answers: any[]) {
    const categoryStats = {
      DOMAIN_KNOWLEDGE: { correct: 0, total: 0 },
      QUANTITATIVE_APTITUDE: { correct: 0, total: 0 },
      LOGICAL_REASONING: { correct: 0, total: 0 },
      VERBAL_ABILITY: { correct: 0, total: 0 }
    };

    answers.forEach(answer => {
      const category = answer.question.category as AptitudeCategory;
      categoryStats[category].total++;
      if (answer.isCorrect) {
        categoryStats[category].correct++;
      }
    });

    // Calculate percentages
    const scores = {
      DOMAIN_KNOWLEDGE: categoryStats.DOMAIN_KNOWLEDGE.total > 0 
        ? (categoryStats.DOMAIN_KNOWLEDGE.correct / categoryStats.DOMAIN_KNOWLEDGE.total) * 100 
        : 0,
      QUANTITATIVE_APTITUDE: categoryStats.QUANTITATIVE_APTITUDE.total > 0 
        ? (categoryStats.QUANTITATIVE_APTITUDE.correct / categoryStats.QUANTITATIVE_APTITUDE.total) * 100 
        : 0,
      LOGICAL_REASONING: categoryStats.LOGICAL_REASONING.total > 0 
        ? (categoryStats.LOGICAL_REASONING.correct / categoryStats.LOGICAL_REASONING.total) * 100 
        : 0,
      VERBAL_ABILITY: categoryStats.VERBAL_ABILITY.total > 0 
        ? (categoryStats.VERBAL_ABILITY.correct / categoryStats.VERBAL_ABILITY.total) * 100 
        : 0
    };

    return scores;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
