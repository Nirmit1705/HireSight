import { Router } from 'express';
import authRoutes from './auth';
import interviewRoutes from './interview';
import aptitudeRoutes from './aptitude';

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

// Aptitude routes
router.use('/aptitude', aptitudeRoutes);

export default router;
