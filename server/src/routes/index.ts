import { Router } from 'express';
import authRoutes from './auth';
import interviewRoutes from './interview';
import aptitudeRoutes from './aptitude';
import metadataRoutes from './metadata';
import aiInterviewRoutes from './aiInterview';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Interview routes
router.use('/interviews', interviewRoutes);

// AI Interview routes
router.use('/ai-interview', aiInterviewRoutes);

// Aptitude routes
router.use('/aptitude', aptitudeRoutes);

// Metadata routes (positions, domains, etc.)
router.use('/metadata', metadataRoutes);

export default router;
