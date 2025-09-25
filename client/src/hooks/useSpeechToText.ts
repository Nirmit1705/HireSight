import { useState, useRef, useCallback } from 'react';
import { speechToTextAPI, TranscriptionResponse, ConfidenceMetrics } from '../services/speechToTextAPI';

export interface UseSpeechToTextReturn {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  confidence: number;
  confidenceMetrics: ConfidenceMetrics | null;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<void>;
  clearTranscript: () => void;
}

export const useSpeechToText = (): UseSpeechToTextReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [confidenceMetrics, setConfidenceMetrics] = useState<ConfidenceMetrics | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      setTranscript('');
      setConfidence(0);
      setConfidenceMetrics(null);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Process the recorded audio
        await processRecording();
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError(error instanceof Error ? error.message : 'Failed to start recording');
      return false;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<void> => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const processRecording = useCallback(async (): Promise<void> => {
    if (audioChunksRef.current.length === 0) {
      setError('No audio data recorded');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Create audio blob from chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      console.log('Processing audio blob:', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      // Send to speech-to-text service
      const result: TranscriptionResponse = await speechToTextAPI.transcribeAudio(audioBlob);

      if (result.success && result.transcript) {
        setTranscript(result.transcript);
        setConfidence(result.confidence || 0);
        setConfidenceMetrics(result.confidenceMetrics || null);
        console.log('📞 Transcription API Response:');
        console.log('  - Transcript:', result.transcript);
        console.log('  - Basic Confidence:', result.confidence || 0);
        
        if (result.confidenceMetrics) {
          console.log('  - Detailed Confidence Analysis: ✅ Available');
          console.log('  - Overall Score:', result.confidenceMetrics.overallScore + '%');
        } else {
          console.log('  - Detailed Confidence Analysis: ❌ Not available');
        }
      } else {
        setError(result.error || 'Transcription failed');
        console.error('❌ Transcription failed:', result.error);
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      setError(error instanceof Error ? error.message : 'Failed to process recording');
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
    setConfidence(0);
    setConfidenceMetrics(null);
  }, []);

  return {
    isRecording,
    isProcessing,
    transcript,
    error,
    confidence,
    confidenceMetrics,
    startRecording,
    stopRecording,
    clearTranscript,
  };
};
