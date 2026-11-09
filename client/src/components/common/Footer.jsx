import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone, MapPin, Heart } from 'lucide-react';
import logoImg from '../../assets/logo.jpg';
import ipadImg from '../../assets/hero-carousel/slide-ipads.png';
import macbookImg from '../../assets/hero-carousel/slide-macbook-air.png';
import gamingLaptopImg from '../../assets/hero-carousel/slide-gaming-laptop.png';

const promoCards = [
  {
    title: 'iPad Pro & iPad Air',
    tag: 'Apple Tablets',
    desc: 'Pro performance, Apple Pencil support, and stunning Liquid Retina displays.',
    image: ipadImg,
    alt: 'Apple iPad Pro and iPad Air',
    link: '/products?category=Electronics',
    cta: 'Explore iPads',
  },
  {
    title: 'MacBook Air M-Series',
    tag: 'Laptops & Ultrabooks',
    desc: 'Supercharged with Apple Silicon, silent fanless speed, and all-day battery.',
    image: macbookImg,
    alt: 'Apple MacBook Air',
    link: '/products?category=Electronics',
    cta: 'Explore MacBooks',
  },
  {
    title: 'Lenovo LOQ Gaming',
    tag: 'Gaming Laptops',
    desc: 'High-refresh rate displays, dedicated GPU power, and advanced thermal cooling.',
    image: gamingLaptopImg,
    alt: 'Lenovo LOQ Gaming Laptop',
    link: '/products?category=Electronics',
    cta: 'Explore Gaming',
  },
];

const Footer = () => {
  return (
    <footer className="store-footer text-slate-800 pt-16 pb-12 border-t">
      {/* 3 Featured Tech Showcase Cards (Replaced Trust Badges) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {promoCards.map((item, idx) => (
            <Link
              key={idx}
              to={item.link}
              className="group relative flex flex-col justify-between bg-white/95 hover:bg-white rounded-3xl border-2 border-amber-200/90 hover:border-amber-400 p-6 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {item.desc}
                </p>
              </div>

              <div className="my-5 h-44 sm:h-48 flex items-center justify-center p-3 rounded-2xl bg-[#faf6ee] group-hover:bg-[#f5eedc] transition-colors">
                <img
                  src={item.image}
                  alt={item.alt}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
                  loading="lazy"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-amber-100 text-sm font-semibold text-amber-700 group-hover:text-amber-900">
                <span>{item.cta}</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-amber-300/80">
        <div className="md:col-span-2 space-y-4">
          <Link to="/" className="inline-block p-2.5 rounded-2xl bg-white shadow-md border border-amber-200 hover:scale-[1.02] transition-transform">
            <img src={logoImg} alt="shoping.com" className="h-14 sm:h-16 w-auto object-contain" />
          </Link>
          <p className="text-sm text-slate-700 leading-relaxed max-w-sm">
            Experience modern everyday shopping on <strong>shoping.com</strong>. Genuine branded products, ultra-fast doorstep dispatch, and secure digital checkout.
          </p>
          <div className="flex items-center space-x-3 text-slate-700 text-sm">
            <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
            <span>shoping.com HQ, Cyber City, Gurugram, India</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-700 text-sm">
            <Phone className="w-4 h-4 text-amber-600 shrink-0" />
            <span>+91 (800) 420-SMART (Toll-Free)</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-700 text-sm">
            <Mail className="w-4 h-4 text-amber-600 shrink-0" />
            <span>support@shoping.com</span>
          </div>
        </div>

        <div>
          <h5 className="font-black text-slate-950 mb-4 text-sm uppercase tracking-wider">Quick Links</h5>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/products" className="text-slate-700 hover:text-amber-700 font-medium transition-colors">All Products</Link></li>
            <li><Link to="/products?category=Mobiles" className="text-slate-700 hover:text-amber-700 font-medium transition-colors">Mobiles</Link></li>
            <li><Link to="/products?category=Clothes" className="text-slate-700 hover:text-amber-700 font-medium transition-colors">Clothes & Fashion</Link></li>
            <li><Link to="/products?category=Shoes" className="text-slate-700 hover:text-amber-700 font-medium transition-colors">Shoes Collection</Link></li>
            <li><Link to="/products?category=Watches" className="text-slate-700 hover:text-amber-700 font-medium transition-colors">Watches</Link></li>
            <li><Link to="/track-order" className="text-slate-700 hover:text-amber-700 font-medium transition-colors">Live Order Tracking</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-black text-slate-950 mb-4 text-sm uppercase tracking-wider">Customer Portal</h5>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/profile" className="text-slate-700 hover:text-amber-700 font-medium transition-colors">My Profile</Link></li>
            <li><Link to="/profile?tab=orders" className="text-slate-700 hover:text-amber-700 font-medium transition-colors">Order History</Link></li>
            <li><Link to="/wishlist" className="text-slate-700 hover:text-amber-700 font-medium transition-colors">Saved Wishlist</Link></li>
            <li><Link to="/cart" className="text-slate-700 hover:text-amber-700 font-medium transition-colors">Shopping Cart</Link></li>
            <li><Link to="/admin" className="text-amber-800 hover:text-amber-900 font-bold transition-colors">Admin Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-black text-slate-950 mb-4 text-sm uppercase tracking-wider">Newsletter</h5>
          <p className="text-xs text-slate-600 mb-3">
            Subscribe for flash deals, coupon drops, and new arrival alerts.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed to shoping.com newsletter!'); }} className="space-y-2">
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-amber-300 text-slate-900 placeholder-slate-400 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              Get 20% Off Coupon
            </button>
          </form>
          <div className="mt-4 flex items-center space-x-2 text-[11px] text-slate-600">
            <span>Use coupon:</span>
            <code className="text-amber-950 font-mono font-bold bg-amber-200/80 px-2 py-0.5 rounded border border-amber-300">
              WELCOME20
            </code>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-600 space-y-4 md:space-y-0">
        <p className="flex items-center">
          © {new Date().getFullYear()} shoping.com Inc. Built with{' '}
          <Heart className="w-3.5 h-3.5 text-amber-600 mx-1 fill-amber-500" /> for modern intelligent shopping.
        </p>
        <div className="flex items-center space-x-6">
          <span className="hover:text-amber-800 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-amber-800 cursor-pointer">Terms of Service</span>
          <span className="hover:text-amber-800 cursor-pointer">Security Center</span>
          <span className="text-amber-800 font-mono font-bold">v2.0-Production</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
