import { sendEmail, buildOTPEmailTemplate } from '../utils/sendEmail.js';

/**
 * Backwards compatibility wrapper for sendOTPEmail
 */
export const sendOTPEmail = async (options) => {
  return sendEmail(options);
};

export { sendEmail, buildOTPEmailTemplate };
export default sendEmail;
