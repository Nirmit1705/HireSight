import express from 'express';
import { synthesizeSpeech, getVoices, healthCheck } from '../controllers/textToSpeechController';

const router = express.Router();

// Health check endpoint
router.get('/health', healthCheck);

// Get available voices
router.get('/voices', getVoices);

// Synthesize speech from text
router.post('/synthesize', synthesizeSpeech);

export default router;