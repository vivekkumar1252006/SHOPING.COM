import express from 'express';
import {
    getProducts,
    getProductById,
    getFeaturedProducts,
    getTrendingProducts,
    getNewArrivals,
    getBestSellers,
    getRelatedProducts,
    compareProducts,
    getSmartSearchSuggestions,
    createProductReview,
    getFilterMetadata,
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/meta/filters', getFilterMetadata);
router.get('/sections/featured', getFeaturedProducts);
router.get('/sections/trending', getTrendingProducts);
router.get('/sections/new-arrivals', getNewArrivals);
router.get('/sections/best-sellers', getBestSellers);
router.get('/search/suggestions', getSmartSearchSuggestions);
router.post('/compare', compareProducts);

router.get('/:id', getProductById);
router.get('/:id/related', getRelatedProducts);
router.post('/:id/reviews', protect, createProductReview);

export default router;

