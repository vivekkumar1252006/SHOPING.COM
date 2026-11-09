import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import QuickViewModal from '../components/product/QuickViewModal';
import { productApi } from '../services/api';

const SORT_OPTIONS = [
  { label: 'Newest Arrivals',   value: '-createdAt' },
  { label: 'Most Popular',      value: '-rating' },
  { label: 'Price: Low to High',value: 'price' },
  { label: 'Price: High to Low',value: '-price' },
  { label: 'Most Reviews',      value: '-numReviews' },
];

const BRANDS = [
  'Apple', 'Sony', 'Samsung', 'Nike', 'Zara', 'Titan',
  'Dermacell', 'PureFlow', 'Dell', 'Ray-Ban', 'Fitbit', 'Tanishq',
];

const SKELETONS = Array.from({ length: 12 }, (_, i) => i);

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  /* ---- Filter state (synced from URL) ---- */
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [searchTerm,       setSearchTerm]       = useState(searchParams.get('search')   || '');
  const [sortBy,           setSortBy]           = useState(searchParams.get('sort')     || '-createdAt');
  const [priceRange,       setPriceRange]       = useState(250000);
  const [selectedBrand,    setSelectedBrand]    = useState('');

  /* Sync state → URL */
  useEffect(() => {
    const params = {};
    if (selectedCategory) params.category = selectedCategory;
    if (searchTerm)       params.search   = searchTerm;
    if (sortBy !== '-createdAt') params.sort = sortBy;
    setSearchParams(params, { replace: true });
  }, [selectedCategory, searchTerm, sortBy]);

  /* Sync URL → state on back/forward navigation */
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
    setSearchTerm(searchParams.get('search')   || '');
    setSortBy(searchParams.get('sort')         || '-createdAt');
  }, [searchParams.toString()]);

  /* Fetch categories once */
  useEffect(() => {
    productApi.getCategories()
      .then((res) => setCategories(res.data.data || []))
      .catch(() => {});
  }, []);

  /* Fetch products on filter change */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { sort: sortBy, limit: 500 };
      if (priceRange < 250000)                                      params.maxPrice  = priceRange;
      if (selectedCategory && selectedCategory.toLowerCase() !== 'all') params.category = selectedCategory.trim();
      if (searchTerm)                                               params.search   = searchTerm.trim();
      if (selectedBrand && selectedBrand !== 'all')                 params.brand    = selectedBrand;

      const res = await productApi.getAll(params);
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
      setError('Could not load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm, sortBy, priceRange, selectedBrand]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSearchTerm('');
    setSortBy('-createdAt');
    setPriceRange(250000);
    setSelectedBrand('');
  };

  const hasActiveFilters =
    selectedCategory || searchTerm || sortBy !== '-createdAt' ||
    priceRange < 250000 || selectedBrand;

  /* ---- Sidebar content (shared between desktop + drawer) ---- */
  const SidebarContent = () => (
    <>
      <div className="products-page__filter-group">
        <span className="products-page__filter-label">Category</span>
        <button
          className={`products-page__cat-btn${!selectedCategory || selectedCategory.toLowerCase() === 'all' ? ' is-active' : ''}`}
          onClick={() => setSelectedCategory('')}
        >
          All Categories
        </button>
        {categories.map((cat) => {
          const name = cat.name || cat;
          const isActive = selectedCategory.toLowerCase() === name.toLowerCase();
          return (
            <button
              key={cat._id || name}
              className={`products-page__cat-btn${isActive ? ' is-active' : ''}`}
              onClick={() => setSelectedCategory(name)}
            >
              {name}
            </button>
          );
        })}
      </div>

      <div className="products-page__filter-group">
        <span className="products-page__filter-label">Max Price</span>
        <div className="products-page__price-row">
          <span>₹1,000</span>
          <strong>₹{priceRange.toLocaleString('en-IN')}</strong>
        </div>
        <input
          type="range"
          min="1000"
          max="250000"
          step="5000"
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="products-page__range"
          aria-label="Maximum price"
        />
      </div>

      <div className="products-page__filter-group">
        <span className="products-page__filter-label">Brand</span>
        <div className="products-page__brand-chips">
          {BRANDS.map((b) => (
            <button
              key={b}
              className={`products-page__brand-chip${selectedBrand === b ? ' is-active' : ''}`}
              onClick={() => setSelectedBrand(selectedBrand === b ? '' : b)}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="products-page">
      {/* ---- Page Header ---- */}
      <div className="products-page__header">
        <div>
          <h1 className="products-page__title">Explore All Products</h1>
          <p className="products-page__subtitle">
            {loading ? 'Loading...' : `${products.length} products across all categories`}
          </p>
        </div>

        <div className="products-page__controls">
          {/* Mobile filter toggle */}
          <button
            className="products-page__filter-toggle"
            onClick={() => setFilterDrawerOpen(true)}
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasActiveFilters && (
              <span
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--shop-gold-hover)', display: 'inline-block',
                }}
              />
            )}
          </button>

          {/* Search */}
          <div className="products-page__search">
            <Search size={15} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--shop-muted)' }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="products-page__sort"
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button className="products-page__clear-btn" onClick={handleClearFilters}>
              <X size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* ---- Main Layout ---- */}
      <div className="products-page__layout">
        {/* Desktop Sidebar */}
        <aside className="products-page__sidebar" aria-label="Product filters">
          <div className="products-page__sidebar-title">
            <span>Filters</span>
            {hasActiveFilters && (
              <button className="products-page__clear-btn" onClick={handleClearFilters}>
                Reset
              </button>
            )}
          </div>
          <SidebarContent />
        </aside>

        {/* Product Grid */}
        <main>
          {loading ? (
            <div className="products-page__grid">
              {SKELETONS.map((i) => (
                <div key={i} className="products-page__skeleton" />
              ))}
            </div>
          ) : error ? (
            <div className="products-page__grid">
              <div className="products-page__error">
                <h3>Something went wrong</h3>
                <p>{error}</p>
                <button className="products-page__reset-btn" onClick={fetchProducts}>
                  Try Again
                </button>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="products-page__grid">
              <div className="products-page__empty">
                <h3>No products found</h3>
                <p>Try adjusting your search or filters to discover more products.</p>
                <button className="products-page__reset-btn" onClick={handleClearFilters}>
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="products-page__grid">
              {products.map((prod) => (
                <ProductCard
                  key={prod._id}
                  product={prod}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      {filterDrawerOpen && (
        <div className="products-page__filter-drawer" role="dialog" aria-modal="true" aria-label="Product filters">
          <div
            className="products-page__filter-drawer-overlay"
            onClick={() => setFilterDrawerOpen(false)}
          />
          <div className="products-page__filter-drawer-panel">
            <div className="products-page__drawer-header">
              <h3>Filters</h3>
              <button
                className="products-page__drawer-close"
                onClick={() => setFilterDrawerOpen(false)}
                aria-label="Close filters"
              >
                <X size={16} />
              </button>
            </div>
            <SidebarContent />
            <button
              className="products-page__reset-btn"
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => { handleClearFilters(); setFilterDrawerOpen(false); }}
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};

export default ProductsPage;
