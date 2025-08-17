import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types for API responses
export interface AptitudeQuestion {
  id: string;
  questionText: string;
  options: string[];
  category: string;
  difficulty: string;
}

export interface AptitudePracticeQuestion extends AptitudeQuestion {
  correctOption: number;
  explanation: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// API functions
export const aptitudeAPI = {
  // Get questions for formal test (without correct answers)
  async getQuestions(position: string): Promise<AptitudeQuestion[]> {
    try {
      const response = await api.get<ApiResponse<{ questions: AptitudeQuestion[] }>>(`/aptitude/questions?position=${position}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data.questions;
      }
      throw new Error(response.data.message || 'Failed to fetch questions');
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },

  // Get questions for practice mode (with correct answers and explanations)
  async getPracticeQuestions(position: string): Promise<AptitudePracticeQuestion[]> {
    try {
      const response = await api.get<ApiResponse<{ questions: AptitudePracticeQuestion[] }>>(`/aptitude/practice-questions?position=${position}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data.questions;
      }
      throw new Error(response.data.message || 'Failed to fetch practice questions');
    } catch (error) {
      console.error('Error fetching practice questions:', error);
      throw error;
    }
  },

  // Start a new test
  async startTest(position: string, isPractice: boolean = false): Promise<{
    testId: string;
    position: string;
    isPractice: boolean;
    totalQuestions: number;
    timeLimit: number;
    startedAt: string;
  }> {
    try {
      const response = await api.post('/aptitude/start', {
        position,
        isPractice
      });
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to start test');
    } catch (error) {
      console.error('Error starting test:', error);
      throw error;
    }
  },

  // Submit an answer
  async submitAnswer(testId: string, questionId: string, selectedOption: number): Promise<{
    isCorrect: boolean;
    correctOption?: number;
    explanation?: string;
  }> {
    try {
      const response = await api.post(`/aptitude/${testId}/answers`, {
        questionId,
        selectedOption
      });
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to submit answer');
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  },

  // Complete the test
  async completeTest(testId: string, timeTaken: number): Promise<{
    overallScore: number;
    scores: {
      domainKnowledge: number;
      quantitative: number;
      logicalReasoning: number;
      verbalAbility: number;
    };
    timeTaken: number;
    completedAt: string;
  }> {
    try {
      const response = await api.post(`/aptitude/${testId}/complete`, {
        timeTaken
      });
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to complete test');
    } catch (error) {
      console.error('Error completing test:', error);
      throw error;
    }
  },

  // Get test results
  async getTestResults(testId: string): Promise<{
    test: {
      id: string;
      position: string;
      isPractice: boolean;
      overallScore: number;
      timeTaken: number;
      completedAt: string;
      scores: {
        domainKnowledge: number;
        quantitative: number;
        logicalReasoning: number;
        verbalAbility: number;
      };
    };
    answers: Array<{
      questionText: string;
      options: string[];
      selectedOption: number;
      correctOption: number;
      isCorrect: boolean;
      category: string;
    }>;
  }> {
    try {
      const response = await api.get(`/aptitude/${testId}/results`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to get test results');
    } catch (error) {
      console.error('Error getting test results:', error);
      throw error;
    }
  },

  // Get test history
  async getTestHistory(): Promise<Array<{
    id: string;
    position: string;
    isPractice: boolean;
    overallScore: number;
    timeTaken: number;
    completedAt: string;
    status: string;
  }>> {
    try {
      const response = await api.get('/aptitude/history');
      
      if (response.data.success && response.data.data) {
        return response.data.data.tests;
      }
      throw new Error(response.data.message || 'Failed to get test history');
    } catch (error) {
      console.error('Error getting test history:', error);
      throw error;
    }
  }
};
