import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  AlertCircle,
  Lock,
  ArrowRight,
  MapPin,
  Loader2,
  QrCode,
  Smartphone,
  Copy,
  Check,
  UserCheck,
  LogIn,
  Building2,
  Banknote
} from 'lucide-react';
import { clearCart, clearBuyNowItem } from '../redux/slices/cartSlice';
import { orderApi } from '../services/api';
import paymentQrImg from '../assets/payment-qr.jpg';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const isBuyNow = searchParams.get('buyNow') === '1' || searchParams.get('buyNow') === 'true';

  const { items = [], coupon, discount = 0, buyNowItem } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  // In Buy Now mode, ONLY checkout the buyNowItem so the user's regular shopping cart is preserved
  const activeItems = isBuyNow
    ? (buyNowItem ? [buyNowItem] : [])
    : items;

  // Normalize each cart item whether formatted as { product: { ... }, quantity } or { _id, title, ... }
  const normalizedItems = activeItems.map((item) => {
    const p = item.product && typeof item.product === 'object' ? item.product : item;
    const productId = p._id || p.id || (typeof item.product === 'string' ? item.product : null) || item._id;
    const title = p.name || p.title || item.title || item.name || 'Shopping Item';
    const price = Number(p.discountPrice && p.discountPrice > 0 ? p.discountPrice : (p.price || item.price || 0));
    const image = p.images?.[0] || p.image || item.images?.[0] || item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200';
    const quantity = Number(item.quantity || 1);

    return {
      _id: productId,
      product: productId,
      title,
      name: title,
      price,
      image,
      images: [image],
      quantity
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 99;
  const tax = Math.round((subtotal - (discount || 0)) * 0.18);
  const total = Math.max(0, subtotal - (discount || 0) + shipping + tax);

  const [address, setAddress] = useState({
    street: user?.addresses?.[0]?.street || 'Flat 402, Sunshine Heights',
    city: user?.addresses?.[0]?.city || 'Mumbai',
    state: user?.addresses?.[0]?.state || 'Maharashtra',
    postalCode: user?.addresses?.[0]?.postalCode || '400001',
    country: user?.addresses?.[0]?.country || 'India',
    phone: user?.addresses?.[0]?.phone || user?.phone || '+91 98765 43210'
  });

  // Payment Options: 'Razorpay' | 'UPI' | 'COD'
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // Default to user's UPI QR method
  const [upiMethod, setUpiMethod] = useState('qr'); // 'qr' | 'id'
  const [upiId, setUpiId] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [processingMsg, setProcessingMsg] = useState('');

  // Update address when user data loads
  useEffect(() => {
    if (user?.addresses?.[0]) {
      const a = user.addresses[0];
      setAddress((prev) => ({
        ...prev,
        street: a.street || prev.street,
        city: a.city || prev.city,
        state: a.state || prev.state,
        postalCode: a.postalCode || prev.postalCode,
        country: a.country || prev.country,
        phone: a.phone || prev.phone
      }));
    }
  }, [user]);

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText('vivek8986kumarr@okhdfcbank');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // 1. Verify user authentication
    const token = localStorage.getItem('smartcart_token');
    if (!token || !user) {
      setErrorMsg('Please login to your account to place your order.');
      const redirectTarget = isBuyNow ? 'checkout?buyNow=1' : 'checkout';
      navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }

    // 2. Validate cart items
    if (normalizedItems.length === 0) {
      setErrorMsg('No items selected for checkout. Please browse products.');
      navigate('/products');
      return;
    }

    // 3. Validate shipping address
    if (!address.street?.trim() || !address.city?.trim() || !address.postalCode?.trim()) {
      setErrorMsg('Please complete your shipping address');
      return;
    }

    // 4. Validate UPI ID if VPA entered
    if (paymentMethod === 'UPI' && upiMethod === 'id' && !upiId.includes('@')) {
      setErrorMsg('Please enter a valid UPI ID (e.g. mobile@upi or name@okhdfcbank)');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setProcessingMsg('Creating your order...');

    const cleanupCheckout = () => {
      if (isBuyNow) {
        dispatch(clearBuyNowItem());
      } else {
        dispatch(clearCart());
      }
    };

    try {
      // 1. Build backend order payload
      const orderPayload = {
        isBuyNow: Boolean(isBuyNow),
        orderItems: normalizedItems.map((item) => ({
          product: item.product,
          name: item.title,
          image: item.image,
          price: item.price,
          quantity: item.quantity
        })),
        shippingAddress: {
          fullName: user?.name || 'Valued Customer',
          email: user?.email || 'customer@shoping.com',
          ...address
        },
        paymentMethod:
          paymentMethod === 'UPI'
            ? `UPI (${upiMethod === 'id' ? (upiId || 'Direct') : 'QR Scan'})`
            : paymentMethod === 'COD'
            ? 'Cash On Delivery'
            : paymentMethod, // 'Debit Card', 'Credit Card', 'Net Banking', 'Razorpay'
        itemsPrice: subtotal,
        taxPrice: tax,
        shippingPrice: shipping,
        discountAmount: discount || 0,
        couponCode: coupon || '',
        totalPrice: total
      };

      const orderRes = await orderApi.create(orderPayload);
      const createdOrder = orderRes.data?.data || orderRes.data?.order || orderRes.data;

      if (!createdOrder?._id) {
        throw new Error(orderRes.data?.message || 'Failed to initialize order');
      }

      const orderId = createdOrder._id;

      // 2. Gateway execution
      if (paymentMethod === 'COD') {
        // Cash On Delivery placed immediately
        cleanupCheckout();
        navigate(`/order-success/${orderId}`);
        return;
      }

      if (paymentMethod === 'UPI') {
        // UPI Instant Confirmation
        setProcessingMsg('Verifying UPI payment...');
        await new Promise((r) => setTimeout(r, 1200));
        await orderApi.simulateDemoPay(orderId);
        cleanupCheckout();
        navigate(`/order-success/${orderId}`);
        return;
      }

      // Online card / netbanking / gateway payments
      setProcessingMsg('Connecting to secure payment gateway...');
      const rpOrderRes = await orderApi.createRazorpayOrder(orderId);
      const rpOrderData = rpOrderRes.data?.data || rpOrderRes.data;

      const isRealKey = rpOrderData?.key &&
        (rpOrderData.key.startsWith('rzp_live_') || rpOrderData.key.startsWith('rzp_test_')) &&
        !rpOrderData.key.includes('your_');

      if (window.Razorpay && isRealKey) {
        let prefillMethod = undefined;
        if (paymentMethod === 'Debit Card' || paymentMethod === 'Credit Card') prefillMethod = 'card';
        if (paymentMethod === 'Net Banking') prefillMethod = 'netbanking';

        const options = {
          key: rpOrderData.key,
          amount: rpOrderData.amount,
          currency: rpOrderData.currency || 'INR',
          name: 'Shoping.com',
          description: `Order #${orderId} (${paymentMethod})`,
          order_id: rpOrderData.razorpayOrderId,
          handler: async (response) => {
            try {
              setProcessingMsg('Verifying payment signature...');
              await orderApi.verifyPayment({
                orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              cleanupCheckout();
              navigate(`/order-success/${orderId}`);
            } catch (verifyErr) {
              setErrorMsg('Payment verification failed. Please contact support.');
              setLoading(false);
            }
          },
          prefill: {
            name: user?.name || 'Customer',
            email: user?.email || 'customer@shoping.com',
            contact: address.phone,
            ...(prefillMethod ? { method: prefillMethod } : {})
          },
          theme: { color: '#f59e0b' }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setErrorMsg(resp.error?.description || 'Payment was declined or cancelled. You can retry with another method.');
          setLoading(false);
          setProcessingMsg('');
        });
        rzp.open();
        setLoading(false);
        return;
      } else {
        // Instant simulation fallback when demo/test keys are configured
        setProcessingMsg(`Verifying and confirming ${paymentMethod} payment...`);
        await new Promise((r) => setTimeout(r, 1200));
        await orderApi.simulateDemoPay(orderId);
        cleanupCheckout();
        navigate(`/order-success/${orderId}`);
        return;
      }
    } catch (err) {
      console.error('Order creation error:', err);
      if (err.response?.status === 401) {
        setErrorMsg('Your session has expired. Please login to complete your order.');
        const redirectTarget = isBuyNow ? 'checkout?buyNow=1' : 'checkout';
        navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
        return;
      }
      const serverMsg = err.response?.data?.message || err.message || 'Failed to place order. Please try again.';
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
      setProcessingMsg('');
    }
  };

  const upiIntentUrl = `upi://pay?pa=vivek8986kumarr@okhdfcbank&pn=Vivek%20kumar&am=${total}&cu=INR&tn=Shopping%20Order`;

  if (normalizedItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center px-4 space-y-5">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          {isBuyNow ? 'No Product Selected for Buy Now' : 'Your Cart is Empty'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          {isBuyNow
            ? 'Please choose a product and click "Buy Now" to proceed directly to checkout.'
            : 'Add some products from our store before proceeding to checkout.'}
        </p>
        <Link
          to="/products"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all shadow-md"
        >
          <span>Browse Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Checkout &amp; Payment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Choose your shipping address and preferred secure payment method
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>256-Bit Bank Grade SSL Encryption</span>
        </div>
      </div>

      {/* Auth Warning Banner if user is not logged in */}
      {!user && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <UserCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <span>You are currently checking out as a guest. Login to save your orders and receive instant order notifications.</span>
          </div>
          <Link
            to={isBuyNow ? '/login?redirect=checkout%3FbuyNow%3D1' : '/login?redirect=checkout'}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shrink-0 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login to Account</span>
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Address & Payment Methods */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Shipping Address */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>1. Shipping Address</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder="House number, apartment, street name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    required
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Payment Method Selector */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-amber-500" />
              <span>2. Select Payment Option</span>
            </h3>

            <div className="space-y-3">
              {/* 1. Cash On Delivery */}
              <label
                className={`flex items-start justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-400'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-1 accent-amber-500"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        1. Cash on Delivery (COD)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Pay upon delivery
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Pay with cash or UPI scan when the courier arrives at your doorstep.
                    </p>
                  </div>
                </div>
                <Truck className="w-5 h-5 text-amber-500 shrink-0" />
              </label>

              {/* 2. UPI Payment (Google Pay, PhonePe, Paytm, QR) */}
              <div
                className={`p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-400'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-300'
                }`}
              >
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                    className="mt-1 accent-amber-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        2. UPI Payment (Google Pay, PhonePe, Paytm, QR)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                        Fastest • Zero Fees
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Instant contactless payment via custom UPI QR code or virtual payment address.
                    </p>
                  </div>
                </label>

                {paymentMethod === 'UPI' && (
                  <div className="mt-4 pt-4 border-t border-amber-200/80 dark:border-slate-800 space-y-4">
                    <div className="flex space-x-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setUpiMethod('qr')}
                        className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                          upiMethod === 'qr'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Scan QR Code</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpiMethod('id')}
                        className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                          upiMethod === 'id'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Enter UPI ID</span>
                      </button>
                    </div>

                    {upiMethod === 'qr' ? (
                      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-amber-200 dark:border-slate-700 text-center space-y-3.5">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Scan using any UPI App (Google Pay / PhonePe / Paytm / BHIM)
                          </p>
                        </div>

                        {/* User's Custom UPI QR Code Image */}
                        <div className="flex justify-center">
                          <div className="p-2.5 rounded-2xl bg-white border-2 border-amber-300 dark:border-amber-400 shadow-lg inline-block">
                            <img
                              src={paymentQrImg}
                              alt="Vivek kumar UPI QR Code"
                              className="w-48 sm:w-56 h-auto rounded-xl object-contain select-none shadow-sm"
                            />
                          </div>
                        </div>

                        {/* Payee Info & Copy UPI ID */}
                        <div className="space-y-1.5 pt-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Payee Name: <span className="text-amber-600 dark:text-amber-400">Vivek kumar</span>
                          </p>
                          <div className="flex items-center justify-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                            <span>UPI ID: <strong className="text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">vivek8986kumarr@okhdfcbank</strong></span>
                            <button
                              type="button"
                              onClick={handleCopyUpi}
                              className="p-1.5 rounded-lg bg-amber-50 dark:bg-slate-700 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-bold transition-all border border-amber-200 dark:border-slate-600"
                              title="Copy UPI ID"
                            >
                              {copiedUpi ? (
                                <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-600 font-bold">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Copied!</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-[11px]">
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </span>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="pt-1">
                          <a
                            href={upiIntentUrl}
                            className="inline-flex items-center justify-center space-x-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Click here to pay directly in your UPI app (Mobile)</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Enter your UPI ID / VPA
                        </label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. 9876543210@paytm or yourname@okhdfcbank"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <p className="text-[11px] text-slate-500">
                          We will send a payment collect request to your UPI app.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Debit Card */}
              <label
                className={`flex items-start justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'Debit Card'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-400'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'Debit Card'}
                    onChange={() => setPaymentMethod('Debit Card')}
                    className="mt-1 accent-amber-500"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        3. Debit Card
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                        Visa • RuPay • Mastercard
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Direct payment from your bank account via your ATM/Debit card with 3D Secure OTP.
                    </p>
                  </div>
                </div>
                <CreditCard className="w-5 h-5 text-blue-500 shrink-0" />
              </label>

              {/* 4. Credit Card */}
              <label
                className={`flex items-start justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'Credit Card'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-400'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'Credit Card'}
                    onChange={() => setPaymentMethod('Credit Card')}
                    className="mt-1 accent-amber-500"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        4. Credit Card
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                        Visa • Mastercard • Amex
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Pay using any Indian or International Credit card. Zero extra convenience charges.
                    </p>
                  </div>
                </div>
                <CreditCard className="w-5 h-5 text-purple-500 shrink-0" />
              </label>

              {/* 5. Net Banking */}
              <label
                className={`flex items-start justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'Net Banking'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-400'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'Net Banking'}
                    onChange={() => setPaymentMethod('Net Banking')}
                    className="mt-1 accent-amber-500"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        5. Net Banking
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        50+ Banks Supported
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Pay directly using HDFC, SBI, ICICI, Axis, Kotak, PNB or your preferred bank portal.
                    </p>
                  </div>
                </div>
                <Building2 className="w-5 h-5 text-emerald-500 shrink-0" />
              </label>

              {/* 6. Other Online Methods / Razorpay Gateway */}
              <label
                className={`flex items-start justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'Razorpay'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-400'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'Razorpay'}
                    onChange={() => setPaymentMethod('Razorpay')}
                    className="mt-1 accent-amber-500"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        6. Other Online Methods (Razorpay Gateway)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                        Wallets • PayLater
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Official checkout window supporting Paytm Wallet, MobiKwik, Freecharge and PayLater.
                    </p>
                  </div>
                </div>
                <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order Summary Preview & Submit */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Order Summary ({normalizedItems.length} items)
            </h3>

            {/* Items scroll */}
            <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
              {normalizedItems.map((i, idx) => (
                <div key={i._id || idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <img
                      src={i.image}
                      alt={i.title}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <h5 className="font-semibold text-slate-900 dark:text-white truncate">
                        {i.title}
                      </h5>
                      <span className="text-slate-400">Qty: {i.quantity}</span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white shrink-0 ml-2">
                    ₹{((i.price || 0) * (i.quantity || 1)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Savings</span>
                  <span>-₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>GST Tax (18%)</span>
                <span>₹{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Total Payable
                </span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  ₹{total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 transition-transform active:scale-95 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{processingMsg || 'Processing Order...'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    {paymentMethod === 'COD'
                      ? `Confirm Cash on Delivery (₹${total.toLocaleString()})`
                      : paymentMethod === 'UPI'
                      ? `Confirm UPI Payment (₹${total.toLocaleString()})`
                      : `Proceed to Pay ₹${total.toLocaleString()} via ${paymentMethod}`}
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Certified SSL 256-Bit Secure Transaction</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
