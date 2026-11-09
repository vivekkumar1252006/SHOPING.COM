import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Menu, Search, ShoppingCart, UserRound, X, LogOut, Package } from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';
import { productApi } from '../../services/api';
import logoImg from '../../assets/logo.jpg';

const categories = [
  'All',
  'Mobiles',
  'Clothes',
  'Shoes',
  'Cosmetics',
  'Watches',
  'Bags',
  'Bottles',
  'Perfumes',
  'Headphones',
  'Laptops',
  'Sunglasses',
  'Home Decor',
  'Fitness',
  'Jewellery',
];

const collections = [
  ['Men Collection', 'Men Collection'],
  ['Women Collection', 'Women Collection'],
  ['Children Collection', 'Children Collection'],
  ['Mobiles Collection', 'Mobiles'],
  ['Laptop & Computers', 'Laptops'],
  ['Headphones & Audio', 'Headphones'],
  ['Watch Collections', 'Watches'],
  ['Shoes Collections', 'Shoes'],
  ['Bag Collections', 'Bags'],
  ['Bottles & Tumblers', 'Bottles'],
  ['Perfumes & Fragrances', 'Perfumes'],
  ['Cosmetics & Beauty', 'Cosmetics'],
  ['Skin Care Collection', 'Skin Care'],
  ['Makeup Kits', 'Makeup Kits'],
  ['Sunglasses & Eyewear', 'Sunglasses'],
  ['Home Decor & Living', 'Home Decor'],
  ['Fitness & Gym Gear', 'Fitness'],
  ['Jewellery & Luxury', 'Jewellery'],
];

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const wishlistCount = useSelector((state) => state.wishlist.items.length);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionError, setSuggestionError] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const activeCategoryParam = (searchParams.get('category') || '').trim();
  const isAllActive = (!activeCategoryParam && location.pathname === '/') || activeCategoryParam.toLowerCase() === 'all';

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) return undefined;

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const response = await productApi.getAll({ search: query, limit: 5 });
        if (active) {
          setSuggestions(response.data.data);
          setSuggestionError(false);
        }
      } catch (error) {
        console.error('Product search suggestions failed', error);
        if (active) {
          setSuggestions([]);
          setSuggestionError(true);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [sidebarOpen]);

  const searchProducts = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
    setSuggestionsOpen(false);
  };

  const openCategory = (category) => {
    const isProductsPage = location.pathname.startsWith('/products');
    const basePath = isProductsPage ? '/products' : '/';

    if (category === 'All' || category === 'all') {
      navigate(basePath);
    } else {
      navigate(`${basePath}?category=${encodeURIComponent(category)}`);
    }
    setSidebarOpen(false);
    setSuggestionsOpen(false);
    setSearchQuery('');
    setSuggestions([]);
    setSuggestionError(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    setAccountMenuOpen(false);
  };

  return (
    <header className="store-header">
      <div className="store-header__top">
        <Link to="/" className="store-logo" aria-label="shoping.com home">
          <img src={logoImg} alt="shoping.com" className="store-logo__img" />
        </Link>

        <form className="store-search" role="search" onSubmit={searchProducts}>
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => {
              const value = event.target.value;
              setSearchQuery(value);
              if (value.trim().length < 2) {
                setSuggestions([]);
                setSuggestionError(false);
              }
            }}
            onFocus={() => setSuggestionsOpen(true)}
            onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
            placeholder="Search products"
            aria-label="Search products"
            aria-autocomplete="list"
            aria-expanded={suggestionsOpen && searchQuery.trim().length >= 2}
          />
          <button type="submit">Search</button>
          {suggestionsOpen && searchQuery.trim().length >= 2 && (
            <div className="store-search__suggestions" role="listbox">
              {suggestions.map((product) => (
                <button
                  type="button"
                  role="option"
                  key={product._id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    navigate(`/products/${product._id}`);
                    setSuggestionsOpen(false);
                  }}
                >
                  <img src={product.images?.[0]} alt="" />
                  <span>{product.title}</span>
                  <strong>₹{Number(product.price || 0).toLocaleString('en-IN')}</strong>
                </button>
              ))}
              {suggestionError && (
                <p className="store-search__message">Suggestions are unavailable right now.</p>
              )}
              {!suggestionError && suggestions.length === 0 && (
                <p className="store-search__message">No matching products found.</p>
              )}
            </div>
          )}
        </form>

        <div className="store-header__actions">
          {isAuthenticated ? (
            <div className="store-account">
              <button
                type="button"
                className="store-account__button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-expanded={accountMenuOpen}
                aria-label={`Account for ${user?.name || 'user'}`}
              >
                <UserRound size={20} />
                <span>{user?.name?.split(' ')[0] || 'Account'}</span>
              </button>
              {accountMenuOpen && (
                <div className="store-account__menu">
                  <Link to="/profile"><UserRound size={16} /> My profile</Link>
                  <Link to="/profile?tab=orders"><Package size={16} /> My orders</Link>
                  <button type="button" onClick={handleLogout}><LogOut size={16} /> Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="store-account__button" aria-label="Account / Login">
              <UserRound size={20} />
              <span>Account / Login</span>
            </Link>
          )}

          <Link to="/wishlist" className="store-wishlist" aria-label={`Wishlist, ${wishlistCount} items`}>
            <Heart size={20} aria-hidden="true" />
            <span className="store-wishlist__label">Wishlist</span>
            {wishlistCount > 0 && <span className="store-wishlist__count">{wishlistCount}</span>}
          </Link>

          <Link to="/cart" className="store-cart" aria-label={`Shopping cart, ${cartCount} items`}>
            <ShoppingCart size={22} />
            <span className="store-cart__label">Cart</span>
            <span className="store-cart__count">{cartCount}</span>
          </Link>
        </div>
      </div>

      <nav className="store-category-bar" aria-label="Product categories">
        <button
          type="button"
          className="store-category-bar__menu"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open collections menu"
          aria-expanded={sidebarOpen}
        >
          <Menu size={21} />
        </button>
        <div className="store-category-bar__links">
          {categories.map((category) => {
            const isSelected =
              (category === 'All' && isAllActive) ||
              (activeCategoryParam && activeCategoryParam.toLowerCase() === category.toLowerCase());
            return (
              <button
                type="button"
                key={category}
                className={isSelected ? 'is-active' : ''}
                onClick={() => openCategory(category)}
              >
                {category}
              </button>
            );
          })}
        </div>
      </nav>

      {sidebarOpen && (
        <div className="store-sidebar-layer">
          <button
            type="button"
            className="store-sidebar-layer__overlay"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close collections menu"
          />
          <aside className="store-sidebar" aria-label="Collections">
            <div className="store-sidebar__heading">
              <Link to="/" onClick={() => setSidebarOpen(false)} className="inline-block py-1" aria-label="shoping.com home">
                <img src={logoImg} alt="shoping.com" className="h-8 w-auto object-contain" />
              </Link>
              <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                <X size={21} />
              </button>
            </div>
            <button
              type="button"
              className={`store-sidebar__all ${isAllActive ? 'is-active' : ''}`}
              onClick={() => openCategory('All')}
            >
              All products
            </button>
            {collections.map(([label, category]) => {
              const isSelected = activeCategoryParam.toLowerCase() === category.toLowerCase();
              return (
                <button
                  type="button"
                  key={label}
                  className={`store-sidebar__link ${isSelected ? 'is-active' : ''}`}
                  onClick={() => openCategory(category)}
                >
                  {label}
                </button>
              );
            })}
          </aside>
        </div>
      )}
    </header>
  );
};

export default Navbar;