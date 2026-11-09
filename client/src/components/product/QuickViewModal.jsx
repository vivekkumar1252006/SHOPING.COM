import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { X, Heart, ShoppingBag, Zap, ShieldCheck, Truck, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { addToCart, setBuyNowItem } from '../../redux/slices/cartSlice';
import { toggleWishlist } from '../../redux/slices/wishlistSlice';
import { addToCompare } from '../../redux/slices/compareSlice';
import RatingStars from '../common/RatingStars';

const QuickViewModal = ({ product, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const wishlist = useSelector((state) => state.wishlist.items);

    if (!isOpen || !product) return null;

  const inStock = (product.countInStock ?? product.stock ?? 0) > 0;
  const maxStock = Math.max(1, product.countInStock ?? product.stock ?? 1);
    const isWishlisted = wishlist.some((item) => item._id === product._id);
    const images = product.images?.length > 0 ? product.images : [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
    ];

  const handleAddToCart = () => {
    if (!inStock) return;
    dispatch(addToCart({ product, quantity }));
    onClose();
  };

  const handleBuyNow = () => {
    if (!inStock) return;
    dispatch(setBuyNowItem({ product, quantity }));
    onClose();
    navigate('/checkout?buyNow=1');
  };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Images Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                            <img
                                src={images[selectedImage]}
                                alt={product.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {images.length > 1 && (
                            <div className="flex space-x-2 overflow-x-auto pb-1">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${selectedImage === idx
                                            ? 'border-purple-600 scale-95 shadow-md'
                                            : 'border-transparent opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-col justify-between">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
                                {product.brand} • {product.category?.name || 'Smart Tech'}
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                                {product.title}
                            </h2>

                            <div className="mt-3 flex items-center space-x-3">
                                <RatingStars rating={product.rating || 4.6} />
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {product.numReviews || 34} customer reviews
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                                    In Stock ({product.stock})
                                </span>
                            </div>

                            <div className="mt-4 flex items-baseline space-x-3">
                                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                                    ₹{product.price?.toLocaleString()}
                                </span>
                                {product.originalPrice && (
                                    <span className="text-sm text-slate-400 line-through">
                                        ₹{product.originalPrice?.toLocaleString()}
                                    </span>
                                )}
                                {product.originalPrice && product.originalPrice > product.price && (
                                    <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-md">
                                        Save ₹{(product.originalPrice - product.price).toLocaleString()}
                                    </span>
                                )}
                            </div>

                            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                                {product.description}
                            </p>

                            {/* Specs pill list */}
                            {product.specifications && Object.keys(product.specifications).length > 0 && (
                                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                    {Object.entries(product.specifications).slice(0, 4).map(([key, value]) => (
                                        <div key={key} className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                                            <span className="text-slate-400 capitalize">{key}: </span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!inStock || quantity <= 1}
                    className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-bold text-sm text-slate-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                    disabled={!inStock || quantity >= maxStock}
                    className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{inStock ? `Add to Cart` : 'Out of Stock'}</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  className="py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  <Zap className="w-4 h-4" />
                  <span>Buy Now</span>
                </button>

                <button
                  onClick={() => dispatch(toggleWishlist(product))}
                  className={`p-3 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors ${
                    isWishlisted ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-300' : 'text-slate-500 hover:text-rose-500'
                  }`}
                  title="Save to Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                </button>

                                <button
                                    onClick={() => { dispatch(addToCompare(product)); onClose(); }}
                                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-purple-600 transition-colors"
                                    title="Compare"
                                >
                                    <ArrowRightLeft className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
                                <span className="flex items-center space-x-1"><Truck className="w-3.5 h-3.5 text-purple-500" /><span>Free express delivery</span></span>
                                <span className="flex items-center space-x-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /><span>1-Year warranty</span></span>
                                <span className="flex items-center space-x-1"><RotateCcw className="w-3.5 h-3.5 text-blue-500" /><span>30-Day returns</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickViewModal;

