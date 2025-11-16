import { useState, useCallback, useRef } from 'react';
import { textToSpeechAPI, Voice } from '../services/textToSpeechAPI';

export interface UseTextToSpeechOptions {
  voice?: string;
  autoplay?: boolean;
}

export interface UseTextToSpeechReturn {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  voices: Voice[];
  currentVoice: string;
  speak: (text: string) => Promise<void>;
  stop: () => void;
  setVoice: (voiceId: string) => void;
  loadVoices: () => Promise<void>;
}

export const useTextToSpeech = (options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [currentVoice, setCurrentVoice] = useState(options.voice || 'aura-luna-en');
  
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) {
      setError('No text provided');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const textLength = text.length;
      const isLongText = textLength > 1000;
      
      console.log(`🔄 [TTS HOOK] Starting TTS process - Text length: ${textLength} chars`);
      
      if (isLongText) {
        console.log('⏳ Long text detected - TTS may take up to 2 minutes');
      }

      // Stop any currently playing audio
      stop();

      const audioBlob = await textToSpeechAPI.synthesizeSpeech({
        text,
        voice: currentVoice,
      });

      if (options.autoplay !== false) {
        setIsPlaying(true);
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
        };
        
        audio.onerror = (error) => {
          setIsPlaying(false);
          setError('Failed to play audio');
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          console.error('❌ [TTS HOOK] Audio playback error:', error);
        };

        await audio.play();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to synthesize speech';
      setError(errorMessage);
      console.error('Text-to-speech error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentVoice, options.autoplay]);

  const stop = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      
      // Clean up the audio URL if it exists
      if (currentAudioRef.current.src) {
        URL.revokeObjectURL(currentAudioRef.current.src);
      }
      
      currentAudioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const setVoice = useCallback((voiceId: string) => {
    setCurrentVoice(voiceId);
  }, []);

  const loadVoices = useCallback(async () => {
    try {
      const response = await textToSpeechAPI.getVoices();
      if (response.success && response.voices) {
        setVoices(response.voices);
        
        // Set default voice if not already set
        if (!currentVoice && response.defaultVoice) {
          setCurrentVoice(response.defaultVoice);
        }
      } else {
        setError(response.error || 'Failed to load voices');
      }
    } catch (err) {
      setError('Failed to load voices');
      console.error('Load voices error:', err);
    }
  }, [currentVoice]);

  return {
    isLoading,
    isPlaying,
    error,
    voices,
    currentVoice,
    speak,
    stop,
    setVoice,
    loadVoices,
  };
};