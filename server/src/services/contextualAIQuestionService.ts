import axios from 'axios';
import { ResumeAnalysis } from './resumeProcessingService';
import { ConversationService, ConversationMessage, InterviewContext } from './conversationService';

export interface AIQuestion {
  id: string;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  followUp?: string[];
  isFollowUp?: boolean;
  isHumanResponse?: boolean; // New flag for human-like responses
}

export interface InterviewSession {
  sessionId: string;
  questions: AIQuestion[];
  currentQuestionIndex: number;
  responses: string[];
  resumeAnalysis?: ResumeAnalysis;
  conversationHistory: Array<{
    question: string;
    response: string;
    timestamp: Date;
  }>;
  totalQuestionCount: number;
  isComplete: boolean;
}

export class ContextualAIQuestionService {
  private ollamaUrl: string;
  private modelName: string;
  private sessions: Map<string, InterviewSession> = new Map();
  private conversationService: ConversationService;

  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.modelName = process.env.OLLAMA_MODEL || 'gemma3';
    this.conversationService = new ConversationService();
  }

  async createInterviewSession(sessionId: string, resumeAnalysis: ResumeAnalysis): Promise<InterviewSession> {
    try {
      console.log('=== CREATING CONTEXTUAL INTERVIEW SESSION ===');
      
      // Check if Ollama is available
      const isOllamaHealthy = await this.healthCheck();
      if (!isOllamaHealthy) {
        console.error('Ollama is not available. Please ensure Ollama is running and the model is loaded.');
        throw new Error('AI service is not available. Please ensure Ollama is running and try again.');
      }

      // Initialize conversation context in Redis
      const interviewContext = await this.conversationService.initializeConversation(
        sessionId,
        {
          skills: resumeAnalysis.skills,
          experience: resumeAnalysis.experience,
          domain: resumeAnalysis.domain,
          projects: resumeAnalysis.projects,
          workExperience: resumeAnalysis.workExperience
        },
        resumeAnalysis.domain || 'Software Engineering'
      );

      // Calculate total questions
      const baseQuestions = 8;
      const projectBonus = Math.min(resumeAnalysis.projects?.length || 0, 3);
      const experienceBonus = resumeAnalysis.workExperience?.length > 0 ? 2 : 0;
      const skillBonus = Math.min(Math.floor(resumeAnalysis.skills.length / 3), 3);
      
      let totalQuestionCount = baseQuestions + projectBonus + experienceBonus + skillBonus;
      totalQuestionCount = Math.max(totalQuestionCount, 10);
      totalQuestionCount = Math.min(totalQuestionCount, 15);

      // Generate the first question with context
      const firstQuestion = await this.generateContextualQuestion(sessionId, resumeAnalysis, [], 0, totalQuestionCount);
      
      // Store the first question in conversation
      await this.conversationService.addMessage(sessionId, {
        role: 'interviewer',
        content: firstQuestion.text,
        timestamp: new Date(),
        questionType: firstQuestion.category,
        isFollowUp: false
      });

      const session: InterviewSession = {
        sessionId,
        questions: [firstQuestion],
        currentQuestionIndex: 0,
        responses: [],
        resumeAnalysis,
        conversationHistory: [],
        totalQuestionCount,
        isComplete: false
      };

      this.sessions.set(sessionId, session);
      return session;
    } catch (error) {
      console.error('Error creating contextual interview session:', error);
      throw error;
    }
  }

  async processResponse(sessionId: string, userResponse: string): Promise<{
    nextQuestion: AIQuestion | null;
    isComplete: boolean;
    shouldContinue: boolean;
    isFollowUp: boolean;
    humanResponse?: string; // New field for human-like responses
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Store candidate response in conversation
    await this.conversationService.addMessage(sessionId, {
      role: 'candidate',
      content: userResponse,
      timestamp: new Date()
    });

    // Update session
    session.responses.push(userResponse);
    
    if (session.currentQuestionIndex < session.questions.length) {
      session.conversationHistory.push({
        question: session.questions[session.currentQuestionIndex].text,
        response: userResponse,
        timestamp: new Date()
      });
    }
    
    session.currentQuestionIndex++;

    // Get conversation context for analysis
    const context = await this.conversationService.getContext(sessionId);
    const conversationFlow = await this.conversationService.getConversation(sessionId);
    
    // Analyze if candidate is staying on track
    const flowAnalysis = this.conversationService.analyzeConversationFlow(conversationFlow);

    // Check if interview should complete
    const minimumQuestions = 8;
    const shouldComplete = session.responses.length >= session.totalQuestionCount && session.responses.length >= minimumQuestions;
    
    if (shouldComplete) {
      console.log(`🏁 CONTEXTUAL INTERVIEW COMPLETED: ${session.responses.length}/${session.totalQuestionCount} questions answered`);
      session.isComplete = true;
      
      // Generate a closing human response
      const closingResponse = await this.generateHumanClosingResponse(sessionId);
      return { 
        nextQuestion: null, 
        isComplete: true, 
        shouldContinue: false, 
        isFollowUp: false,
        humanResponse: closingResponse
      };
    }

    try {
      // Determine if we need a follow-up or new question
      const shouldGenerateFollowUp = await this.shouldGenerateFollowUp(sessionId, userResponse);
      
      let nextQuestion: AIQuestion;
      let humanResponse: string | undefined;

      if (shouldGenerateFollowUp) {
        // Generate contextual follow-up
        const followUpData = await this.generateContextualFollowUp(sessionId, userResponse);
        nextQuestion = followUpData.question;
        humanResponse = followUpData.humanResponse;
      } else {
        // Generate next main question
        const nextQuestionNumber = session.responses.length;
        nextQuestion = await this.generateContextualQuestion(
          sessionId,
          session.resumeAnalysis!,
          session.questions,
          nextQuestionNumber,
          session.totalQuestionCount
        );

        // Generate a brief human acknowledgment of the previous answer
        humanResponse = await this.generateHumanAcknowledgment(sessionId, userResponse);
      }

      // Handle redirection if candidate went off-topic
      if (flowAnalysis.needsRedirection && !nextQuestion.isFollowUp) {
        const redirectionResponse = await this.generateRedirectionResponse(sessionId);
        humanResponse = redirectionResponse;
      }

      // Store the new question in conversation
      await this.conversationService.addMessage(sessionId, {
        role: 'interviewer',
        content: nextQuestion.text,
        timestamp: new Date(),
        questionType: nextQuestion.category,
        isFollowUp: nextQuestion.isFollowUp || false
      });

      session.questions.push(nextQuestion);
      
      return { 
        nextQuestion: nextQuestion!, 
        isComplete: false, 
        shouldContinue: true, 
        isFollowUp: nextQuestion.isFollowUp || false,
        humanResponse
      };
    } catch (error) {
      console.error('Failed to generate contextual response:', error);
      
      session.isComplete = true;
      return { 
        nextQuestion: null, 
        isComplete: true, 
        shouldContinue: false, 
        isFollowUp: false 
      };
    }
  }

  private async generateContextualQuestion(
    sessionId: string,
    analysis: ResumeAnalysis, 
    previousQuestions: AIQuestion[], 
    questionNumber: number,
    totalQuestions: number
  ): Promise<AIQuestion> {
    try {
      // Get conversation context
      const conversationContext = await this.conversationService.getConversationContextForAI(sessionId);
      const context = await this.conversationService.getContext(sessionId);
      
      // Determine question focus based on conversation flow
      const questionFocus = this.determineQuestionFocusWithContext(
        questionNumber / totalQuestions,
        questionNumber,
        analysis,
        previousQuestions,
        context
      );

      const prompt = this.createContextualPrompt(
        questionFocus,
        analysis,
        conversationContext,
        questionNumber,
        totalQuestions
      );

      console.log(`Generating contextual question ${questionNumber + 1}/${totalQuestions}...`);
      
      // Use longer timeout for first question as Ollama might need to load model
      const timeout = questionNumber === 0 ? 45000 : 25000;
      const response = await this.queryOllamaWithTimeout(prompt, timeout);
      const questions = this.parseQuestions(response);
      
      if (questions.length > 0) {
        questions[0].id = `q-${sessionId}-${questionNumber + 1}`;
        console.log(`Successfully generated contextual question: ${questions[0].text.substring(0, 100)}...`);
        return questions[0];
      } else {
        // Fallback to non-contextual question
        return this.createFallbackQuestion(questionFocus, analysis, questionNumber);
      }
    } catch (error: any) {
      console.error(`Failed to generate contextual question:`, error.message);
      throw error;
    }
  }

  private async shouldGenerateFollowUp(sessionId: string, userResponse: string): Promise<boolean> {
    // Check conversation context to determine if a follow-up is needed
    const conversation = await this.conversationService.getConversation(sessionId);
    const lastInterviewerMessage = conversation
      .filter(m => m.role === 'interviewer')
      .slice(-1)[0];

    if (!lastInterviewerMessage) return false;

    // Analyze response quality and depth
    const responseLength = userResponse.trim().length;
    const hasSpecificExamples = /example|instance|time when|situation where/i.test(userResponse);
    const hasTechnicalDetails = /implement|code|algorithm|design|architecture/i.test(userResponse);
    
    // Generate follow-up if:
    // 1. Response is too brief (less than 100 chars)
    // 2. Response lacks examples/details for behavioral questions
    // 3. Response needs technical clarification
    
    const isBrief = responseLength < 100;
    const isLastQuestionBehavioral = lastInterviewerMessage.questionType === 'behavioral';
    const isLastQuestionTechnical = lastInterviewerMessage.questionType === 'technical';
    
    return (
      isBrief ||
      (isLastQuestionBehavioral && !hasSpecificExamples) ||
      (isLastQuestionTechnical && !hasTechnicalDetails && Math.random() > 0.7) // 30% chance for technical follow-ups
    );
  }

  private async generateContextualFollowUp(sessionId: string, userResponse: string): Promise<{
    question: AIQuestion;
    humanResponse: string;
  }> {
    try {
      const conversationContext = await this.conversationService.getConversationContextForAI(sessionId);
      
      const prompt = `You are a professional, conversational interviewer. Based on the following conversation context and the candidate's latest response, generate a natural follow-up question and a brief human-like acknowledgment.

${conversationContext}

Candidate's Latest Response: "${userResponse}"

Generate a JSON response with exactly this format:
{
  "humanResponse": "A brief, natural acknowledgment (like 'That's interesting', 'I see', 'Good point', etc.)",
  "followUpQuestion": {
    "text": "A natural follow-up question that digs deeper or asks for clarification",
    "category": "follow-up",
    "difficulty": "medium"
  }
}

Make the human response feel natural and conversational. Make the follow-up question feel like a natural continuation of the conversation.`;

      const response = await this.queryOllamaWithTimeout(prompt, 20000);
      const parsed = this.parseFollowUpResponse(response);
      
      return {
        question: {
          id: `followup-${sessionId}-${Date.now()}`,
          text: parsed.followUpQuestion.text,
          category: 'follow-up',
          difficulty: 'medium',
          isFollowUp: true,
          isHumanResponse: true
        },
        humanResponse: parsed.humanResponse
      };
    } catch (error) {
      console.error('Failed to generate contextual follow-up:', error);
      
      // Fallback follow-up
      return {
        question: {
          id: `fallback-followup-${sessionId}-${Date.now()}`,
          text: "Could you elaborate on that a bit more? I'd like to understand your approach better.",
          category: 'follow-up',
          difficulty: 'medium',
          isFollowUp: true
        },
        humanResponse: "That's interesting."
      };
    }
  }

  private async generateHumanAcknowledgment(sessionId: string, userResponse: string): Promise<string> {
    try {
      const prompt = `Generate a brief, natural human acknowledgment (1-5 words) for this response: "${userResponse.substring(0, 200)}"

Examples: "That's great", "I see", "Interesting", "Good point", "Makes sense", "Absolutely", "Right", "Fair enough"

Response:`;

      const response = await this.queryOllamaWithTimeout(prompt, 8000);
      const acknowledgment = response.trim().replace(/["']/g, '');
      
      // Ensure it's brief
      if (acknowledgment.length > 50) {
        return this.getRandomAcknowledgment();
      }
      
      return acknowledgment;
    } catch (error) {
      return this.getRandomAcknowledgment();
    }
  }

  private async generateRedirectionResponse(sessionId: string): Promise<string> {
    const redirections = [
      "That's interesting, but let's get back to the technical aspects.",
      "I appreciate that context. Now, let's focus on your professional experience.",
      "Good to know. Let me ask you about something more specific to the role.",
      "Thanks for sharing. Let's dive into the technical side of things.",
      "I see. Let's talk about your work experience instead."
    ];
    
    return redirections[Math.floor(Math.random() * redirections.length)];
  }

  private async generateHumanClosingResponse(sessionId: string): Promise<string> {
    const closings = [
      "Thank you for your time today. It's been a great conversation!",
      "Excellent! I really enjoyed our discussion about your experience.",
      "That's wonderful. Thank you for walking me through your background.",
      "Great answers! I appreciate you taking the time to share your insights.",
      "Perfect! That gives me a really good understanding of your experience."
    ];
    
    return closings[Math.floor(Math.random() * closings.length)];
  }

  private getRandomAcknowledgment(): string {
    const acknowledgments = [
      "That's great", "I see", "Interesting", "Good point", "Makes sense",
      "Absolutely", "Right", "Fair enough", "Nice", "Excellent"
    ];
    
    return acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
  }

  private createContextualPrompt(
    questionFocus: any,
    analysis: ResumeAnalysis,
    conversationContext: string,
    questionNumber: number,
    totalQuestions: number
  ): string {
    return `You are a professional, conversational interviewer conducting a ${analysis.domain} interview. Be natural and human-like, not robotic.

${conversationContext}

Generate the next question (${questionNumber + 1}/${totalQuestions}) focusing on: ${questionFocus.category}

Requirements:
- Be conversational and natural, like a real human interviewer
- Consider the conversation flow and previous responses
- Don't repeat topics already covered thoroughly
- Make questions relevant to their background: ${analysis.skills?.slice(0, 3).join(', ')}
- Focus on: ${questionFocus.focusArea || questionFocus.category}
- Difficulty: ${questionFocus.difficulty || 'medium'}

Generate a JSON response with this exact format:
{
  "text": "Your natural, conversational interview question",
  "category": "${questionFocus.category}",
  "difficulty": "${questionFocus.difficulty || 'medium'}"
}

Make it sound like a real human conversation, not a formal assessment.`;
  }

  private determineQuestionFocusWithContext(
    progress: number,
    questionNumber: number,
    analysis: ResumeAnalysis,
    previousQuestions: AIQuestion[],
    context: InterviewContext | null
  ) {
    // Consider conversation context and what's been covered
    const coveredCategories = previousQuestions.map(q => q.category);
    const topicsCovered = context?.topicHistory || [];
    
    // Determine focus based on progress and conversation context
    if (questionNumber === 0) {
      return { category: 'introduction', difficulty: 'easy' };
    }
    
    if (progress < 0.3) {
      return { category: 'technical', difficulty: 'easy', focusArea: 'core skills' };
    } else if (progress < 0.6) {
      if (!coveredCategories.includes('project-specific')) {
        return { category: 'project-specific', difficulty: 'medium' };
      }
      return { category: 'technical', difficulty: 'medium', focusArea: 'advanced concepts' };
    } else if (progress < 0.8) {
      if (!coveredCategories.includes('behavioral')) {
        return { category: 'behavioral', difficulty: 'medium' };
      }
      return { category: 'problem-solving', difficulty: 'medium' };
    } else {
      return { category: 'situational', difficulty: 'hard', focusArea: 'leadership and decision making' };
    }
  }

  private parseFollowUpResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      // Fallback parsing
      return {
        humanResponse: "I see.",
        followUpQuestion: {
          text: "Could you tell me more about that?",
          category: "follow-up",
          difficulty: "medium"
        }
      };
    }
  }

  // Include other necessary methods from the original service
  async healthCheck(): Promise<boolean> {
    try {
      console.log('Performing Ollama health check...');
      // First check if Ollama is running
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
      if (response.status !== 200) {
        return false;
      }
      
      // Then test if the model can generate a response
      const testResponse = await this.testOllamaConnection("Generate a simple JSON: {\"status\": \"ready\"}");
      console.log('Ollama model test successful, response length:', testResponse.length);
      return testResponse.length > 0;
    } catch (error) {
      console.error('Ollama health check failed:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  private async queryOllamaWithTimeout(prompt: string, timeout: number = 25000): Promise<string> {
    try {
      console.log(`Querying Ollama with timeout: ${timeout}ms`);
      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: this.modelName,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            num_predict: 200, // Limit response length for faster generation
            num_ctx: 2048     // Reduce context window for faster processing
          }
        },
        { timeout }
      );

      return response.data.response || '';
    } catch (error: any) {
      console.error('Ollama query failed:', error.message);
      throw error;
    }
  }

  private parseQuestions(response: string): AIQuestion[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.text && parsed.category) {
          return [{
            id: `q-${Date.now()}`,
            text: parsed.text,
            category: parsed.category,
            difficulty: parsed.difficulty || 'medium'
          }];
        }
      }
      return [];
    } catch (error) {
      console.error('Failed to parse questions:', error);
      return [];
    }
  }

  private createFallbackQuestion(questionFocus: any, analysis: ResumeAnalysis, questionNumber: number): AIQuestion {
    let questionText = '';
    
    switch (questionFocus.category) {
      case 'introduction':
        questionText = `Could you tell me a bit about yourself and what interests you about ${analysis.domain}?`;
        break;
      case 'technical':
        const skill = analysis.skills?.[0] || 'programming';
        questionText = `Can you tell me about your experience with ${skill}? What projects have you used it in?`;
        break;
      case 'project-specific':
        const project = analysis.projects?.[0] || 'one of your projects';
        questionText = `Can you walk me through ${project}? What was your role and what challenges did you face?`;
        break;
      default:
        questionText = `What's an achievement you're particularly proud of in your career?`;
    }

    return {
      id: `fallback-${questionNumber}`,
      text: questionText,
      category: questionFocus.category,
      difficulty: 'medium'
    };
  }

  getSession(sessionId: string): InterviewSession | undefined {
    return this.sessions.get(sessionId);
  }

  completeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    // Clean up conversation data
    this.conversationService.endConversation(sessionId);
  }

  async testOllamaConnection(prompt: string = "Say hello."): Promise<string> {
    return await this.queryOllamaWithTimeout(prompt, 15000);
  }
}