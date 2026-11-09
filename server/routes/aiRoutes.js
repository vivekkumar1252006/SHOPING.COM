import express from 'express';
import {
    chatWithAI,
    smartSearch,
    getRecommendations,
} from '../controllers/aiController.js';

const router = express.Router();

router.post('/chat', chatWithAI);
router.post('/smart-search', smartSearch);
router.post('/recommendations', getRecommendations);

export default router;

