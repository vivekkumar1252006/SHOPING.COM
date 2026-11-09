import express from 'express';
import {
    createOrder,
    getOrderById,
    getMyOrders,
    createRazorpayOrder,
    verifyPayment,
    simulateDemoPay,
    trackOrder,
    cancelOrder,
    razorpayWebhook,
    resendOrderNotifications,
    retryWhatsAppOrderNotification,
    resendDeliveryOTP,
    verifyDeliveryOTP,
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Tracking Routes & Razorpay Webhook
router.get('/track/:id', trackOrder);
router.post('/track/:id/resend-delivery-otp', resendDeliveryOTP);
router.post('/track/:id/verify-delivery-otp', verifyDeliveryOTP);
router.post('/webhook/razorpay', razorpayWebhook);

// Protected routes (Customer & Admin)
router.use(protect);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/razorpay', createRazorpayOrder);
router.post('/:id/verify-payment', verifyPayment);
router.post('/:id/demo-pay', simulateDemoPay);
router.post('/:id/resend-notifications', resendOrderNotifications);
router.post('/:id/retry-whatsapp', retryWhatsAppOrderNotification);
router.post('/:id/resend-delivery-otp', resendDeliveryOTP);
router.post('/:id/verify-delivery-otp', verifyDeliveryOTP);

export default router;
