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
export interface Position {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Domain {
  id: string;
  title: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// API functions
export const metadataAPI = {
  // Get all available positions
  async getPositions(): Promise<Position[]> {
    try {
      const response = await api.get<ApiResponse<{ positions: Position[] }>>('/metadata/positions');
      
      if (response.data.success && response.data.data) {
        return response.data.data.positions;
      }
      throw new Error(response.data.message || 'Failed to fetch positions');
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  },

  // Get all available domains
  async getDomains(): Promise<Domain[]> {
    try {
      const response = await api.get<ApiResponse<{ domains: Domain[] }>>('/metadata/domains');
      
      if (response.data.success && response.data.data) {
        return response.data.data.domains;
      }
      throw new Error(response.data.message || 'Failed to fetch domains');
    } catch (error) {
      console.error('Error fetching domains:', error);
      throw error;
    }
  }
};
