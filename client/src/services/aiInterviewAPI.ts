const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ResumeAnalysis {
  extractedText: string;
  keywords: string[];
  skills: string[];
  experience: string;
  domain: string;
  education: string[];
  certifications: string[];
}

export interface AIQuestion {
  id: string;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AIInterviewSession {
  sessionId: string;
  firstQuestion: AIQuestion;
  totalQuestions: number;
  candidateProfile: {
    skills: string[];
    experience: string;
    domain: string;
  };
}

export interface AnswerResponse {
  nextQuestion?: AIQuestion;
  shouldContinue: boolean;
  isFollowUp: boolean;
  progress: {
    currentQuestion: number;
    totalQuestions: number;
    conversationLength: number;
  };
  message: string;
}

class AIInterviewAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  async uploadResume(file: File): Promise<{ analysis: ResumeAnalysis; extractedText: string }> {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await fetch(`${API_BASE_URL}/ai-interview/upload-resume`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to upload resume');
    }

    return data.data;
  }

  async startAIInterview(resumeAnalysis: ResumeAnalysis): Promise<AIInterviewSession> {
    const response = await fetch(`${API_BASE_URL}/ai-interview/start-ai-interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({ resumeAnalysis })
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to start AI interview');
    }

    return data.data;
  }

  async submitAnswer(sessionId: string, answer: string): Promise<AnswerResponse> {
    const response = await fetch(`${API_BASE_URL}/ai-interview/submit-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({ sessionId, answer })
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to submit answer');
    }

    return data.data;
  }

  async completeInterview(sessionId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/ai-interview/complete-interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({ sessionId })
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to complete interview');
    }

    return data.data;
  }

  async getSessionStatus(sessionId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/ai-interview/session/${sessionId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to get session status');
    }

    return data.data;
  }

  async healthCheck(): Promise<{ ollama: boolean; resumeProcessing: boolean }> {
    const response = await fetch(`${API_BASE_URL}/ai-interview/health`, {
      method: 'GET'
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error('Health check failed');
    }

    return data.data;
  }
}

export const aiInterviewAPI = new AIInterviewAPI();
