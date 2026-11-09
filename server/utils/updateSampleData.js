import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sampleDataPath = path.join(__dirname, 'sampleData.js');

let content = fs.readFileSync(sampleDataPath, 'utf8');

// 1. Add new categories to sampleCategories if missing
const newCategories = `        ['Skin Care', 'Simple skincare essentials', 'Droplets'],
        ['Makeup Kits', 'Makeup sets and beauty kits', 'Palette'],
        ['Headphones', 'Premium sound, earbuds, and wireless audio', 'Headphones'],
        ['Laptops', 'Gaming laptops, ultrabooks, and workstations', 'Laptop'],
        ['Sunglasses', 'Designer eyewear and polarized shades', 'Glasses'],
        ['Home Decor', 'Modern home accents, lighting, and decor', 'Home'],
        ['Fitness', 'Gym gear, resistance bands, and workout equipment', 'Dumbbell'],
        ['Jewellery', 'Rings, necklaces, luxury bracelets, and earrings', 'Gem'],`;

if (!content.includes("'Headphones'")) {
  content = content.replace(
    /(\['Skin Care'[^\]]+\][,\r\n\s]+)(\['Makeup Kits'[^\]]+\])/,
    `$1$2,\n        ['Headphones', 'Premium sound, earbuds, and wireless audio', 'Headphones'],\n        ['Laptops', 'Gaming laptops, ultrabooks, and workstations', 'Laptop'],\n        ['Sunglasses', 'Designer eyewear and polarized shades', 'Glasses'],\n        ['Home Decor', 'Modern home accents, lighting, and decor', 'Home'],\n        ['Fitness', 'Gym gear, resistance bands, and workout equipment', 'Dumbbell'],\n        ['Jewellery', 'Rings, necklaces, luxury bracelets, and earrings', 'Gem']`
  );
}

