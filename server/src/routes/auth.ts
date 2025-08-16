import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validate } from '../middleware/validation';
import passport from '../config/passport';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/signup',
  validate(AuthController.signUpValidation),
  AuthController.signUp
);

/**
 * @route   POST /api/auth/signin
 * @desc    Sign in user
 * @access  Public
 */
router.post(
  '/signin',
  validate(AuthController.signInValidation),
  AuthController.signIn
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @route   POST /api/auth/signout
 * @desc    Sign out user
 * @access  Public
 */
router.post('/signout', AuthController.signOut);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token validity
 * @access  Private
 */
router.get('/verify', authenticateToken, AuthController.verifyToken);

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth
 * @access  Public
 */
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false,
  accessType: 'offline',
  prompt: 'select_account consent'
}));

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/api/auth/google/failure',
    session: false 
  }),
  AuthController.googleCallback
);

/**
 * @route   GET /api/auth/google/failure
 * @desc    Google OAuth failure
 * @access  Public
 */
router.get('/google/failure', AuthController.googleFailure);

export default router;
