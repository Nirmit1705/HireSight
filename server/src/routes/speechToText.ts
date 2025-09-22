import express from 'express';
import { transcribeAudio, transcribeStream, healthCheck, upload } from '../controllers/speechToTextController';

const router = express.Router();

// Health check endpoint
router.get('/health', healthCheck);

// Transcribe uploaded audio file
router.post('/transcribe', upload.single('audio'), transcribeAudio);

// Real-time streaming transcription (future implementation)
router.post('/stream', transcribeStream);

export default router;
