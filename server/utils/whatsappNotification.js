import { loadEnv } from '../config/env.js';

loadEnv();

/**
 * Clean & normalize phone number to Meta WhatsApp Cloud API format (E.164 digits without +)
 * E.g. "+91 98765 43210" -> "919876543210"
 * "9876543210" -> "919876543210" (defaulting to country code 91 for India if 10 digits)
 */
export const normalizeWhatsAppPhone = (phone = '', defaultCountryCode = '91') => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');

  // If user entered 10-digit mobile number, prepend India country code 91
  if (digits.length === 10) {
    digits = `${defaultCountryCode}${digits}`;
  }

  // Remove leading zeros if present
  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
    if (digits.length === 10) {
      digits = `${defaultCountryCode}${digits}`;
    }
  }

  return digits;
};

/**
 * Send Order Confirmation Notification via Official Meta WhatsApp Business Cloud API
 */
export const sendWhatsAppOrderConfirmation = async ({
  phone,
  customerName = 'Valued Customer',
  orderId,
  trackingNumber,
  deliveryOTP = '',
  totalPrice = 0,
  paymentMethod = 'Online',
  paymentStatus = 'Pending',
  shippingAddress = '',
  estimatedDelivery = '3 - 5 Days',
  trackingUrl = 'http://localhost:5173',
  items = [],
}) => {
  try {
    loadEnv();

    const token = (process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || '').trim();
    const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
    const templateName = (process.env.WHATSAPP_TEMPLATE_NAME || '').trim();

    const normalizedPhone = normalizeWhatsAppPhone(phone);
    const displayOrderId = orderId.toString().slice(-8).toUpperCase();
    const formattedTotal = Number(totalPrice).toLocaleString('en-IN');
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const productNames = items.map((i) => i.name).filter(Boolean).join(', ') || 'Selected Items';

    console.log('\n--------------------------------------------------------------------------------');
    console.log(`📱 [WhatsApp Notification] Dispatching to: +${normalizedPhone || 'NOT_PROVIDED'}`);
    console.log(`📦 [WhatsApp Meta Config] Phone ID: ${phoneNumberId ? phoneNumberId.slice(0, 4) + '***' : 'NOT_CONFIGURED'} | Template: ${templateName || 'auto-text'}`);
    console.log('--------------------------------------------------------------------------------');

    if (!normalizedPhone || normalizedPhone.length < 10) {
      console.warn('⚠️ [WhatsApp] Skipping: invalid or missing recipient phone number');
      return { success: false, reason: 'Invalid or missing phone number' };
    }

    if (!token || !phoneNumberId || token.length < 20) {
      console.log('ℹ️ [WhatsApp] Meta WhatsApp Cloud API credentials not configured in server/.env (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID). Notification logged safely.');
      return {
        success: false,
        reason: 'Meta WhatsApp Cloud API credentials not configured in server/.env',
        simulated: true,
      };
    }

    const apiVersion = (process.env.WHATSAPP_API_VERSION || 'v21.0').trim();
    const apiUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    // 1. If an approved template is configured in Meta Business Manager, send Template message
    if (templateName && templateName !== 'none') {
      try {
        console.log(`📤 [WhatsApp] Attempting Meta Template send: "${templateName}" (API ${apiVersion})...`);
        const templatePayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: customerName },
                  { type: 'text', text: `#${displayOrderId}` },
                  { type: 'text', text: productNames.slice(0, 50) },
                  { type: 'text', text: String(totalQuantity) },
                  { type: 'text', text: `₹${formattedTotal}` },
                  { type: 'text', text: paymentMethod },
                  { type: 'text', text: paymentStatus },
                  { type: 'text', text: estimatedDelivery },
                ],
              },
            ],
          },
        };

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templatePayload),
        });

        const resData = await res.json();

        if (res.ok && resData.messages?.[0]?.id) {
          console.log(`✅ [WhatsApp Success] Meta Template Message ID: ${resData.messages[0].id}`);
          return {
            success: true,
            provider: 'meta-whatsapp-template',
            messageId: resData.messages[0].id,
            recipient: normalizedPhone,
          };
        } else {
          console.warn(`⚠️ [WhatsApp Template Error]: ${resData.error?.message || JSON.stringify(resData)}. Attempting direct text fallback...`);
        }
      } catch (templateErr) {
        console.warn(`⚠️ [WhatsApp Template Exception]: ${templateErr.message}. Attempting text fallback...`);
      }
    }

    // 2. Direct Formatted Message matching exact Shoping.com professional template
    const otpSection = deliveryOTP ? `\n🔐 *Delivery OTP*: *${deliveryOTP}*\n(Share this secret verification code with courier agent upon arrival)\n` : '';

    const messageBody = `Hello ${customerName}! 👋

🎉 *Your Order Has Been Placed Successfully!*

Thank you for shopping with us.

📦 *Order Details*
- Order ID: #${displayOrderId}
- Product: ${productNames}
- Quantity: ${totalQuantity}
- Total Amount: ₹${formattedTotal}
- Payment Status: ${paymentStatus}
- Payment Method: ${paymentMethod}
${otpSection}
📍 *Delivery Address*
${shippingAddress || 'Registered Delivery Address'}

We have successfully received your order and will notify you when your order is shipped.

Thank you for choosing us! ❤️`.trim();

    const textPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedPhone,
      type: 'text',
      text: {
        preview_url: true,
        body: messageBody,
      },
    };

    const textRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(textPayload),
    });

    const textData = await textRes.json();

    if (textRes.ok && textData.messages?.[0]?.id) {
      console.log(`✅ [WhatsApp Success - Meta Cloud API] Message ID: ${textData.messages[0].id}`);
      return {
        success: true,
        provider: 'meta-whatsapp-cloud-api',
        messageId: textData.messages[0].id,
        recipient: normalizedPhone,
      };
    } else {
      console.error(`❌ [WhatsApp API Error]:`, textData.error || textData);
      return {
        success: false,
        reason: textData.error?.message || 'Meta API returned error',
        metaError: textData.error,
      };
    }
  } catch (error) {
    console.error(`❌ [WhatsApp Notification Failed]:`, error.message);
    return { success: false, reason: error.message };
  }
};

