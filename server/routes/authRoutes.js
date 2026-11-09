import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  sendOTP,
  verifyOTP,
  resendOTP,
  loginUser,
  getMe,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  addAddress,
  deleteAddress,
  forgotPassword,
  resetPassword,
  checkBrevoStatus,
  triggerBrevoTest,
  checkWhatsAppStatus,
  triggerWhatsAppTest,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict rate-limiter for sensitive OTP generation endpoints (15 attempts / 15 minutes per IP)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: 'Too many OTP requests from this IP. Please wait 15 minutes before requesting again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public Authentication & OTP Endpoints
router.post('/send-otp', otpLimiter, sendOTP);
router.post('/register', otpLimiter, registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

// Brevo Diagnostic Health & Test Routes
router.get('/brevo-status', checkBrevoStatus);
router.post('/brevo-test', triggerBrevoTest);

// WhatsApp Meta Cloud API Diagnostic Health & Test Routes
router.get('/whatsapp-status', checkWhatsAppStatus);
router.post('/whatsapp-test', triggerWhatsAppTest);

// Protected Profile & Address Management Endpoints
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.post('/address', protect, addAddress);
router.delete('/address/:addressId', protect, deleteAddress);

export default router;
