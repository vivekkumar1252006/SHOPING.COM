import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';

export const getProducts = async (req, res) => {
  try {
        const pageSize = Number(req.query.limit) || 24;
    const page = Number(req.query.page) || 1;

    const query = {};

    if (req.query.keyword) {
      const keywordRegex = { $regex: req.query.keyword, $options: 'i' };
      query.$or = [
        { name: keywordRegex },
        { description: keywordRegex },
        { brand: keywordRegex },
        { tags: keywordRegex },
        { aiKeywords: keywordRegex },
        { category: keywordRegex },
      ];
    }

    if (req.query.category && req.query.category.trim().toLowerCase() !== 'all') {
      const rawCat = req.query.category.trim();
      const lowerCat = rawCat.toLowerCase();
      if (lowerCat === 'clothes') {
        query.category = { $regex: /^(clothes|men collection|women collection|children collection|fashion)$/i };
      } else if (lowerCat === 'cosmetics') {
        query.category = { $regex: /^(cosmetics|skin care|makeup kits|beauty.*)$/i };
      } else if (lowerCat === 'headphones' || lowerCat === 'audio') {
        query.category = { $regex: /^(headphones|audio|earbuds|electronics)$/i };
        query.category = { $regex: /^(headphones|audio|earbuds)$/i };
      } else if (lowerCat === 'laptops' || lowerCat === 'computers') {
        query.category = { $regex: /^(laptops|tech|computers|electronics)$/i };
        query.category = { $regex: /^(laptops|computers)$/i };
      } else if (lowerCat === 'sunglasses' || lowerCat === 'eyewear') {
        query.category = { $regex: /^(sunglasses|eyewear|accessories)$/i };
        query.category = { $regex: /^(sunglasses|eyewear)$/i };
      } else if (lowerCat === 'home decor' || lowerCat === 'home-decor' || lowerCat === 'home') {
        query.category = { $regex: /^(home decor|home & living|home)$/i };
      } else if (lowerCat === 'fitness' || lowerCat === 'sports') {
        query.category = { $regex: /^(fitness|sports|fitness & sports)$/i };
      } else if (lowerCat === 'jewellery' || lowerCat === 'jewelry') {
        query.category = { $regex: /^(jewellery|jewelry|accessories)$/i };
        query.category = { $regex: /^(jewellery|jewelry)$/i };
      } else {
        const flexiblePattern = rawCat.replace(/[-_]/g, '[- ]?');
        query.category = { $regex: new RegExp(`^${flexiblePattern}$`, 'i') };
      }
    }

    if (req.query.brand && req.query.brand !== 'all') {
      const brands = req.query.brand.split(',');
      query.brand = { $in: brands.map((b) => new RegExp(`^${b.trim()}$`, 'i')) };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query.discountPrice = {};
      if (req.query.minPrice) query.discountPrice.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.discountPrice.$lte = Number(req.query.maxPrice);
    }

    if (req.query.rating) {
      query.rating = { $gte: Number(req.query.rating) };
    }

    if (req.query.inStock === 'true') {
      query.countInStock = { $gt: 0 };
    }

    if (req.query.featured === 'true') query.isFeatured = true;
    if (req.query.trending === 'true') query.isTrending = true;
    if (req.query.newArrival === 'true') query.isNewArrival = true;
    if (req.query.bestSeller === 'true') query.isBestSeller = true;

    let sortOptions = { createdAt: -1 };
    switch (req.query.sortBy) {
      case 'price_asc':
        sortOptions = { discountPrice: 1 };
        break;
      case 'price_desc':
        sortOptions = { discountPrice: -1 };
        break;
      case 'rating':
        sortOptions = { rating: -1, numReviews: -1 };
        break;
      case 'popular':
        sortOptions = { numReviews: -1 };
        break;
      case 'discount':
        sortOptions = { discountPercentage: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      success: true,
      products,
      page,
      pages: Math.ceil(count / pageSize),
      totalProducts: count,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const rawId = decodeURIComponent(req.params.id || '').trim();
    let product = null;

    if (rawId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(rawId);
    }
    if (!product && rawId) {
      const normalizedSlug = rawId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      product = await Product.findOne({
        $or: [
          { slug: rawId },
          { slug: normalizedSlug },
          { name: new RegExp(`^${rawId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        ],
      });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 });

    res.json({ success: true, product, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true }).limit(8);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTrendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ isTrending: true }).limit(8);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({ isNewArrival: true }).limit(8);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBestSellers = async (req, res) => {
  try {
    const products = await Product.find({ isBestSeller: true }).limit(8);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const related = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
    }).limit(4);

    res.json({ success: true, products: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const compareProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide array of product IDs' });
    }

    const products = await Product.find({ _id: { $in: productIds } });

    const allSpecKeys = new Set();
    products.forEach((p) => {
      p.specifications?.forEach((s) => allSpecKeys.add(s.key));
    });

    res.json({
      success: true,
      products,
      attributes: Array.from(allSpecKeys),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSmartSearchSuggestions = async (req, res) => {
  try {
    const q = req.query.q || '';
    if (q.trim().length === 0) {
      return res.json({ success: true, suggestions: [], products: [] });
    }

    const regex = new RegExp(q, 'i');
    const products = await Product.find({
      $or: [{ name: regex }, { brand: regex }, { category: regex }, { tags: regex }],
    })
      .select('name price discountPrice images category brand rating')
      .limit(6);

    const categories = await Category.find({ name: regex }).limit(3);

    const suggestions = [
      ...new Set([
        ...products.map((p) => p.name),
        ...products.map((p) => p.brand),
        ...categories.map((c) => c.name),
      ]),
    ].slice(0, 5);

    res.json({ success: true, suggestions, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProductReview = async (req, res) => {
  try {
    const { rating, comment, title } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const alreadyReviewed = await Review.findOne({
      product: product._id,
      user: req.user._id,
    });

    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      product: product._id,
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      title: title || 'Verified Purchase',
      comment,
      verifiedPurchase: true,
    });

    const reviews = await Review.find({ product: product._id });
    product.numReviews = reviews.length;
    product.rating = Number(
      (reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length).toFixed(1)
    );

    await product.save();

    res.status(201).json({ success: true, review, message: 'Review added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFilterMetadata = async (req, res) => {
  try {
    const categories = await Category.find({});
    const brands = await Product.distinct('brand');
    const priceStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: '$discountPrice' },
          maxPrice: { $max: '$price' },
        },
      },
    ]);

    res.json({
      success: true,
      categories,
      brands,
      minPrice: priceStats[0]?.minPrice || 0,
      maxPrice: priceStats[0]?.maxPrice || 2000,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
