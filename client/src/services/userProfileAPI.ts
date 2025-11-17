import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Add auth token to requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  currentPosition?: string;
  experience?: string;
}

export interface UserStatistics {
  totalInterviews: number;
  averageScore: number;
  improvementRate: number;
  timeSpent: number;
  bestScore: number;
  streak: number;
}

export interface RecentInterview {
  id: string;
  date: string;
  position: string;
  score: number;
  domain: string;
  status: string;
}

export interface SkillProgress {
  skill: string;
  current: number;
  target: number;
  change: number;
}

export interface RadarDataPoint {
  label: string;
  value: number;
}

export interface Achievement {
  title: string;
  description: string;
  earned: boolean;
  iconType: 'award' | 'trophy' | 'trending' | 'clock';
}

export interface UserProfileData {
  userInfo: UserInfo;
  statistics: UserStatistics;
  recentInterviews: RecentInterview[];
  skillProgress: SkillProgress[];
  radarData: RadarDataPoint[];
  achievements: Achievement[];
}

export const userProfileAPI = {
  /**
   * Get comprehensive user profile data
   */
  async getUserProfile(): Promise<UserProfileData> {
    const response = await axios.get(`${API_BASE_URL}/user/profile`);
    return response.data.data;
  },

  /**
   * Get user basic info
   */
  async getUserInfo(): Promise<UserInfo> {
    const response = await axios.get(`${API_BASE_URL}/auth/profile`);
    return response.data.data.user;
  }
};
