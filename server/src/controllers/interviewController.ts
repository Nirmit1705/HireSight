import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { InterviewQuestionService, InterviewQuestionData } from '../services/interviewQuestionService';

const prisma = new PrismaClient();

// Note: You'll need to initialize Redis and InterviewQuestionService
// const redis = new Redis(process.env.REDIS_URL);
// const interviewQuestionService = new InterviewQuestionService(redis);

export class InterviewController {
  constructor(private interviewQuestionService: InterviewQuestionService) {}

  /**
   * Start a new interview
   */
  async startInterview(req: Request, res: Response) {
    try {
      const { userId, position } = req.body;

      // Create interview record in PostgreSQL with minimal data
      const interview = await prisma.interview.create({
        data: {
          userId,
          position,
          status: 'IN_PROGRESS',
        },
      });

      // Create in-memory session for questions
      await this.interviewQuestionService.createInterviewSession(
        interview.id,
        userId,
        position
      );

      res.status(201).json({
        success: true,
        interview: {
          id: interview.id,
          position: interview.position,
          startedAt: interview.startedAt,
          status: interview.status,
        },
      });
    } catch (error) {
      console.error('Error starting interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start interview',
      });
    }
  }

  /**
   * Submit a question response during interview
   */
  async submitQuestionResponse(req: Request, res: Response) {
    try {
      const { interviewId } = req.params;
      const { questionText, userResponse, audioUrl, duration } = req.body;

      const questionData: InterviewQuestionData = {
        questionId: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        questionText,
        userResponse,
        audioUrl,
        timestamp: new Date(),
        duration,
      };

      // Store question response in memory/Redis
      await this.interviewQuestionService.addQuestionResponse(interviewId, questionData);

      res.status(200).json({
        success: true,
        message: 'Question response recorded',
        questionId: questionData.questionId,
      });
    } catch (error) {
      console.error('Error submitting question response:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record question response',
      });
    }
  }

  /**
   * Update scores for a specific question (called by AI/ML service)
   */
  async updateQuestionScores(req: Request, res: Response) {
    try {
      const { interviewId, questionIndex } = req.params;
      const scores = req.body;

      await this.interviewQuestionService.updateQuestionScores(
        interviewId,
        parseInt(questionIndex),
        scores
      );

      res.status(200).json({
        success: true,
        message: 'Question scores updated',
      });
    } catch (error) {
      console.error('Error updating question scores:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update question scores',
      });
    }
  }

  /**
   * Complete interview and save final results to PostgreSQL
   */
  async completeInterview(req: Request, res: Response) {
    try {
      const { interviewId } = req.params;

      // Calculate final aggregated scores
      const finalScores = await this.interviewQuestionService.calculateFinalScores(interviewId);
      
      if (!finalScores) {
        return res.status(400).json({
          success: false,
          message: 'No scored questions found for this interview',
        });
      }

      // Update interview record in PostgreSQL with final scores
      const completedInterview = await prisma.interview.update({
        where: { id: interviewId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          duration: Math.floor((new Date().getTime() - new Date().getTime()) / 1000), // You'll need to calculate this properly
          fluencyScore: finalScores.fluencyScore,
          grammarScore: finalScores.grammarScore,
          confidenceScore: finalScores.confidenceScore,
          technicalKnowledgeScore: finalScores.technicalKnowledgeScore,
          vocabularyScore: finalScores.vocabularyScore,
          analyticalThinkingScore: finalScores.analyticalThinkingScore,
          overallScore: finalScores.overallScore,
        },
      });

      // Create feedback record
      await prisma.feedback.create({
        data: {
          userId: completedInterview.userId,
          interviewId: completedInterview.id,
          fluencyScore: finalScores.fluencyScore,
          grammarScore: finalScores.grammarScore,
          confidenceScore: finalScores.confidenceScore,
          technicalKnowledgeScore: finalScores.technicalKnowledgeScore,
          vocabularyScore: finalScores.vocabularyScore,
          analyticalThinkingScore: finalScores.analyticalThinkingScore,
          interviewOverallScore: finalScores.overallScore,
          strengths: [], // You can generate these based on high scores
          // Add feedback improvements as needed
        },
      });

      // Clean up in-memory session
      await this.interviewQuestionService.completeInterviewSession(interviewId);

      res.status(200).json({
        success: true,
        interview: completedInterview,
        scores: finalScores,
      });
    } catch (error) {
      console.error('Error completing interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete interview',
      });
    }
  }

  /**
   * Get current interview session status
   */
  async getInterviewSession(req: Request, res: Response) {
    try {
      const { interviewId } = req.params;

      const session = await this.interviewQuestionService.getInterviewSession(interviewId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Interview session not found',
        });
      }

      // Return session info without sensitive question data
      res.status(200).json({
        success: true,
        session: {
          interviewId: session.interviewId,
          position: session.position,
          startedAt: session.startedAt,
          currentQuestionIndex: session.currentQuestionIndex,
          totalQuestions: session.questions.length,
          status: session.status,
        },
      });
    } catch (error) {
      console.error('Error getting interview session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get interview session',
      });
    }
  }

  /**
   * Abandon interview
   */
  async abandonInterview(req: Request, res: Response) {
    try {
      const { interviewId } = req.params;

      // Update interview status in PostgreSQL
      await prisma.interview.update({
        where: { id: interviewId },
        data: {
          status: 'ABANDONED',
          completedAt: new Date(),
        },
      });

      // Clean up in-memory session
      await this.interviewQuestionService.deleteInterviewSession(interviewId);

      res.status(200).json({
        success: true,
        message: 'Interview abandoned',
      });
    } catch (error) {
      console.error('Error abandoning interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to abandon interview',
      });
    }
  }
}
