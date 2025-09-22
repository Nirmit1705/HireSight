import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ContextualAIQuestionService } from '../services/contextualAIQuestionService';
import { ConversationService } from '../services/conversationService';
import { AuthenticatedRequest } from '../types/authTypes';

const prisma = new PrismaClient();

export class ContextualInterviewController {
  private contextualAIService: ContextualAIQuestionService;
  private conversationService: ConversationService;

  constructor() {
    this.contextualAIService = new ContextualAIQuestionService();
    this.conversationService = new ConversationService();
  }

  /**
   * Start a contextual AI interview session
   */
  async startContextualInterview(req: AuthenticatedRequest, res: Response) {
    try {
      const { resumeAnalysis } = req.body;

      if (!resumeAnalysis) {
        return res.status(400).json({
          success: false,
          message: 'Resume analysis required to start contextual AI interview'
        });
      }

      // Check if AI service is available
      const aiHealthy = await this.contextualAIService.healthCheck();
      if (!aiHealthy) {
        return res.status(503).json({
          success: false,
          message: 'AI service is currently unavailable. Please try again later.'
        });
      }

      // Generate session ID
      const sessionId = `contextual-ai-interview-${req.user?.id}-${Date.now()}`;

      // Create contextual interview session
      const session = await this.contextualAIService.createInterviewSession(sessionId, resumeAnalysis);

      // Get conversation context for the response
      const context = await this.conversationService.getContext(sessionId);

      res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          firstQuestion: session.questions[0],
          totalQuestions: session.totalQuestionCount,
          candidateProfile: {
            skills: resumeAnalysis.skills.slice(0, 5),
            experience: resumeAnalysis.experience,
            domain: resumeAnalysis.domain
          },
          conversationStyle: 'contextual',
          message: 'Contextual AI interview session started. The AI will maintain conversation context and provide human-like responses.'
        }
      });

    } catch (error) {
      console.error('Contextual AI interview start error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to start contextual AI interview',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * Submit answer and get contextual response
   */
  async submitContextualAnswer(req: AuthenticatedRequest, res: Response) {
    try {
      const { sessionId, answer } = req.body;

      if (!sessionId || !answer) {
        return res.status(400).json({
          success: false,
          message: 'Session ID and answer are required'
        });
      }

      if (answer.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a more detailed answer (minimum 5 characters)'
        });
      }

      // Process response with contextual AI
      const result = await this.contextualAIService.processResponse(sessionId, answer.trim());

      const session = this.contextualAIService.getSession(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Interview session not found'
        });
      }

      // Get conversation statistics
      const conversationStats = await this.conversationService.getConversationStats(sessionId);

      res.json({
        success: true,
        data: {
          nextQuestion: result.nextQuestion,
          humanResponse: result.humanResponse, // New field for human-like responses
          shouldContinue: result.shouldContinue,
          isFollowUp: result.isFollowUp,
          isComplete: result.isComplete,
          progress: {
            currentQuestion: session.currentQuestionIndex + 1,
            totalQuestions: session.totalQuestionCount,
            conversationLength: session.conversationHistory.length,
            questionsAnswered: session.responses.length
          },
          conversationContext: {
            totalMessages: conversationStats?.totalMessages || 0,
            averageResponseLength: conversationStats?.averageResponseLength || 0,
            topicsCovered: conversationStats?.topicsCovered || []
          },
          message: result.isFollowUp 
            ? 'Contextual follow-up question generated' 
            : result.isComplete 
              ? 'Interview completed successfully'
              : 'Moving to next question with context awareness'
        }
      });

    } catch (error) {
      console.error('Contextual answer submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to process contextual answer',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * Complete contextual AI interview session
   */
  async completeContextualInterview(req: AuthenticatedRequest, res: Response) {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      const session = this.contextualAIService.getSession(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Interview session not found'
        });
      }

      // Get final conversation statistics
      const conversationStats = await this.conversationService.getConversationStats(sessionId);
      const finalConversation = await this.conversationService.getConversation(sessionId);

      // Generate interview summary with conversation context
      const summary = {
        sessionId,
        totalQuestions: session.conversationHistory.length,
        questionsAnswered: session.responses.length,
        duration: conversationStats?.duration || 0,
        averageResponseLength: conversationStats?.averageResponseLength || 0,
        topicsCovered: conversationStats?.topicsCovered || [],
        conversationQuality: this.assessConversationQuality(finalConversation),
        skills: session.resumeAnalysis?.skills || [],
        domain: session.resumeAnalysis?.domain,
        completedAt: new Date(),
        interviewType: 'contextual-ai'
      };

      // Clean up session and conversation data
      this.contextualAIService.completeSession(sessionId);
      await this.conversationService.endConversation(sessionId);

      res.json({
        success: true,
        data: {
          summary,
          message: 'Contextual AI interview completed successfully',
          feedback: 'Thank you for the engaging conversation! Your responses showed good depth and technical understanding.'
        }
      });

    } catch (error) {
      console.error('Contextual interview completion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to complete contextual interview',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * Get current contextual interview session status
   */
  async getContextualSessionStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { sessionId } = req.params;
      
      const session = this.contextualAIService.getSession(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Interview session not found'
        });
      }

      // Get conversation context
      const context = await this.conversationService.getContext(sessionId);
      const conversationStats = await this.conversationService.getConversationStats(sessionId);

      res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          currentQuestion: session.questions[session.currentQuestionIndex],
          progress: {
            currentQuestion: session.currentQuestionIndex + 1,
            totalQuestions: session.totalQuestionCount,
            conversationLength: session.conversationHistory.length,
            questionsAnswered: session.responses.length
          },
          candidateProfile: {
            skills: session.resumeAnalysis?.skills.slice(0, 5) || [],
            experience: session.resumeAnalysis?.experience,
            domain: session.resumeAnalysis?.domain
          },
          conversationContext: {
            currentTopic: context?.currentTopic,
            topicsHistory: context?.topicHistory || [],
            interviewStyle: context?.interviewStyle || 'conversational',
            totalMessages: conversationStats?.totalMessages || 0,
            averageResponseLength: conversationStats?.averageResponseLength || 0
          },
          interviewType: 'contextual-ai'
        }
      });

    } catch (error) {
      console.error('Contextual session status error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to get contextual session status',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * Get conversation history for debugging/review
   */
  async getConversationHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const { sessionId } = req.params;
      
      const conversation = await this.conversationService.getConversation(sessionId);
      const context = await this.conversationService.getContext(sessionId);

      if (!context) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      res.json({
        success: true,
        data: {
          sessionId,
          conversation: conversation.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            questionType: msg.questionType,
            isFollowUp: msg.isFollowUp
          })),
          context: {
            currentTopic: context.currentTopic,
            topicsHistory: context.topicHistory,
            questionsAsked: context.questionsAsked,
            maxQuestions: context.maxQuestions,
            interviewStyle: context.interviewStyle
          }
        }
      });

    } catch (error) {
      console.error('Conversation history error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to get conversation history',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * Health check for contextual AI services
   */
  async healthCheck(req: Request, res: Response) {
    try {
      const aiHealthy = await this.contextualAIService.healthCheck();
      
      res.json({
        success: true,
        data: {
          contextualAI: aiHealthy,
          conversationService: true, // Always available as it uses Redis
          redis: true, // Assume Redis is available if no errors
          timestamp: new Date(),
          features: {
            contextAware: true,
            humanLikeResponses: true,
            followUpQuestions: true,
            topicRedirection: true
          }
        }
      });

    } catch (error) {
      console.error('Contextual AI health check error:', error);
      res.status(500).json({
        success: false,
        message: 'Contextual AI health check failed'
      });
    }
  }

  /**
   * Assess conversation quality based on various metrics
   */
  private assessConversationQuality(conversation: any[]): {
    score: number;
    metrics: {
      responsiveness: number;
      depth: number;
      engagement: number;
    };
  } {
    const candidateMessages = conversation.filter(m => m.role === 'candidate');
    
    if (candidateMessages.length === 0) {
      return {
        score: 0,
        metrics: { responsiveness: 0, depth: 0, engagement: 0 }
      };
    }

    // Calculate responsiveness (based on response frequency)
    const responsiveness = Math.min(candidateMessages.length / 8, 1) * 100;

    // Calculate depth (based on average response length)
    const avgLength = candidateMessages.reduce((sum, msg) => sum + msg.content.length, 0) / candidateMessages.length;
    const depth = Math.min(avgLength / 150, 1) * 100; // 150 chars = good depth

    // Calculate engagement (based on use of examples, details, questions)
    const engagementKeywords = ['example', 'instance', 'experience', 'project', 'challenge', 'learned', 'implemented'];
    const engagementScore = candidateMessages.reduce((score, msg) => {
      const keywordCount = engagementKeywords.filter(keyword => 
        msg.content.toLowerCase().includes(keyword)
      ).length;
      return score + keywordCount;
    }, 0);
    const engagement = Math.min(engagementScore / candidateMessages.length * 30, 100);

    const overallScore = (responsiveness + depth + engagement) / 3;

    return {
      score: Math.round(overallScore),
      metrics: {
        responsiveness: Math.round(responsiveness),
        depth: Math.round(depth),
        engagement: Math.round(engagement)
      }
    };
  }
}