import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

export const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim().length > 15 && !apiKey.includes('your_gemini_key') && !apiKey.includes('your_')) {
    if (!genAI) {
      genAI = new GoogleGenerativeAI(apiKey.trim());
    }
    return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return null;
};

export const fallbackAIAssistant = ({ prompt, products, history = [] }) => {
  const lowerPrompt = prompt.toLowerCase();
  
  const priceMatch = lowerPrompt.match(/under\s*\$?(\d+)/i) || lowerPrompt.match(/below\s*\$?(\d+)/i) || lowerPrompt.match(/less than\s*\$?(\d+)/i);
  let budget = priceMatch ? parseFloat(priceMatch[1]) : null;

  const matchedProducts = products.filter((p) => {
    const text = `${p.name} ${p.category} ${p.brand} ${p.tags?.join(' ')} ${p.description}`.toLowerCase();
    const words = lowerPrompt.split(/\s+/).filter(w => w.length > 2);
    const matchesKeyword = words.some(w => text.includes(w));
    const matchesBudget = budget ? (p.discountPrice || p.price) <= budget : true;
    return matchesKeyword && matchesBudget;
  }).slice(0, 4);

  if (matchedProducts.length > 0) {
    const suggestionsText = matchedProducts
      .map(p => `• **${p.name}** by ${p.brand} - ₹${p.discountPrice || p.price} (Rating: ${p.rating}★)`)
      .join('\n');

    return {
      reply: `Here are the top smart recommendations I found for your request "${prompt}":\n\n${suggestionsText}\n\nWould you like more details, a comparison, or help adding any of these to your cart?`,
      recommendedProducts: matchedProducts,
      intent: 'recommendation'
    };
  }

  if (lowerPrompt.includes('compare') || lowerPrompt.includes('versus') || lowerPrompt.includes('vs')) {
    const sample = products.slice(0, 2);
    return {
      reply: `Comparing products is easy on SmartCart! You can click the **Compare** icon on any product card or compare these top picks:\n\n1. **${sample[0]?.name}** (₹${sample[0]?.discountPrice || sample[0]?.price}) - Best for ${sample[0]?.category}\n2. **${sample[1]?.name}** (₹${sample[1]?.discountPrice || sample[1]?.price}) - Highly rated (${sample[1]?.rating}★)`,
      recommendedProducts: sample,
      intent: 'comparison'
    };
  }

  if (lowerPrompt.includes('order') || lowerPrompt.includes('track') || lowerPrompt.includes('shipping') || lowerPrompt.includes('delivery')) {
    return {
      reply: `📦 Orders on SmartCart are dispatched within 24 hours with free standard shipping on orders over ₹999! You can track your existing orders anytime in your **Account > Order History** or **Live Order Tracking** page with step-by-step progress tracking.`,
      recommendedProducts: [],
      intent: 'support'
    };
  }

  if (lowerPrompt.includes('coupon') || lowerPrompt.includes('discount') || lowerPrompt.includes('code') || lowerPrompt.includes('offer')) {
    return {
      reply: `🎉 Great news! You can use code **SMART10** for 10% off any order, **WELCOME20** for 20% off your first purchase, or **FLAT50** for flat ₹500 off! Apply them right at checkout to save instantly.`,
      recommendedProducts: products.slice(0, 3),
      intent: 'coupons'
    };
  }

  const featured = products.filter(p => p.isFeatured || p.isTrending).slice(0, 3);
  return {
    reply: `Hello! I am **Nova**, your SmartCart AI Personal Shopper. I can help you find products, compare specs, pick gifts within your budget, or track your orders. Here are some of our most trending deals right now!`,
    recommendedProducts: featured.length > 0 ? featured : products.slice(0, 3),
    intent: 'general'
  };
};
