import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { removeFromWishlist, clearWishlist } from '../redux/slices/wishlistSlice';
import { addToCart } from '../redux/slices/cartSlice';

const WishlistPage = () => {
    const dispatch = useDispatch();
    const wishlist = useSelector((state) => state.wishlist.items);

    const handleMoveToCart = (item) => {
        dispatch(addToCart({ ...item, quantity: 1 }));
        dispatch(removeFromWishlist(item._id));
    };

    if (wishlist.length === 0) {
        return (
            <div className="py-20 text-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    Your Wishlist is Empty
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
                    Save your favorite smart tech gadgets and accessories to purchase later!
                </p>
                <Link
                    to="/products"
                    className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all"
                >
                    <span>Explore Products</span>
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        My Wishlist ({wishlist.length})
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Items you have saved for later
                    </p>
                </div>
                <button
                    onClick={() => dispatch(clearWishlist())}
                    className="text-xs font-semibold text-rose-500 hover:underline flex items-center space-x-1"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Wishlist</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlist.map((item) => (
                    <div
                        key={item._id}
                        className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
                    >
                        <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <Link to={`/products/${item._id}`}>
                                <img
                                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </Link>
                            <button
                                onClick={() => dispatch(removeFromWishlist(item._id))}
                                className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 dark:bg-slate-800/90 text-rose-500 hover:bg-rose-500 hover:text-white shadow-md transition-colors"
                                title="Remove from wishlist"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                                    {item.brand}
                                </span>
                                <Link
                                    to={`/products/${item._id}`}
                                    className="block font-bold text-sm text-slate-900 dark:text-white hover:text-purple-600 line-clamp-1 mt-1"
                                >
                                    {item.title}
                                </Link>
                                <div className="text-base font-extrabold text-slate-900 dark:text-white mt-2">
                                    ₹{item.price?.toLocaleString()}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => handleMoveToCart(item)}
                                    className="w-full py-2.5 px-4 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white text-xs shadow-md shadow-purple-600/20 flex items-center justify-center space-x-2 transition-transform active:scale-95 cursor-pointer"
                                >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span>Move to Cart</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WishlistPage;

