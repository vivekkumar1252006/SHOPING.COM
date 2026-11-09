import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Coupon from '../models/Coupon.js';
import Review from '../models/Review.js';
import { sampleCategories, sampleProducts, sampleCoupons } from './sampleData.js';

const findOrCreateSeedUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) return existingUser;

  try {
    return await User.create(userData);
  } catch (error) {
    if (error.code !== 11000) throw error;
    const user = await User.findOne({ email: userData.email });
    if (!user) throw error;
    return user;
  }
};

export const seedDatabase = async () => {
  try {
    const productCount = await Product.countDocuments();
    if (productCount > 0) {
      console.log(`📦 Database already contains ${productCount} products. Skipping seeding to preserve existing data.`);
      return;
    }

    console.log('🌱 Empty database detected. Seeding initial catalog & verified demo accounts...');

    await Category.deleteMany();
    await Category.insertMany(sampleCategories);

    await findOrCreateSeedUser({
      name: 'shoping.com Admin',
      email: 'admin@shoping.com',
      password: 'Admin@123',
      role: 'admin',
      isVerified: true,
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      addresses: [
        {
          fullName: 'shoping.com HQ Admin',
          phone: '+91 98765 43210',
          street: 'DLF Cyber City, Tower 10',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122002',
          country: 'India',
          isDefault: true,
        },
      ],
    });

    const customerUser = await findOrCreateSeedUser({
      name: 'Rohan Sharma',
      email: 'customer@shoping.com',
      password: 'Customer@123',
      role: 'customer',
      isVerified: true,
      phone: '+91 98765 12345',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      addresses: [
        {
          fullName: 'Rohan Sharma',
          phone: '+91 98765 12345',
          street: 'Flat 402, Green Glen Layout, Bellandur',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560103',
          country: 'India',
          isDefault: true,
        },
      ],
    });

    // Also support smartcart.ai aliases
    await findOrCreateSeedUser({
      name: 'SmartCart Admin',
      email: 'admin@smartcart.ai',
      password: 'Admin@123',
      role: 'admin',
      isVerified: true,
    });
    await findOrCreateSeedUser({
      name: 'Alex Johnson',
      email: 'customer@smartcart.ai',
      password: 'Customer@123',
      role: 'customer',
      isVerified: true,
    });

    await Product.deleteMany();
    const createdProducts = await Product.insertMany(sampleProducts);

    await Coupon.deleteMany();
    await Coupon.insertMany(sampleCoupons);

    await Review.deleteMany();
    if (createdProducts.length > 1) {
      await Review.create({
        product: createdProducts[1]._id,
        user: customerUser._id,
        name: customerUser.name,
        rating: 5,
        title: 'Premium build quality & super fast delivery',
        comment: 'Ultra premium packaging and lightning-fast delivery. Quality exceeded expectations!',
        verifiedPurchase: true,
        helpfulVotes: 12,
      });
    }

    console.log(`🎉 shoping.com Database seeding complete! Seeded ${createdProducts.length} products & verified demo accounts.`);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  }
};
