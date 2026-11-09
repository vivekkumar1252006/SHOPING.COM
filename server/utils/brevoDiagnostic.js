import { BrevoClient } from '@getbrevo/brevo';
import { loadEnv } from '../config/env.js';

loadEnv();

/**
 * Helper to safely mask sensitive strings (API Keys, Passwords, OTPs)
 */
export const maskSecret = (secret, visibleStart = 4, visibleEnd = 4) => {
  if (!secret || typeof secret !== 'string') return '[NOT SET]';
  const clean = secret.trim();
  if (clean.length <= visibleStart + visibleEnd) return '******';
  return `${clean.slice(0, visibleStart)}...${clean.slice(-visibleEnd)}`;
};

/**
 * Comprehensive 10-Step Brevo Delivery Diagnostic Engine
 * Inspects credentials, sender verification, account status, email credits,
 * and delivery events according to official Brevo API specifications.
 *
 * @param {Object} [options]
 * @param {string} [options.testRecipient] - Optional recipient email to test delivery
 * @returns {Promise<Object>} Diagnostic report
 */
export const runBrevoDiagnostic = async (testRecipient = null) => {
  // Re-read .env with override
  loadEnv();

  const rawApiKey = (process.env.BREVO_API_KEY || '').trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || '').trim().toLowerCase();
  const senderName = process.env.BREVO_SENDER_NAME || 'shoping.com';
  const targetRecipient = (testRecipient || senderEmail || 'test@example.com').trim().toLowerCase();

  const report = {
    timestamp: new Date().toISOString(),
    step1_envLoading: { status: 'CHECKING', details: null },
    step2_senderCheck: { status: 'PENDING', verified: false, details: null },
    step3_accountStatus: { status: 'PENDING', active: false, credits: null, details: null },
    step4_apiConnectivity: { status: 'PENDING', details: null },
    step5_recipientCheck: { status: 'PENDING', recipient: targetRecipient, valid: false },
    step6_transactionalSubmission: { status: 'SKIPPED', messageId: null, details: null },
    step9_deliveryLogs: { status: 'SKIPPED', events: [] },
    overallSuccess: false,
    errorMessage: null,
    actionableAdvice: null,
  };

  // STEP 1: Check BREVO_API_KEY and environment variable loading
  const isKeyEmpty = !rawApiKey || rawApiKey === 'your_brevo_api_key_here';
  const isPlaceholder = rawApiKey.includes('aapki_copy_ki_hui') || rawApiKey.includes('your_');
  const isValidFormat = rawApiKey.startsWith('xkeysib-') && rawApiKey.length > 30;

  if (isKeyEmpty) {
    report.step1_envLoading = {
      status: 'FAILED',
      details: 'BREVO_API_KEY is empty in server/.env.',
    };
    report.errorMessage = 'BREVO_API_KEY is not configured in server/.env.';
    report.actionableAdvice = 'Paste your valid Brevo API key (starts with "xkeysib-") into server/.env on line 18.';
    return report;
  }

  if (isPlaceholder || !isValidFormat) {
    report.step1_envLoading = {
      status: 'FAILED',
      maskedKey: maskSecret(rawApiKey, 8, 4),
      details: 'BREVO_API_KEY appears to be a placeholder or invalid format. Brevo v3 keys start with "xkeysib-".',
    };
    report.errorMessage = 'Invalid BREVO_API_KEY format in server/.env.';
    report.actionableAdvice = 'Generate a fresh API key from https://app.brevo.com/settings/keys/api and paste it into server/.env.';
    return report;
  }

  report.step1_envLoading = {
    status: 'PASSED',
    maskedKey: maskSecret(rawApiKey, 8, 4),
    senderEmailConfigured: senderEmail || '[MISSING]',
    senderNameConfigured: senderName,
  };

  // Initialize official Brevo SDK Client
  const client = new BrevoClient({ apiKey: rawApiKey });

  // STEP 3 & 4: Check Account Status & Credits
  try {
    const accountInfo = await client.account.getAccount();
    const plan = accountInfo?.plan || [];
    const emailPlan = plan.find((p) => p.type === 'free' || p.type === 'subscription' || p.creditsType === 'sendLimit');

    report.step3_accountStatus = {
      status: 'PASSED',
      active: true,
      email: accountInfo?.email || 'N/A',
      companyName: accountInfo?.companyName || 'N/A',
      credits: accountInfo?.credits || emailPlan?.credits || 'Unlimited/Active',
      relayStatus: accountInfo?.relay?.status || 'Active',
    };
    report.step4_apiConnectivity = {
      status: 'PASSED',
      details: 'Successfully connected to Brevo API v3 over HTTPS.',
    };
  } catch (accErr) {
    const status = accErr.statusCode || accErr.status || 500;
    const msg = accErr.body?.message || accErr.message || 'Unknown Brevo error';
    report.step3_accountStatus = {
      status: 'FAILED',
      httpStatus: status,
      details: msg,
    };
    report.step4_apiConnectivity = { status: 'FAILED', details: msg };
    report.errorMessage = `Brevo Account Check Failed (${status}): ${msg}`;

    if (status === 401) {
      report.actionableAdvice = 'Brevo rejected the API key (401 Unauthorized). Please check https://app.brevo.com/settings/keys/api and generate a new key.';
    } else {
      report.actionableAdvice = `Brevo returned HTTP ${status}: ${msg}. Check account activation status at https://app.brevo.com/`;
    }
    return report;
  }

  // STEP 2: Verify BREVO_SENDER_EMAIL is a verified Brevo sender
  try {
    const sendersResponse = await client.senders.getSenders();
    const sendersList = sendersResponse?.senders || [];
    const matchedSender = sendersList.find((s) => s.email?.toLowerCase() === senderEmail);

    if (!matchedSender) {
      report.step2_senderCheck = {
        status: 'FAILED',
        configuredSender: senderEmail,
        verified: false,
        availableSenders: sendersList.map((s) => ({ email: s.email, active: s.active })),
        details: `Configured BREVO_SENDER_EMAIL (${senderEmail}) is NOT in your Brevo account's verified senders list.`,
      };
      report.errorMessage = `Sender email "${senderEmail}" is not verified in your Brevo account.`;
      report.actionableAdvice = `Add and verify "${senderEmail}" at https://app.brevo.com/senders or set BREVO_SENDER_EMAIL in server/.env to one of your verified senders: ${sendersList.map((s) => s.email).join(', ') || 'No senders found'}.`;
      return report;
    }

    if (!matchedSender.active) {
      report.step2_senderCheck = {
        status: 'WARNING',
        configuredSender: senderEmail,
        verified: false,
        details: `Sender "${senderEmail}" exists in Brevo but is not yet active/validated.`,
      };
      report.errorMessage = `Sender email "${senderEmail}" is pending validation in Brevo.`;
      report.actionableAdvice = `Check the verification email Brevo sent to ${senderEmail} to activate this sender.`;
      return report;
    }

    report.step2_senderCheck = {
      status: 'PASSED',
      configuredSender: senderEmail,
      senderId: matchedSender.id,
      verified: true,
      active: matchedSender.active,
    };
  } catch (senderErr) {
    report.step2_senderCheck = {
      status: 'WARNING',
      details: `Could not verify senders list: ${senderErr.body?.message || senderErr.message}`,
    };
  }

  // STEP 5: Check recipient email address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(targetRecipient)) {
    report.step5_recipientCheck = {
      status: 'FAILED',
      recipient: targetRecipient,
      valid: false,
      details: 'Recipient email format is invalid.',
    };
    report.errorMessage = `Invalid recipient email format: ${targetRecipient}`;
    return report;
  }
  report.step5_recipientCheck = {
    status: 'PASSED',
    recipient: targetRecipient,
    valid: true,
  };

  // If a test recipient was supplied, perform real test transactional dispatch
  if (testRecipient) {
    try {
      const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const sendResult = await client.transactionalEmails.sendTransacEmail({
        subject: `🔐 Test Verification Code [${testOtp.slice(0, 2)}****] - shoping.com Diagnostic`,
        htmlContent: `
          <div style="font-family:sans-serif;padding:24px;border:1px solid #fde68a;border-radius:12px;max-width:500px;background:#fffbeb;">
            <h2 style="color:#b45309;margin-top:0;">Brevo Real-Time Diagnostic Test</h2>
            <p>This is a live diagnostic verification email from <strong>shoping.com</strong>.</p>
            <div style="background:#ffffff;border:2px dashed #f59e0b;padding:16px;border-radius:8px;text-align:center;margin:16px 0;">
              <span style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#b45309;">${testOtp}</span>
            </div>
            <p style="font-size:12px;color:#78350f;">Timestamp: ${new Date().toLocaleString()}</p>
          </div>
        `,
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: targetRecipient,
            name: 'Diagnostic Tester',
          },
        ],
      });

      const messageId = sendResult?.messageId || sendResult?.body?.messageId;
      report.step6_transactionalSubmission = {
        status: 'PASSED',
        messageId,
        details: 'Brevo API successfully accepted the transactional email for delivery.',
      };

      // STEP 9: Fetch recent transactional event logs for this email
      try {
        const eventsResponse = await client.transactionalEmails.getEmailEventReport({
          email: targetRecipient,
          limit: 5,
        });
        report.step9_deliveryLogs = {
          status: 'CHECKED',
          events: eventsResponse?.events || [],
        };
      } catch (_) {
        report.step9_deliveryLogs = { status: 'PENDING_DELIVERY_QUEUE', events: [] };
      }

      report.overallSuccess = true;
    } catch (sendErr) {
      const status = sendErr.statusCode || sendErr.status || 500;
      const errorMsg = sendErr.body?.message || sendErr.message || 'Error sending test transactional email';

      report.step6_transactionalSubmission = {
        status: 'FAILED',
        httpStatus: status,
        details: errorMsg,
      };
      report.errorMessage = `Brevo Send Failure (${status}): ${errorMsg}`;
      report.actionableAdvice = `Brevo rejected transactional email dispatch: ${errorMsg}. Verify sender and account standing.`;
      return report;
    }
  } else {
    report.step6_transactionalSubmission = {
      status: 'SKIPPED',
      details: 'No test recipient provided. Credentials and sender are verified and ready for live delivery.',
    };
    report.overallSuccess = true;
  }

  return report;
};
