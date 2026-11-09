import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import { getRazorpayInstance, verifyRazorpaySignature } from '../config/razorpay.js';
import { sendOrderConfirmationNotifications, retryWhatsAppNotification, dispatchDeliveryOTPNotification } from '../services/notificationService.js';

export const createOrder = async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod, couponCode, isBuyNow } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ success: false, message: 'No order items specified' });
        }

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street) {
            return res.status(400).json({ success: false, message: 'Please provide full shipping address' });
        }

        let itemsPrice = 0;
        const verifiedItems = [];

        // Strictly validate each product price and stock on backend from DB
        for (const item of orderItems) {
            let product = null;
            const rawId = item.product || item._id;

            if (rawId && String(rawId).match(/^[0-9a-fA-F]{24}$/)) {
                product = await Product.findById(rawId);
            }
            if (!product && rawId) {
                const normalizedSlug = String(rawId).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                product = await Product.findOne({
                    $or: [
                        { slug: rawId },
                        { slug: normalizedSlug },
                        { name: new RegExp(`^${String(item.name || rawId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                    ],
                });
            }

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product "${item.name || 'Selected product'}" was not found or is currently unavailable`,
                });
            }

            const availableStock = Number(product.countInStock ?? product.stock ?? 0);
            const requestedQty = Number(item.quantity || 1);

            if (availableStock < requestedQty) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${requestedQty}`,
                });
            }

            const activePrice = Number(product.discountPrice > 0 ? product.discountPrice : product.price);
            itemsPrice += activePrice * requestedQty;

            verifiedItems.push({
                product: product._id,
                name: product.name,
                image: product.images?.[0] || item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
                price: activePrice,
                quantity: requestedQty,
            });
        }

        let discountAmount = 0;
        let appliedCoupon = null;

        if (couponCode) {
            const coupon = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                isActive: true,
                expiryDate: { $gte: new Date() },
            });

            if (coupon && itemsPrice >= coupon.minOrderValue) {
                if (coupon.discountType === 'percentage') {
                    discountAmount = (itemsPrice * coupon.discountValue) / 100;
                    if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
                        discountAmount = coupon.maxDiscount;
                    }
                } else {
                    discountAmount = coupon.discountValue;
                }
                appliedCoupon = coupon;
            }
        }

        discountAmount = Math.min(discountAmount, itemsPrice);
        const shippingPrice = itemsPrice >= 999 || itemsPrice === 0 ? 0 : 99;
        const taxableAmount = Math.max(0, itemsPrice - discountAmount);
        const taxPrice = Number((taxableAmount * 0.18).toFixed(2));
        const totalPrice = Number((itemsPrice + shippingPrice + taxPrice - discountAmount).toFixed(2));

        const order = new Order({
            user: req.user._id,
            orderItems: verifiedItems,
            shippingAddress,
            paymentMethod,
            itemsPrice: Number(itemsPrice.toFixed(2)),
            taxPrice,
            shippingPrice,
            discountAmount: Number(discountAmount.toFixed(2)),
            couponCode: appliedCoupon ? appliedCoupon.code : '',
            totalPrice,
            paymentStatus: 'Pending',
            status: paymentMethod === 'Cash On Delivery' ? 'Confirmed' : 'Pending',
            statusHistory: [
                {
                    status: 'Order Placed',
                    comment: `Order placed via ${paymentMethod}`,
                },
            ],
        });

        const createdOrder = await order.save();

        // Decrement stock in database atomically
        for (const item of verifiedItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { countInStock: -item.quantity },
            });
        }

        if (appliedCoupon) {
            appliedCoupon.usedCount += 1;
            await appliedCoupon.save();
        }

        // Clear user cart only upon regular cart checkout, preserving cart during Buy Now
        if (!isBuyNow) {
            await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], couponCode: '' });
        }

        // Trigger asynchronous order confirmation notifications for Cash On Delivery
        if (createdOrder.paymentMethod === 'Cash On Delivery') {
            sendOrderConfirmationNotifications(createdOrder._id);
        }

        res.status(201).json({ success: true, order: createdOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (
            order.user._id.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
        }

        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Cancel Order and Restore Stock
 * POST /api/orders/:id/cancel
 */
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check ownership or admin privilege
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }

    if (order.status === 'Delivered') {
      return res.status(400).json({ success: false, message: 'Delivered orders cannot be cancelled' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    order.status = 'Cancelled';
    order.statusHistory.push({
      status: 'Cancelled',
      comment: `Order cancelled by ${req.user.role === 'admin' ? 'Store Administrator' : 'Customer'}`,
      date: new Date(),
    });

    // Atomically restore stock for all cancelled items
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { countInStock: item.quantity },
      });
    }

    const updatedOrder = await order.save();
    res.json({ success: true, order: updatedOrder, message: 'Order cancelled successfully and stock restored' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRazorpayOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const razorpay = getRazorpayInstance();
        const amountInPaise = Math.round(order.totalPrice * 100);

        if (razorpay) {
            try {
                const rzpOrder = await razorpay.orders.create({
                    amount: amountInPaise,
                    currency: 'INR',
                    receipt: `order_rcptid_${order._id}`,
                });

                order.paymentResult = {
                    ...order.paymentResult,
                    razorpay_order_id: rzpOrder.id,
                };
                await order.save();

                return res.json({
                    success: true,
                    razorpayOrderId: rzpOrder.id,
                    amount: amountInPaise,
                    currency: 'INR',
                    key: process.env.RAZORPAY_KEY_ID,
                });
            } catch (rzpError) {
                console.warn('Razorpay error, fallback to test mode:', rzpError.message);
            }
        }

        const demoOrderId = `rzp_order_demo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        order.paymentResult = {
            ...order.paymentResult,
            razorpay_order_id: demoOrderId,
        };
        await order.save();

        res.json({
            success: true,
            razorpayOrderId: demoOrderId,
            amount: amountInPaise,
            currency: 'INR',
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_smartcartdemo',
            isDemo: true,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

    // Prevent duplicate processing
    if (order.isPaid) {
      return res.json({ success: true, order, message: 'Payment has already been confirmed' });
    }

        const isValid = verifyRazorpaySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentStatus = 'Paid';
        order.status = 'Confirmed';
        order.paymentResult = {
            id: razorpay_payment_id,
            status: 'Captured',
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            email_address: req.user?.email || order.shippingAddress?.email || 'customer@shoping.com',
        };
        order.statusHistory.push({
            status: 'Payment Received',
            comment: `Payment of $${order.totalPrice} verified successfully via Razorpay (ID: ${razorpay_payment_id})`,
        });

        const updatedOrder = await order.save();

        // Trigger order confirmation notifications asynchronously after payment is confirmed
        sendOrderConfirmationNotifications(updatedOrder._id);

        res.json({ success: true, order: updatedOrder, message: 'Payment verified successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Razorpay Webhook Handler
 * POST /api/orders/webhook/razorpay
 */
export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (webhookSecret && signature) {
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload?.payment?.entity;

    if (event === 'payment.captured' && paymentEntity) {
      const rzpOrderId = paymentEntity.order_id;
      const order = await Order.findOne({ 'paymentResult.razorpay_order_id': rzpOrderId });

      if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentStatus = 'Paid';
        order.status = 'Confirmed';
        order.paymentResult.status = 'Captured';
        order.paymentResult.razorpay_payment_id = paymentEntity.id;
        order.statusHistory.push({
          status: 'Payment Received',
          comment: `Payment verified via Razorpay Webhook (Payment ID: ${paymentEntity.id})`,
        });
        await order.save();
        // Trigger order confirmation notifications asynchronously
        sendOrderConfirmationNotifications(order._id);
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const trackOrder = async (req, res) => {
    try {
        const { id } = req.params;
        let order = null;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            order = await Order.findById(id);
        }
        if (!order) {
            order = await Order.findOne({ trackingNumber: id });
        }
        if (!order) {
            return res.status(404).json({ success: false, message: 'Tracking record or order not found' });
        }

        // Compute destination masked phone for WhatsApp security
        const rawPhone = order.shippingAddress?.phone || order.deliveryNotifications?.recipientPhone || '';
        const cleanDigits = rawPhone.replace(/\D/g, '');
        const last4 = cleanDigits.slice(-4) || 'XXXX';
        const maskedPhone = cleanDigits.length >= 4 ? `••••••${last4}` : '••••';

        const orderObj = order.toObject();
        orderObj.maskedPhone = maskedPhone;
        orderObj.orderStatus = order.status;

        res.json({ success: true, order: orderObj });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const simulateDemoPay = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const mockPaymentId = `pay_sim_${Date.now()}`;
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentStatus = 'Paid';
        order.status = 'Confirmed';
        order.paymentResult = {
            id: mockPaymentId,
            status: 'Completed',
            razorpay_payment_id: mockPaymentId,
            razorpay_signature: 'demo_sig_verified',
            email_address: req.user?.email || order.shippingAddress?.email || 'customer@shoping.com',
        };
        order.statusHistory.push({
            status: 'Payment Received',
            comment: `Instant card checkout completed. Payment confirmed.`,
        });

        const updatedOrder = await order.save();

        // Trigger order confirmation notifications asynchronously
        sendOrderConfirmationNotifications(updatedOrder._id);

        res.json({ success: true, order: updatedOrder, message: 'Payment processed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Manually resend order confirmation notifications (Email + WhatsApp)
 * POST /api/orders/:id/resend-notifications
 */
export const resendOrderNotifications = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check ownership or admin privilege
        if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Trigger notifications with forceResend = true
        sendOrderConfirmationNotifications(order._id, { forceResend: true });

        res.json({
            success: true,
            message: 'Order confirmation notifications dispatched successfully via Email & WhatsApp.',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Retry WhatsApp Notification specifically
 * POST /api/orders/:id/retry-whatsapp
 */
export const retryWhatsAppOrderNotification = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const result = await retryWhatsAppNotification(order._id);
        res.json({
            success: true,
            message: result.success
                ? 'WhatsApp order confirmation message delivered successfully via Meta Cloud API.'
                : `WhatsApp attempt: ${result.waResult?.reason || 'Failed to dispatch'}`,
            order: result.order,
            whatsappStatus: result.order?.notifications?.whatsappStatus,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Resend Delivery Verification OTP via WhatsApp with 60-second rate-limiting cooldown
 * POST /api/orders/:id/resend-delivery-otp
 */
export const resendDeliveryOTP = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Authorization check
        if (req.user && req.user.role !== 'admin' && String(order.user) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Not authorized for this order' });
        }

        // Cooldown check (60 seconds)
        const now = Date.now();
        if (order.deliveryOTPResendCooldown && new Date(order.deliveryOTPResendCooldown).getTime() > now) {
            const remaining = Math.ceil((new Date(order.deliveryOTPResendCooldown).getTime() - now) / 1000);
            return res.status(429).json({
                success: false,
                message: `Please wait ${remaining} seconds before requesting a new OTP.`,
                cooldownSeconds: remaining,
            });
        }

        // Set cooldown 60 seconds into future
        order.deliveryOTPResendCooldown = new Date(now + 60 * 1000);
        await order.save();

        // Dispatch new 10-minute OTP
        const dispatchResult = await dispatchDeliveryOTPNotification(order._id, { forceResend: true });

        const updated = await Order.findById(order._id);
        const rawPhone = updated.shippingAddress?.phone || updated.deliveryNotifications?.recipientPhone || '';
        const cleanDigits = rawPhone.replace(/\D/g, '');
        const last4 = cleanDigits.slice(-4) || 'XXXX';
        const maskedPhone = cleanDigits.length >= 4 ? `••••••${last4}` : '••••';

        res.json({
            success: true,
            message: dispatchResult.success
                ? 'New Delivery Verification OTP sent to your WhatsApp!'
                : `OTP generated (Expires in 10 mins). WhatsApp status: ${dispatchResult.reason || 'Pending delivery'}`,
            cooldownSeconds: 60,
            deliveryNotifications: updated.deliveryNotifications,
            deliveryOTPExpiresAt: updated.deliveryOTPExpiresAt,
            maskedPhone,
            deliveryOTP: updated.deliveryOTP,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Customer / Agent: Verify Delivery OTP and mark Order Delivered
 * POST /api/orders/:id/verify-delivery-otp
 */
export const verifyDeliveryOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        if (!otp) {
            return res.status(400).json({ success: false, message: 'Please provide the 6-digit delivery OTP' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status === 'Delivered' && order.deliveryOTPVerified) {
            return res.json({ success: true, message: 'Order has already been verified and delivered.', order });
        }

        if (order.deliveryOTPAttempts >= 5) {
            return res.status(429).json({
                success: false,
                message: 'Too many incorrect attempts (5/5). Please click "Resend OTP" to generate a fresh code.',
            });
        }

        if (order.deliveryOTPExpiresAt && new Date() > new Date(order.deliveryOTPExpiresAt)) {
            return res.status(400).json({
                success: false,
                message: 'This Delivery OTP has expired (10-minute limit). Please click "Resend OTP".',
            });
        }

        if (String(otp).trim() !== String(order.deliveryOTP).trim()) {
            order.deliveryOTPAttempts = (order.deliveryOTPAttempts || 0) + 1;
            await order.save();
            return res.status(400).json({
                success: false,
                message: `Incorrect OTP code entered (Attempt ${order.deliveryOTPAttempts}/5).`,
            });
        }

        order.deliveryOTPVerified = true;
        order.deliveryOTPVerifiedAt = new Date();
        order.status = 'Delivered';
        order.isDelivered = true;
        order.deliveredAt = new Date();
        order.statusHistory.push({
            status: 'Delivered',
            comment: 'Delivery verified successfully via customer WhatsApp OTP.',
            date: new Date(),
        });

        const savedOrder = await order.save();
        res.json({
            success: true,
            message: 'Delivery Verification OTP verified! Order status changed to Delivered.',
            order: savedOrder,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
