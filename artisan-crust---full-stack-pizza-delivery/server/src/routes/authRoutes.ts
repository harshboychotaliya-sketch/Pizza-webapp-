import { Router } from 'express';
import {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  getDevMailbox,
  googleAuth,
  verifyAdminPasscode
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/admin-verify', verifyAdminPasscode);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticateToken, getProfile);
router.get('/dev-mailbox', getDevMailbox);

export default router;
