import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

/**
 * Get user's wishlist
 * GET /api/wishlist
 */
export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products',
      select: 'name slug price discountPrice discountPercentage images countInStock category brand rating numReviews',
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    // Filter out null products in case a product was deleted
    wishlist.products = (wishlist.products || []).filter((p) => p !== null);

    res.json({
      success: true,
      wishlist: wishlist.products,
      count: wishlist.products.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Toggle product in wishlist (Add if not present, Remove if already present)
 * POST /api/wishlist/toggle
 */
export const toggleWishlistItem = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    const index = wishlist.products.findIndex((p) => p.toString() === productId);
    let isAdded = false;

    if (index > -1) {
      wishlist.products.splice(index, 1);
      isAdded = false;
    } else {
      wishlist.products.push(productId);
      isAdded = true;
    }

    await wishlist.save();

    const populated = await Wishlist.findById(wishlist._id).populate({
      path: 'products',
      select: 'name slug price discountPrice discountPercentage images countInStock category brand rating numReviews',
    });

    res.json({
      success: true,
      isAdded,
      message: isAdded ? 'Added to wishlist' : 'Removed from wishlist',
      wishlist: populated.products,
      count: populated.products.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Remove specific product from wishlist
 * DELETE /api/wishlist/:productId
 */
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);
    await wishlist.save();

    const populated = await Wishlist.findById(wishlist._id).populate({
      path: 'products',
      select: 'name slug price discountPrice discountPercentage images countInStock category brand rating numReviews',
    });

    res.json({
      success: true,
      message: 'Item removed from wishlist',
      wishlist: populated.products,
      count: populated.products.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Clear entire wishlist
 * DELETE /api/wishlist
 */
export const clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    res.json({ success: true, message: 'Wishlist cleared successfully', count: 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

