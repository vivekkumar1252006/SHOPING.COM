import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Truck,
  Sparkles,
  MapPin,
  CreditCard,
  Mail,
  MessageSquare,
  Copy,
  Check,
  RotateCw,
  ShieldCheck,
  Calendar,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { orderApi } from '../services/api';

const OrderConfirmationPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [resending, setResending] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  useEffect(() => {
    // Fire celebratory confetti burst
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // safe fallback
    }

    const fetchOrder = async () => {
      try {
        const res = await orderApi.getById(id);
        const orderData = res.data?.data || res.data?.order || res.data;
        setOrder(orderData);
      } catch (err) {
        console.error('Failed to fetch order', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  const handleCopyOrderId = () => {
    if (!order?._id) return;
    navigator.clipboard?.writeText(order._id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleResendNotifications = async () => {
    if (!order?._id || resending) return;
    setResending(true);
    setNotificationMsg('');
    try {
      await orderApi.resendNotifications(order._id);
      setNotificationMsg('Fresh Email & WhatsApp notifications have been dispatched!');
      setTimeout(() => setNotificationMsg(''), 4000);
    } catch (err) {
      setNotificationMsg(err.response?.data?.message || 'Could not resend notifications at this moment.');
      setTimeout(() => setNotificationMsg(''), 4000);
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-14 h-14 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Retrieving your order confirmation...
        </p>
      </div>
    );
  }

  const customerEmail = order?.user?.email || order?.shippingAddress?.email || 'your registered email';
  const customerPhone = order?.shippingAddress?.phone || order?.user?.phone || 'registered mobile';
  const formattedDeliveryDate = order?.estimatedDeliveryDate
    ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Within 3 - 5 Business Days';

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 space-y-8">
      {/* Success Badge & Header */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xl ring-8 ring-emerald-50 dark:ring-emerald-950/30">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Congratulations! Your Order Has Been Placed Successfully.
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto font-medium">
          Thank you for shopping with <strong className="text-amber-600 dark:text-amber-400">Shopping.com</strong>.
          Your order is being processed and packaged with premium care.
        </p>
      </div>

      {/* Real-Time Notification Status Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-300/40 dark:border-amber-500/30 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-wide uppercase">
              Instant Order Notifications
            </h3>
          </div>
          <button
            type="button"
            onClick={handleResendNotifications}
            disabled={resending}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm disabled:opacity-60"
          >
            <RotateCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin text-amber-500' : ''}`} />
            <span>{resending ? 'Dispatching...' : 'Resend Updates'}</span>
          </button>
        </div>

        {notificationMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-semibold text-center">
            {notificationMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Email Notification Card */}
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-start space-x-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Email Confirmation</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Delivered
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Sent to: <span className="font-semibold text-slate-700 dark:text-slate-300">{customerEmail}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1 italic">
                (Tip: Check Primary or Spam folder for invoice receipt)
              </p>
            </div>
          </div>

          {/* WhatsApp Notification Card */}
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-start space-x-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">WhatsApp Update</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Delivered
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Sent to: <span className="font-semibold text-slate-700 dark:text-slate-300">{customerPhone}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Via Official Meta WhatsApp Cloud API
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Order Details Card */}
      {order && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          {/* Header row with Order ID & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Order ID:</span>
              <div className="flex items-center space-x-2 mt-0.5">
                <p className="font-mono font-black text-base text-amber-600 dark:text-amber-400">
                  #{order._id}
                </p>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors"
                  title="Copy Order ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                Status: {order.status || 'Processing'}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                order.isPaid
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-300'
              }`}>
                Payment: {order.isPaid ? 'PAID & CONFIRMED' : 'CASH ON DELIVERY'}
              </span>
            </div>
          </div>

          {/* Tracking info banner */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span>Tracking Number:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-black">
                    {order.trackingNumber || 'TRK-' + String(order._id).slice(-8).toUpperCase()}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-amber-500" />
                  <span>Estimated Delivery: <strong>{formattedDeliveryDate}</strong></span>
                </p>
              </div>
            </div>
            <Link
              to={`/track-order?trackingId=${order.trackingNumber || order._id}`}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center space-x-1"
            >
              <span>Track Live Delivery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Secret Delivery OTP Banner */}
          {order.deliveryOTP && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-amber-500/15 border-2 border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Secret Delivery Verification Code
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      Sent on WhatsApp
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      📱 To: ••••••{(order.shippingAddress?.phone || '').replace(/\D/g, '').slice(-4) || 'XXXX'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="font-mono font-black text-xl text-slate-900 dark:text-white tracking-widest bg-white/70 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700">
                      {order.deliveryOTP}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Share this OTP with the delivery agent when receiving your parcel.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Purchased Items List */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Purchased Items ({order.orderItems?.length || 0})
            </h4>
            <div className="space-y-2">
              {order.orderItems?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs hover:border-amber-200 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <h5 className="font-bold text-slate-900 dark:text-white truncate">{item.name}</h5>
                      <span className="text-slate-400 text-[11px]">
                        Qty: {item.quantity} &times; ₹{Number(item.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 dark:text-white pl-2">
                    ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping destination & Payment Summary */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1.5 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>Shipping Destination</span>
              </span>
              <p className="font-bold text-slate-900 dark:text-white">
                {order.shippingAddress?.fullName || 'Customer'}
              </p>
              <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
              </p>
              {order.shippingAddress?.phone && (
                <p className="text-slate-500 mt-1 flex items-center space-x-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{order.shippingAddress.phone}</span>
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1.5 flex items-center space-x-1">
                <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                <span>Payment Summary</span>
              </span>
              <div className="space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Method:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{order.paymentMethod}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount:</span>
                    <span>-₹{Number(order.discountAmount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white">
                  <span>Grand Total:</span>
                  <span className="text-base text-amber-600 dark:text-amber-400 font-black">
                    ₹{Number(order.totalPrice || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link
          to={`/track-order?trackingId=${order?.trackingNumber || id}`}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer transform hover:scale-[1.02]"
        >
          <Truck className="w-4 h-4" />
          <span>Track Order Status</span>
        </Link>
        <Link
          to="/products"
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-2 transition-all shadow-sm"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
