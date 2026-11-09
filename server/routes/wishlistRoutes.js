import express from 'express';
import {
  getWishlist,
  toggleWishlistItem,
  removeFromWishlist,
  clearWishlist,
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All wishlist operations require authenticated customer
router.use(protect);

router.route('/')
  .get(getWishlist)
  .delete(clearWishlist);

router.post('/toggle', toggleWishlistItem);
router.delete('/:productId', removeFromWishlist);

export default router;

