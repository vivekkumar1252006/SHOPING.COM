import express from 'express';
import {
    getDashboardStats,
    createProduct,
    updateProduct,
    deleteProduct,
    getAllOrders,
    updateOrderStatus,
    retryAdminWhatsAppNotification,
    resendAdminDeliveryOTP,
    verifyAdminDeliveryOTP,
    getAllUsers,
    updateUserRole,
  deleteUser,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, admin);

router.get('/dashboard', getDashboardStats);

router.route('/products')
    .post(createProduct);

router.route('/products/:id')
    .put(updateProduct)
    .delete(deleteProduct);

router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/retry-whatsapp', retryAdminWhatsAppNotification);
router.post('/orders/:id/resend-delivery-otp', resendAdminDeliveryOTP);
router.post('/orders/:id/verify-delivery-otp', verifyAdminDeliveryOTP);

router.get('/users', getAllUsers);
router.route('/users/:id')
  .put(updateUserRole)
  .delete(deleteUser);

export default router;

