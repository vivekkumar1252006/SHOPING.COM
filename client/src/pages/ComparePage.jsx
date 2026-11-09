import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowRightLeft, X, ShoppingBag, Check, Trash2, ArrowRight } from 'lucide-react';
import { removeFromCompare, clearCompare } from '../redux/slices/compareSlice';
import { addToCart } from '../redux/slices/cartSlice';
import RatingStars from '../components/common/RatingStars';

const ComparePage = () => {
  const dispatch = useDispatch();
  const compareItems = useSelector((state) => state.compare.items);

  if (compareItems.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto mb-6">
          <ArrowRightLeft className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          No Products to Compare
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
          Click the compare button on any product card or detail page to analyze features side-by-side.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all"
        >
          <span>Find Products to Compare</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Collect all unique spec keys across compared items
  const allSpecKeys = Array.from(
    new Set(
      compareItems.flatMap((item) =>
        item.specifications ? Object.keys(item.specifications) : []
      )
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Smart Product Comparison ({compareItems.length}/4)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Side-by-side breakdown of technical specs, ratings, and value
          </p>
        </div>
        <button
          onClick={() => dispatch(clearCompare())}
          className="text-xs font-semibold text-rose-500 hover:underline flex items-center space-x-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Comparison</span>
        </button>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-4 sm:p-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="p-4 w-48 text-xs uppercase font-extrabold text-slate-400">
                Product
              </th>
              {compareItems.map((prod) => (
                <th key={prod._id} className="p-4 min-w-[240px] align-top">
                  <div className="relative group">
                    <button
                      onClick={() => dispatch(removeFromCompare(prod._id))}
                      className="absolute -top-2 -right-2 p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white rounded-full text-slate-400 transition-colors"
                      title="Remove from compare"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="aspect-square w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3 mx-auto">
                      <img
                        src={prod.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                        alt={prod.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Link
                      to={`/products/${prod._id}`}
                      className="block font-bold text-sm text-slate-900 dark:text-white hover:text-amber-500 line-clamp-2 text-center"
                    >
                      {prod.title}
                    </Link>
                    <div className="text-center mt-2">
                      <span className="text-lg font-black text-amber-500 dark:text-amber-400">
                        ₹{prod.price?.toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => dispatch(addToCart({ ...prod, quantity: 1 }))}
                      className="mt-3 w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {/* Brand */}
            <tr>
              <td className="p-4 font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/30">
                Brand
              </td>
              {compareItems.map((prod) => (
                <td key={prod._id} className="p-4 font-semibold text-slate-900 dark:text-white">
                  {prod.brand}
                </td>
              ))}
            </tr>

            {/* Rating */}
            <tr>
              <td className="p-4 font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/30">
                Rating
              </td>
              {compareItems.map((prod) => (
                <td key={prod._id} className="p-4">
                  <div className="flex items-center space-x-1.5">
                    <RatingStars rating={prod.rating || 4.5} size="sm" />
                    <span className="font-bold">({prod.numReviews || 12})</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Availability */}
            <tr>
              <td className="p-4 font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/30">
                Stock Status
              </td>
              {compareItems.map((prod) => (
                <td key={prod._id} className="p-4 font-semibold">
                  {prod.stock > 0 ? (
                    <span className="text-emerald-600 font-bold">In Stock ({prod.stock})</span>
                  ) : (
                    <span className="text-red-500 font-bold">Sold Out</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Technical Specifications */}
            {allSpecKeys.map((key) => (
              <tr key={key}>
                <td className="p-4 font-bold capitalize text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/30">
                  {key}
                </td>
                {compareItems.map((prod) => (
                  <td key={prod._id} className="p-4 text-slate-700 dark:text-slate-300">
                    {prod.specifications?.[key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparePage;
