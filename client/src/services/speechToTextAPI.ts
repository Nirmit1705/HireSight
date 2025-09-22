import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface TranscriptionResponse {
  success: boolean;
  transcript?: string;
  confidence?: number;
  metadata?: {
    duration?: number;
    model?: string;
  };
  error?: string;
  details?: string;
}

export interface SpeechToTextService {
  transcribeAudio: (audioBlob: Blob) => Promise<TranscriptionResponse>;
  healthCheck: () => Promise<{ success: boolean; service: string; status: string }>;
}

export const speechToTextAPI: SpeechToTextService = {
  /**
   * Transcribe audio blob using Deepgram
   */
  transcribeAudio: async (audioBlob: Blob): Promise<TranscriptionResponse> => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await axios.post(`${API_BASE_URL}/speech-to-text/transcribe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      return response.data;
    } catch (error) {
      console.error('Speech-to-text API error:', error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || 'Failed to transcribe audio',
          details: error.response?.data?.details || error.message,
        };
      }
      
      return {
        success: false,
        error: 'Unknown error occurred during transcription',
      };
    }
  },

  /**
   * Check if the speech-to-text service is healthy
   */
  healthCheck: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/speech-to-text/health`);
      return response.data;
    } catch (error) {
      console.error('Speech-to-text health check failed:', error);
      return {
        success: false,
        service: 'speech-to-text',
        status: 'unhealthy',
      };
    }
  },
};
