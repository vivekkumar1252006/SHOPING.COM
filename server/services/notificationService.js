import nodemailer from 'nodemailer';
import { BrevoClient } from '@getbrevo/brevo';
import { loadEnv } from '../config/env.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { buildOrderConfirmationTemplate } from '../utils/orderEmailTemplate.js';
import { sendWhatsAppOrderConfirmation, sendWhatsAppDeliveryOTP } from '../utils/whatsappNotification.js';

loadEnv();

/**
 * Dispatch Order Confirmation Notifications (Email + WhatsApp)
 *
 * Rules:
 * 1. Asynchronous non-blocking execution.
 * 2. Prevents duplicate notifications via order.notifications tracking flags.
 * 3. Notification failures never delete, cancel, or disrupt the order.
 *
 * @param {string|Object} orderOrId MongoDB Order ID or Order Document
 * @param {Object} [options]
 * @param {boolean} [options.forceResend=false] Override duplicate check
 */
export const sendOrderConfirmationNotifications = async (orderOrId, options = {}) => {
  const { forceResend = false } = options;

  // Run in a separate microtask / tick so the caller's HTTP response is never blocked
  setImmediate(async () => {
    try {
      loadEnv();

      const orderId = typeof orderOrId === 'string' ? orderOrId : orderOrId?._id;
      if (!orderId) {
        console.warn('⚠️ [NotificationService] Invalid orderId provided to sendOrderConfirmationNotifications');
        return;
      }

      // Fetch fresh order with user populated
      const order = await Order.findById(orderId).populate('user', 'name email phone');
      if (!order) {
        console.warn(`⚠️ [NotificationService] Order #${orderId} not found in database`);
        return;
      }

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const trackingUrl = `${clientUrl}/track-order?trackingId=${order.trackingNumber || order._id}`;
      const recipientEmail = order.user?.email || order.shippingAddress?.email || order.paymentResult?.email_address;
      const recipientPhone = order.shippingAddress?.phone || order.user?.phone;
      const customerName = order.shippingAddress?.fullName || order.user?.name || 'Customer';

      const estimatedDelivery = order.estimatedDeliveryDate
        ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })
        : '3 - 5 Business Days';

      const fullShippingAddress = [
        order.shippingAddress?.street,
        order.shippingAddress?.city,
        order.shippingAddress?.state,
        order.shippingAddress?.postalCode,
      ]
        .filter(Boolean)
        .join(', ');

      const paymentStatusDisplay = order.paymentStatus || (order.isPaid ? 'Paid' : 'Pending');

      console.log(`\n================================================================================`);
      console.log(`🔔 [NotificationService] Processing Order Notifications for Order #${order._id}`);
      console.log(`   Customer: ${customerName} | Email: ${recipientEmail || 'N/A'} | Phone: ${recipientPhone || 'N/A'}`);
      console.log(`   Payment Method: ${order.paymentMethod} | Status: ${order.status} | Payment Status: ${paymentStatusDisplay}`);
      console.log(`================================================================================`);

      // Initialize notifications object if missing
      if (!order.notifications) {
        order.notifications = {
          emailSent: false,
          emailSentAt: null,
          whatsappStatus: 'Not Sent',
          whatsappSent: false,
          whatsappSentAt: null,
          whatsappMessageId: '',
          whatsappError: '',
          whatsappRetries: 0,
        };
      }

      // ----------------------------------------------------------------------
      // 1. EMAIL NOTIFICATION (Nodemailer / Gmail SMTP / Brevo)
      // ----------------------------------------------------------------------
      if (recipientEmail && (!order.notifications.emailSent || forceResend)) {
        try {
          const { subject, html, text } = buildOrderConfirmationTemplate({
            order,
            user: order.user,
            trackingUrl,
          });

          const gmailUser = (process.env.EMAIL_USER || process.env.GMAIL_USER || '').trim();
          const gmailPass = (process.env.EMAIL_PASS || process.env.GMAIL_PASS || '').trim();
          const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
          const senderName = process.env.BREVO_SENDER_NAME || 'Shoping.com';

          console.log(`📤 [Order Email] Dispatching to ${recipientEmail} via Gmail SMTP...`);

          // Try Gmail SMTP first if configured
          if (gmailUser && gmailPass && gmailPass !== 'your_gmail_app_password') {
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: gmailUser,
                pass: gmailPass,
              },
            });

            const info = await transporter.sendMail({
              from: `"${senderName}" <${gmailUser}>`,
              to: recipientEmail,
              subject,
              text,
              html,
            });

            console.log(`✅ [Order Email Success] Delivered via Gmail SMTP! MessageId: ${info.messageId}`);
            order.notifications.emailSent = true;
            order.notifications.emailSentAt = new Date();
          } else if (brevoApiKey && brevoApiKey.startsWith('xkeysib-')) {
            const brevoClient = new BrevoClient({ apiKey: brevoApiKey });
            const senderEmail = (process.env.BREVO_SENDER_EMAIL || 'support@shoping.com').trim();

            const response = await brevoClient.transactionalEmails.sendTransacEmail({
              subject,
              htmlContent: html,
              textContent: text,
              sender: { name: senderName, email: senderEmail },
              to: [{ email: recipientEmail, name: customerName }],
            });

            console.log(`✅ [Order Email Success] Delivered via Brevo! MessageId: ${response?.messageId || 'brevo-sent'}`);
            order.notifications.emailSent = true;
            order.notifications.emailSentAt = new Date();
          } else {
            console.warn('⚠️ [Order Email] No email credentials configured in server/.env. Email notification skipped.');
          }
        } catch (emailErr) {
          console.error(`❌ [Order Email Failed]: ${emailErr.message}`);
        }
      } else if (order.notifications.emailSent && !forceResend) {
        console.log(`ℹ️ [Order Email] Duplicate prevented: Email already sent at ${order.notifications.emailSentAt}`);
      }

      // ----------------------------------------------------------------------
      // 2. WHATSAPP NOTIFICATION (Meta WhatsApp Business Cloud API)
      // ----------------------------------------------------------------------
      if (recipientPhone && (!order.notifications.whatsappSent || forceResend)) {
        try {
          order.notifications.whatsappStatus = 'Pending';
          order.notifications.whatsappRetries = (order.notifications.whatsappRetries || 0) + 1;

          const waResult = await sendWhatsAppOrderConfirmation({
            phone: recipientPhone,
            customerName,
            orderId: order._id.toString(),
            trackingNumber: order.trackingNumber,
            deliveryOTP: order.deliveryOTP,
            totalPrice: order.totalPrice,
            paymentMethod: order.paymentMethod,
            paymentStatus: paymentStatusDisplay,
            shippingAddress: fullShippingAddress,
            estimatedDelivery,
            trackingUrl,
            items: order.orderItems,
          });

          if (waResult.success) {
            order.notifications.whatsappStatus = 'Sent';
            order.notifications.whatsappSent = true;
            order.notifications.whatsappSentAt = new Date();
            order.notifications.whatsappMessageId = waResult.messageId || '';
            order.notifications.whatsappError = '';
          } else {
            order.notifications.whatsappStatus = waResult.simulated ? 'Not Sent' : 'Failed';
            order.notifications.whatsappError = waResult.reason || 'Failed to deliver';
          }
        } catch (waErr) {
          console.error(`❌ [WhatsApp Notification Failed]: ${waErr.message}`);
          order.notifications.whatsappStatus = 'Failed';
          order.notifications.whatsappError = waErr.message;
        }
      } else if (order.notifications.whatsappSent && !forceResend) {
        console.log(`ℹ️ [WhatsApp] Duplicate prevented: WhatsApp already sent at ${order.notifications.whatsappSentAt}`);
      }

      // Persist notification timestamps to database
      await order.save();
      console.log(`💾 [NotificationService] Saved notification state for Order #${order._id} (Email: ${order.notifications.emailSent}, WA Status: ${order.notifications.whatsappStatus})\n`);
    } catch (globalErr) {
      console.error(`❌ [NotificationService Uncaught Exception]: ${globalErr.message}`);
    }
  });
};

