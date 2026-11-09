import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import HeroBanner from '../components/home/HeroBanner';
import CategorySlider from '../components/home/CategorySlider';
import ProductCarousel from '../components/home/ProductCarousel';
import ExploreProductsSection from '../components/home/ExploreProductsSection';
import SmartSearchModal from '../components/ai/SmartSearchModal';
import { productApi, aiApi } from '../services/api';

const PAGE_SIZE = 100;

const collectionSections = [
  {
    title: "Men's Collection",
    description: 'Shirts, trousers, jackets and more for the modern man',
    category: 'Men Collection',
    matches: (text) => /\bmen'?s?(\s+collection)?\b/.test(text),
  },
  {
    title: "Women's Collection",
    description: 'Dresses, tops, kurtis and stylish picks for women',
    category: 'Women Collection',
    matches: (text) => /\bwomen'?s?(\s+collection)?\b/.test(text),
  },
  {
    title: 'Kids Collection',
    description: 'Fun and comfortable clothing for boys and girls',
    category: 'Children Collection',
    matches: (text) => /\b(kids?|children)(\s+collection)?\b/.test(text),
  },
  {
    title: 'Electronics',
    description: 'Phones, laptops, earbuds, cameras and cutting-edge tech',
    category: 'Electronics',
    matches: (text) =>
      /\b(electronics?|mobiles?|phones?|laptops?|computers?|headphones?|audio|earbuds?|gaming|cameras?|tablets?)\b/.test(
        text
      ),
  },
  {
    title: 'Watches & Accessories',
    description: 'Luxury and casual watches, jewellery and smart accessories',
    category: 'Watches',
    matches: (text) =>
      /\b(watches?|accessories|jewellery|jewelry|sunglasses|bottles?)\b/.test(text),
  },
  {
    title: 'Shoes Collection',
    description: 'Sneakers, formal shoes, sandals and sports footwear',
    category: 'Shoes',
    matches: (text) => /\b(shoes?|footwear|sneakers?|sandals?)\b/.test(text),
  },
  {
    title: 'Beauty & Skincare',
    description: 'Makeup, skincare essentials and grooming products',
    category: 'Cosmetics',
    matches: (text) =>
      /\b(cosmetics?|skincare|skin care|makeup|beauty)\b/.test(text),
  },
  {
    title: 'Bags & Accessories',
    description: 'Handbags, backpacks, wallets and travel accessories',
    category: 'Bags',
    matches: (text) =>
      /\b(bags?|handbags?|backpacks?|purses?|wallets?|luggage)\b/.test(text),
  },
  {
    title: 'Perfumes Collection',
    description: 'Luxury fragrances and long-lasting scents for every mood',
    category: 'Perfumes',
    matches: (text) =>
      /\b(perfumes?|fragrances?|scents?|deodorants?|cologne)\b/.test(text),
  },
];

const searchableProductText = (product) =>
  `${product.category || ''} ${(product.tags || []).join(' ')} ${(product.aiKeywords || []).join(
    ' '
  )}`.toLowerCase();

const matchesSelectedCategory = (product, category) => {
  const text = searchableProductText(product);
  const normalizedCategory = category.toLowerCase();
  const collection = collectionSections.find(
    (section) => section.category.toLowerCase() === normalizedCategory
  );

  if (collection) return collection.matches(text);
  if (normalizedCategory === 'clothes')
    return /\b(clothes|fashion|men'?s?|women'?s?|kids?|children)\b/.test(text);
  if (normalizedCategory === 'cosmetics')
    return /\b(cosmetics?|skincare|skin care|makeup|beauty)\b/.test(text);
  return text.includes(normalizedCategory);
};

