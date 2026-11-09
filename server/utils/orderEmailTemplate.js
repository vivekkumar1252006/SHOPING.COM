/**
 * Premium Responsive HTML Email Template for Shopping.com Order Confirmation
 */
export const buildOrderConfirmationTemplate = ({
  order,
  user,
  trackingUrl,
}) => {
  const customerName = order.shippingAddress?.fullName || user?.name || 'Valued Customer';
  const orderId = order._id.toString();
  const trackingNumber = order.trackingNumber || 'TRK-' + orderId.slice(-8).toUpperCase();
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const estimatedDelivery = order.estimatedDeliveryDate
    ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Within 3 - 5 Business Days';

  const isPaid = Boolean(order.isPaid);
  const paymentBadge = isPaid
    ? '<span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;background-color:#065f46;color:#a7f3d0;">PAID &amp; CONFIRMED</span>'
    : '<span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;background-color:#854d0e;color:#fef08a;">CASH ON DELIVERY</span>';

  // Render order items rows
  const itemsHtml = (order.orderItems || [])
    .map((item) => {
      const price = Number(item.price || 0).toLocaleString('en-IN');
      const lineTotal = Number((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN');
      const imgUrl = item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120';

      return `
        <tr>
          <td style="padding:14px 12px;border-bottom:1px solid #334155;vertical-align:middle;width:64px;">
            <img src="${imgUrl}" alt="${item.name}" width="54" height="54" style="border-radius:10px;object-fit:cover;border:1px solid #475569;display:block;" />
          </td>
          <td style="padding:14px 12px;border-bottom:1px solid #334155;vertical-align:middle;">
            <div style="font-weight:700;font-size:13px;color:#f8fafc;line-height:1.4;">${item.name}</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:3px;">Qty: ${item.quantity} &times; &#8377;${price}</div>
          </td>
          <td style="padding:14px 12px;border-bottom:1px solid #334155;vertical-align:middle;text-align:right;font-weight:700;font-size:13px;color:#f8fafc;white-space:nowrap;">
            &#8377;${lineTotal}
          </td>
        </tr>
      `;
    })
    .join('');

  const subtotalFormatted = Number(order.itemsPrice || 0).toLocaleString('en-IN');
  const shippingFormatted = order.shippingPrice > 0 ? `&#8377;${Number(order.shippingPrice).toLocaleString('en-IN')}` : 'FREE';
  const taxFormatted = Number(order.taxPrice || 0).toLocaleString('en-IN');
  const discountFormatted = order.discountAmount > 0 ? `-&#8377;${Number(order.discountAmount).toLocaleString('en-IN')}` : '&#8377;0';
  const totalFormatted = Number(order.totalPrice || 0).toLocaleString('en-IN');

  const fullStreet = order.shippingAddress?.street || '';
  const cityState = `${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.postalCode || ''}`;
  const phone = order.shippingAddress?.phone || '';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation #${orderId.slice(-8).toUpperCase()} - Shopping.com</title>
  <style>
    body {
      margin: 0;
      padding: 20px 10px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #e2e8f0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #111827;
      border-radius: 20px;
      border: 1px solid #1f2937;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 60%, #b45309 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-sub {
      font-size: 13px;
      color: #3b2505;
      font-weight: 700;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .body-content {
      padding: 32px 24px;
    }
    .success-pill {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 14px;
      padding: 16px;
      text-align: center;
      margin-bottom: 24px;
    }
    .info-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 20px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #0f172a !important;
      font-weight: 800;
      font-size: 14px;
      padding: 14px 32px;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 10px 20px -5px rgba(245, 158, 11, 0.4);
    }
    .footer {
      background: #0f172a;
      padding: 24px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid #1e293b;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1 class="brand-title">Shopping.com</h1>
      <div class="brand-sub">Premium E-Commerce Experience</div>
    </div>

    <!-- Body -->
    <div class="body-content">
      <!-- Success Banner -->
      <div class="success-pill">
        <div style="font-size:24px;line-height:1;margin-bottom:6px;">&#10004;&#65039;</div>
        <h2 style="margin:0;font-size:18px;font-weight:800;color:#34d399;">Order Placed Successfully!</h2>
        <p style="margin:6px 0 0 0;font-size:13px;color:#cbd5e1;">
          Hello <strong>${customerName}</strong>, thank you for your order! We are preparing your shipment with care.
        </p>
      </div>

      <!-- Quick Order Meta Card -->
      <div class="info-card">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <tr>
            <td style="padding:4px 0;color:#94a3b8;">Order ID:</td>
            <td style="padding:4px 0;text-align:right;font-weight:700;color:#f59e0b;font-family:monospace;font-size:13px;">#${orderId}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#94a3b8;">Order Date:</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;color:#f8fafc;">${orderDate}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#94a3b8;">Payment Method:</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;color:#f8fafc;">${order.paymentMethod || 'Online'}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#94a3b8;">Payment Status:</td>
            <td style="padding:4px 0;text-align:right;">${paymentBadge}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#94a3b8;">Tracking Number:</td>
            <td style="padding:4px 0;text-align:right;font-weight:700;color:#a78bfa;font-family:monospace;">${trackingNumber}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#94a3b8;">Estimated Delivery:</td>
            <td style="padding:4px 0;text-align:right;font-weight:700;color:#38bdf8;">${estimatedDelivery}</td>
          </tr>
        </table>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom:20px;">
        <h3 style="font-size:13px;font-weight:800;color:#f59e0b;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px 0;">
          Items in Your Order
        </h3>
        <table style="width:100%;border-collapse:collapse;background:#1e293b;border-radius:14px;overflow:hidden;border:1px solid #334155;">
          ${itemsHtml}
        </table>
      </div>

      <!-- Price Breakdown -->
      <div class="info-card">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <tr>
            <td style="padding:5px 0;color:#94a3b8;">Subtotal:</td>
            <td style="padding:5px 0;text-align:right;color:#e2e8f0;">&#8377;${subtotalFormatted}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#94a3b8;">Shipping Fee:</td>
            <td style="padding:5px 0;text-align:right;color:#10b981;font-weight:600;">${shippingFormatted}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#94a3b8;">Estimated Taxes (GST 5%):</td>
            <td style="padding:5px 0;text-align:right;color:#e2e8f0;">&#8377;${taxFormatted}</td>
          </tr>
          ${
            order.discountAmount > 0
              ? `
          <tr>
            <td style="padding:5px 0;color:#94a3b8;">Discount (${order.couponCode || 'Promo'}):</td>
            <td style="padding:5px 0;text-align:right;color:#f59e0b;font-weight:600;">${discountFormatted}</td>
          </tr>
          `
              : ''
          }
          <tr style="border-top:1px solid #475569;">
            <td style="padding:12px 0 4px 0;font-size:15px;font-weight:800;color:#f8fafc;">Total Paid:</td>
            <td style="padding:12px 0 4px 0;text-align:right;font-size:18px;font-weight:900;color:#f59e0b;">&#8377;${totalFormatted}</td>
          </tr>
        </table>
      </div>

      <!-- Shipping Destination -->
      <div class="info-card">
        <h4 style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">
          Shipping Destination
        </h4>
        <div style="font-weight:700;font-size:14px;color:#f8fafc;">${customerName}</div>
        <div style="font-size:13px;color:#cbd5e1;margin-top:2px;line-height:1.4;">
          ${fullStreet}<br />
          ${cityState}
        </div>
        ${phone ? `<div style="font-size:12px;color:#94a3b8;margin-top:4px;">Contact Phone: ${phone}</div>` : ''}
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0 16px 0;">
        <a href="${trackingUrl}" class="cta-button" target="_blank">
          &#128666; Track My Order Status
        </a>
        <div style="font-size:11px;color:#64748b;margin-top:10px;">
          Or copy link: <a href="${trackingUrl}" style="color:#f59e0b;word-break:break-all;">${trackingUrl}</a>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin:0 0 6px 0;">
        Need help with your order? Reach our 24/7 support at <a href="mailto:support@shoping.com" style="color:#f59e0b;text-decoration:none;">support@shoping.com</a>
      </p>
      <p style="margin:0;">
        &copy; ${new Date().getFullYear()} Shopping.com Inc. All rights reserved. 256-Bit SSL Encrypted.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Shopping.com - Order Confirmation #${orderId}
Hello ${customerName},

Thank you for your order! Your order has been placed successfully.

Order ID: #${orderId}
Tracking Number: ${trackingNumber}
Estimated Delivery: ${estimatedDelivery}
Payment Method: ${order.paymentMethod || 'Online'} (${isPaid ? 'PAID' : 'COD'})
Total Amount: INR ${totalFormatted}

Shipping To:
${customerName}
${fullStreet}
${cityState}
Phone: ${phone}

Track your order status here:
${trackingUrl}

Thank you for shopping with us!
Shopping.com Support Team
  `.trim();

  const subject = `Order Confirmation #${orderId.slice(-8).toUpperCase()} - Shopping.com (₹${totalFormatted})`;

  return { subject, html, text };
};

