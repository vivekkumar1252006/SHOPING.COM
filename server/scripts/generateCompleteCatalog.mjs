// server/scripts/generateCompleteCatalog.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const unsplash = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;

// 12 Primary Categories requested by user + 6 supplementary categories
export const sampleCategories = [
  {
    name: "Men's Fashion",
    slug: "mens-fashion",
    description: "Tailored suits, blazers, jackets, denim & casual shirts",
    icon: "Shirt",
    image: unsplash("photo-1594938298603-c8148c4dae35"),
    featured: true
  },
  {
    name: "Women's Fashion",
    slug: "womens-fashion",
    description: "Designer dresses, evening gowns, blazers, tops & knitwear",
    icon: "Sparkles",
    image: unsplash("photo-1515886657613-9f3515b0c78f"),
    featured: true
  },
  {
    name: "Kids Collection",
    slug: "kids-collection",
    description: "Organic cotton rompers, party dresses, hoodies & shoes",
    icon: "Baby",
    image: unsplash("photo-1519457431-44ccd64a579b"),
    featured: true
  },
  {
    name: "Cosmetics",
    slug: "cosmetics",
    description: "High-pigment lipsticks, liquid blushes, foundations & beauty items",
    icon: "Sparkles",
    image: unsplash("photo-1522337360788-8b13dee7a37e"),
    featured: true
  },
  {
    name: "Skincare",
    slug: "skincare",
    description: "Dermatologist serums, moisturizers, cleansers & sunscreens",
    icon: "Heart",
    image: unsplash("photo-1556228720-195a672e8a03"),
    featured: true
  },
  {
    name: "Makeup Kits",
    slug: "makeup-kits",
    description: "Vanity boxes, 35-shade palettes & professional brush sets",
    icon: "Palette",
    image: unsplash("photo-1512496015851-a90fb38ba796"),
    featured: true
  },
  {
    name: "Watches",
    slug: "watches",
    description: "Luxury automatic chronographs, sapphire crystal & smartwatches",
    icon: "Watch",
    image: unsplash("photo-1523275335684-37898b6baf30"),
    featured: true
  },
  {
    name: "Shoes",
    slug: "shoes",
    description: "Performance running shoes, sneakers, leather brogues & boots",
    icon: "Footprints",
    image: unsplash("photo-1542291026-7eec264c27ff"),
    featured: true
  },
  {
    name: "Smartphones",
    slug: "smartphones",
    description: "Flagship 5G smartphones, Pro camera systems & folding phones",
    icon: "Smartphone",
    image: unsplash("photo-1511707171634-5f897ff02aa9"),
    featured: true
  },
  {
    name: "Bags",
    slug: "bags",
    description: "Italian leather tote bags, commuter backpacks & duffels",
    icon: "ShoppingBag",
    image: unsplash("photo-1548036328-c9fa89d128fa"),
    featured: true
  },
  {
    name: "Perfumes",
    slug: "perfumes",
    description: "Luxury Eau de Parfum, rare oud mist, fresh citrus & woody scents",
    icon: "Wind",
    image: unsplash("photo-1592945403244-b3fbafd7f539"),
    featured: true
  },
  {
    name: "Water Bottles",
    slug: "water-bottles",
    description: "Double-wall vacuum insulated bottles, gym flasks & tumblers",
    icon: "CupSoda",
    image: unsplash("photo-1602143407151-7111542de6e8"),
    featured: true
  },
  {
    name: "Headphones",
    slug: "headphones",
    description: "Studio monitors, ANC wireless headphones & hi-res earbuds",
    icon: "Headphones",
    image: unsplash("photo-1505740420928-5e560c06d30e"),
    featured: true
  },
  {
    name: "Laptops",
    slug: "laptops",
    description: "Ultralight aluminum ultrabooks & RTX gaming workstations",
    icon: "Laptop",
    image: unsplash("photo-1496181133206-80ce9b88a853"),
    featured: true
  },
  {
    name: "Sunglasses",
    slug: "sunglasses",
    description: "UV400 polarized aviators & luxury designer frames",
    icon: "Glasses",
    image: unsplash("photo-1511499767150-a48a237f0083"),
    featured: true
  },
  {
    name: "Home Decor",
    slug: "home-decor",
    description: "Nordic ceramic vases, ambient lighting & aesthetic accents",
    icon: "Home",
    image: unsplash("photo-1513519245088-0e12902e5a38"),
    featured: true
  },
  {
    name: "Fitness",
    slug: "fitness",
    description: "Dumbbell sets, yoga mats, resistance bands & training gear",
    icon: "Dumbbell",
    image: unsplash("photo-1517838277536-f5f99be501cd"),
    featured: true
  },
  {
    name: "Jewellery",
    slug: "jewellery",
    description: "18K gold-plated necklaces, diamond bracelets & solitaire rings",
    icon: "Crown",
    image: unsplash("photo-1515562141207-7a88fb7ce338"),
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
