import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingCart, Zap, Star } from 'lucide-react';
import { addToCart, setBuyNowItem, setCartOpen } from '../../redux/slices/cartSlice';
import { toggleWishlist } from '../../redux/slices/wishlistSlice';

/** Render up to 5 filled/half/empty stars */
const StarRating = ({ rating }) => {
  const stars = [];
  const full = Math.floor(rating);
  const half = rating - full >= 0.4;

  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <Star
          key={i}
          size={12}
          fill="currentColor"
          strokeWidth={0}
          className="product-card__star product-card__star--filled"
          aria-hidden="true"
        />
      );
    } else if (i === full && half) {
      stars.push(
        <span key={i} className="product-card__star product-card__star--half" aria-hidden="true">
          ★
        </span>
      );
    } else {
      stars.push(
        <Star
          key={i}
          size={12}
          strokeWidth={1.5}
          className="product-card__star product-card__star--empty"
          aria-hidden="true"
        />
      );
    }
  }
  return <>{stars}</>;
};

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isWishlisted = useSelector((state) =>
    state.wishlist.items.some((item) => item._id === product._id)
  );
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [buying, setBuying] = useState(false);

  const originalPrice = product.originalPrice || product.price;
  const discount =
    originalPrice > product.price
      ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
      : 0;
  const inStock = (product.stock ?? product.countInStock ?? 0) > 0;
  const rating = Number(product.rating || 4.5);
  const reviewCount = product.numReviews || 0;

  const handleAddToCart = () => {
    dispatch(addToCart({ product, quantity: 1 }));
    dispatch(setCartOpen(false));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!inStock || buying) return;
    setBuying(true);
    dispatch(setBuyNowItem({ product, quantity: 1 }));
    dispatch(setCartOpen(false));
    navigate('/checkout?buyNow=1');
  };

  const primaryImage =
    product.images?.[0] ||
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800';
  const secondaryImage = product.images?.[1] || primaryImage;
  const currentImage = hovered ? secondaryImage : primaryImage;

  return (
    <article className="store-product-card">
      {/* Image Area */}
      <Link
        to={`/products/${product._id}`}
        className="store-product-card__image-link"
        aria-label={`View ${product.title}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          src={currentImage}
          alt={product.title}
          className="store-product-card__image"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src =
              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
          }}
        />
        {discount > 0 && (
          <span className="store-product-card__discount" aria-label={`${discount}% off`}>
            -{discount}%
          </span>
        )}
        {!inStock && (
          <span className="store-product-card__out-of-stock">Out of Stock</span>
        )}
      </Link>

      {/* Wishlist Button */}
      <button
        type="button"
        className={`store-product-card__wishlist${isWishlisted ? ' is-active' : ''}`}
        aria-label={
          isWishlisted
            ? `Remove ${product.title} from wishlist`
            : `Add ${product.title} to wishlist`
        }
        aria-pressed={isWishlisted}
        onClick={() => dispatch(toggleWishlist(product))}
      >
        <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>

      {/* Card Content */}
      <div className="store-product-card__content">
        <Link to={`/products/${product._id}`} className="store-product-card__title">
          {product.title}
        </Link>

        {/* Star Rating + Review Count */}
        <div
          className="store-product-card__rating"
          aria-label={`Rated ${rating.toFixed(1)} out of 5 — ${reviewCount} reviews`}
        >
          <span className="store-product-card__stars">
            <StarRating rating={rating} />
          </span>
          <span className="store-product-card__rating-value">{rating.toFixed(1)}</span>
          <span className="store-product-card__reviews">
            ({reviewCount.toLocaleString()} reviews)
          </span>
        </div>

        {/* Price Row */}
        <div className="store-product-card__price">
          <strong>₹{Number(product.price || 0).toLocaleString('en-IN')}</strong>
          {discount > 0 && (
            <del aria-label={`Original price ₹${Number(originalPrice).toLocaleString('en-IN')}`}>
              ₹{Number(originalPrice).toLocaleString('en-IN')}
            </del>
          )}
          {discount > 0 && (
            <span className="store-product-card__saving">
              Save ₹{Number(originalPrice - product.price).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="store-product-card__actions">
          <button
            type="button"
            className={`store-button store-button--cart${added ? ' is-added' : ''}`}
            onClick={handleAddToCart}
            disabled={!inStock}
            aria-label={inStock ? `Add ${product.title} to cart` : 'Out of stock'}
          >
            <ShoppingCart size={13} aria-hidden="true" />
            <span>{added ? 'Added!' : inStock ? 'Add to Cart' : 'Out of Stock'}</span>
          </button>
          <button
            type="button"
            className={`store-button store-button--buy${buying ? ' is-loading' : ''}`}
            onClick={handleBuyNow}
            disabled={!inStock || buying}
            aria-label={`Buy ${product.title} now`}
          >
            <Zap size={13} aria-hidden="true" />
            <span>{buying ? 'Processing...' : inStock ? 'Buy Now' : 'Out of Stock'}</span>
          </button>
        </div>

        <span className="store-sr-only" role="status" aria-live="polite">
          {added ? `${product.title} added to cart` : ''}
        </span>
      </div>
    </article>
  );
};

export default ProductCard;
