// server/scripts/generateCatalog.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 12 Primary requested categories + 6 extra categories
export const sampleCategories = [
  {
    name: "Men's Fashion",
    slug: "mens-fashion",
    description: "Premium tailored suits, blazers, jackets, denim & casual wear",
    icon: "Shirt",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Women's Fashion",
    slug: "womens-fashion",
    description: "Designer dresses, evening gowns, blazers, tops & knitwear",
    icon: "Gem",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Kids Collection",
    slug: "kids-collection",
    description: "Soft organic cotton rompers, party dresses, hoodies & shoes",
    icon: "Baby",
    image: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Cosmetics",
    slug: "cosmetics",
    description: "High-pigment lipsticks, liquid blushes, foundations & beauty items",
    icon: "Sparkles",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Skincare",
    slug: "skincare",
    description: "Dermatologist-tested serums, moisturizers, cleansers & sunscreens",
    icon: "Heart",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Makeup Kits",
    slug: "makeup-kits",
    description: "Complete vanity boxes, 35-shade palettes & professional brush sets",
    icon: "Palette",
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Watches",
    slug: "watches",
    description: "Luxury automatic chronographs, sapphire crystal & smartwatches",
    icon: "Watch",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Shoes",
    slug: "shoes",
    description: "Performance running shoes, sneakers, leather brogues & Chelsea boots",
    icon: "Footprints",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Smartphones",
    slug: "smartphones",
    description: "Flagship 5G smartphones, Pro camera systems & folding screens",
    icon: "Smartphone",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Bags",
    slug: "bags",
    description: "Italian leather tote bags, commuter backpacks, duffels & clutches",
    icon: "ShoppingBag",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Perfumes",
    slug: "perfumes",
    description: "Luxury Eau de Parfum, rare oud mist, fresh citrus & woody scents",
    icon: "Wind",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Water Bottles",
    slug: "water-bottles",
    description: "Double-wall vacuum insulated bottles, gym flasks & aesthetic tumblers",
    icon: "CupSoda",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Headphones",
    slug: "headphones",
    description: "Studio monitors, ANC wireless headphones & hi-res earbuds",
    icon: "Headphones",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Laptops",
    slug: "laptops",
    description: "Ultralight aluminum ultrabooks & RTX gaming workstations",
    icon: "Laptop",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Sunglasses",
    slug: "sunglasses",
    description: "UV400 polarized aviators & luxury designer frames",
    icon: "Glasses",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Home Decor",
    slug: "home-decor",
    description: "Nordic ceramic vases, ambient lighting & aesthetic accents",
    icon: "Home",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Fitness",
    slug: "fitness",
    description: "Dumbbell sets, yoga mats, resistance bands & training gear",
    icon: "Dumbbell",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=85",
    featured: true
  },
  {
    name: "Jewellery",
    slug: "jewellery",
    description: "18K gold-plated necklaces, diamond bracelets & solitaire rings",
    icon: "Crown",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=85",
    featured: true
  }
];

export const sampleCoupons = [
  {
    code: 'WELCOME10',
    discountPercentage: 10,
    maxDiscountAmount: 500,
    minOrderAmount: 999,
    validUntil: new Date('2028-12-31'),
    isActive: true,
  },
  {
    code: 'FESTIVE25',
    discountPercentage: 25,
    maxDiscountAmount: 2500,
    minOrderAmount: 2999,
    validUntil: new Date('2028-12-31'),
    isActive: true,
  },
  {
    code: 'SUPER50',
    discountPercentage: 50,
    maxDiscountAmount: 5000,
    minOrderAmount: 6999,
    validUntil: new Date('2028-12-31'),
    isActive: true,
  },
  {
    code: 'FREESHIP',
    discountPercentage: 100,
    maxDiscountAmount: 150,
    minOrderAmount: 499,
    validUntil: new Date('2028-12-31'),
    isActive: true,
  },
];
