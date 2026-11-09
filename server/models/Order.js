import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1, min: 1 },
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  date: { type: Date, default: Date.now },
  comment: { type: String, default: '' },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'Razorpay',
    },
    paymentResult: {
      id: String,
      status: String,
      razorpay_order_id: { type: String, index: true },
      razorpay_payment_id: String,
      razorpay_signature: String,
      email_address: String,
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    discountAmount: {
      type: Number,
      default: 0.0,
    },
    couponCode: {
      type: String,
      default: '',
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
      index: true,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    trackingNumber: {
      type: String,
      index: true,
      default: function () {
        return 'TRK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      },
    },
    deliveryOTP: {
      type: String,
      default: function () {
        return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit Delivery OTP
      },
    },
    deliveryOTPExpiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
      },
    },
    deliveryOTPAttempts: {
      type: Number,
      default: 0,
    },
    deliveryOTPVerified: {
      type: Boolean,
      default: false,
    },
    deliveryOTPVerifiedAt: {
      type: Date,
    },
    deliveryOTPResendCooldown: {
      type: Date,
    },
    deliveryNotifications: {
      status: {
        type: String,
        enum: ['Not Sent', 'Sending', 'Sent', 'Failed'],
        default: 'Not Sent',
        index: true,
      },
      sentAt: { type: Date },
      messageId: { type: String, default: '' },
      error: { type: String, default: '' },
      recipientPhone: { type: String, default: '' },
      resendCount: { type: Number, default: 0 },
    },
    estimatedDeliveryDate: {
      type: Date,
      default: function () {
        const d = new Date();
        d.setDate(d.getDate() + 4);
        return d;
      },
    },
    statusHistory: [statusHistorySchema],
    notifications: {
      emailSent: { type: Boolean, default: false },
      emailSentAt: { type: Date },
      whatsappStatus: {
        type: String,
        enum: ['Not Sent', 'Pending', 'Sent', 'Failed'],
        default: 'Not Sent',
        index: true,
      },
      whatsappSent: { type: Boolean, default: false },
      whatsappSentAt: { type: Date },
      whatsappMessageId: { type: String, default: '' },
      whatsappError: { type: String, default: '' },
      whatsappRetries: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user orders in chronological order
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
