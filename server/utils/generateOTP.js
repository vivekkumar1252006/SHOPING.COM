import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generate a cryptographically secure 6-digit numeric OTP string
 */
export const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Hash the OTP using bcrypt so plain-text OTP is never stored in DB
 */
export const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(String(otp).trim(), salt);
};

/**
 * Compare plain entered OTP with the stored hashed OTP
 */
export const compareOTP = async (enteredOtp, hashedOtp) => {
  if (!enteredOtp || !hashedOtp) return false;
  return await bcrypt.compare(String(enteredOtp).trim(), String(hashedOtp));
};