// 2. Add sample products if missing
const newProducts = [
  {
    name: 'Sony WH-1000XM5 Noise Cancelling Headphones',
    shortDescription: 'Industry-leading noise cancellation with 2 processors and 8 microphones.',
    description: 'Ultra-comfortable lightweight design with soft fit leather. Crystal clear hands-free calling with 4 beamforming microphones and advanced audio signal processing. Up to 30-hour battery life with quick charging.',
    price: 399,
    discountPrice: 349,
    category: 'Headphones',
    brand: 'Sony',
    images: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 25,
    rating: 4.9,
    numReviews: 124,
    tags: ['headphones', 'wireless', 'anc', 'audio', 'sony']
  },
  {
    name: 'AirPods Max Space Grey High-Fidelity Audio',
    shortDescription: 'Apple-designed dynamic driver provides high-fidelity audio with active noise cancellation.',
    description: 'Computational audio combines custom acoustic design with the Apple H1 chip and software for breakthrough listening experiences. Crafted with a knit-mesh canopy and memory foam ear cushions.',
    price: 549,
    discountPrice: 499,
    category: 'Headphones',
    brand: 'Apple',
    images: [
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 18,
    rating: 4.8,
    numReviews: 89,
    tags: ['headphones', 'apple', 'wireless', 'spatial-audio']
  },
  {
    name: 'Bose QuietComfort 45 Bluetooth Headphones',
    shortDescription: 'Iconic quiet, comfort, and sound with TriPort acoustic architecture.',
    description: 'High-fidelity audio with adjustable EQ that lets you tune bass, mid-range, and treble. Up to 24 hours of battery life on a single charge with USB-C quick recharge.',
    price: 329,
    discountPrice: 279,
    category: 'Headphones',
    brand: 'Bose',
    images: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 30,
    rating: 4.7,
    numReviews: 68,
    tags: ['headphones', 'bose', 'audio', 'anc']
  },
  {
    name: 'MacBook Pro 16-inch M3 Max Silicon',
    shortDescription: 'Supercharged by M3 Max with up to 16-core CPU and 40-core GPU.',
    description: 'Liquid Retina XDR display with Extreme Dynamic Range, 1000 nits sustained brightness, and ProMotion technology. Up to 22 hours of battery life and extensive connectivity with MagSafe 3 and Thunderbolt 4.',
    price: 2499,
    discountPrice: 2299,
    category: 'Laptops',
    brand: 'Apple',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 12,
    rating: 4.9,
    numReviews: 142,
    tags: ['laptop', 'macbook', 'apple', 'm3', 'computer']
  },
  {
    name: 'Dell XPS 15 OLED InfinityEdge Laptop',
    shortDescription: '15.6-inch 3.5K OLED touchscreen with 13th Gen Intel Core i9 processor.',
    description: 'Crafted with machined aluminum and carbon-fiber palm rest. NVIDIA GeForce RTX 4070 graphics for gaming and high-end video editing with studio-quality quad speakers.',
    price: 1899,
    discountPrice: 1699,
    category: 'Laptops',
    brand: 'Dell',
    images: [
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 15,
    rating: 4.7,
    numReviews: 76,
    tags: ['laptop', 'dell', 'windows', 'oled']
  },
  {
    name: 'ASUS ROG Zephyrus G16 Gaming Laptop',
    shortDescription: 'Ultra-slim gaming powerhouse with OLED ROG Nebula Display and RTX 4080.',
    description: 'Intel Core Ultra 9 processor, 32GB LPDDR5X RAM, 2TB PCIe Gen 4 SSD, and whisper-quiet vapor chamber cooling system inside a premium CNC aluminum chassis.',
    price: 1999,
    discountPrice: 1799,
    category: 'Laptops',
    brand: 'ASUS',
    images: [
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 10,
    rating: 4.8,
    numReviews: 54,
    tags: ['laptop', 'gaming', 'asus', 'rtx']
  },
  {
    name: 'Ray-Ban Classic Aviator Polarized Sunglasses',
    shortDescription: 'Timeless gold frame with polarized classic G-15 green UV400 lenses.',
    description: 'Originally designed in 1937 for aviators, these iconic shades offer 100% UV protection, exceptional contrast, and superior glare reduction for driving and outdoor sunshine.',
    price: 175,
    discountPrice: 145,
    category: 'Sunglasses',
    brand: 'Ray-Ban',
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 40,
    rating: 4.8,
    numReviews: 92,
    tags: ['sunglasses', 'ray-ban', 'aviator', 'eyewear']
  },
  {
    name: 'Oakley Holbrook Prizm Sport Sunglasses',
    shortDescription: 'Lightweight O Matter frame with Prizm lens technology for crystal clarity.',
    description: 'Combines vintage American design with modern sports performance. Prizm lenses maximize contrast and improve visibility in bright conditions.',
    price: 160,
    discountPrice: 135,
    category: 'Sunglasses',
    brand: 'Oakley',
    images: [
      'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 35,
    rating: 4.7,
    numReviews: 68,
    tags: ['sunglasses', 'oakley', 'sports', 'prizm']
  },
  {
    name: 'Gucci Oversized Square Frame Sunglasses',
    shortDescription: 'Bold Italian designer acetate frame with gold interlocking GG temple logos.',
    description: 'High-fashion statement eyewear made in Italy with gradient tinted lenses providing 100% UVA/UVB protection. Includes velvet hard case and satin pouch.',
    price: 390,
    discountPrice: 330,
    category: 'Sunglasses',
    brand: 'Gucci',
    images: [
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 15,
    rating: 4.9,
    numReviews: 41,
    tags: ['sunglasses', 'gucci', 'luxury', 'fashion']
  },
  {
    name: 'Nordic Minimalist Ceramic Vase Set (3-Piece)',
    shortDescription: 'Handcrafted matte ribbed ceramic vases in warm neutral tones.',
    description: 'Elevate your living room, shelf, or tabletop with these aesthetic modern vases. Perfect for dried pampas grass, fresh floral stems, or architectural standalone decor.',
    price: 65,
    discountPrice: 49,
    category: 'Home Decor',
    brand: 'NordicLiving',
    images: [
      'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 50,
    rating: 4.8,
    numReviews: 73,
    tags: ['home decor', 'vase', 'ceramic', 'nordic']
  },
  {
    name: 'Ambient Sunset Projection LED Smart Lamp',
    shortDescription: '180-degree rotating golden hour mood lighting with app & remote controls.',
    description: 'Creates aesthetic warm sunset and aurora glow across walls and ceilings. Aluminum heat dissipation base with optical crystal lens for ultra-vivid colors and photography background vibes.',
    price: 45,
    discountPrice: 32,
    category: 'Home Decor',
    brand: 'Lumina',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 60,
    rating: 4.6,
    numReviews: 120,
    tags: ['home decor', 'lamp', 'lighting', 'sunset']
  },
  {
    name: 'Handwoven Bohemian Macrame Wall Tapestry',
    shortDescription: '100% natural organic cotton macrame wall hanging with wooden dowel.',
    description: 'Artisan hand-knotted geometric bohemian wall tapestry that brings warmth, texture, and cozy vibes to bedrooms, living spaces, or home offices.',
    price: 55,
    discountPrice: 39,
    category: 'Home Decor',
    brand: 'BohoCrafts',
    images: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 25,
    rating: 4.7,
    numReviews: 44,
    tags: ['home decor', 'macrame', 'tapestry', 'art']
  },
  {
    name: 'Pro Elite Adjustable Dumbbells (5-52.5 lbs Pair)',
    shortDescription: 'Rapid dial-adjust weight selection system with heavy-duty storage trays.',
    description: 'Replaces 15 sets of weights in one compact design. Smooth dial mechanism lets you switch from 5 lbs up to 52.5 lbs in seconds for full-body strength and hypertrophy training.',
    price: 299,
    discountPrice: 249,
    category: 'Fitness',
    brand: 'IronGrip',
    images: [
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 20,
    rating: 4.9,
    numReviews: 87,
    tags: ['fitness', 'dumbbells', 'workout', 'weights', 'gym']
  },
  {
    name: 'Eco-Friendly Natural Tree Rubber Yoga Mat',
    shortDescription: '6mm high-density non-slip grip yoga and pilates workout mat with alignment lines.',
    description: 'Sustainably sourced natural biodegradable rubber with moisture-wicking polyurethane surface. Exceptional cushion for joints and zero slip even during hot sweat sessions.',
    price: 60,
    discountPrice: 45,
    category: 'Fitness',
    brand: 'ZenYoga',
    images: [
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 45,
    rating: 4.8,
    numReviews: 62,
    tags: ['fitness', 'yoga', 'mat', 'exercise']
  },
  {
    name: 'Heavy-Duty 5-Level Tube Resistance Bands Set',
    shortDescription: 'Stackable anti-snap workout bands up to 150 lbs with foam handles & door anchor.',
    description: 'Complete home gym kit with 5 colored resistance bands, heavy-duty carabiners, padded ankle straps, door anchor, and travel carry bag for mobile strength workouts.',
    price: 35,
    discountPrice: 25,
    category: 'Fitness',
    brand: 'FitPulse',
    images: [
      'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 55,
    rating: 4.7,
    numReviews: 94,
    tags: ['fitness', 'resistance bands', 'home gym']
  },
  {
    name: '18K Gold Plated Emerald Solitaire Pendant Necklace',
    shortDescription: 'Genuine lab-grown vibrant emerald with shimmering zircon halo and 18-inch chain.',
    description: 'Hypoallergenic 925 sterling silver base plated in rich 18-karat yellow gold. Tarnish-resistant coating ensures lifelong radiant luster for weddings, galas, and fine occasions.',
    price: 120,
    discountPrice: 89,
    category: 'Jewellery',
    brand: 'AuraJewels',
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 30,
    rating: 4.9,
    numReviews: 58,
    tags: ['jewellery', 'necklace', 'gold', 'emerald']
  },
  {
    name: 'Sterling Silver Moissanite Diamond Tennis Bracelet',
    shortDescription: 'Classically sparkling 4mm VVS1 moissanite stones set in 925 sterling silver.',
    description: 'Features high-clarity round brilliant moissanite gemstones that pass diamond testers. Double-safety box clasp ensures secure, elegant wear on your wrist.',
    price: 150,
    discountPrice: 115,
    category: 'Jewellery',
    brand: 'LuxeGems',
    images: [
      'https://images.unsplash.com/photo-1611591475879-19816dfb7724?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 22,
    rating: 4.8,
    numReviews: 46,
    tags: ['jewellery', 'bracelet', 'silver', 'diamond']
  },
  {
    name: 'Modern Chunky Gold Hoop Earrings (Waterproof)',
    shortDescription: 'Lightweight hollow gold tubular hoop earrings with secure click-top closure.',
    description: 'Designed for daily comfort and timeless elegance. Triple PVD 18K gold coated over titanium steel makes them 100% waterproof, sweatproof, and hypoallergenic.',
    price: 45,
    discountPrice: 34,
    category: 'Jewellery',
    brand: 'ArtisanGold',
    images: [
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 40,
    rating: 4.7,
    numReviews: 83,
    tags: ['jewellery', 'earrings', 'gold', 'accessories']
  }
];

if (!content.includes('Sony WH-1000XM5')) {
  const jsonStrings = newProducts.map(p => JSON.stringify(p, null, 4)).join(',\n');
  const targetEnd = /([\r\n\s]*\];\s*export const sampleCoupons)/;
  content = content.replace(targetEnd, `,\n${jsonStrings}\n];\n\nexport const sampleCoupons`);
}

fs.writeFileSync(sampleDataPath, content, 'utf8');
console.log('Successfully updated sampleData.js with new categories and products!');