/**
 * Dedicated Admin Retry Function for WhatsApp Order Confirmation
 * Returns status result directly
 */
export const retryWhatsAppNotification = async (orderId) => {
  const order = await Order.findById(orderId).populate('user', 'name email phone');
  if (!order) {
    throw new Error('Order not found');
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const trackingUrl = `${clientUrl}/track-order?trackingId=${order.trackingNumber || order._id}`;
  const recipientPhone = order.shippingAddress?.phone || order.user?.phone;
  const customerName = order.shippingAddress?.fullName || order.user?.name || 'Customer';

  const estimatedDelivery = order.estimatedDeliveryDate
    ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    : '3 - 5 Business Days';

  const fullShippingAddress = [
    order.shippingAddress?.street,
    order.shippingAddress?.city,
    order.shippingAddress?.state,
    order.shippingAddress?.postalCode,
  ]
    .filter(Boolean)
    .join(', ');

  const paymentStatusDisplay = order.paymentStatus || (order.isPaid ? 'Paid' : 'Pending');

  if (!order.notifications) {
    order.notifications = {
      emailSent: false,
      whatsappStatus: 'Pending',
      whatsappSent: false,
      whatsappRetries: 0,
    };
  }

  order.notifications.whatsappStatus = 'Pending';
  order.notifications.whatsappRetries = (order.notifications.whatsappRetries || 0) + 1;

  const waResult = await sendWhatsAppOrderConfirmation({
    phone: recipientPhone,
    customerName,
    orderId: order._id.toString(),
    trackingNumber: order.trackingNumber,
    totalPrice: order.totalPrice,
    paymentMethod: order.paymentMethod,
    paymentStatus: paymentStatusDisplay,
    shippingAddress: fullShippingAddress,
    estimatedDelivery,
    trackingUrl,
    items: order.orderItems,
  });

  if (waResult.success) {
    order.notifications.whatsappStatus = 'Sent';
    order.notifications.whatsappSent = true;
    order.notifications.whatsappSentAt = new Date();
    order.notifications.whatsappMessageId = waResult.messageId || '';
    order.notifications.whatsappError = '';
  } else {
    order.notifications.whatsappStatus = waResult.simulated ? 'Not Sent' : 'Failed';
    order.notifications.whatsappError = waResult.reason || 'Failed to deliver';
  }

  await order.save();
  return { success: waResult.success, order, waResult };
};

/**
 * Dispatch Delivery Verification OTP Notification via Meta WhatsApp Cloud API
 *
 * Triggered automatically when order enters "Out for Delivery" or upon manual customer/admin resend.
 *
 * @param {string|Object} orderOrId MongoDB Order ID or Order Document
 * @param {Object} [options]
 * @param {boolean} [options.forceResend=false]
 */
export const dispatchDeliveryOTPNotification = async (orderOrId, options = {}) => {
  const { forceResend = false } = options;

  const orderId = typeof orderOrId === 'string' ? orderOrId : orderOrId?._id;
  if (!orderId) {
    throw new Error('Invalid order ID provided to dispatchDeliveryOTPNotification');
  }

  const order = await Order.findById(orderId).populate('user', 'name email phone');
  if (!order) {
    throw new Error(`Order #${orderId} not found`);
  }

  const recipientPhone = order.shippingAddress?.phone || order.user?.phone;
  const customerName = order.shippingAddress?.fullName || order.user?.name || 'Customer';

  if (!recipientPhone) {
    console.warn(`⚠️ [Delivery OTP] No phone number found for order #${order._id}`);
    if (!order.deliveryNotifications) order.deliveryNotifications = {};
    order.deliveryNotifications.status = 'Failed';
    order.deliveryNotifications.error = 'No phone number attached to order';
    await order.save();
    return { success: false, reason: 'No phone number found for order' };
  }

  // Ensure valid 6-digit OTP and 10-minute expiry
  const now = new Date();
  const isExpired = !order.deliveryOTPExpiresAt || now > new Date(order.deliveryOTPExpiresAt);
  if (!order.deliveryOTP || isExpired || forceResend) {
    order.deliveryOTP = Math.floor(100000 + Math.random() * 900000).toString();
    order.deliveryOTPExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    order.deliveryOTPAttempts = 0;
    order.deliveryOTPVerified = false;
  }

  if (!order.deliveryNotifications) {
    order.deliveryNotifications = {
      status: 'Not Sent',
      sentAt: null,
      messageId: '',
      error: '',
      recipientPhone: recipientPhone,
      resendCount: 0,
    };
  }

  // Check duplicate prevention
  if (!forceResend && order.deliveryNotifications.status === 'Sent' && !isExpired) {
    console.log(`ℹ️ [Delivery OTP] Duplicate prevented: active OTP already sent to ${recipientPhone} at ${order.deliveryNotifications.sentAt}`);
    return { success: true, message: 'Active OTP already sent', order };
  }

  order.deliveryNotifications.status = 'Sending';
  order.deliveryNotifications.recipientPhone = recipientPhone;
  order.deliveryNotifications.resendCount = (order.deliveryNotifications.resendCount || 0) + 1;
  await order.save();

  try {
    const waResult = await sendWhatsAppDeliveryOTP({
      phone: recipientPhone,
      customerName,
      otp: order.deliveryOTP,
      orderId: order._id.toString(),
      trackingNumber: order.trackingNumber,
    });

    if (waResult.success) {
      order.deliveryNotifications.status = 'Sent';
      order.deliveryNotifications.sentAt = new Date();
      order.deliveryNotifications.messageId = waResult.messageId || '';
      order.deliveryNotifications.error = '';
    } else {
      order.deliveryNotifications.status = 'Failed';
      order.deliveryNotifications.error = waResult.reason || 'Meta WhatsApp delivery failed';
    }

    await order.save();
    return { success: waResult.success, order, waResult };
  } catch (err) {
    console.error(`❌ [Delivery OTP Dispatch Error]: ${err.message}`);
    order.deliveryNotifications.status = 'Failed';
    order.deliveryNotifications.error = err.message;
    await order.save();
    return { success: false, reason: err.message };
  }
};
