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
  randomSeed?: number; // Add seed for consistent randomization within session
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
    
    // Debug session management
    console.log('🚀 ContextualAIQuestionService initialized');
  }

  /**
   * Get session information for debugging
   */
  getSessionInfo(sessionId: string): { exists: boolean; session?: InterviewSession; totalSessions: number; allSessionIds: string[] } {
    return {
      exists: this.sessions.has(sessionId),
      session: this.sessions.get(sessionId),
      totalSessions: this.sessions.size,
      allSessionIds: Array.from(this.sessions.keys())
    };
  }

  /**
   * Check if session exists
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  async createInterviewSession(sessionId: string, resumeAnalysis: ResumeAnalysis): Promise<InterviewSession> {
    try {
      console.log('=== CREATING CONTEXTUAL INTERVIEW SESSION ===');
      console.log('📝 Session ID:', sessionId);
      console.log('📊 Current sessions before creation:', this.sessions.size);
      
      // Check if session already exists
      if (this.sessions.has(sessionId)) {
        console.log('⚠️ Session already exists, returning existing session');
        return this.sessions.get(sessionId)!;
      }
      
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

      // Calculate dynamic question count based on resume complexity and desired thoroughness
      const baseQuestions = 12; // Increased base for more comprehensive interviews
      const projectBonus = Math.min(resumeAnalysis.projects?.length || 0, 4);
      const experienceBonus = resumeAnalysis.workExperience?.length > 0 ? 3 : 0;
      const skillBonus = Math.min(Math.floor(resumeAnalysis.skills.length / 3), 4);
      
      let totalQuestionCount = baseQuestions + projectBonus + experienceBonus + skillBonus;
      totalQuestionCount = Math.max(totalQuestionCount, 12); // Minimum 12 questions for thoroughness
      totalQuestionCount = Math.min(totalQuestionCount, 20); // Maximum 20 to avoid fatigue
      
      console.log(`📊 Dynamic question calculation: Base=${baseQuestions}, Projects=${projectBonus}, Experience=${experienceBonus}, Skills=${skillBonus} → Total=${totalQuestionCount}`);

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
        isComplete: false,
        randomSeed: Math.floor(Math.random() * 10000) // Generate unique seed per session
      };

      this.sessions.set(sessionId, session);
      console.log('✅ Session created and stored successfully');
      console.log('📊 Total sessions after creation:', this.sessions.size);
      console.log('📋 All session IDs:', Array.from(this.sessions.keys()));
      
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
    console.log('🔍 Processing response for sessionId:', sessionId);
    console.log('📊 Current active sessions:', this.sessions.size);
    console.log('📋 Available session IDs:', Array.from(this.sessions.keys()));
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error('❌ Session not found for ID:', sessionId);
      console.error('📊 Available sessions:', Array.from(this.sessions.keys()));
      throw new Error(`Session not found: ${sessionId}. Available sessions: ${Array.from(this.sessions.keys()).join(', ')}`);
    }

    console.log('✅ Session found. Current question index:', session.currentQuestionIndex);

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
    
    console.log(`🔍 Flow Analysis: OnTopic=${flowAnalysis.isOnTopic}, Disruption=${flowAnalysis.flowDisruption}, RedirectionNeeded=${flowAnalysis.redirectionNeeded}, Confidence=${flowAnalysis.confidence}`);

    // Check if interview should complete based on dynamic criteria
    const minimumQuestions = 10;
    const hasReachedMinimum = session.responses.length >= minimumQuestions;
    const hasReachedTarget = session.responses.length >= session.totalQuestionCount;
    const isTimeForCompletion = hasReachedMinimum && (hasReachedTarget || session.responses.length >= 18); // Absolute max 18 questions
    
    if (isTimeForCompletion) {
      console.log(`🏁 CONTEXTUAL INTERVIEW COMPLETED: ${session.responses.length}/${session.totalQuestionCount} questions answered (min: ${minimumQuestions})`);
      session.isComplete = true;
      
      // Generate a professional closing response
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
      if (flowAnalysis.redirectionNeeded && !nextQuestion.isFollowUp) {
        const redirectionResponse = await this.generateRedirectionResponse(sessionId);
        humanResponse = redirectionResponse;
        console.log('🔄 Applying flow redirection due to off-topic response');
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

    // Analyze response quality and depth more comprehensively
    const responseAnalysis = this.analyzeResponseDepth(userResponse, lastInterviewerMessage.questionType);
    
    // Get context to see how many times we've asked follow-ups on this topic
    const context = await this.conversationService.getContext(sessionId);
    const recentFollowUps = conversation
      .filter(m => m.role === 'interviewer' && m.isFollowUp)
      .slice(-3).length; // Count recent follow-ups
    
    // Don't ask more than 2-3 follow-ups in a row to avoid being repetitive
    if (recentFollowUps >= 2) {
      console.log(`🔄 Limiting follow-ups: ${recentFollowUps} recent follow-ups detected`);
      return false;
    }

    // Smart follow-up decision based on response analysis
    const shouldFollowUp = this.determineFollowUpNeed(responseAnalysis, lastInterviewerMessage.questionType);
    
    console.log(`🤖 Follow-up decision: ${shouldFollowUp ? 'YES' : 'NO'} - Quality: ${responseAnalysis.quality}, Depth: ${responseAnalysis.depth}, Examples: ${responseAnalysis.hasExamples}`);
    
    return shouldFollowUp;
  }

  /**
   * Analyze the depth and quality of the user's response
   */
  private analyzeResponseDepth(userResponse: string, questionType?: string): {
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    depth: 'surface' | 'moderate' | 'detailed';
    hasExamples: boolean;
    hasTechnicalDetails: boolean;
    hasQuantifiableResults: boolean;
    length: number;
    wordCount: number;
  } {
    const trimmedResponse = userResponse.trim();
    const length = trimmedResponse.length;
    const wordCount = trimmedResponse.split(/\s+/).filter(word => word.length > 0).length;

    // Check for specific indicators
    const hasExamples = /example|instance|time when|situation where|once|happened|case where|for instance/i.test(userResponse);
    const hasTechnicalDetails = /implement|code|algorithm|design|architecture|framework|database|API|system|component|method|function|class|interface|pattern/i.test(userResponse);
    const hasQuantifiableResults = /\d+%|increased|decreased|improved|reduced|\$\d+|million|thousand|users|customers|performance|efficiency|faster|slower|metric/i.test(userResponse);
    const hasSpecificTools = /react|angular|vue|node|python|java|sql|mongodb|redis|aws|azure|docker|kubernetes/i.test(userResponse);
    const hasProblemSolvingLanguage = /challenge|problem|issue|solution|approach|strategy|decision|analyze|evaluate|consider|alternative|trade-off/i.test(userResponse);

    // Determine depth
    let depth: 'surface' | 'moderate' | 'detailed';
    if (length < 50 || wordCount < 10) {
      depth = 'surface';
    } else if ((length < 150 || wordCount < 25) && !hasExamples && !hasTechnicalDetails) {
      depth = 'surface';
    } else if (length < 300 || wordCount < 50) {
      depth = 'moderate';
    } else {
      depth = 'detailed';
    }

    // Determine quality based on multiple factors
    let qualityScore = 0;
    if (hasExamples) qualityScore += 2;
    if (hasTechnicalDetails && questionType === 'technical') qualityScore += 2;
    if (hasQuantifiableResults) qualityScore += 2;
    if (hasSpecificTools && questionType === 'technical') qualityScore += 1;
    if (hasProblemSolvingLanguage) qualityScore += 1;
    if (depth === 'detailed') qualityScore += 2;
    if (depth === 'moderate') qualityScore += 1;
    if (wordCount >= 30) qualityScore += 1;

    let quality: 'poor' | 'fair' | 'good' | 'excellent';
    if (qualityScore >= 6) quality = 'excellent';
    else if (qualityScore >= 4) quality = 'good';
    else if (qualityScore >= 2) quality = 'fair';
    else quality = 'poor';

    return {
      quality,
      depth,
      hasExamples,
      hasTechnicalDetails,
      hasQuantifiableResults,
      length,
      wordCount
    };
  }

  /**
   * Determine if a follow-up question is needed based on response analysis
   */
  private determineFollowUpNeed(responseAnalysis: any, questionType?: string): boolean {
    // Always follow up on poor quality responses
    if (responseAnalysis.quality === 'poor') {
      return true;
    }

    // Question-type specific logic
    switch (questionType) {
      case 'behavioral':
      case 'situational':
        // For behavioral questions, we need specific examples
        return !responseAnalysis.hasExamples && responseAnalysis.quality !== 'excellent';
      
      case 'technical':
      case 'project-specific':
        // For technical questions, we need technical depth or specific details
        return !responseAnalysis.hasTechnicalDetails && responseAnalysis.depth === 'surface';
      
      case 'experience':
        // For experience questions, we want quantifiable results or specific examples
        return !responseAnalysis.hasQuantifiableResults && !responseAnalysis.hasExamples && responseAnalysis.quality === 'fair';
      
      case 'problem-solving':
        // For problem-solving, we want to see analytical thinking
        return responseAnalysis.depth === 'surface' && responseAnalysis.quality !== 'excellent';
      
      default:
        // General case: follow up if response is surface-level and not excellent quality
        return responseAnalysis.depth === 'surface' && responseAnalysis.quality !== 'excellent';
    }
  }

  private async generateContextualFollowUp(sessionId: string, userResponse: string): Promise<{
    question: AIQuestion;
    humanResponse: string;
  }> {
    try {
      const conversationContext = await this.conversationService.getConversationContextForAI(sessionId);
      const conversation = await this.conversationService.getConversation(sessionId);
      const lastInterviewerMessage = conversation
        .filter(m => m.role === 'interviewer')
        .slice(-1)[0];
      
      const responseAnalysis = this.analyzeResponseDepth(userResponse, lastInterviewerMessage?.questionType);
      const followUpType = this.determineFollowUpType(responseAnalysis, lastInterviewerMessage?.questionType);
      
      const prompt = `You are a professional, conversational interviewer conducting a contextual follow-up. 

Current Conversation Context:
${conversationContext}

Candidate's Latest Response: "${userResponse}"

Response Analysis:
- Quality: ${responseAnalysis.quality}
- Depth: ${responseAnalysis.depth}
- Has Examples: ${responseAnalysis.hasExamples}
- Has Technical Details: ${responseAnalysis.hasTechnicalDetails}
- Question Type: ${lastInterviewerMessage?.questionType || 'general'}

Follow-up Type Needed: ${followUpType}

Based on this analysis, generate a natural follow-up that ${this.getFollowUpObjective(followUpType)}.

Generate a JSON response with exactly this format:
{
  "humanResponse": "A brief, natural acknowledgment that shows you're listening (like 'That's interesting', 'I see', 'Good point', 'Tell me more about that', etc.)",
  "followUpQuestion": {
    "text": "A natural follow-up question based on the follow-up type needed",
    "category": "follow-up",
    "difficulty": "medium",
    "isFollowUp": true
  }
}

Make the conversation feel natural and build on what they just said. Don't ask generic questions - be specific to their response.`;

      const response = await this.queryOllamaWithTimeout(prompt, 20000);
      const parsed = this.parseFollowUpResponse(response);
      
      if (parsed && parsed.followUpQuestion) {
        return {
          question: {
            id: `followup-${sessionId}-${Date.now()}`,
            text: parsed.followUpQuestion.text,
            category: 'follow-up',
            difficulty: 'medium',
            isFollowUp: true
          },
          humanResponse: parsed.humanResponse || "I'd like to dig a bit deeper into that."
        };
      } else {
        // Fallback follow-up
        return this.generateFallbackFollowUp(followUpType, userResponse);
      }
    } catch (error) {
      console.error('Error generating contextual follow-up:', error);
      return this.generateFallbackFollowUp('clarification', userResponse);
    }
  }

  /**
   * Determine what type of follow-up is needed
   */
  private determineFollowUpType(responseAnalysis: any, questionType?: string): string {
    if (responseAnalysis.quality === 'poor' || responseAnalysis.depth === 'surface') {
      if (responseAnalysis.length < 50) {
        return 'expansion'; // "Can you elaborate on that?"
      } else {
        return 'clarification'; // "What specifically did you mean by...?"
      }
    }

    switch (questionType) {
      case 'behavioral':
      case 'situational':
        if (!responseAnalysis.hasExamples) {
          return 'example_request'; // "Can you give me a specific example?"
        } else {
          return 'outcome_exploration'; // "What was the result?" or "What did you learn?"
        }
      
      case 'technical':
      case 'project-specific':
        if (!responseAnalysis.hasTechnicalDetails) {
          return 'technical_deep_dive'; // "How did you implement that technically?"
        } else {
          return 'challenge_exploration'; // "What challenges did you face?"
        }
      
      case 'experience':
        if (!responseAnalysis.hasQuantifiableResults) {
          return 'impact_measurement'; // "What impact did that have?"
        } else {
          return 'learning_exploration'; // "What did you learn from that experience?"
        }
      
      default:
        return 'clarification';
    }
  }

  /**
   * Get the objective for each follow-up type
   */
  private getFollowUpObjective(followUpType: string): string {
    const objectives: { [key: string]: string } = {
      expansion: "encourages them to provide more detail and depth",
      clarification: "asks for clarification on specific points they mentioned",
      example_request: "asks for a specific example or concrete situation",
      outcome_exploration: "explores the results, outcomes, or lessons learned",
      technical_deep_dive: "digs into the technical implementation or approach",
      challenge_exploration: "explores challenges faced and how they were overcome",
      impact_measurement: "asks about measurable impact or quantifiable results",
      learning_exploration: "explores what they learned or how they grew from the experience"
    };
    return objectives[followUpType] || "encourages them to elaborate further";
  }

  /**
   * Generate a fallback follow-up when AI generation fails
   */
  private generateFallbackFollowUp(followUpType: string, userResponse: string): {
    question: AIQuestion;
    humanResponse: string;
  } {
    const fallbackQuestions: { [key: string]: string } = {
      expansion: "Can you tell me more about that?",
      clarification: "What specifically do you mean by that?",
      example_request: "Can you give me a specific example?",
      outcome_exploration: "What was the outcome of that situation?",
      technical_deep_dive: "How did you approach that technically?",
      challenge_exploration: "What challenges did you face with that?",
      impact_measurement: "What impact did that have?",
      learning_exploration: "What did you learn from that experience?"
    };

    const fallbackResponses = [
      "That's interesting.", "I see.", "Tell me more about that.", "I'd like to understand that better."
    ];

    return {
      question: {
        id: `fallback-followup-${Date.now()}`,
        text: fallbackQuestions[followUpType] || "Can you elaborate on that?",
        category: 'follow-up',
        difficulty: 'medium',
        isFollowUp: true
      },
      humanResponse: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
    };
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
    
    // Special handling for introduction questions
    if (questionFocus.category === 'introduction') {
      if (questionNumber === 0) {
        return `You are a professional, friendly interviewer conducting a ${analysis.domain} interview. 

Generate the FIRST question of the interview. This must be a warm, welcoming introduction question to make the candidate comfortable.

Background: The candidate has skills in ${analysis.skills?.slice(0, 3).join(', ')} and experience in ${analysis.domain}.

Generate a JSON response with this exact format:
{
  "text": "Your warm, introductory question that welcomes the candidate and asks them to introduce themselves or tell you about their background",
  "category": "introduction",
  "difficulty": "easy"
}

Examples of good introduction questions:
- "Welcome! Thank you for taking the time to interview with us today. Could you start by telling me a bit about yourself and your background in [relevant field]?"
- "Hi there! I'm excited to learn more about you. Could you walk me through your journey and what brought you to [field]?"
- "Thanks for joining us today! I'd love to start by hearing about your experience and what you're passionate about in [field]."

Make it sound natural and welcoming.`;
      } else {
        return `You are a professional interviewer. Continue the conversation naturally.

${conversationContext}

Generate a follow-up introduction question (${questionNumber + 1}/${totalQuestions}) that builds on the introduction.

Requirements:
- Ask about their background, motivations, or career journey
- Keep it conversational and comfortable
- Build on what they might have shared previously
- Focus on: ${questionFocus.focusArea}

Generate a JSON response with this exact format:
{
  "text": "Your natural follow-up question about their background or career journey",
  "category": "introduction",
  "difficulty": "easy"
}`;
      }
    }

    // For non-introduction questions
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
- For technical questions: Focus on practical application, not just theory
- For behavioral questions: Ask for specific examples and situations
- For project questions: Ask about challenges, decisions, and learnings

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
    
    // ALWAYS start with introduction - this is the most critical fix
    if (questionNumber === 0) {
      return { category: 'introduction', difficulty: 'easy', focusArea: 'personal introduction and background' };
    }

    // Track topic depth - how many questions we've asked in each category
    const categoryDepth: { [key: string]: number } = {};
    coveredCategories.forEach(cat => {
      categoryDepth[cat] = (categoryDepth[cat] || 0) + 1;
    });

    // Create a pool of question categories based on progress, with intelligent prioritization
    let availableCategories: Array<{category: string, difficulty: string, focusArea?: string, priority: number}> = [];
    
    if (progress < 0.3) {
      // Early questions (30%) - Focus on getting to know the candidate
      availableCategories = [
        { category: 'introduction', difficulty: 'easy', focusArea: 'background and experience overview', priority: 3 },
        { category: 'experience', difficulty: 'easy', focusArea: 'recent work history', priority: 2 },
        { category: 'motivation', difficulty: 'easy', focusArea: 'interest in role and company', priority: 2 },
        { category: 'technical', difficulty: 'easy', focusArea: 'fundamental technical skills', priority: 1 }
      ];
    } else if (progress < 0.6) {
      // Mid questions (30-60%) - Dive deeper into expertise and projects
      availableCategories = [
        { category: 'project-specific', difficulty: 'medium', focusArea: 'detailed project discussion', priority: 3 },
        { category: 'technical', difficulty: 'medium', focusArea: 'technical problem-solving', priority: 3 },
        { category: 'problem-solving', difficulty: 'medium', focusArea: 'analytical and critical thinking', priority: 2 },
        { category: 'experience', difficulty: 'medium', focusArea: 'challenging work situations', priority: 1 }
      ];
    } else if (progress < 0.8) {
      // Later questions (60-80%) - Assess soft skills and cultural fit
      availableCategories = [
        { category: 'behavioral', difficulty: 'medium', focusArea: 'soft skills and teamwork', priority: 3 },
        { category: 'situational', difficulty: 'medium', focusArea: 'hypothetical scenarios', priority: 2 },
        { category: 'technical', difficulty: 'hard', focusArea: 'advanced technical concepts', priority: 2 },
        { category: 'collaboration', difficulty: 'medium', focusArea: 'teamwork and communication', priority: 2 },
        { category: 'leadership', difficulty: 'medium', focusArea: 'leadership and mentoring experience', priority: 1 }
      ];
    } else {
      // Final questions (80%+) - Future focus and wrap-up
      availableCategories = [
        { category: 'situational', difficulty: 'hard', focusArea: 'leadership and decision making', priority: 2 },
        { category: 'behavioral', difficulty: 'hard', focusArea: 'conflict resolution and growth', priority: 2 },
        { category: 'future-oriented', difficulty: 'medium', focusArea: 'career goals and aspirations', priority: 3 },
        { category: 'closing', difficulty: 'easy', focusArea: 'questions for us and next steps', priority: 1 }
      ];
    }

    // Intelligent category selection based on coverage and priority
    const categoriesWithScores = availableCategories.map(cat => {
      const timesAsked = categoryDepth[cat.category] || 0;
      const maxAllowed = cat.priority; // Use priority as max allowed questions in this phase
      
      // Calculate score: higher is better
      let score = cat.priority * 10; // Base score from priority
      score -= timesAsked * 15; // Penalty for repetition
      score += Math.random() * 5; // Small randomization factor
      
      // Bonus for never-asked categories
      if (timesAsked === 0) score += 20;
      
      return { ...cat, score, timesAsked, maxAllowed };
    });

    // Filter out categories that have been overused
    const eligibleCategories = categoriesWithScores.filter(cat => 
      cat.timesAsked < cat.maxAllowed || categoriesWithScores.every(c => c.timesAsked >= c.maxAllowed)
    );

    // Sort by score and pick the best one
    const sortedCategories = eligibleCategories.sort((a, b) => b.score - a.score);
    const selectedCategory = sortedCategories[0] || availableCategories[0];
    
    console.log(`Question ${questionNumber}: Selected ${selectedCategory.category} (${selectedCategory.difficulty}) - Score: ${selectedCategory.score}, Times Asked: ${selectedCategory.timesAsked}/${selectedCategory.maxAllowed}`);
    console.log(`Available options: ${sortedCategories.slice(0, 3).map(c => `${c.category}(${c.score.toFixed(1)})`).join(', ')}`);
    
    return {
      category: selectedCategory.category,
      difficulty: selectedCategory.difficulty,
      focusArea: selectedCategory.focusArea
    };
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
    console.log('🔍 Getting session:', sessionId);
    console.log('📊 Available sessions:', Array.from(this.sessions.keys()));
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error('❌ Session not found for ID:', sessionId);
    }
    
    return session;
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