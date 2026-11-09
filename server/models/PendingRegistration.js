import mongoose from 'mongoose';

const pendingRegistrationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: '',
    },
    otpHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    resendCooldown: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '7d' },
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, bufferCommands: false }
);

const PendingRegistration =
  mongoose.models.PendingRegistration ||
  mongoose.model('PendingRegistration', pendingRegistrationSchema);

export default PendingRegistration;
