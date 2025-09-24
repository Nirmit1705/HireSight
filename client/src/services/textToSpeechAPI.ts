import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  description: string;
}

export interface VoicesResponse {
  success: boolean;
  voices?: Voice[];
  defaultVoice?: string;
  error?: string;
}

export interface SynthesizeRequest {
  text: string;
  voice?: string;
}

export interface TextToSpeechService {
  synthesizeSpeech: (request: SynthesizeRequest) => Promise<Blob>;
  getVoices: () => Promise<VoicesResponse>;
  healthCheck: () => Promise<{ success: boolean; service: string; status: string }>;
}

export const textToSpeechAPI: TextToSpeechService = {
  /**
   * Synthesize speech from text using Deepgram
   */
  synthesizeSpeech: async (request: SynthesizeRequest): Promise<Blob> => {
    try {
      console.log('🌐 [TTS API] Starting API request to server...');
      console.log('🌐 [TTS API] Text length:', request.text.length, 'characters');
      console.log('🌐 [TTS API] Voice:', request.voice);
      const apiCallStartTime = performance.now();
      
      const response = await axios.post(
        `${API_BASE_URL}/text-to-speech/synthesize`,
        {
          text: request.text,
          voice: request.voice || 'aura-luna-en',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'blob',
          timeout: 30000, // 30 second timeout
        }
      );
      
      const apiCallEndTime = performance.now();
      const apiCallDuration = apiCallEndTime - apiCallStartTime;
      console.log('🌐 [TTS API] API Response received in:', apiCallDuration, 'ms');
      console.log('🌐 [TTS API] Response blob size:', response.data.size, 'bytes');

      return response.data;
    } catch (error) {
      console.error('Text-to-speech API error:', error);
      
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to synthesize speech');
      }
      
      throw new Error('Unknown error occurred during speech synthesis');
    }
  },

  /**
   * Get available voices
   */
  getVoices: async (): Promise<VoicesResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/text-to-speech/voices`);
      return response.data;
    } catch (error) {
      console.error('Get voices API error:', error);
      return {
        success: false,
        error: 'Failed to get available voices',
      };
    }
  },

  /**
   * Check if the text-to-speech service is healthy
   */
  healthCheck: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/text-to-speech/health`);
      return response.data;
    } catch (error) {
      console.error('Text-to-speech health check failed:', error);
      return {
        success: false,
        service: 'text-to-speech',
        status: 'unhealthy',
      };
    }
  },
};

/**
 * Utility function to play audio blob
 */
export const playAudioBlob = (audioBlob: Blob): Promise<void> => {
  return new Promise((resolve, reject) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };
    
    audio.onerror = (error) => {
      URL.revokeObjectURL(audioUrl);
      reject(error);
    };
    
    audio.play().catch(reject);
  });
};