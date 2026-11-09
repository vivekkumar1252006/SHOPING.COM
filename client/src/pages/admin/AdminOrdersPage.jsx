import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  MessageSquare,
  RotateCw,
  CreditCard,
  Banknote,
  Send,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Phone,
  Sparkles,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { adminApi, orderApi, authApi } from '../../services/api';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'prepaid' | 'cod' | 'whatsapp-issue'
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [retryingWaId, setRetryingWaId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState({ id: null, msg: '', type: 'success' });
  const [waTestPhone, setWaTestPhone] = useState('');
  const [waTesting, setWaTesting] = useState(false);
  const [waTestResult, setWaTestResult] = useState(null);
  const [waApiHealth, setWaApiHealth] = useState(null);

  // Verification Dialog State
  const [verifyModalOrder, setVerifyModalOrder] = useState(null);
  const [modalOtpInput, setModalOtpInput] = useState('');
  const [verifyingModalOtp, setVerifyingModalOtp] = useState(false);
  const [modalFeedback, setModalFeedback] = useState('');

  const checkHealth = () => {
    authApi.checkWhatsAppStatus()
      .then((res) => setWaApiHealth(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleTestWhatsApp = async (e) => {
    e.preventDefault();
    if (!waTestPhone.trim()) return;
    setWaTesting(true);
    setWaTestResult(null);
    try {
      const res = await authApi.testWhatsAppOTP(waTestPhone.trim());
      setWaTestResult({ success: true, message: res.data.message });
      checkHealth();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      const details = err.response?.data?.details || '';
      setWaTestResult({ success: false, message: msg, details });
      checkHealth();
    } finally {
      setWaTesting(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAllOrders();
      setOrders(res.data.data || []);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    const targetOrder = orders.find((o) => o._id === orderId);

    // If changing to Delivered and not verified, open verification modal
    if (newStatus === 'Delivered' && targetOrder && !targetOrder.deliveryOTPVerified) {
      setVerifyModalOrder(targetOrder);
      setModalOtpInput('');
      setModalFeedback('');
      return;
    }

    setUpdatingId(orderId);
    try {
      const res = await orderApi.updateStatus(orderId, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? (res.data.order || { ...o, status: newStatus }) : o))
      );
      showFeedback(
        orderId,
        res.data?.message || `Status updated to "${newStatus}"`,
        'success'
      );
      if (newStatus === 'Out for Delivery') {
        // Refresh orders shortly after to reflect dispatched WhatsApp status
        setTimeout(fetchOrders, 2000);
      }
    } catch (err) {
      showFeedback(orderId, err.response?.data?.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Retry Order Confirmation WhatsApp
  const handleRetryWhatsApp = async (orderId) => {
    setRetryingWaId(`confirm-${orderId}`);
    try {
      const res = await adminApi.retryWhatsApp(orderId);
      const updatedOrder = res.data?.order;
      if (updatedOrder) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, notifications: updatedOrder.notifications } : o))
        );
      }
      showFeedback(
        orderId,
        res.data?.message || 'WhatsApp confirmation message triggered!',
        res.data?.success ? 'success' : 'error'
      );
    } catch (err) {
      showFeedback(orderId, err.response?.data?.message || 'Failed to dispatch WhatsApp', 'error');
    } finally {
      setRetryingWaId(null);
    }
  };

  // Resend Delivery Verification OTP
  const handleResendDeliveryOTP = async (orderId) => {
    setRetryingWaId(`delivery-${orderId}`);
    try {
      const res = await adminApi.resendDeliveryOTP(orderId);
      const updatedOrder = res.data?.order;
      if (updatedOrder) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? updatedOrder : o))
        );
      } else {
        await fetchOrders();
      }
      showFeedback(
        orderId,
        res.data?.message || 'Delivery Verification OTP dispatched via WhatsApp!',
        res.data?.result?.success ? 'success' : 'error'
      );
    } catch (err) {
      showFeedback(orderId, err.response?.data?.message || 'Failed to resend Delivery OTP', 'error');
    } finally {
      setRetryingWaId(null);
    }
  };

  // Submit Modal Verification
  const handleModalVerifyOTP = async (e) => {
    e.preventDefault();
    if (!verifyModalOrder || !modalOtpInput.trim() || verifyingModalOtp) return;

    setVerifyingModalOtp(true);
    setModalFeedback('');

    try {
      const res = await adminApi.verifyDeliveryOTP(verifyModalOrder._id, modalOtpInput.trim());
      showFeedback(
        verifyModalOrder._id,
        res.data.message || 'OTP verified! Order marked as Delivered.',
        'success'
      );
      setVerifyModalOrder(null);
      await fetchOrders();
    } catch (err) {
      setModalFeedback(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setVerifyingModalOtp(false);
    }
  };

  // Admin Bypass OTP
  const handleBypassOTP = async () => {
    if (!verifyModalOrder || verifyingModalOtp) return;
    setVerifyingModalOtp(true);
    try {
      await orderApi.updateStatus(verifyModalOrder._id, {
        status: 'Delivered',
        forceBypassOTP: true,
        comment: 'Delivered via Admin manual verification override',
      });
      showFeedback(verifyModalOrder._id, 'Order marked as Delivered (OTP bypassed)', 'success');
      setVerifyModalOrder(null);
      await fetchOrders();
    } catch (err) {
      setModalFeedback(err.response?.data?.message || 'Failed to update order');
    } finally {
      setVerifyingModalOtp(false);
    }
  };

  const showFeedback = (id, msg, type = 'success') => {
    setActionFeedback({ id, msg, type });
    setTimeout(() => setActionFeedback({ id: null, msg: '', type: 'success' }), 5000);
  };

  // Filter pipeline
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    let matchesPayment = true;
    if (paymentFilter === 'cod') {
      matchesPayment = o.paymentMethod === 'Cash On Delivery';
    } else if (paymentFilter === 'prepaid') {
      matchesPayment = o.paymentMethod !== 'Cash On Delivery';
    } else if (paymentFilter === 'whatsapp-issue') {
      matchesPayment =
        o.notifications?.whatsappStatus === 'Failed' ||
        o.notifications?.whatsappStatus === 'Not Sent' ||
        o.deliveryNotifications?.status === 'Failed';
    }

    const q = search.toLowerCase();
    const customerPhone = o.shippingAddress?.phone || o.user?.phone || '';
    const rzpId = o.paymentResult?.razorpay_payment_id || o.paymentResult?.razorpay_order_id || '';
    const matchesSearch =
      o._id.toLowerCase().includes(q) ||
      (o.user?.name && o.user.name.toLowerCase().includes(q)) ||
      (o.shippingAddress?.fullName && o.shippingAddress.fullName.toLowerCase().includes(q)) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
      customerPhone.toLowerCase().includes(q) ||
      rzpId.toLowerCase().includes(q);

    return matchesStatus && matchesPayment && matchesSearch;
  });

  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'Cancelled' ? sum + (o.totalPrice || 0) : sum), 0);
  const codCount = orders.filter((o) => o.paymentMethod === 'Cash On Delivery').length;
  const prepaidCount = orders.filter((o) => o.paymentMethod !== 'Cash On Delivery').length;
  const waSentCount = orders.filter((o) => o.notifications?.whatsappStatus === 'Sent' || o.deliveryNotifications?.status === 'Sent').length;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Orders &amp; WhatsApp Delivery Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30">
              {orders.length} Total
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review online &amp; COD orders, monitor official Meta WhatsApp Delivery OTPs, and verify doorstep delivery codes
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchOrders}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors inline-flex items-center space-x-1"
            title="Refresh Orders"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Settled Revenue</span>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
            ₹{totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Prepaid / Online</span>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center space-x-1.5">
            <CreditCard className="w-4 h-4" />
            <span>{prepaidCount} Orders</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cash on Delivery</span>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1 flex items-center space-x-1.5">
            <Banknote className="w-4 h-4" />
            <span>{codCount} Orders</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Delivered</span>
          <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1 flex items-center space-x-1.5">
            <MessageSquare className="w-4 h-4" />
            <span>{waSentCount} Dispatched</span>
          </div>
        </div>
      </div>

      {/* WhatsApp Cloud API Live Tester Tool & Accurate Health Check */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-blue-500/10 border-2 border-emerald-500/30 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Meta WhatsApp Cloud API Live Delivery OTP System
                </h3>
                {waApiHealth?.success ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Connected ({waApiHealth.phoneDetails?.display_phone_number || '+1 555-627-3568'})</span>
                  </span>
                ) : waApiHealth?.configured ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>Meta Token Expired (OAuthException 190)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Meta Token Missing in .env
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Dispatches real 10-minute Delivery Verification OTPs with Indian country code (+91) to customer WhatsApp upon "Out for Delivery".
              </p>
            </div>
          </div>
        </div>

        {/* Informative Token Refresh Notice if token is expired */}
        {waApiHealth && !waApiHealth.success && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-bold flex items-center space-x-1.5">
              <span>⚠️ Meta WhatsApp Token Status:</span>
              <span className="font-mono text-[11px] text-rose-600 dark:text-rose-400">
                {waApiHealth.message || 'Session expired'}
              </span>
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              To send live WhatsApp messages to your phone, generate a fresh access token at{' '}
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noreferrer"
                className="underline font-bold text-amber-800 dark:text-amber-300"
              >
                developers.facebook.com
              </a>{' '}
              (Select App ➔ WhatsApp ➔ API Setup ➔ Copy Temporary or System Access Token), then update <code className="bg-white/80 dark:bg-slate-800 px-1 rounded">WHATSAPP_ACCESS_TOKEN</code> in <code className="bg-white/80 dark:bg-slate-800 px-1 rounded">server/.env</code>.
            </p>
          </div>
        )}

        <form onSubmit={handleTestWhatsApp} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Phone className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={waTestPhone}
              onChange={(e) => setWaTestPhone(e.target.value)}
              placeholder="Enter your WhatsApp number (e.g. +91 98765 43210)"
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={waTesting}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 inline-flex items-center justify-center space-x-1.5 cursor-pointer transition-transform active:scale-95"
          >
            <Send className={`w-3.5 h-3.5 ${waTesting ? 'animate-spin' : ''}`} />
            <span>{waTesting ? 'Dispatching...' : 'Send Live WhatsApp OTP'}</span>
          </button>
        </form>

        {waTestResult && (
          <div
            className={`p-3 rounded-2xl text-xs font-semibold space-y-1 border ${
              waTestResult.success
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                : 'bg-rose-950/80 border-rose-700 text-rose-200'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              {waTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
              <span>{waTestResult.message}</span>
            </div>
            {waTestResult.details && (
              <p className="text-[11px] text-slate-300 font-normal pl-5">
                {waTestResult.details}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setPaymentFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              paymentFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setPaymentFilter('prepaid')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              paymentFilter === 'prepaid'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Prepaid ({prepaidCount})
          </button>
          <button
            type="button"
            onClick={() => setPaymentFilter('cod')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              paymentFilter === 'cod'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            COD Orders ({codCount})
          </button>
          <button
            type="button"
            onClick={() => setPaymentFilter('whatsapp-issue')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              paymentFilter === 'whatsapp-issue'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            WhatsApp Needs Attention
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, customer, phone, Razorpay ID..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-400 uppercase font-extrabold text-[11px]">
                <th className="p-4">Order ID &amp; Date</th>
                <th className="p-4">Customer &amp; Mobile</th>
                <th className="p-4">Items</th>
                <th className="p-4">Payment &amp; Transaction</th>
                <th className="p-4">Fulfillment Status</th>
                <th className="p-4">WhatsApp Status &amp; Delivery OTP</th>
                <th className="p-4 text-right">Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-400">
                    <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto mb-2" />
                    <span>Loading orders from database...</span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const customerPhone = ord.shippingAddress?.phone || ord.user?.phone || 'No Phone';
                  const rzpPaymentId = ord.paymentResult?.razorpay_payment_id || ord.paymentResult?.id;
                  const waConfirmStatus = ord.notifications?.whatsappStatus || (ord.notifications?.whatsappSent ? 'Sent' : 'Not Sent');
                  const waDeliveryStatus = ord.deliveryNotifications?.status || 'Not Sent';
                  const isRetryingConfirm = retryingWaId === `confirm-${ord._id}`;
                  const isRetryingDelivery = retryingWaId === `delivery-${ord._id}`;

                  return (
                    <tr key={ord._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* 1. Order ID & Date */}
                      <td className="p-4">
                        <span className="font-mono font-black text-amber-500 dark:text-amber-400">
                          #{ord._id.slice(-8).toUpperCase()}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        {actionFeedback.id === ord._id && (
                          <div className={`text-[10px] font-bold mt-1 ${actionFeedback.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {actionFeedback.msg}
                          </div>
                        )}
                      </td>

                      {/* 2. Customer & Phone */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {ord.shippingAddress?.fullName || ord.user?.name || 'Customer'}
                        </div>
                        <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                          {customerPhone}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {ord.shippingAddress?.city}, {ord.shippingAddress?.state}
                        </p>
                      </td>

                      {/* 3. Items */}
                      <td className="p-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {ord.orderItems?.length || 0} product(s)
                        </span>
                        <p className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5">
                          {ord.orderItems?.[0]?.name}
                        </p>
                      </td>

                      {/* 4. Payment Details */}
                      <td className="p-4">
                        <div className="font-black text-slate-900 dark:text-white text-sm">
                          ₹{Number(ord.totalPrice || 0).toLocaleString()}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.paymentMethod === 'Cash On Delivery'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}>
                            {ord.paymentMethod}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.isPaid || ord.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300'
                          }`}>
                            {ord.isPaid || ord.paymentStatus === 'Paid' ? 'PAID' : 'PENDING'}
                          </span>
                        </div>
                        {rzpPaymentId && (
                          <p className="text-[10px] font-mono text-slate-400 mt-1 truncate max-w-[160px]" title={rzpPaymentId}>
                            Txn: {rzpPaymentId}
                          </p>
                        )}
                      </td>

                      {/* 5. Fulfillment Status Dropdown */}
                      <td className="p-4">
                        <select
                          disabled={updatingId === ord._id}
                          value={ord.status || 'Pending'}
                          onChange={(e) => handleStatusChange(ord._id, e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-amber-600 dark:text-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* 6. WhatsApp Notification & Delivery Verification OTP Details */}
                      <td className="p-4">
                        <div className="space-y-2 min-w-[180px]">
                          {/* Part A: Order Confirmation */}
                          <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                            <span className="text-[10px] text-slate-400">Order Alert:</span>
                            {waConfirmStatus === 'Sent' ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Sent</span>
                              </span>
                            ) : waConfirmStatus === 'Failed' ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.2 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300" title={ord.notifications?.whatsappError}>
                                <X className="w-2.5 h-2.5 text-rose-600" />
                                <span>Failed</span>
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-500">Not Sent</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRetryWhatsApp(ord._id)}
                              disabled={isRetryingConfirm}
                              className="text-[9px] font-bold text-amber-600 hover:underline"
                              title="Resend Order Confirmation"
                            >
                              {isRetryingConfirm ? '...' : 'Retry'}
                            </button>
                          </div>

                          {/* Part B: Delivery Verification OTP */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span>OTP:</span>
                              </span>
                              <span className="font-mono font-black text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                                {ord.deliveryOTP || '------'}
                              </span>
                            </div>

                            {/* Verification Badge */}
                            <div className="flex items-center justify-between gap-1">
                              {ord.deliveryOTPVerified ? (
                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500 text-slate-950">
                                  ✅ Verified
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                  ⏳ Unverified
                                </span>
                              )}

                              {/* WhatsApp Status */}
                              {waDeliveryStatus === 'Sent' ? (
                                <span className="text-[9px] font-bold text-emerald-600">
                                  WA: Sent
                                </span>
                              ) : waDeliveryStatus === 'Sending' ? (
                                <span className="text-[9px] font-bold text-amber-600 animate-pulse">
                                  WA: Sending...
                                </span>
                              ) : waDeliveryStatus === 'Failed' ? (
                                <span className="text-[9px] font-bold text-rose-600" title={ord.deliveryNotifications?.error}>
                                  WA: Failed
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400">WA: Pending</span>
                              )}
                            </div>

                            {/* Resend & Verify Action Buttons */}
                            {!ord.deliveryOTPVerified && (
                              <div className="flex items-center gap-1 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleResendDeliveryOTP(ord._id)}
                                  disabled={isRetryingDelivery}
                                  className="flex-1 py-1 px-1.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[9px] font-bold border border-emerald-200 dark:border-emerald-800 transition-colors disabled:opacity-50 cursor-pointer text-center"
                                  title="Send 10-Minute Delivery OTP via WhatsApp"
                                >
                                  {isRetryingDelivery ? 'Sending...' : 'Resend OTP'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVerifyModalOrder(ord);
                                    setModalOtpInput('');
                                    setModalFeedback('');
                                  }}
                                  className="flex-1 py-1 px-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[9px] font-black shadow-xs transition-colors cursor-pointer text-center"
                                  title="Verify Customer Delivery OTP"
                                >
                                  Verify OTP
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 7. Tracking Code */}
                      <td className="p-4 text-right">
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {ord.trackingNumber || 'TRK-PARCEL-EXPRESS'}
                        </span>
                        <div className="mt-1">
                          <a
                            href={`/track-order?trackingId=${ord.trackingNumber || ord._id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            <span>Track</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Delivery OTP Verification Modal */}
      {verifyModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    Delivery OTP Verification
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Order #{verifyModalOrder._id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerifyModalOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p>
                Customer: <strong>{verifyModalOrder.shippingAddress?.fullName || verifyModalOrder.user?.name}</strong>
              </p>
              <p>
                Destination WhatsApp: <strong>{verifyModalOrder.shippingAddress?.phone}</strong>
              </p>
              <p>
                Generated OTP: <strong className="font-mono text-emerald-600 dark:text-emerald-400 text-sm tracking-wider">{verifyModalOrder.deliveryOTP}</strong>
              </p>
            </div>

            <form onSubmit={handleModalVerifyOTP} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Enter Customer's 6-Digit Verification Code:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={modalOtpInput}
                  onChange={(e) => setModalOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 123456"
                  className="w-full text-center text-xl font-mono font-black tracking-widest py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {modalFeedback && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs text-center font-bold">
                  {modalFeedback}
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={verifyingModalOtp || modalOtpInput.length !== 6}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  {verifyingModalOtp ? 'Verifying...' : 'Verify OTP & Complete Delivery'}
                </button>
                <button
                  type="button"
                  onClick={handleBypassOTP}
                  disabled={verifyingModalOtp}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                  title="Admin Emergency Override"
                >
                  Bypass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
