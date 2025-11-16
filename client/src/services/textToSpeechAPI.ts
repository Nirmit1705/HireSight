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
      const textLength = request.text.length;
      
      // For very long texts (>2000 characters), truncate to prevent extremely long TTS times
      let processedText = request.text;
      if (textLength > 2000) {
        processedText = request.text.substring(0, 2000) + "...";
        console.log(`⚠️ Text truncated from ${textLength} to ${processedText.length} characters for TTS performance`);
      }
      
      // Calculate dynamic timeout based on text length
      const baseTimeout = 30000; // 30 seconds base
      const additionalTime = Math.max(0, (processedText.length - 500) * 100); // 100ms per extra character after 500
      const dynamicTimeout = Math.min(baseTimeout + additionalTime, 120000); // Max 2 minutes
      
      console.log(`🔄 TTS Request - Text length: ${processedText.length}, Timeout: ${dynamicTimeout/1000}s`);
      
      const response = await axios.post(
        `${API_BASE_URL}/text-to-speech/synthesize`,
        {
          text: processedText,
          voice: request.voice || 'aura-luna-en',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'blob',
          timeout: dynamicTimeout,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Text-to-speech API error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          throw new Error('Speech synthesis timed out. The text might be too long. Please try a shorter response.');
        }
        if (error.response?.status === 500) {
          throw new Error('Speech synthesis service error. Please try again or use a shorter response.');
        }
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