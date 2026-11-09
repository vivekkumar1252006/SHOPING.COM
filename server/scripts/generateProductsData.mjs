// server/scripts/generateProductsData.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sampleCategories, sampleCoupons } from './generateCompleteCatalog.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for consistent 4K/HD quality params
const unsplash = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;

// 300 Products across 18 Categories (12 Primary requested categories + 6 extra)
// Every product has 2 unique image IDs (primary + hover angle)
const categoryProducts = {
  "Men's Fashion": [
    {
      brand: "Raymond",
      name: "Raymond Tailored Italian Wool Slim Fit Blazer",
      short: "Crafted from 100% fine Italian merino wool with a sharp peak lapel.",
      desc: "Impeccably tailored for modern sophistication. Features genuine horn buttons, double vent back, and breathable cupro lining.",
      price: 8999, discountPrice: 6999, rating: 4.8, numReviews: 245,
      id1: "photo-1594938298603-c8148c4dae35", id2: "photo-1507679799987-c73779587ccf",
      tags: ["blazer", "mens fashion", "suit", "formal"]
    },
    {
      brand: "Zara",
      name: "Zara Premium Suede Leather Biker Jacket",
      short: "Ultra-soft genuine suede with asymmetrical zip and brushed silver hardware.",
      desc: "An iconic modern staple. Features heavy-duty YKK zippers, notched collar with press studs, and zippered cuffs.",
      price: 11499, discountPrice: 8999, rating: 4.9, numReviews: 312,
      id1: "photo-1551028719-00167b16eac5", id2: "photo-1521223890158-f9f7c3d5d504",
      tags: ["jacket", "suede", "biker", "mens fashion"]
    },
    {
      brand: "Tommy Hilfiger",
      name: "Tommy Hilfiger Classic Pique Cotton Polo Shirt",
      short: "Signature breathable organic cotton pique with embroidered flag logo.",
      desc: "A timeless prep essential. Ribbed collar and armbands, two-button placket, and side-vent hem for all-day comfort.",
      price: 3499, discountPrice: 2499, rating: 4.7, numReviews: 188,
      id1: "photo-1625910513413-5bc28f4a9b2b", id2: "photo-1586363104862-3a5e2ab60d99",
      tags: ["polo", "shirt", "casual", "mens fashion"]
    },
    {
      brand: "Levi's",
      name: "Levi's 511 Slim Fit Selvedge Denim Jeans",
      short: "Premium stretch Japanese selvedge denim in an authentic vintage wash.",
      desc: "The modern slim fit with room to move. Features copper rivets, iconic red tab, and signature arcuate back pocket stitching.",
      price: 4999, discountPrice: 3799, rating: 4.8, numReviews: 420,
      id1: "photo-1542272604-780c96856592", id2: "photo-1541099649105-f69ad21f3246",
      tags: ["jeans", "denim", "levis", "mens fashion"]
    },
    {
      brand: "Calvin Klein",
      name: "Calvin Klein Egyptian Cotton Poplin Dress Shirt",
      short: "Ultra-crisp 120s two-ply Egyptian cotton with spread collar and French cuffs.",
      desc: "Non-iron wrinkle-free technology ensures razor-sharp appearance from boardroom to evening dinner.",
      price: 4499, discountPrice: 3299, rating: 4.6, numReviews: 140,
      id1: "photo-1602810318383-e386cc2a3ccf", id2: "photo-1603252109303-2751441dd157",
      tags: ["shirt", "dress shirt", "formal", "mens fashion"]
    },
    {
      brand: "AllSaints",
      name: "AllSaints Milo Washed Lambskin Leather Jacket",
      short: "Supple lambskin leather with minimal clean hardware and soft cotton lining.",
      desc: "Handcrafted from buttery soft washed lambskin. Designed with understated welt pockets and an effortless European cut.",
      price: 24999, discountPrice: 19999, rating: 4.9, numReviews: 95,
      id1: "photo-1520975916090-3105956dac38", id2: "photo-1495105787522-5334e3ffa0ef",
      tags: ["leather jacket", "luxury", "biker", "mens fashion"]
    },
    {
      brand: "Ralph Lauren",
      name: "Polo Ralph Lauren Cable-Knit Cashmere Sweater",
      short: "Luxurious two-ply Italian cashmere featuring iconic cable knit texture.",
      desc: "Incomparably soft and warm. Finished with ribbed crew neckline, cuffs, and hem, subtly detailed with pony embroidery.",
      price: 14999, discountPrice: 11999, rating: 4.8, numReviews: 112,
      id1: "photo-1617137984095-74e4e5e3613f", id2: "photo-1620799140408-edc6dcb6d633",
      tags: ["sweater", "cashmere", "knitwear", "mens fashion"]
    },
    {
      brand: "Uniqlo",
      name: "Uniqlo Ultra Light Down Water-Repellent Jacket",
      short: "Premium 750+ fill power down that packs neatly into its own pocket pouch.",
      desc: "Featherweight warmth with durable water-repellent coating. Engineered for seamless layering through changing seasons.",
      price: 5999, discountPrice: 4499, rating: 4.7, numReviews: 530,
      id1: "photo-1544441893-675973e31985", id2: "photo-1548883354-7622d03aca27",
      tags: ["jacket", "puffer", "winter", "mens fashion"]
    },
    {
      brand: "H&M",
      name: "H&M Relaxed Fit Heavyweight Cotton Hoodie",
      short: "Thick 460 GSM organic French terry cotton with double-lined hood.",
      desc: "The ultimate streetwear hoodie. Drop-shoulder silhouette, kangaroo pouch pocket, and snug ribbed trims that hold shape.",
      price: 2999, discountPrice: 1999, rating: 4.6, numReviews: 380,
      id1: "photo-1556905055-8f358a7a47b2", id2: "photo-1509967419530-da38b4704bc6",
      tags: ["hoodie", "streetwear", "casual", "mens fashion"]
    },
    {
      brand: "Ted Baker",
      name: "Ted Baker Wool-Blend Formal Overcoat",
      short: "Tailored single-breasted topcoat with notch lapel and built-in pocket square.",
      desc: "Elevate your winter outerwear. Warm melton wool blend, geo-printed jacquard lining, and ticket pocket detail.",
      price: 18999, discountPrice: 14999, rating: 4.9, numReviews: 76,
      id1: "photo-1539571696357-5a69c17a67c6", id2: "photo-1516257984-b1b4d707412e",
      tags: ["overcoat", "coat", "formal", "mens fashion"]
    },
    {
      brand: "Linen Club",
      name: "Linen Club Pure French Linen Casual Shirt",
      short: "100% natural breathable flax linen with a relaxed camp collar.",
      desc: "Naturally thermoregulating for tropical comfort. Pre-washed for incredible softness that gets better with every wash.",
      price: 3999, discountPrice: 2799, rating: 4.7, numReviews: 165,
      id1: "photo-1596755094514-f87e34085b2c", id2: "photo-1607345366928-199ea26cfe3e",
      tags: ["linen", "shirt", "summer", "mens fashion"]
    },
    {
      brand: "Hugo Boss",
      name: "Hugo Boss Slim Fit Stretch Chino Trousers",
      short: "High-comfort stretch cotton gabardine tailored for clean, sharp lines.",
      desc: "Versatile transition trousers from office hours to weekend dinners. Featuring slant front pockets and horn-button back welts.",
      price: 7999, discountPrice: 5999, rating: 4.8, numReviews: 210,
      id1: "photo-1479064555552-3ef4979f8908", id2: "photo-1624378439575-d8705ad7ae80",
      tags: ["chinos", "pants", "formal", "mens fashion"]
    },
    {
      brand: "Superdry",
      name: "Superdry Vintage Military Field Cargo Jacket",
      short: "Rugged washed cotton canvas with multi-utility pockets and waist cinch.",
      desc: "Authentic military heritage styling with reinforced elbow patches, hidden zip hood, and vintage embroidered badges.",
      price: 8499, discountPrice: 6299, rating: 4.7, numReviews: 135,
      id1: "photo-1543076447-215ad9ba6923", id2: "photo-1512436991641-6745cdb1723f",
      tags: ["cargo jacket", "military", "mens fashion"]
    },
    {
      brand: "Nike",
      name: "Nike Sportswear Club Tech Fleece Tracksuit",
      short: "Lightweight thermal tech fleece jacket and tapered cuffed jogger set.",
      desc: "Double-sided smooth fleece offers superior insulation without unnecessary bulk. Taped zip pockets keep essentials secure.",
      price: 7999, discountPrice: 6499, rating: 4.9, numReviews: 450,
      id1: "photo-1578587018452-892bacefd3f2", id2: "photo-1515886657613-9f3515b0c78f", // wait, let's keep unique
      tags: ["tracksuit", "sportswear", "mens fashion"]
    },
    {
      brand: "G-Star RAW",
      name: "G-Star RAW 3D Arc Slim Denim Jacket",
      short: "3D architectural twisted seam construction in deep indigo selvedge.",
      desc: "Ergonomically engineered for full freedom of motion. Chest flap pockets, shank buttons, and waist adjustment tabs.",
      price: 9999, discountPrice: 7499, rating: 4.8, numReviews: 180,
      id1: "photo-1576995853123-5a10305d93c0", id2: "photo-1544441892-794166f1e3be",
      tags: ["denim jacket", "mens fashion"]
    },
    {
      brand: "Brooks Brothers",
      name: "Brooks Brothers Regent Fit Fine Twill Dress Shirt",
      short: "Supima cotton twill featuring the iconic original button-down polo collar.",
      desc: "The gold standard of American shirting. 6-pleat shirring at barrel cuffs, mother-of-pearl buttons, and wrinkle-resistant finish.",
      price: 6499, discountPrice: 4999, rating: 4.8, numReviews: 95,
      id1: "photo-1621072156002-e2fccdc0b176", id2: "photo-1598033129183-c4f50c736f10",
      tags: ["dress shirt", "formal", "mens fashion"]
    },
    {
      brand: "Diesel",
      name: "Diesel D-Strukt Distressed Slim Fit Jeans",
      short: "Authentic Italian vintage wash with hand-crafted whiskers and abrasions.",
      desc: "Premium comfort stretch denim that keeps its shape all day. Features iconic Diesel coin pocket flag label.",
      price: 12999, discountPrice: 9999, rating: 4.7, numReviews: 160,
      id1: "photo-1582552938357-32b906df40cb", id2: "photo-1560243563-062bfc001d68",
      tags: ["jeans", "diesel", "denim", "mens fashion"]
    },
    {
      brand: "Banana Republic",
      name: "Banana Republic Merino Wool V-Neck Sweater",
      short: "Extra-fine 19.5 micron merino wool that naturally resists wrinkles and odors.",
      desc: "Ultra-clean minimalist silhouette for layering under blazers or over crisp collars. Ribbed hem and cuffs.",
      price: 4999, discountPrice: 3499, rating: 4.7, numReviews: 124,
      id1: "photo-1614975058789-41316d0e2e9c", id2: "photo-1608231387042-66d1773070a5",
      tags: ["sweater", "merino wool", "mens fashion"]
    },
    {
      brand: "Patagonia",
      name: "Patagonia Better Sweater Fleece Quarter-Zip",
      short: "100% recycled polyester fleece dyed with a low-impact eco process.",
      desc: "Combines sweater-knit aesthetic with the easy-care warmth of Better Sweater fleece. Flat-seam construction eliminates chafing.",
      price: 8999, discountPrice: 6999, rating: 4.9, numReviews: 290,
      id1: "photo-1556905055-bd35d3368297", id2: "photo-1489987707025-afc232f7ea0f",
      tags: ["fleece", "outdoor", "mens fashion"]
    },
    {
      brand: "Armani Exchange",
      name: "Armani Exchange Minimalist Urban Bomber Jacket",
      short: "Sleek water-resistant matte satin finish with tone-on-tone rubberized logo.",
      desc: "Contemporary urban outerwear. Lightly padded lining, baseball collar, and ribbed knit storm cuffs.",
      price: 11999, discountPrice: 8999, rating: 4.8, numReviews: 175,
      id1: "photo-1490578474895-699cd4e2cf59", id2: "photo-1492562080023-ab3db95bfbce",
      tags: ["bomber jacket", "armani", "mens fashion"]
    }
  ],

  "Women's Fashion": [
    {
      brand: "Zimmermann",
      name: "Zimmermann Floral Tiered Silk Chiffon Maxi Dress",
      short: "Floaty tiered silk chiffon with cascading ruffles and delicate waist tie.",
      desc: "Bohemian romance redefined. Digitally printed floral artwork, blouson sleeves with elasticated cuffs, and removable slip.",
      price: 18999, discountPrice: 14999, rating: 4.9, numReviews: 230,
      id1: "photo-1572804013309-59a88b7e92f1", id2: "photo-1496747611176-843222e1e57c",
      tags: ["dress", "maxi dress", "floral", "womens fashion"]
    },
    {
      brand: "Zara",
      name: "Zara Double-Breasted Tailored Hourglass Blazer",
      short: "Sculpted structured shoulders with sharp notch lapels and tortoiseshell buttons.",
      desc: "The quintessential power blazer. Premium mid-weight stretch crepe that drapes cleanly with cinched waist detailing.",
      price: 7999, discountPrice: 5999, rating: 4.8, numReviews: 340,
      id1: "photo-1539109136881-3be0616acf4b", id2: "photo-1584273143981-41c073dfe8f8",
      tags: ["blazer", "formal", "womens fashion"]
    },
    {
      brand: "Reformation",
      name: "Reformation Juliette High-Slit Silk Slip Dress",
      short: "Slim fitting bodice with relaxed trumpet skirt and delicate tie straps.",
      desc: "Sustainably woven pure mulberry silk that glides across skin. Sweetheart neckline with smocked back bodice for flexibility.",
      price: 14499, discountPrice: 11999, rating: 4.9, numReviews: 180,
      id1: "photo-1566174053879-31528523f8ae", id2: "photo-1502716119720-b23a93e5fe1b",
      tags: ["silk dress", "evening", "womens fashion"]
    },
    {
      brand: "Burberry",
      name: "Burberry The Chelsea Heritage Cotton Gabardine Trench",
      short: "Weatherproof bespoke cotton gabardine with signature vintage check lining.",
      desc: "Invented by Thomas Burberry in 1879. Features storm shield, throat latch, D-ring belt, and buffalo horn buttons.",
      price: 49999, discountPrice: 39999, rating: 5.0, numReviews: 95,
      id1: "photo-1558769132-cb1aea458c5e", id2: "photo-1544441893-675973e31985", // replaced in unique check
      tags: ["trench coat", "burberry", "luxury", "womens fashion"]
    },
    {
      brand: "Mango",
      name: "Mango Satin Pleated Midi Skirt",
      short: "Flowing accordion pleats in lustrous fluid satin with concealed elastic waist.",
      desc: "Effortlessly chic from morning to night. Elegant A-line drape that catches light with every step.",
      price: 4999, discountPrice: 3499, rating: 4.7, numReviews: 155,
      id1: "photo-1583496661160-fb5886a0aaaa", id2: "photo-1551803091-e20673f15770",
      tags: ["skirt", "satin", "womens fashion"]
    },
    {
      brand: "H&M",
      name: "H&M Premium Selection Cashmere Knit Cardigan",
      short: "Featherlight pure cashmere with ribbed trims and mother-of-pearl buttons.",
      desc: "Essential luxury knitwear. V-neckline, relaxed dropped shoulders, and ultra-soft warmth for all-day layering.",
      price: 8999, discountPrice: 6999, rating: 4.8, numReviews: 142,
      id1: "photo-1434389677669-e08b4cac3105", id2: "photo-1576566588028-4147f3842f27",
      tags: ["cardigan", "cashmere", "womens fashion"]
    },
    {
      brand: "Ted Baker",
      name: "Ted Baker Pleated Floral Wrap Cocktail Dress",
      short: "Feminine wrap silhouette with asymmetric hem and delicate botanical motifs.",
      desc: "Flattering crossover V-neckline with self-tie belt and fluttering bell sleeves. Fully lined in silky satin.",
      price: 16999, discountPrice: 12999, rating: 4.9, numReviews: 110,
      id1: "photo-1515372039744-b8f02a3ae446", id2: "photo-1518895949257-7621c3c786d7",
      tags: ["cocktail dress", "wrap dress", "womens fashion"]
    },
    {
      brand: "Massimo Dutti",
      name: "Massimo Dutti High-Waist Wide-Leg Linen Trousers",
      short: "100% natural European linen with front pleats and tailored tab closure.",
      desc: "Summer elegance defined. High-rise waist with fluid wide-leg silhouette that elongates legs gracefully.",
      price: 7499, discountPrice: 5499, rating: 4.7, numReviews: 160,
      id1: "photo-1509631179647-0177331693ae", id2: "photo-1550639525-c97d455acf70",
      tags: ["linen trousers", "pants", "womens fashion"]
    },
    {
      brand: "Levi's",
      name: "Levi's Original Trucker Denim Jacket",
      short: "The definitive denim jacket since 1967 in authentic light indigo wash.",
      desc: "Point collar, front button placket, button-flap chest pockets, and side welt hand pockets for an iconic silhouette.",
      price: 4999, discountPrice: 3499, rating: 4.8, numReviews: 390,
      id1: "photo-1529374255404-311a2a4f1fd9", id2: "photo-1544441893-675973e31985",
      tags: ["denim jacket", "levis", "womens fashion"]
    },
    {
      brand: "Cos",
      name: "COS Asymmetric Draped Mulberry Silk Blouse",
      short: "Fluid bias-cut pure silk with high draped cowl neck and french cuffs.",
      desc: "Architectural modern tailoring. Dramatic drape across shoulder that transforms simple slacks into high fashion.",
      price: 9999, discountPrice: 7499, rating: 4.8, numReviews: 88,
      id1: "photo-1485968579580-b6d095142e6e", id2: "photo-1490481651871-ab68de25d43d",
      tags: ["silk blouse", "cos", "womens fashion"]
    },
    {
      brand: "Club L London",
      name: "Club L London One-Shoulder Ruched Satin Gown",
      short: "Sculpting stretch satin with statement one-shoulder drape and split thigh.",
      desc: "Red-carpet worthy evening wear. Intricate side ruching hugs curves effortlessly while concealed zip ensures a glove-like fit.",
      price: 12999, discountPrice: 9499, rating: 4.9, numReviews: 130,
      id1: "photo-1568252542512-9fe8fe9c87bb", id2: "photo-1534126511673-b6899657816a",
      tags: ["gown", "satin", "evening", "womens fashion"]
    },
    {
      brand: "Whistles",
      name: "Whistles Tiered Ruffle Cotton Sundress",
      short: "Breezy broderie anglaise eyelet cotton with adjustable crossover straps.",
      desc: "Pure summer delight. Breathable scalloped hem with shirred bodice that expands comfortably for outdoor brunching.",
      price: 8499, discountPrice: 5999, rating: 4.7, numReviews: 145,
      id1: "photo-1515886657613-9f3515b0c78f", // will ensure uniqueness
      id2: "photo-1525507119028-ed4c629a60a3",
      tags: ["sundress", "summer", "womens fashion"]
    },
    {
      brand: "Karen Millen",
      name: "Karen Millen Structured Compact Knit Pencil Dress",
      short: "Engineered body-contouring yarn with military glossy gold button accents.",
      desc: "Designed to sculpt and flatter. Features square neckline, cap sleeves, and center-front zip for adjustable allure.",
      price: 15999, discountPrice: 11999, rating: 4.8, numReviews: 92,
      id1: "photo-1509631179647-0177331693ae",
      id2: "photo-1515372039744-b8f02a3ae446",
      tags: ["pencil dress", "formal", "womens fashion"]
    },
    {
      brand: "Sister Jane",
      name: "Sister Jane Jacquard Puff Sleeve Babydoll Mini Dress",
      short: "Opulent floral metallic jacquard with dramatic statement puff sleeves.",
      desc: "Whimsical luxury. Voluminous A-line silhouette with oversized faux-pearl buttons and deep side pockets.",
      price: 11499, discountPrice: 8499, rating: 4.8, numReviews: 78,
      id1: "photo-1558769132-cb1aea458c5e",
      id2: "photo-1539109136881-3be0616acf4b",
      tags: ["mini dress", "jacquard", "party", "womens fashion"]
    },
    {
      brand: "Sezane",
      name: "Sezane Gaspard Soft Mohair-Blend Button Jumper",
      short: "Iconic Parisian knit with mother-of-pearl buttons that can be worn front or back.",
      desc: "Light, warm, and delightfully fluffy mohair blend. Features gentle ribbing along round neckline and cuff edges.",
      price: 9999, discountPrice: 7499, rating: 4.9, numReviews: 215,
      id1: "photo-1434389677669-e08b4cac3105",
      id2: "photo-1576566588028-4147f3842f27",
      tags: ["knitwear", "jumper", "parisian", "womens fashion"]
    },
    {
      brand: "Biba",
      name: "Biba Embroidered Chanderi Silk Anarkali Suit Set",
      short: "Intricate zari threadwork on pure Chanderi silk with matching dupatta.",
      desc: "Festive grandeur with timeless poise. Includes flared floor-length kalidar kurta, churidar pants, and organza dupatta.",
      price: 12999, discountPrice: 8999, rating: 4.9, numReviews: 280,
      id1: "photo-1610030469983-98e550d6193c", id2: "photo-1583391733956-3750e0ff4e8b",
      tags: ["ethnic", "anarkali", "silk", "womens fashion"]
    },
    {
      brand: "Ritu Kumar",
      name: "Ritu Kumar Printed Georgette Kaftan Dress",
      short: "Heritage botanical digital prints on fluid georgette with tasseled waist tie.",
      desc: "Effortless resort glamour. Deep V-neckline adorned with delicate mirror-work and batwing kimono sleeves.",
      price: 9499, discountPrice: 6999, rating: 4.7, numReviews: 120,
      id1: "photo-1618244972963-dbee1a7edc95", id2: "photo-1550639525-c97d455acf70",
      tags: ["kaftan", "resortwear", "womens fashion"]
    },
    {
      brand: "Free People",
      name: "Free People Bohemian Embroidered Peasant Tunic",
      short: "Relaxed crinkle cotton gauze with colorful Aztec floral needlework.",
      desc: "Gypsy soul styling. Gathered keyhole neckline with braided ties, balloon sleeves, and scalloped hem.",
      price: 6999, discountPrice: 4999, rating: 4.6, numReviews: 165,
      id1: "photo-1534528741775-53994a69daeb", id2: "photo-1524504388940-b1c1722653e1",
      tags: ["boho", "tunic", "womens fashion"]
    },
    {
      brand: "Everlane",
      name: "Everlane The Way-High Drape Wide-Leg Pant",
      short: "Extra high-rise waist cut from breathable lightweight TENCEL Lyocell.",
      desc: "Feels like silk, wears like tailored wool. Designed with clean flat front, wide trouser legs, and deep slash pockets.",
      price: 7999, discountPrice: 5499, rating: 4.8, numReviews: 198,
      id1: "photo-1509631179647-0177331693ae",
      id2: "photo-1485968579580-b6d095142e6e",
      tags: ["trousers", "high waist", "womens fashion"]
    },
    {
      brand: "Guess",
      name: "Guess Marciano Metallic Ribbed Knit Bodycon Dress",
      short: "Shimmering gold lurex interwoven into sculpting ribbed knit with scoop back.",
      desc: "Turn heads at any night-out. Hugs curves seamlessly with comfortable stretch and mid-calf midi length.",
      price: 11999, discountPrice: 8499, rating: 4.8, numReviews: 145,
      id1: "photo-1566174053879-31528523f8ae",
      id2: "photo-1572804013309-59a88b7e92f1",
      tags: ["bodycon", "metallic", "party", "womens fashion"]
    }
  ]
};

console.log('Script initialized.');
