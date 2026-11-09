import { getGeminiModel, fallbackAIAssistant } from '../config/aiClient.js';
import Product from '../models/Product.js';

export const chatWithAI = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const allProducts = await Product.find({ countInStock: { $gt: 0 } })
      .select('name price discountPrice discountPercentage category brand rating numReviews description specifications tags countInStock')
      .limit(30);

    const gemini = getGeminiModel();

    if (gemini) {
      try {
        const catalogSummary = allProducts.map((p) => ({
          id: p._id,
          name: p.name,
          category: p.category,
          brand: p.brand,
          price: p.discountPrice || p.price,
          rating: p.rating,
          inStock: p.countInStock > 0,
          specs: p.specifications?.map(s => `${s.key}: ${s.value}`).join(', '),
        }));

        const prompt = `You are "SmartCart AI", an enthusiastic, friendly, and expert personal shopping assistant for an intelligent e-commerce store.
Here is the currently available product catalog (in JSON):
${JSON.stringify(catalogSummary)}

Guidelines:
1. Recommend actual products from our catalog whenever possible.
2. If asked about prices, compare them or recommend the best value.
3. Be helpful, concise, well-formatted with markdown bullet points and bold product names.
4. If recommending products, include their exact product IDs in a JSON block at the very end like this:
[RECOMMENDED_IDS: "id1", "id2"]
5. Active coupon codes in our store are: SMART10 (10% off), WELCOME20 (20% off for new shoppers).

User's message: "${message}"`;

        const result = await gemini.generateContent(prompt);
        const responseText = result.response.text();

        let recommendedProducts = [];
        const match = responseText.match(/\[RECOMMENDED_IDS:\s*([^\]]+)\]/);
        let cleanReply = responseText.replace(/\[RECOMMENDED_IDS:[^\]]+\]/, '').trim();

        if (match && match[1]) {
          const ids = match[1]
            .split(',')
            .map((id) => id.replace(/["'\s]/g, ''))
            .filter((id) => id.length === 24);
          if (ids.length > 0) {
            recommendedProducts = await Product.find({ _id: { $in: ids } });
          }
        }

        if (recommendedProducts.length === 0) {
          recommendedProducts = allProducts.filter((p) =>
            cleanReply.toLowerCase().includes(p.name.toLowerCase().substring(0, 15))
          ).slice(0, 4);
        }

        return res.json({
          success: true,
          reply: cleanReply,
          recommendedProducts,
        });
      } catch (geminiError) {
        console.warn('Gemini call error:', geminiError.message);
      }
    }

    const fallbackResponse = fallbackAIAssistant({
      prompt: message,
      products: allProducts,
      history,
    });

    return res.json({
      success: true,
      reply: fallbackResponse.reply,
      recommendedProducts: fallbackResponse.recommendedProducts,
      intent: fallbackResponse.intent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const smartSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const lowerQuery = query.toLowerCase();

    let maxPrice = null;
    let minPrice = null;
    const underMatch = lowerQuery.match(/(?:under|below|less than|max)\s*\$?(\d+)/i);
    const aboveMatch = lowerQuery.match(/(?:above|over|more than|min)\s*\$?(\d+)/i);

    if (underMatch) maxPrice = parseFloat(underMatch[1]);
    if (aboveMatch) minPrice = parseFloat(aboveMatch[1]);

    let minRating = null;
    if (lowerQuery.includes('top rated') || lowerQuery.includes('best rated')) minRating = 4.3;
    const ratingMatch = lowerQuery.match(/(\d(?:\.\d)?)\s*(?:star|stars)/i);
    if (ratingMatch) minRating = parseFloat(ratingMatch[1]);

    const stopWords = new Set(['find', 'me', 'a', 'an', 'the', 'for', 'with', 'in', 'under', 'below', 'above', 'over', 'of', 'and', 'show', 'buy', 'looking', 'cheap', 'best', 'good']);
    const tokens = lowerQuery
      .replace(/[^\w\s]/gi, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    const dbQuery = { countInStock: { $gt: 0 } };

    if (maxPrice || minPrice) {
      dbQuery.discountPrice = {};
      if (minPrice) dbQuery.discountPrice.$gte = minPrice;
      if (maxPrice) dbQuery.discountPrice.$lte = maxPrice;
    }

    if (minRating) {
      dbQuery.rating = { $gte: minRating };
    }

    if (tokens.length > 0) {
      const orClauses = tokens.map((token) => ({
        $or: [
          { name: { $regex: token, $options: 'i' } },
          { category: { $regex: token, $options: 'i' } },
          { brand: { $regex: token, $options: 'i' } },
          { tags: { $regex: token, $options: 'i' } },
          { description: { $regex: token, $options: 'i' } },
          { aiKeywords: { $regex: token, $options: 'i' } },
        ],
      }));
      dbQuery.$and = orClauses;
    }

    let products = await Product.find(dbQuery).limit(20);

    if (products.length === 0 && tokens.length > 0) {
      const relaxedQuery = { countInStock: { $gt: 0 } };
      if (maxPrice || minPrice) relaxedQuery.discountPrice = dbQuery.discountPrice;

      relaxedQuery.$or = tokens.flatMap((token) => [
        { name: { $regex: token, $options: 'i' } },
        { category: { $regex: token, $options: 'i' } },
        { brand: { $regex: token, $options: 'i' } },
        { tags: { $regex: token, $options: 'i' } },
      ]);
      products = await Product.find(relaxedQuery).limit(20);
    }

    res.json({
      success: true,
      query,
      parsedFilters: {
        maxPrice,
        minPrice,
        minRating,
        detectedKeywords: tokens,
      },
      products,
      total: products.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const { viewedProductIds = [], preferredCategories = [] } = req.body;

    let targetCategories = [...preferredCategories];

    if (viewedProductIds.length > 0) {
      const viewed = await Product.find({ _id: { $in: viewedProductIds } });
      viewed.forEach((p) => {
        if (!targetCategories.includes(p.category)) {
          targetCategories.push(p.category);
        }
      });
    }

    let recommended;
    if (targetCategories.length > 0) {
      recommended = await Product.find({
        category: { $in: targetCategories },
        _id: { $nin: viewedProductIds },
      })
        .sort({ rating: -1, numReviews: -1 })
        .limit(8);
    }

    if (!recommended || recommended.length < 4) {
      const popular = await Product.find({
        _id: { $nin: viewedProductIds },
      })
        .sort({ rating: -1, numReviews: -1 })
        .limit(8);
      recommended = popular;
    }

    res.json({ success: true, recommendations: recommended });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
