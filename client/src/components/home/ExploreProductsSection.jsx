import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PackageOpen } from 'lucide-react';
import ProductCard from '../product/ProductCard';

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'men', label: "Men's Fashion" },
  { id: 'women', label: "Women's Fashion" },
  { id: 'shoes', label: 'Shoes & Sneakers' },
  { id: 'watches', label: 'Smart Watches' },
  { id: 'smartphones', label: 'Smartphones' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'bags', label: 'Bags & Accessories' },
  { id: 'beauty', label: 'Beauty & Skincare' },
];

const matchesCategory = (product, catId) => {
  const title = (product.title || product.name || '').toLowerCase();
  const cat = (product.category || '').toLowerCase();
  const tags = (product.tags || []).join(' ').toLowerCase();
  const text = `${title} ${cat} ${tags}`;

  switch (catId) {
    case 'men':
      return (
        cat === 'clothes' &&
        (/\b(men|shirt|t-shirt|polo|jacket|trouser|pant|hoodie|blazer|suit|denim)\b/.test(text) ||
          !/\b(women|dress|skirt|kurti|saree|girl|female)\b/.test(text))
      );
    case 'women':
      return (
        cat === 'clothes' &&
        /\b(women|dress|top|kurti|skirt|saree|blouse|girl|female|gown)\b/.test(text)
      );
    case 'shoes':
      return cat === 'shoes' || /\b(shoes?|sneakers?|boots?|loafers?|sandals?|footwear)\b/.test(text);
    case 'watches':
      return cat === 'watches' || /\b(watches?|smartwatch|chronograph)\b/.test(text);
    case 'smartphones':
      return (
        cat === 'mobiles' ||
        /\b(phones?|smartphones?|iphone|galaxy|pixel|oneplus|iqoo|redmi|mobile)\b/.test(text)
      );
    case 'electronics':
      return (
        ['electronics', 'laptops', 'headphones'].includes(cat) ||
        /\b(laptop|headphones?|audio|earbuds?|tablet|monitor|keyboard)\b/.test(text)
      );
    case 'bags':
      return (
        ['bags', 'jewellery', 'sunglasses'].includes(cat) ||
        /\b(bag|backpack|wallet|jewel|sunglass|necklace|earring|handbag)\b/.test(text)
      );
    case 'beauty':
      return (
        ['cosmetics', 'perfumes'].includes(cat) ||
        /\b(perfume|cologne|fragrance|cream|skincare|serum|lipstick|makeup)\b/.test(text)
      );
    default:
      return true;
  }
};

const LoadingSkeleton = () => (
  <div className="store-grid" aria-label="Loading products">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={`skel-${index}`} className="store-product-card store-product-card--skeleton">
        <div className="store-product-card__skel-img" />
        <div className="store-product-card__content" style={{ gap: '10px' }}>
          <div className="store-product-card__skel-line" style={{ width: '80%', height: '14px' }} />
          <div className="store-product-card__skel-line" style={{ width: '50%', height: '12px' }} />
          <div className="store-product-card__skel-line" style={{ width: '60%', height: '18px' }} />
          <div className="store-product-card__actions" style={{ marginTop: '8px' }}>
            <div className="store-product-card__skel-line" style={{ flex: 1, height: '36px', borderRadius: '6px' }} />
            <div className="store-product-card__skel-line" style={{ flex: 1, height: '36px', borderRadius: '6px' }} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ExploreProductsSection = ({ products = [], loading = false }) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    if (activeCategory === 'all') {
      // Pick a rich, balanced mix from each target category
      const targetCategoryIds = ['men', 'women', 'shoes', 'watches', 'smartphones', 'electronics', 'bags', 'beauty'];
      const seenIds = new Set();
      const mixed = [];

      // Add up to 2 items per category first
      targetCategoryIds.forEach((catId) => {
        const matches = products.filter((p) => matchesCategory(p, catId) && !seenIds.has(p._id));
        matches.slice(0, 2).forEach((p) => {
          seenIds.add(p._id);
          mixed.push(p);
        });
      });

      // Fill remaining up to 16 from all products if needed
      if (mixed.length < 16) {
        products.forEach((p) => {
          if (!seenIds.has(p._id) && mixed.length < 16) {
            seenIds.add(p._id);
            mixed.push(p);
          }
        });
      }

      return mixed;
    }

    return products.filter((p) => matchesCategory(p, activeCategory)).slice(0, 16);
  }, [products, activeCategory]);

  return (
    <section className="explore-products-section" aria-label="Explore Our Products">
      <div className="explore-products-section__header">
        <p className="explore-products-section__eyebrow">FEATURED COLLECTION</p>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h2 className="explore-products-section__title">Explore Our Products</h2>
            <p className="explore-products-section__subtitle">
              Discover products you'll love, handpicked for your everyday needs.
            </p>
          </div>
          <Link
            to="/products"
            className="explore-products-section__view-all"
            aria-label="View all products in shop"
          >
            <span>View all products</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="explore-products-section__tabs" role="tablist" aria-label="Product categories">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`explore-products-section__tab ${
                isActive ? 'explore-products-section__tab--active' : ''
              }`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Product Grid / Loading / Empty State */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredProducts.length > 0 ? (
        <div className="store-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="explore-products-section__empty">
          <PackageOpen size={48} strokeWidth={1.5} />
          <p className="font-semibold text-base text-slate-800 dark:text-slate-200">
            No products found in this category right now.
          </p>
          <p className="text-xs text-slate-500">
            Check back soon or explore our complete catalog.
          </p>
          <Link
            to="/products"
            className="premium-button premium-button--primary"
            style={{ marginTop: '8px' }}
          >
            Browse all products
          </Link>
        </div>
      )}
    </section>
  );
};

export default ExploreProductsSection;

