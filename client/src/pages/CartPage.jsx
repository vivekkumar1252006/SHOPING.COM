import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    Trash2,
    ShoppingBag,
    ArrowRight,
    Sparkles,
    Tag,
    Truck,
    ShieldCheck,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import {
    removeFromCart,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    clearCart
} from '../redux/slices/cartSlice';
import { couponApi } from '../services/api';

const CartPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items, coupon, discount } = useSelector((state) => state.cart);

    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');
    const [validating, setValidating] = useState(false);

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const freeShippingThreshold = 999;
    const shipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 99;
    const tax = Math.round((subtotal - discount) * 0.18);
    const total = Math.max(0, subtotal - discount + shipping + tax);
    const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        if (!couponCode.trim()) return;

        setValidating(true);
        setCouponError('');
        setCouponSuccess('');
        try {
            const res = await couponApi.validate(couponCode.trim(), subtotal);
            const data = res.data.data;
            dispatch(applyCoupon({ code: data.code, discount: data.discountAmount }));
            setCouponSuccess(`Coupon applied! You saved ₹${data.discountAmount}`);
            setCouponCode('');
        } catch (err) {
            setCouponError(err.response?.data?.message || 'Invalid or expired coupon code');
        } finally {
            setValidating(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="py-20 text-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <ShoppingBag className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    Your Cart is Empty
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
                    Looks like you haven&apos;t added any smart gadgets yet. Check out our AI-recommended tech!
                </p>
                <Link
                    to="/products"
                    className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-600/30 hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer"
                >
                    <span>Start Shopping</span>
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Title */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        Shopping Cart ({items.reduce((acc, i) => acc + i.quantity, 0)})
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Review your selected tech before secure checkout
                    </p>
                </div>
                <button
                    onClick={() => dispatch(clearCart())}
                    className="text-xs font-semibold text-rose-500 hover:underline flex items-center space-x-1"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                </button>
            </div>

            {/* Free Shipping Goal Bar */}
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <div className="flex items-center space-x-1.5 text-purple-700 dark:text-purple-300">
                        <Truck className="w-4 h-4" />
                        {progressPercent >= 100 ? (
                            <span>🎉 You unlocked FREE Express Shipping!</span>
                        ) : (
                            <span>Add ₹{(freeShippingThreshold - subtotal).toLocaleString()} more for FREE Express Shipping</span>
                        )}
                    </div>
                    <span className="text-purple-600 font-extrabold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-purple-200 dark:bg-purple-900 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Cart Items & Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Items list */}
                <div className="lg:col-span-8 space-y-4">
                    {items.map((item) => (
                        <div
                            key={item._id}
                            className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
                        >
                            <div className="flex items-center space-x-4 w-full sm:w-auto">
                                <img
                                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                                    alt={item.title}
                                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                                />
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                                        {item.brand}
                                    </span>
                                    <Link
                                        to={`/products/${item._id}`}
                                        className="block font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-purple-600 line-clamp-1"
                                    >
                                        {item.title}
                                    </Link>
                                    <div className="text-xs text-slate-400 mt-1">
                                        Unit Price: ₹{item.price.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Quantity Controls & Line Price */}
                            <div className="flex items-center justify-between w-full sm:w-auto space-x-6">
                                <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                                    <button
                                        onClick={() =>
                                            dispatch(updateQuantity({ _id: item._id, quantity: Math.max(1, item.quantity - 1) }))
                                        }
                                        className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    >
                                        -
                                    </button>
                                    <span className="px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() =>
                                            dispatch(updateQuantity({ _id: item._id, quantity: item.quantity + 1 }))
                                        }
                                        className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    >
                                        +
                                    </button>
                                </div>

                                <div className="text-right">
                                    <div className="font-extrabold text-slate-900 dark:text-white text-base">
                                        ₹{(item.price * item.quantity).toLocaleString()}
                                    </div>
                                </div>

                                <button
                                    onClick={() => dispatch(removeFromCart(item._id))}
                                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                    title="Remove item"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right: Order Summary */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                            Order Breakdown
                        </h3>

                        {/* Promo Code Input */}
                        <div>
                            <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    placeholder="Coupon (e.g. SMART10)"
                                    className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                    type="submit"
                                    disabled={validating || !couponCode.trim()}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                >
                                    {validating ? 'Checking...' : 'Apply'}
                                </button>
                            </form>

                            {couponError && (
                                <p className="mt-2 text-[11px] text-red-500 flex items-center space-x-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>{couponError}</span>
                                </p>
                            )}

                            {coupon && (
                                <div className="mt-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
                                    <span className="font-bold flex items-center space-x-1">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        <span>Coupon {coupon} Applied</span>
                                    </span>
                                    <button
                                        onClick={() => dispatch(removeCoupon())}
                                        className="text-red-500 font-bold hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Calculations */}
                        <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Subtotal</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    ₹{subtotal.toLocaleString()}
                                </span>
                            </div>

                            {discount > 0 && (
                                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                    <span>Coupon Discount</span>
                                    <span className="font-bold">-₹{discount.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Estimated GST (18%)</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    ₹{tax.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Express Shipping</span>
                                <span className="font-bold">
                                    {shipping === 0 ? (
                                        <span className="text-emerald-600 font-bold">FREE</span>
                                    ) : (
                                        `₹${shipping}`
                                    )}
                                </span>
                            </div>

                            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    Grand Total
                                </span>
                                <span className="text-xl font-black text-purple-600 dark:text-purple-400">
                                    ₹{total.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Checkout Button */}
                        <button
                            onClick={() => navigate('/checkout')}
                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center space-x-2 transition-transform active:scale-95 cursor-pointer"
                        >
                            <span>Proceed to Checkout</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>

                        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Razorpay 256-Bit SSL Encrypted Checkout</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;

