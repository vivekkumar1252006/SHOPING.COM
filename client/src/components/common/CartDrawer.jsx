import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles, Check, Tag } from 'lucide-react';
import {
  setCartOpen,
  updateQuantity,
  removeFromCart,
  applyCoupon,
  removeCoupon,
} from '../../redux/slices/cartSlice';
import api from '../../services/api';

const CartDrawer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, isCartOpen, itemsPrice, shippingPrice, taxPrice, discountAmount, totalPrice, coupon, syncError } =
    useSelector((state) => state.cart);

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  if (!isCartOpen) return null;

  const freeShippingThreshold = 999;
  const progressPercent = Math.min(100, Math.round((itemsPrice / freeShippingThreshold) * 100));
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - itemsPrice);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const response = await api.post('/coupons/validate', {
        code: couponCodeInput.trim(),
        orderAmount: itemsPrice,
      });

      dispatch(applyCoupon(response.data.coupon));
      setCouponSuccess(`Coupon ${response.data.coupon.code} applied! Saved ₹${response.data.coupon.calculatedDiscount}`);
      setCouponCodeInput('');
    } catch (err) {
      setCouponError(err.message);
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={() => dispatch(setCartOpen(false))}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-100 dark:border-slate-800">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Cart</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
            <button
              onClick={() => dispatch(setCartOpen(false))}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 bg-primary-50/50 dark:bg-primary-950/30 border-b border-primary-100/50 dark:border-primary-900/30">
            <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
              <span className="text-primary-800 dark:text-primary-300 flex items-center gap-1">
                <Sparkles size={14} className="text-primary-600" />
                {remainingForFreeShipping > 0
                  ? `Add ₹${remainingForFreeShipping.toLocaleString('en-IN')} more for free shipping!`
                  : '🎉 Congratulations! You have unlocked FREE shipping!'}
              </span>
              <span className="text-primary-600 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {syncError && (
              <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs" role="alert">
                {syncError}
              </p>
            )}
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                  <ShoppingBag size={36} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Your cart is empty
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">
                  Explore our AI curated products and add top trending items to your bag.
                </p>
                <button
                  onClick={() => {
                    dispatch(setCartOpen(false));
                    navigate('/products');
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-medium rounded-xl hover:shadow-glow transition-all"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => {
                const prod = item.product || {};
                const price = prod.discountPrice || prod.price || 0;
                return (
                  <div
                    key={prod._id || Math.random()}
                    className="flex gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <img
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80'}
                      alt={prod.name}
                      className="w-20 h-20 rounded-xl object-cover bg-white"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <Link
                            to={`/products/${prod._id}`}
                            onClick={() => dispatch(setCartOpen(false))}
                            className="text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 truncate"
                          >
                            {prod.name}
                          </Link>
                          <button
                            onClick={() => dispatch(removeFromCart(prod._id))}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {prod.brand} • {prod.category}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-900">
                          <button
                            onClick={() =>
                              dispatch(
                                updateQuantity({
                                  productId: prod._id,
                                  quantity: Math.max(1, item.quantity - 1),
                                })
                              )
                            }
                            disabled={item.quantity <= 1}
                            className="text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xs font-semibold px-1 text-slate-800 dark:text-slate-200 min-w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              dispatch(
                                updateQuantity({
                                  productId: prod._id,
                                  quantity: item.quantity + 1,
                                })
                              )
                            }
                            className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          ₹{(price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {items.length > 0 && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              {coupon ? (
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5">
                    <Tag size={14} className="text-emerald-600" />
                    <span>
                      Coupon <strong>{coupon.code || coupon}</strong> applied (-₹{discountAmount.toLocaleString('en-IN')})
                    </span>
                  </div>
                  <button
                    onClick={() => dispatch(removeCoupon())}
                    className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    placeholder="Try SMART10 or WELCOME20"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCodeInput}
                    className="px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {couponLoading ? 'Checking...' : 'Apply'}
                  </button>
                </form>
              )}

              {couponError && <p className="text-xs text-red-500">{couponError}</p>}
              {couponSuccess && <p className="text-xs text-emerald-600">{couponSuccess}</p>}

              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    ₹{itemsPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {shippingPrice === 0 ? 'FREE' : `₹${shippingPrice.toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated GST (18%)</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    ₹{taxPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total</span>
                  <span className="text-primary-600 dark:text-primary-400">
                    ₹{totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    dispatch(setCartOpen(false));
                    navigate('/cart');
                  }}
                  className="w-full py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  View Cart
                </button>
                <button
                  onClick={() => {
                    dispatch(setCartOpen(false));
                    navigate('/checkout');
                  }}
                  className="w-full py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-md hover:shadow-amber-500/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Checkout</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