/**
 * Send 6-Digit OTP via Meta WhatsApp Cloud API
 */
export const sendWhatsAppOTP = async ({ phone, otp, purpose = 'verification', name = 'Customer' }) => {
  try {
    loadEnv();

    const token = (process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || '').trim();
    const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();

    const normalizedPhone = normalizeWhatsAppPhone(phone);
    console.log(`\n📱 [WhatsApp OTP] Sending 6-digit code to: +${normalizedPhone || 'NOT_PROVIDED'}`);

    if (!normalizedPhone || normalizedPhone.length < 10) {
      return { success: false, reason: 'Invalid or missing phone number' };
    }

    if (!token || !phoneNumberId) {
      console.warn('⚠️ [WhatsApp OTP] Meta WhatsApp Cloud API credentials missing');
      return { success: false, reason: 'Meta WhatsApp credentials missing' };
    }

    const apiVersion = (process.env.WHATSAPP_API_VERSION || 'v21.0').trim();
    const apiUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const purposeText = purpose === 'password_reset' ? 'Password Reset' : 'Account Verification';
    const messageBody = `*Shoping.com Security Code*\n\nHello ${name}!\n\nYour 6-digit ${purposeText} OTP is:\n\n*${otp}*\n\nThis code is valid for 5 minutes. Do not share this OTP with anyone.\n\nThank you for choosing Shoping.com!`;

    const textPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: messageBody,
      },
    };

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(textPayload),
    });

    const resData = await res.json();
    if (res.ok && resData.messages?.[0]?.id) {
      console.log(`✅ [WhatsApp OTP Success] Message ID: ${resData.messages[0].id}`);
      return { success: true, messageId: resData.messages[0].id };
    } else {
      console.warn(`⚠️ [WhatsApp OTP Meta Response]:`, resData.error?.message || resData);
      return { success: false, error: resData.error };
    }
  } catch (err) {
    console.error(`❌ [WhatsApp OTP Exception]:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send Delivery Verification OTP via Official Meta WhatsApp Business Cloud API
 *
 * Exact Message:
 * Shoping.com – Delivery Verification
 *
 * Hello {{customerName}},
 *
 * Your order is arriving soon!
 *
 * Your Delivery Verification OTP is: {{OTP}}
 *
 * Order ID: {{orderId}}
 *
 * Please share this OTP with the delivery agent only when you receive your parcel.
 *
 * Thank you for shopping with Shoping.com!
 */
export const sendWhatsAppDeliveryOTP = async ({
  phone,
  customerName = 'Customer',
  otp,
  orderId,
  trackingNumber = '',
}) => {
  try {
    loadEnv();

    const token = (process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || '').trim();
    const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
    const templateName = (process.env.WHATSAPP_DELIVERY_TEMPLATE_NAME || '').trim();
    const apiVersion = (process.env.WHATSAPP_API_VERSION || 'v21.0').trim();

    const normalizedPhone = normalizeWhatsAppPhone(phone, '91');
    const displayOrderId = orderId ? orderId.toString().slice(-8).toUpperCase() : trackingNumber;

    console.log('\n--------------------------------------------------------------------------------');
    console.log(`📱 [WhatsApp Delivery OTP] Dispatching to: +${normalizedPhone || 'NOT_PROVIDED'}`);
    console.log(`📦 Order: #${displayOrderId} | OTP: ${otp} | Customer: ${customerName}`);
    console.log(`🔑 Meta Phone ID: ${phoneNumberId ? phoneNumberId.slice(0, 4) + '***' : 'NOT_CONFIGURED'}`);
    console.log('--------------------------------------------------------------------------------');

    if (!normalizedPhone || normalizedPhone.length < 10) {
      console.warn('⚠️ [WhatsApp Delivery OTP] Invalid or missing recipient phone number');
      return { success: false, reason: 'Invalid or missing phone number' };
    }

    if (!token || !phoneNumberId || token.length < 20) {
      const reason = 'Meta WhatsApp Cloud API credentials missing in server/.env (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID)';
      console.warn(`⚠️ [WhatsApp Delivery OTP]: ${reason}`);
      return { success: false, reason, simulated: true };
    }

    const apiUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    // 1. If an approved delivery OTP template is configured, send via Template
    if (templateName && templateName !== 'none') {
      try {
        console.log(`📤 [WhatsApp Delivery OTP] Trying Meta approved template: "${templateName}"...`);
        const templatePayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: customerName },
                  { type: 'text', text: String(otp) },
                  { type: 'text', text: `#${displayOrderId}` },
                ],
              },
            ],
          },
        };

        const tRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templatePayload),
        });

        const tData = await tRes.json();
        if (tRes.ok && tData.messages?.[0]?.id) {
          console.log(`✅ [WhatsApp Delivery OTP] Meta Template Message ID: ${tData.messages[0].id}`);
          return {
            success: true,
            provider: 'meta-whatsapp-template',
            messageId: tData.messages[0].id,
            recipient: normalizedPhone,
          };
        } else {
          console.warn(`⚠️ [WhatsApp Delivery OTP] Template error: ${tData.error?.message || JSON.stringify(tData)}. Falling back to direct text format...`);
        }
      } catch (tErr) {
        console.warn(`⚠️ [WhatsApp Delivery OTP] Template exception: ${tErr.message}. Falling back to direct text...`);
      }
    }

    // 2. Direct Meta WhatsApp Cloud API Message format (exact format requested)
    const messageBody = `Shoping.com – Delivery Verification

Hello ${customerName},

Your order is arriving soon!

Your Delivery Verification OTP is: ${otp}

Order ID: #${displayOrderId}

Please share this OTP with the delivery agent only when you receive your parcel.

Thank you for shopping with Shoping.com!`.trim();

    const textPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: messageBody,
      },
    };

    const textRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(textPayload),
    });

    const textData = await textRes.json();

    if (textRes.ok && textData.messages?.[0]?.id) {
      console.log(`✅ [WhatsApp Delivery OTP Success] Message ID: ${textData.messages[0].id}`);
      return {
        success: true,
        provider: 'meta-whatsapp-cloud-api',
        messageId: textData.messages[0].id,
        recipient: normalizedPhone,
      };
    } else {
      const metaErrMsg = textData.error?.message || 'Meta API returned error';
      const metaCode = textData.error?.code;
      console.error(`❌ [WhatsApp Delivery OTP Error]: Code ${metaCode} - ${metaErrMsg}`);
      return {
        success: false,
        reason: metaErrMsg,
        code: metaCode,
        metaError: textData.error,
      };
    }
  } catch (err) {
    console.error(`❌ [WhatsApp Delivery OTP Exception]:`, err.message);
    return { success: false, reason: err.message };
  }
};
