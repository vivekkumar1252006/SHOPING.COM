import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      lowercase: true,
      index: true,
    },
    shortDescription: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      default: 0,
      min: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Please specify a brand'],
      trim: true,
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    countInStock: {
      type: Number,
      required: [true, 'Please add stock count'],
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
      index: true,
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
      index: true,
    },
    specifications: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    tags: [String],
    aiKeywords: [String],
  },
  {
    timestamps: true,
  }
);

productSchema.pre('save', function (next) {
  if (this.price > 0 && this.discountPrice > 0 && this.discountPrice < this.price) {
    this.discountPercentage = Math.round(((this.price - this.discountPrice) / this.price) * 100);
  } else if (!this.discountPrice || this.discountPrice >= this.price) {
    this.discountPrice = this.price;
    this.discountPercentage = 0;
  }
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  next();
});

productSchema.index({ category: 1, discountPrice: 1 });
productSchema.index({ brand: 1, category: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  category: 'text',
  tags: 'text',
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
