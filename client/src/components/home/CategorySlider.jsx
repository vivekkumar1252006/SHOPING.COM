import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Shirt,
  Smartphone,
  Sparkles,
  Watch,
  Footprints,
  Laptop,
  ShoppingBag,
  Wind,
  Baby,
  Gem,
} from 'lucide-react';

const categories = [
  { name: 'Electronics',       icon: Laptop,       category: 'Electronics' },
  { name: 'Mobiles',           icon: Smartphone,   category: 'Mobiles' },
  { name: "Men's Wear",        icon: Shirt,        category: 'Men Collection' },
  { name: "Women's Wear",      icon: Gem,          category: 'Women Collection' },
  { name: 'Kids',              icon: Baby,         category: 'Children Collection' },
  { name: 'Shoes',             icon: Footprints,   category: 'Shoes' },
  { name: 'Watches',           icon: Watch,        category: 'Watches' },
  { name: 'Beauty',            icon: Sparkles,     category: 'Cosmetics' },
  { name: 'Bags',              icon: ShoppingBag,  category: 'Bags' },
  { name: 'Perfumes',          icon: Wind,         category: 'Perfumes' },
];

const CategorySlider = () => (
  <section className="premium-categories" aria-labelledby="category-title">
    <div className="premium-section-heading">
      <div>
        <p>Browse by department</p>
        <h2 id="category-title">Shop by Category</h2>
      </div>
      <Link to="/products" className="premium-shelf__link">
        View all <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </div>
    <div className="premium-categories__grid">
      {categories.map(({ name, icon: Icon, category }) => (
        <Link
          key={name}
          to={`/products?category=${encodeURIComponent(category)}`}
          className="premium-category"
        >
          <span>
            <Icon size={20} aria-hidden="true" />
          </span>
          <strong>{name}</strong>
          <ChevronRight size={15} aria-hidden="true" />
        </Link>
      ))}
    </div>
  </section>
);

export default CategorySlider;
