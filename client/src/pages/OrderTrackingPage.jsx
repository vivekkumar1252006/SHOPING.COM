import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  AlertCircle,
  Check,
  Send
} from 'lucide-react';
import { orderApi } from '../services/api';

const OrderTrackingPage = () => {
    const [searchParams] = useSearchParams();
    const initialTracking = searchParams.get('trackingId') || '';
    const [trackingId, setTrackingId] = useState(initialTracking);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

  // Resend OTP Cooldown & Loading
  const [resendingOtp, setResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendFeedback, setResendFeedback] = useState({ type: '', msg: '' });

  // Verification Input for Delivery Agent / Customer
  const [verifyOtpInput, setVerifyOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState({ type: '', msg: '' });

  // 10-Minute Expiry Countdown State
  const [otpTimeRemaining, setOtpTimeRemaining] = useState('');
  const [isOtpExpired, setIsOtpExpired] = useState(false);

  const fetchTracking = async (idToTrack) => {
    if (!idToTrack.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await orderApi.trackOrder(idToTrack.trim());
      const orderData = res.data.data;
      setOrder(orderData);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Order or Tracking Number not found');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
        if (initialTracking) {
            fetchTracking(initialTracking);
        }
    }, [initialTracking]);

  // Cooldown timer interval
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 10-Minute OTP Expiry Countdown Interval
  useEffect(() => {
    if (!order?.deliveryOTPExpiresAt || order.deliveryOTPVerified) {
      setOtpTimeRemaining('');
      setIsOtpExpired(false);
      return;
    }

    const updateTimer = () => {
      const diff = new Date(order.deliveryOTPExpiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setOtpTimeRemaining('Expired');
        setIsOtpExpired(true);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setOtpTimeRemaining(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
        setIsOtpExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order?.deliveryOTPExpiresAt, order?.deliveryOTPVerified]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchTracking(trackingId);
    };

  // Handle Resend OTP with cooldown
  const handleResendDeliveryOTP = async () => {
    if (!order?._id || resendCooldown > 0 || resendingOtp) return;
    setResendingOtp(true);
    setResendFeedback({ type: '', msg: '' });

    try {
      const res = await orderApi.resendDeliveryOTP(order._id);
      setResendFeedback({
        type: 'success',
        msg: res.data.message || 'New OTP sent to your WhatsApp number!',
      });
      setResendCooldown(res.data.cooldownSeconds || 60);

      // Refresh order data
      await fetchTracking(order._id);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to resend Delivery OTP';
      setResendFeedback({ type: 'error', msg: errMsg });
      if (err.response?.data?.cooldownSeconds) {
        setResendCooldown(err.response.data.cooldownSeconds);
      }
    } finally {
      setResendingOtp(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyDeliveryOTP = async (e) => {
    e.preventDefault();
    if (!order?._id || !verifyOtpInput.trim() || verifyingOtp) return;

    setVerifyingOtp(true);
    setVerifyFeedback({ type: '', msg: '' });

    try {
      const res = await orderApi.verifyDeliveryOTP(order._id, verifyOtpInput.trim());
      setVerifyFeedback({
        type: 'success',
        msg: res.data.message || 'OTP verified! Order successfully marked as Delivered.',
      });
      setVerifyOtpInput('');
      // Refresh order data to update stepper to Delivered
      await fetchTracking(order._id);
    } catch (err) {
      setVerifyFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Invalid or expired OTP. Please try again.',
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

    const steps = [
        { title: 'Order Placed', statusKey: 'Pending', icon: Package },
        { title: 'Processing & QC', statusKey: 'Processing', icon: Clock },
        { title: 'Shipped', statusKey: 'Shipped', icon: Truck },
        { title: 'Out For Delivery', statusKey: 'Out for Delivery', icon: MapPin },
        { title: 'Delivered', statusKey: 'Delivered', icon: CheckCircle2 }
    ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'Pending': return 0;
      case 'Confirmed': return 0;
      case 'Processing': return 1;
      case 'Shipped': return 2;
      case 'Out for Delivery': return 3;
      case 'Delivered': return 4;
      default: return 1;
    }
  };

    const currentStep = order ? getStepIndex(order.orderStatus) : 1;

  // Masked destination phone for display
  const rawPhone = order?.shippingAddress?.phone || order?.deliveryNotifications?.recipientPhone || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const lastFourDigits = cleanPhone.slice(-4) || 'XXXX';
  const displayMaskedPhone = order?.maskedPhone || (cleanPhone.length >= 4 ? `••••••${lastFourDigits}` : '••••');

  // WhatsApp status logic
  const waDeliveryStatus = order?.deliveryNotifications?.status || 'Not Sent';

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-8">
            {/* Title */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    Real-Time Order Tracking
                </h1>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Enter your Order ID or Courier Tracking Number to follow your parcel live
                </p>
            </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto flex space-x-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            required
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="e.g. TRK-ABC12345 or Order MongoDB ID"
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          {loading ? 'Locating...' : 'Track'}
        </button>
      </form>

            {errorMsg && (
                <div className="max-w-xl mx-auto p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs text-center">
                    {errorMsg}
                </div>
            )}

      {/* Tracking Card */}
      {order && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-amber-500 dark:text-amber-400">
                Carrier: BlueDart Air Express
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                Tracking: {order.trackingNumber || 'TRK-PARCEL-EXPRESS'}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Current Status</span>
              <span className="inline-block mt-1 px-3.5 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">
                {order.orderStatus}
              </span>
            </div>
          </div>

                    {/* Stepper Timeline */}
                    <div className="relative">
                        <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
                        <div
                            className="hidden sm:block absolute top-1/2 left-0 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 -translate-y-1/2 z-0 transition-all duration-500"
                            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 relative z-10">
                            {steps.map((st, idx) => {
                                const Icon = st.icon;
                                const isPassed = idx <= currentStep;
                                const isCurrent = idx === currentStep;

                                return (
                                    <div key={idx} className="flex flex-col items-center text-center space-y-2">
                                        <div
                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isPassed
                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                                } ${isCurrent ? 'ring-4 ring-purple-300 dark:ring-purple-900 scale-105' : ''}`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4
                                                className={`text-xs font-bold ${isPassed ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                                                    }`}
                                            >
                                                {st.title}
                                            </h4>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {isPassed ? 'Completed' : 'Pending'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Details footer */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                            <span className="text-slate-400 block mb-0.5">Destination</span>
                            <p className="font-bold text-slate-900 dark:text-white">
                                {order.shippingAddress?.city}, {order.shippingAddress?.state}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-400 block mb-0.5">Estimated Arrival</span>
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                Within 48 Hours
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-400 block mb-0.5">Order Total</span>
                            <p className="font-bold text-slate-900 dark:text-white">
                                ₹{order.totalPrice?.toLocaleString()} ({order.paymentMethod})
                            </p>
                        </div>
                    </div>

          {/* Delivery Verification Code & WhatsApp Status Banner */}
          {order.deliveryOTP && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/5 border-2 border-emerald-500/30 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Delivery Verification Code
                      </span>

                      {/* WhatsApp Status dynamically updated */}
                      {waDeliveryStatus === 'Sent' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp OTP Sent</span>
                        </span>
                      ) : waDeliveryStatus === 'Sending' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-spin text-amber-600" />
                          <span>Sending OTP...</span>
                        </span>
                      ) : waDeliveryStatus === 'Failed' ? (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 inline-flex items-center gap-1"
                          title={order.deliveryNotifications?.error || 'WhatsApp delivery failed'}
                        >
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>WhatsApp Delivery Failed</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Pending Dispatch
                        </span>
                      )}

                      {/* Destination phone digits */}
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        📱 To WhatsApp: <strong>{displayMaskedPhone}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="font-mono font-black text-2xl text-slate-900 dark:text-white tracking-widest bg-white dark:bg-slate-800 px-3.5 py-1 rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-xs">
                        {order.deliveryOTP}
                      </span>

                      {/* Expiry Badge */}
                      {order.deliveryOTPVerified ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500 text-slate-950">
                          ✅ Verified &amp; Delivered
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                          isOtpExpired
                            ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                          ⏳ {isOtpExpired ? 'OTP Expired' : `Valid for: ${otpTimeRemaining}`}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Please share this OTP with the delivery agent only when you receive your parcel.
                    </p>
                  </div>
                </div>

                {/* Resend OTP Button with Live Cooldown Timer */}
                {!order.deliveryOTPVerified && (
                  <div className="flex flex-col sm:items-end justify-center">
                    <button
                      type="button"
                      onClick={handleResendDeliveryOTP}
                      disabled={resendingOtp || resendCooldown > 0}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm transition-all disabled:opacity-50 cursor-pointer inline-flex items-center space-x-1.5"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${resendingOtp ? 'animate-spin' : ''}`} />
                      <span>
                        {resendingOtp
                          ? 'Requesting...'
                          : resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : 'Resend OTP'}
                      </span>
                    </button>
                    {resendFeedback.msg && (
                      <p className={`text-[10px] font-semibold mt-1 ${
                        resendFeedback.type === 'error' ? 'text-rose-500' : 'text-emerald-600'
                      }`}>
                        {resendFeedback.msg}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Delivery Agent / Customer OTP Verification Flow */}
              {!order.deliveryOTPVerified && order.orderStatus === 'Out for Delivery' && (
                <div className="pt-3 border-t border-emerald-500/20">
                  <form onSubmit={handleVerifyDeliveryOTP} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      Verify Delivery Agent OTP:
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={verifyOtpInput}
                      onChange={(e) => setVerifyOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold tracking-widest text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[180px]"
                    />
                    <button
                      type="submit"
                      disabled={verifyingOtp || verifyOtpInput.length !== 6}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer inline-flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${verifyingOtp ? 'animate-spin' : ''}`} />
                      <span>{verifyingOtp ? 'Verifying...' : 'Verify & Mark Delivered'}</span>
                    </button>
                    {verifyFeedback.msg && (
                      <span className={`text-[11px] font-bold ${
                        verifyFeedback.type === 'error' ? 'text-rose-500' : 'text-emerald-600'
                      }`}>
                        {verifyFeedback.msg}
                      </span>
                    )}
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Details footer */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Destination</span>
              <p className="font-bold text-slate-900 dark:text-white">
                {order.shippingAddress?.city}, {order.shippingAddress?.state}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Estimated Arrival</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                Within 48 Hours
              </p>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Order Total</span>
              <p className="font-bold text-slate-900 dark:text-white">
                ₹{order.totalPrice?.toLocaleString()} ({order.paymentMethod})
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;