const HomePage = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';

  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [smartSearchOpen, setSmartSearchOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchHomeData = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const [firstPage, recommendationResponse] = await Promise.all([
          productApi.getAll({ limit: PAGE_SIZE, page: 1, sortBy: 'newest' }),
          aiApi.getRecommendations().catch((error) => {
            console.error('Failed to load personalized recommendations', error);
            return { data: { data: [] } };
          }),
        ]);

        const pageCount = Math.ceil(firstPage.data.total / PAGE_SIZE);
        const remainingPages = await Promise.all(
          Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
            productApi.getAll({ limit: PAGE_SIZE, page: index + 2, sortBy: 'newest' })
          )
        );

        if (!active) return;
        setProducts([
          ...firstPage.data.data,
          ...remainingPages.flatMap((page) => page.data.data),
        ]);
        setRecommendations(recommendationResponse.data.data);
      } catch (error) {
        console.error('Failed to load homepage products', error);
        if (active) setLoadError('We could not load the product catalog. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchHomeData();
    return () => {
      active = false;
    };
  }, [reloadCount]);

  const sections = useMemo(() => {
    const trending = products.filter((p) => p.isTrending);
    const bestSellers = products.filter((p) => p.isBestSeller);
    const newArrivals = products.filter((p) => p.isNewArrival);
    const offers = products.filter((p) => p.originalPrice > p.price);
    const recommended =
      recommendations.length > 0
        ? recommendations
        : [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return [
      {
        eyebrow: 'Popular right now',
        title: 'Trending Products',
        description: 'The hottest picks loved by thousands of shoppers',
        products:
          trending.length > 0
            ? trending
            : [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)),
      },
      {
        eyebrow: 'Customer favourites',
        title: 'Best Selling Products',
        description: 'Top-rated products our customers keep coming back for',
        products:
          bestSellers.length > 0
            ? bestSellers
            : [...products].sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0)),
      },
      {
        eyebrow: 'Just added',
        title: 'New Arrivals',
        description: 'Fresh products just added to our collection',
        products: newArrivals.length > 0 ? newArrivals : products,
      },
      ...collectionSections.map((section) => ({
        eyebrow: 'Browse the collection',
        title: section.title,
        description: section.description,
        href: `/products?category=${encodeURIComponent(section.category)}`,
        products: products.filter((p) => section.matches(searchableProductText(p))),
      })),
      {
        eyebrow: 'Selected for you',
        title: 'Recommended for You',
        description: 'Handpicked products based on what shoppers like you enjoy',
        products: recommended,
        recommended: true,
      },
      {
        eyebrow: 'Limited-time prices',
        title: 'Special Offers',
        description: 'Exclusive discounts — grab them before they\'re gone',
        products: offers,
      },
    ];
  }, [products, recommendations]);

  const selectedProducts = useMemo(() => {
    if (!categoryParam || categoryParam.toLowerCase() === 'all') return [];
    const category = categoryParam.toLowerCase();
    return products.filter((p) => matchesSelectedCategory(p, category));
  }, [categoryParam, products]);

  return (
    <div className="premium-home">
      <HeroBanner onOpenAIModal={() => setSmartSearchOpen(true)} />
      <CategorySlider />

      {loadError ? (
        <div className="premium-catalog-error" role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={() => setReloadCount((c) => c + 1)}>
            Try again
          </button>
        </div>
      ) : categoryParam && categoryParam.toLowerCase() !== 'all' ? (
        <ProductCarousel
          eyebrow="Selected category"
          title={categoryParam}
          description={`Showing results for "${categoryParam}"`}
          products={selectedProducts}
          loading={loading}
          href={`/products?category=${encodeURIComponent(categoryParam)}`}
        />
      ) : (
        sections.map((section) => (
          <ProductCarousel
            key={section.title}
            eyebrow={section.eyebrow}
            title={section.title}
            description={section.description}
            products={section.products}
            loading={loading}
            href={section.href}
          />
        ))
      )}

      <section className="premium-recommendations">
        <div className="premium-recommendations__heading">
          <div>
            <p>
              <Sparkles size={14} aria-hidden="true" /> Need a hand choosing?
            </p>
            <h2>Shop with smart search</h2>
          </div>
          <button type="button" onClick={() => setSmartSearchOpen(true)}>
            Describe what you need
          </button>
        </div>
      </section>
      <ExploreProductsSection products={products} loading={loading} />

      <SmartSearchModal isOpen={smartSearchOpen} onClose={() => setSmartSearchOpen(false)} />
    </div>
  );
};

export default HomePage;
