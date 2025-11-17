const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface InterviewFeedback {
  id: string;
  userId: string;
  interviewId: string;
  position?: string;  // Formatted position name (e.g., "Full Stack Developer")
  // Interview Scores
  fluencyScore?: number;
  grammarScore?: number;
  confidenceScore?: number;
  technicalKnowledgeScore?: number;
  vocabularyScore?: number;
  analyticalThinkingScore?: number;
  interviewOverallScore?: number;
  // Aptitude Scores
  domainKnowledgeScore?: number;
  quantitativeScore?: number;
  logicalReasoningScore?: number;
  verbalAbilityScore?: number;
  aptitudeOverallScore?: number;
  // Feedback content
  strengths: string[];
  performanceInsights: string[];
  aptitudeInsights: string[];
  improvements: FeedbackImprovement[];
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackImprovement {
  id: string;
  area: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string;
}

export interface InterviewResponse {
  question: string;
  answer: string;
  confidence: number;
  duration: number;
}

export interface EndInterviewRequest {
  responses?: InterviewResponse[];
  duration?: number;
  position?: string;
}

export interface EndInterviewResponse {
  success: boolean;
  message: string;
  feedback?: InterviewFeedback;
  interview?: {
    id: string;
    status: string;
    completedAt: string;
  };
}

class InterviewAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    console.log('🔴 Auth token from localStorage:', token ? 'Token exists' : 'No token found');
    console.log('🔴 Token preview:', token ? token.substring(0, 50) + '...' : 'null');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async startInterview(userId: string, position: string) {
    const response = await fetch(`${API_BASE_URL}/interviews/start`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ userId, position })
    });

    if (!response.ok) {
      throw new Error('Failed to start interview');
    }

    return response.json();
  }

  async endInterview(interviewId: string, data: EndInterviewRequest): Promise<EndInterviewResponse> {
    const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}/end`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to end interview');
    }

    return response.json();
  }

  async getFeedback(interviewId: string): Promise<InterviewFeedback> {
    const response = await fetch(`${API_BASE_URL}/feedback/interview/${interviewId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get feedback');
    }

    return response.json();
  }

  async submitQuestionResponse(
    interviewId: string,
    questionText: string,
    userResponse: string,
    audioUrl?: string,
    duration?: number
  ) {
    const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}/questions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        questionText,
        userResponse,
        audioUrl,
        duration
      })
    });

    if (!response.ok) {
      throw new Error('Failed to submit question response');
    }

    return response.json();
  }

  async abandonInterview(interviewId: string) {
    const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}/abandon`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to abandon interview');
    }

    return response.json();
  }

  async getInterviewHistory(limit = 10) {
    const response = await fetch(`${API_BASE_URL}/ai-interview/history?limit=${limit}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch interview history');
    }

    const data = await response.json();
    return data.data.interviews;
  }

  async getInterviewById(id: string) {
    const response = await fetch(`${API_BASE_URL}/ai-interview/interview/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch interview details');
    }

    const data = await response.json();
    return data.data.interview;
  }
}

export const interviewAPI = new InterviewAPI();