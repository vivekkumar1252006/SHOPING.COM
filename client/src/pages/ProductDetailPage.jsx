import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Heart,
  ShoppingBag,
  ArrowRightLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Star,
  Check,
  ChevronRight,
  Share2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { addToCart, setBuyNowItem } from '../redux/slices/cartSlice';
import { toggleWishlist } from '../redux/slices/wishlistSlice';
import { addToCompare } from '../redux/slices/compareSlice';
import RatingStars from '../components/common/RatingStars';
import ProductCard from '../components/product/ProductCard';
import { productApi } from '../services/api';

const ProductDetailPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [selectedImg, setSelectedImg] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState(false);

    const wishlist = useSelector((state) => state.wishlist.items);
    const user = useSelector((state) => state.auth.user);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await productApi.getById(id);
                const prodData = res.data.data;
                setProduct(prodData);

                // Fetch related products
                const relatedRes = await productApi.getRelated(id);
                setRelatedProducts(relatedRes.data.data || []);
            } catch (err) {
                console.error('Failed to fetch product details', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    if (loading) {
        return (
            <div className="py-20 text-center">
                <div className="w-12 h-12 rounded-full border-4 border-purple-600 border-t-transparent animate-spin mx-auto mb-4" />
                <p className="text-sm text-slate-500">Loading product details...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="py-20 text-center">
                <h2 className="text-2xl font-bold">Product not found</h2>
                <Link to="/products" className="mt-4 inline-block text-purple-600 underline">
                    Browse Catalog
                </Link>
            </div>
        );
    }

  const isWishlisted = wishlist.some((item) => item._id === product._id);
  const inStock = (product.countInStock ?? product.stock ?? 0) > 0;
  const maxStock = Math.max(1, product.countInStock ?? product.stock ?? 1);
  const [buyingNow, setBuyingNow] = useState(false);
  const images = product.images?.length > 0 ? product.images : [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
  ];

  const handleAddToCart = () => {
    if (!inStock) return;
    dispatch(addToCart({ product, quantity }));
  };

  const handleBuyNow = (e) => {
    e?.preventDefault?.();
    if (!inStock || buyingNow) return;
    setBuyingNow(true);
    dispatch(setBuyNowItem({ product, quantity }));
    navigate('/checkout?buyNow=1');
  };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }
        setReviewSubmitting(true);
        try {
            await productApi.createReview(id, newReview);
            setReviewSuccess(true);
            // Refresh product
            const res = await productApi.getById(id);
            setProduct(res.data.data);
            setNewReview({ rating: 5, comment: '' });
        } catch (err) {
            console.error('Review submit failed', err);
            alert(err.response?.data?.message || 'Could not submit review');
        } finally {
            setReviewSubmitting(false);
        }
    };

    return (
        <div className="space-y-12">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <Link to="/" className="hover:text-purple-600">Home</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link to="/products" className="hover:text-purple-600">Products</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                    {product.title}
                </span>
            </nav>

            {/* Main Product Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Gallery */}
                <div className="lg:col-span-6 space-y-4">
                    <div className="aspect-square rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
                        <img
                            src={images[selectedImg]}
                            alt={product.title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {images.length > 1 && (
                        <div className="flex space-x-3 overflow-x-auto pb-2">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImg(idx)}
                                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${selectedImg === idx
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

        {/* Product Meta & Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {product.brand} • {typeof product.category === 'object' ? (product.category?.name || 'General') : (product.category || 'General')}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Product link copied to clipboard!');
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800"
                title="Share link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2 leading-tight">
                            {product.title}
                        </h1>

            <div className="mt-3 flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <RatingStars rating={product.rating || 4.5} />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {product.rating || 4.5}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                ({product.numReviews || 0} reviews)
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  inStock
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                }`}
              >
                {inStock ? `In Stock (${product.countInStock ?? product.stock ?? 10} units)` : 'Out of Stock'}
              </span>
            </div>
          </div>

                    {/* Pricing Box */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-baseline space-x-4">
                        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                            ₹{product.price?.toLocaleString()}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <>
                                <span className="text-base text-slate-400 line-through">
                                    ₹{product.originalPrice?.toLocaleString()}
                                </span>
                                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-600 text-white shadow-sm">
                                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                </span>
                            </>
                        )}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {product.description}
                    </p>

                    {/* Specifications Matrix */}
                    {product.specifications && Object.keys(product.specifications).length > 0 && (
                        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Technical Specifications
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {Object.entries(product.specifications).map(([key, value]) => (
                                    <div key={key} className="bg-white dark:bg-slate-800 p-2.5 rounded-xl">
                                        <span className="text-slate-400 capitalize">{key}: </span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

          {/* Action Row */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!inStock || quantity <= 1}
                  className="px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <span className="px-5 py-3 font-bold text-sm text-slate-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                  disabled={!inStock || quantity >= maxStock}
                  className="px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex-1 py-3.5 px-6 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!inStock || buyingNow}
                className={`py-3.5 px-6 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-2 ${
                  !inStock || buyingNow
                    ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 cursor-pointer'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>{buyingNow ? 'Processing...' : inStock ? 'Buy Now' : 'Out of Stock'}</span>
              </button>

                            <button
                                onClick={() => dispatch(toggleWishlist(product))}
                                className={`p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors ${isWishlisted
                                    ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-300'
                                    : 'text-slate-500 hover:text-rose-500'
                                    }`}
                                title="Save to Wishlist"
                            >
                                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                            </button>

                            <button
                                onClick={() => dispatch(addToCompare(product))}
                                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-purple-600 transition-colors"
                                title="Compare with other devices"
                            >
                                <ArrowRightLeft className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Guarantee Pills */}
                        <div className="grid grid-cols-3 gap-3 pt-3">
                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-2 text-xs">
                                <Truck className="w-4 h-4 text-purple-600 shrink-0" />
                                <span className="font-medium">Free express shipping</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-2 text-xs">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="font-medium">2-Year warranty</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-2 text-xs">
                                <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="font-medium">30-Day returns</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Reviews & Submit Review Section */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                            Customer Reviews ({product.reviews?.length || 0})
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                            <RatingStars rating={product.rating || 5} />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {product.rating} out of 5 stars
                            </span>
                        </div>
                    </div>
                </div>

                {/* Add review form */}
                <form onSubmit={handleReviewSubmit} className="space-y-4 max-w-xl">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Write a Verified Review
                    </h4>
                    <div className="flex items-center space-x-3">
                        <span className="text-xs text-slate-500">Your Rating:</span>
                        <select
                            value={newReview.rating}
                            onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                        >
                            <option value="5">⭐⭐⭐⭐⭐ 5 - Exceptional</option>
                            <option value="4">⭐⭐⭐⭐ 4 - Very Good</option>
                            <option value="3">⭐⭐⭐ 3 - Average</option>
                            <option value="2">⭐⭐ 2 - Poor</option>
                            <option value="1">⭐ 1 - Terrible</option>
                        </select>
                    </div>

                    <textarea
                        required
                        rows={3}
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        placeholder="Share details about performance, build quality, and battery life..."
                        className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />

                    <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                    >
                        {reviewSubmitting ? 'Submitting...' : 'Post Review'}
                    </button>
                </form>

                {/* Existing reviews */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {product.reviews?.length === 0 ? (
                        <p className="text-xs text-slate-400">Be the first to review this product!</p>
                    ) : (
                        product.reviews?.map((rev, idx) => (
                            <div
                                key={idx}
                                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                                            {rev.name}
                                        </span>
                                        <RatingStars rating={rev.rating} size="sm" />
                                    </div>
                                    <span className="text-[11px] text-slate-400">
                                        {new Date(rev.createdAt || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {rev.comment}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* AI Related Products */}
            {relatedProducts.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                            Frequently Bought Together & Related
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedProducts.map((prod) => (
                            <ProductCard key={prod._id} product={prod} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ProductDetailPage;

