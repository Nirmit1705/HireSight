import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface UserStats {
  aptitudeScore: number;
  interviewScore: number;
  overallPerformance: number;
  completedSessions: number;
}

export interface PerformanceDataPoint {
  date: string;
  overallScore: number;
  sessionNumber: number;
}

export interface MLEvaluation {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

export interface RecentActivity {
  date: string;
  activity: string;
  score: number;
  type: 'interview' | 'aptitude';
}

export interface DashboardData {
  userStats: UserStats;
  performanceData: PerformanceDataPoint[];
  mlEvaluation: MLEvaluation;
  recentActivities: RecentActivity[];
}

export const dashboardAPI = {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardData> {
    const token = localStorage.getItem('authToken');
    
    const response = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data.data;
  }
};
