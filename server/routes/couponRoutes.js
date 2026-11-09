import express from 'express';
import {
    validateCoupon,
    getAllCoupons,
    createCoupon,
    deleteCoupon,
} from '../controllers/couponController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/validate', validateCoupon);
router.route('/')
    .get(protect, admin, getAllCoupons)
    .post(protect, admin, createCoupon);

router.delete('/:id', protect, admin, deleteCoupon);

export default router;

