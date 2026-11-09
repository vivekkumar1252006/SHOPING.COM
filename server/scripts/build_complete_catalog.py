# server/scripts/build_complete_catalog.py
import json
import os

def unsplash(photo_id):
    return f"https://images.unsplash.com/{photo_id}?auto=format&fit=crop&w=1200&q=85"

categories = [
    {
        "name": "Men's Fashion",
        "slug": "mens-fashion",
        "description": "Tailored suits, blazers, jackets, premium denim & shirts",
        "icon": "Shirt",
        "image": unsplash("photo-1594938298603-c8148c4dae35"),
        "featured": True
    },
    {
        "name": "Women's Fashion",
        "slug": "womens-fashion",
        "description": "Designer dresses, evening gowns, blazers & silk tops",
        "icon": "Sparkles",
        "image": unsplash("photo-1515886657613-9f3515b0c78f"),
        "featured": True
    },
    {
        "name": "Kids Collection",
        "slug": "kids-collection",
        "description": "Soft organic cotton rompers, party dresses & hoodies",
        "icon": "Baby",
        "image": unsplash("photo-1519457431-44ccd64a579b"),
        "featured": True
    },
    {
        "name": "Cosmetics",
        "slug": "cosmetics",
        "description": "High-pigment lipsticks, blushes, foundations & beauty items",
        "icon": "Sparkles",
        "image": unsplash("photo-1522337360788-8b13dee7a37e"),
        "featured": True
    },
    {
        "name": "Skincare",
        "slug": "skincare",
        "description": "Dermatologist-tested serums, moisturizers & sunscreens",
        "icon": "Heart",
        "image": unsplash("photo-1556228720-195a672e8a03"),
        "featured": True
    },
    {
        "name": "Makeup Kits",
        "slug": "makeup-kits",
        "description": "Vanity boxes, 35-shade palettes & professional brush sets",
        "icon": "Palette",
        "image": unsplash("photo-1512496015851-a90fb38ba796"),
        "featured": True
    },
    {
        "name": "Watches",
        "slug": "watches",
        "description": "Luxury automatic chronographs, sapphire crystal & smartwatches",
        "icon": "Watch",
        "image": unsplash("photo-1523275335684-37898b6baf30"),
        "featured": True
    },
    {
        "name": "Shoes",
        "slug": "shoes",
        "description": "Performance running shoes, sneakers, brogues & boots",
        "icon": "Footprints",
        "image": unsplash("photo-1542291026-7eec264c27ff"),
        "featured": True
    },
    {
        "name": "Smartphones",
        "slug": "smartphones",
        "description": "Flagship 5G smartphones, Pro camera systems & foldables",
        "icon": "Smartphone",
        "image": unsplash("photo-1511707171634-5f897ff02aa9"),
        "featured": True
    },
    {
        "name": "Bags",
        "slug": "bags",
        "description": "Italian leather tote bags, commuter backpacks & duffels",
        "icon": "ShoppingBag",
        "image": unsplash("photo-1548036328-c9fa89d128fa"),
        "featured": True
    },
    {
        "name": "Perfumes",
        "slug": "perfumes",
        "description": "Luxury Eau de Parfum, rare oud mist, citrus & woody scents",
        "icon": "Wind",
        "image": unsplash("photo-1592945403244-b3fbafd7f539"),
        "featured": True
    },
    {
        "name": "Water Bottles",
        "slug": "water-bottles",
        "description": "Double-wall vacuum insulated bottles, gym flasks & tumblers",
        "icon": "CupSoda",
        "image": unsplash("photo-1602143407151-7111542de6e8"),
        "featured": True
    },
    {
        "name": "Headphones",
        "slug": "headphones",
        "description": "Studio monitors, ANC wireless headphones & hi-res earbuds",
        "icon": "Headphones",
        "image": unsplash("photo-1505740420928-5e560c06d30e"),
        "featured": True
    },
    {
        "name": "Laptops",
        "slug": "laptops",
        "description": "Ultralight aluminum ultrabooks & RTX gaming workstations",
        "icon": "Laptop",
        "image": unsplash("photo-1496181133206-80ce9b88a853"),
        "featured": True
    },
    {
        "name": "Sunglasses",
        "slug": "sunglasses",
        "description": "UV400 polarized aviators & luxury designer frames",
        "icon": "Glasses",
        "image": unsplash("photo-1511499767150-a48a237f0083"),
        "featured": True
    },
    {
        "name": "Home Decor",
        "slug": "home-decor",
        "description": "Nordic ceramic vases, ambient lighting & aesthetic accents",
        "icon": "Home",
        "image": unsplash("photo-1513519245088-0e12902e5a38"),
        "featured": True
    },
    {
        "name": "Fitness",
        "slug": "fitness",
        "description": "Dumbbell sets, yoga mats, resistance bands & training gear",
        "icon": "Dumbbell",
        "image": unsplash("photo-1517838277536-f5f99be501cd"),
        "featured": True
    },
    {
        "name": "Jewellery",
        "slug": "jewellery",
        "description": "18K gold-plated necklaces, diamond bracelets & solitaire rings",
        "icon": "Crown",
        "image": unsplash("photo-1515562141207-7a88fb7ce338"),
        "featured": True
    }
]

coupons = [
    {
        "code": "WELCOME10",
        "discountPercentage": 10,
        "maxDiscountAmount": 500,
        "minOrderAmount": 999,
        "validUntil": "2028-12-31T23:59:59.000Z",
        "isActive": True
    },
    {
        "code": "FESTIVE25",
        "discountPercentage": 25,
        "maxDiscountAmount": 2500,
        "minOrderAmount": 2999,
        "validUntil": "2028-12-31T23:59:59.000Z",
        "isActive": True
    },
    {
        "code": "SUPER50",
        "discountPercentage": 50,
        "maxDiscountAmount": 5000,
        "minOrderAmount": 6999,
        "validUntil": "2028-12-31T23:59:59.000Z",
        "isActive": True
    },
    {
        "code": "FREESHIP",
        "discountPercentage": 100,
        "maxDiscountAmount": 150,
        "minOrderAmount": 499,
        "validUntil": "2028-12-31T23:59:59.000Z",
        "isActive": True
    }
]

# We will read product definitions from a clean JSON catalog data file
print("Categories and coupons ready.")
