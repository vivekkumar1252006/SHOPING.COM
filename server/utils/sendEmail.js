import nodemailer from 'nodemailer';
import { BrevoClient } from '@getbrevo/brevo';
import { loadEnv } from '../config/env.js';

loadEnv();

/**
 * Mask string for safe console logging
 */
const maskValue = (str, visibleStart = 3, visibleEnd = 3) => {
  if (!str) return 'NOT_CONFIGURED';
  const s = String(str).trim();
  if (s.length <= visibleStart + visibleEnd) return '***';
  return `${s.slice(0, visibleStart)}***${s.slice(-visibleEnd)}`;
};

/**
 * Build responsive HTML template for Shopping.com transactional emails
 */
export const buildOTPEmailTemplate = ({ name = 'Customer', otp, purpose = 'verification' }) => {
  const isVerification = purpose === 'verification';
  const subject = isVerification
    ? 'Verify Your Email Address - Shopping.com'
    : 'Reset Your Password - Shopping.com';

  const heading = isVerification ? 'Verify Your Email Address' : 'Password Reset Request';
  const description = isVerification
    ? 'Thank you for registering on Shopping.com! To complete your registration and activate your account, please use the 6-digit verification code below:'
    : 'We received a request to reset your Shopping.com password. Please use the 6-digit security code below to proceed:';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
  <style>
    body {
      margin: 0;
      padding: 24px 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f172a;
      color: #e2e8f0;
    }
    .wrapper {
      max-width: 520px;
      margin: 0 auto;
      background: #1e293b;
      border-radius: 20px;
      border: 1px solid #334155;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .brand-name {
      margin: 0;
      font-size: 28px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      margin: 6px 0 0 0;
      font-size: 13px;
      font-weight: 600;
      color: #fef3c7;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
      margin-bottom: 24px;
    }
    .otp-box {
      background: #0f172a;
      border: 2px dashed #f59e0b;
      border-radius: 16px;
      padding: 24px 16px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-tag {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #f59e0b;
      margin-bottom: 8px;
    }
    .otp-digits {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 10px;
      color: #fbbf24;
      text-indent: 10px;
      margin: 8px 0;
    }
    .badge {
      display: inline-block;
      background: rgba(245, 158, 11, 0.15);
      color: #fcd34d;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 9999px;
      margin-top: 8px;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .security-notice {
      background: rgba(15, 23, 42, 0.6);
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      padding: 14px 16px;
      margin-top: 24px;
    }
    .security-notice p {
      margin: 0;
      font-size: 12px;
      line-height: 1.5;
      color: #94a3b8;
    }
    .security-notice strong {
      color: #f59e0b;
    }
    .footer {
      background: #0f172a;
      padding: 20px 24px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid #1e293b;
    }
    .footer a {
      color: #f59e0b;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand-name">Shopping.com</h1>
      <p class="brand-sub">Next-Generation Smart Shopping</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${name},</div>
      <p class="text">${description}</p>
      <div class="otp-box">
        <div class="otp-tag">One-Time Verification Code</div>
        <div class="otp-digits">${otp}</div>
        <div class="badge">⏱️ Expires in 5 minutes</div>
      </div>
      <div class="security-notice">
        <p><strong>Security Warning:</strong> Never share this OTP with anyone. Shopping.com staff will never ask for your verification code. If you did not make this request, please ignore this email.</p>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Shopping.com. All rights reserved.<br>
      Automated security dispatch. Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Shopping.com - ${heading}
Hello ${name},

${description}

Verification Code: ${otp}
(Expires in 5 minutes)

Security Warning: Never share this OTP with anyone. Shopping.com staff will never ask for your verification code.
  `.trim();

  return { subject, html, text };
};

// Cached ethereal transporter for testing if no app password configured yet
let etherealTransporter = null;

/**
 * Send real email via Gmail SMTP or fallback/configured provider
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.otp - 6-digit numeric OTP
 * @param {string} [options.name='Customer'] - Recipient name
 * @param {string} [options.purpose='verification'] - 'verification' | 'password_reset'
 * @returns {Promise<{success: boolean, messageId: string, provider: string}>}
 */
export const sendEmail = async ({ to, email, otp, name = 'Customer', purpose = 'verification' }) => {
  const recipientEmail = (to || email || '').trim().toLowerCase();

  // Validate recipient email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    throw new Error(`Invalid recipient email address format: "${recipientEmail}"`);
  }

  // Refresh environment variables in case .env was recently modified
  try {
    loadEnv();
  } catch (_) {}

  const gmailUser = (process.env.EMAIL_USER || process.env.GMAIL_USER || '').trim();
  const gmailPass = (process.env.EMAIL_PASS || process.env.GMAIL_PASS || '').trim();
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  const senderName = process.env.BREVO_SENDER_NAME || 'Shopping.com';

  const { subject, html, text } = buildOTPEmailTemplate({ name, otp, purpose });

  console.log('\n--------------------------------------------------------------------------------');
  console.log(`📡 [Email Dispatch] Recipient: ${recipientEmail} | Purpose: ${purpose.toUpperCase()}`);
  console.log(`📮 [Gmail SMTP Config] User: ${maskValue(gmailUser, 3, 10)} | Pass: ${maskValue(gmailPass, 2, 2)}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔑 [LOCAL DEV TESTING CODE] 6-Digit OTP: ${otp}`);
  }
  console.log('--------------------------------------------------------------------------------');

  // 1. Try Gmail SMTP via Nodemailer when user configured credentials
  const hasGmailCreds = gmailUser && gmailPass && gmailPass !== 'your_gmail_app_password';
  if (hasGmailCreds) {
    try {
      console.log(`📤 [Gmail SMTP] Dispatching email via Gmail SMTP (${gmailUser})...`);

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

      console.log(`✅ [Gmail SMTP Success] MessageId: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        provider: 'gmail-smtp',
        recipient: recipientEmail,
      };
    } catch (smtpError) {
      console.error(`❌ [Gmail SMTP Error]: ${smtpError.message}`);
      // If Brevo is configured, attempt fallback to Brevo; otherwise throw
      if (!brevoApiKey || brevoApiKey.length < 30 || brevoApiKey.includes('your_')) {
        throw new Error(`Gmail SMTP delivery failed: ${smtpError.message}. Please check EMAIL_USER and EMAIL_PASS (App Password) in server/.env.`);
      }
      console.log('⚠️ Falling back to secondary Brevo provider...');
    }
  }

  // 2. Try Brevo API if configured
  const hasBrevoKey = brevoApiKey && brevoApiKey.startsWith('xkeysib-') && brevoApiKey.length > 30;
  if (hasBrevoKey) {
    try {
      console.log(`📤 [Brevo API] Dispatching email via Brevo...`);
      const brevoClient = new BrevoClient({ apiKey: brevoApiKey });
      const senderEmail = (process.env.BREVO_SENDER_EMAIL || gmailUser || 'support@shoping.com').trim();

      const response = await brevoClient.transactionalEmails.sendTransacEmail({
        subject,
        htmlContent: html,
        textContent: text,
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: recipientEmail, name }],
      });

      const messageId = response?.messageId || response?.body?.messageId || 'brevo-sent';
      console.log(`✅ [Brevo API Success] MessageId: ${messageId}`);
      return {
        success: true,
        messageId,
        provider: 'brevo',
        recipient: recipientEmail,
      };
    } catch (brevoError) {
      console.error(`❌ [Brevo API Error]: ${brevoError.message}`);
      throw new Error(`Email delivery failed via Brevo: ${brevoError.message}`);
    }
  }

  // 3. Testing Fallback: Real SMTP via Ethereal when EMAIL_PASS is not yet set in .env
  console.log('ℹ️ [Nodemailer] EMAIL_PASS not yet set in server/.env. Dispatching via live Ethereal SMTP server...');
  try {
    if (!etherealTransporter) {
      const testAccount = await nodemailer.createTestAccount();
      etherealTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`📡 [Ethereal SMTP] Initialized live test inbox: ${testAccount.user}`);
    }

    const info = await etherealTransporter.sendMail({
      from: `"Shopping.com" <support@shopping.com>`,
      to: recipientEmail,
      subject,
      text,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`✅ [Live SMTP Delivery Success] MessageId: ${info.messageId}`);
    if (previewUrl) {
      console.log(`📬 View Real Delivered Email Preview: ${previewUrl}`);
    }
    console.log(`💡 To deliver directly to your personal inbox, add your 16-character Google App Password in server/.env (EMAIL_PASS=xxxx xxxx xxxx xxxx).`);

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
      provider: 'ethereal-smtp',
      recipient: recipientEmail,
    };
  } catch (err) {
    console.error(`❌ [SMTP Dispatch Error]: ${err.message}`);
    throw new Error(`Email delivery failed: ${err.message}. Please configure EMAIL_USER and EMAIL_PASS in server/.env.`);
  }
};

export default sendEmail;
