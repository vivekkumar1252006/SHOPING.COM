import mongoose from 'mongoose';

const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['verification', 'password_reset'],
      default: 'verification',
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    resendCooldown: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 1000), // 60-second cooldown
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5-minute expiration
      index: { expires: '10m' }, // TTL automatic document removal
    },
  },
  {
    timestamps: true,
  }
);

const EmailOTP = mongoose.models.EmailOTP || mongoose.model('EmailOTP', emailOtpSchema);
export default EmailOTP;

