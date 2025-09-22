import { Request, Response } from 'express';
import { createClient } from '@deepgram/sdk';
import multer from 'multer';

// Configure multer for audio file upload
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Initialize Deepgram client
const deepgram = createClient(process.env.DEEPGRAM_API_KEY || '');

export const transcribeAudio = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No audio file provided' 
      });
    }

    if (!process.env.DEEPGRAM_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Deepgram API key not configured' 
      });
    }

    console.log('Processing audio file:', {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });

    // Use Deepgram to transcribe the audio
    const response = await deepgram.listen.prerecorded.transcribeFile(
      req.file.buffer,
      {
        model: 'nova-2',
        language: 'en-US',
        smart_format: false, // Disable smart formatting to keep filler words
        punctuate: true,
        diarize: false,
        utterances: true,
        filler_words: true, // Explicitly include filler words
        profanity_filter: false, // Don't filter any words
        numerals: false, // Keep numbers as words (e.g., "two" instead of "2")
        replace: [], // Don't replace any words
        search: [], // Include all words in search
      }
    );

    const transcript = response.result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    
    if (!transcript) {
      return res.status(400).json({ 
        success: false, 
        error: 'No speech detected in audio' 
      });
    }

    // Return the transcription
    res.json({
      success: true,
      transcript: transcript.trim(),
      confidence: response.result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0,
      metadata: {
        duration: response.result?.metadata?.duration,
        model: 'nova-2'
      }
    });

  } catch (error) {
    console.error('Speech-to-text error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process audio file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const transcribeStream = async (req: Request, res: Response) => {
  try {
    // For real-time streaming (WebSocket implementation would go here)
    // This is a placeholder for future WebSocket implementation
    res.status(501).json({ 
      success: false, 
      error: 'Streaming transcription not implemented yet' 
    });
  } catch (error) {
    console.error('Streaming transcription error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to setup streaming transcription' 
    });
  }
};

// Health check endpoint for speech-to-text service
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const hasApiKey = !!process.env.DEEPGRAM_API_KEY;
    
    res.json({
      success: true,
      service: 'speech-to-text',
      status: 'healthy',
      deepgram: {
        configured: hasApiKey,
        model: 'nova-2'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Service health check failed' 
    });
  }
};
