import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

import slide1Img from '../../assets/hero-carousel/slide1-maroon-sneakers.jpg';
import slide2Img from '../../assets/hero-carousel/slide2-sports-shoes.jpg';
import slide3Img from '../../assets/hero-carousel/slide3-smart-watches.jpg';
import slide4Img from '../../assets/hero-carousel/slide4-smartphones.png';
import slideSamsungImg from '../../assets/hero-carousel/slide-samsung-s25-ultra.png';
import slide5Img from '../../assets/hero-carousel/slide5-leather-jacket.png';
import slide6Img from '../../assets/hero-carousel/slide-ipads.png';
import slide7Img from '../../assets/hero-carousel/slide-macbook-air.png';
import slide8Img from '../../assets/hero-carousel/slide-gaming-laptop.png';
import slide9Img from '../../assets/hero-carousel/slide-luxury-handbag.jpg';
import slide10Img from '../../assets/hero-carousel/slide-skincare-serum.jpg';

const HERO_SLIDES = [
  {
    id: 'slide-1',
    title: 'Premium Sneakers',
    image: slide1Img,
    alt: 'Maroon premium sneakers with detailed stitching and sleek sole',
    link: '/products?category=Shoes',
  },
  {
    id: 'slide-2',
    title: 'Sports Shoes',
    image: slide2Img,
    alt: 'White performance sports shoes with gold accents',
    link: '/products?category=Shoes',
  },
  {
    id: 'slide-3',
    title: 'Smart Watches',
    image: slide3Img,
    alt: 'Modern smart watches with vibrant display and dual sport straps',
    link: '/products?category=Watches',
  },
  {
    id: 'slide-4',
    title: 'Apple iPhone 17 Pro',
    image: slide4Img,
    alt: 'Apple iPhone 17 Pro flagship smartphone with advanced camera system',
    link: '/products?category=Mobiles',
  },
  {
    id: 'slide-samsung-s25',
    title: 'Samsung Galaxy S25 Ultra',
    image: slideSamsungImg,
    alt: 'Samsung Galaxy S25 Ultra flagship smartphone with S-Pen stylus',
    link: '/products?category=Mobiles',
  },
  {
    id: 'slide-5',
    title: 'Leather Jackets',
    image: slide5Img,
    alt: 'Black biker leather jacket with quilted styling and zip accents',
    link: '/products?category=Men%20Collection',
  },
  {
    id: 'slide-6',
    title: 'iPad Pro & Air Tablets',
    image: slide6Img,
    alt: 'Apple iPad Pro and iPad Air tablets in modern sleek finishes',
    link: '/products?category=Electronics',
  },
  {
    id: 'slide-7',
    title: 'MacBook Air M-Series',
    image: slide7Img,
    alt: 'Ultra-thin Apple MacBook Air laptop with Liquid Retina display',
    link: '/products?category=Electronics',
  },
  {
    id: 'slide-8',
    title: 'Lenovo LOQ RTX 5050',
    image: slide8Img,
    alt: 'Lenovo LOQ RTX 5050 high-performance gaming laptop',
    link: '/products?category=Laptops',
  },
  {
    id: 'slide-9',
    title: 'Luxury Saffiano Handbag',
    image: slide9Img,
    alt: 'Italian Saffiano leather tote handbag for modern women',
    link: '/products?category=Bags',
  },
  {
    id: 'slide-10',
    title: 'Luxury Skincare Essentials',
    image: slide10Img,
    alt: 'Hydra-glow niacinamide dew drops beauty and skincare serum',
    link: '/products?category=Cosmetics',
  },
];

const AUTO_SLIDE_INTERVAL = 4000; // 4 seconds per slide as requested

const HeroProductCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  const goToNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrent((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  }, []);

  const goToSlide = (index) => {
    setCurrent(index);
  };

  // Automatic timer with hover pause & unmount cleanup
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      goToNext();
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [isPaused, goToNext]);

  // Touch swipe support for mobile devices
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    touchStartX.current = null;
  };

  const activeSlide = HERO_SLIDES[current];

  return (
    <div
      className="hero-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Featured Product Showcase"
    >
      {/* Main Image Viewport with Smooth Horizontal Sliding Track */}
      <div className="hero-carousel__viewport">
        <div
          className="hero-carousel__track"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className={`hero-carousel__slide ${index === current ? 'hero-carousel__slide--active' : ''}`}
              aria-hidden={index !== current}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                className="hero-carousel__img"
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
              />
            </div>
          ))}
        </div>

        {/* Previous Navigation Button */}
        <button
          type="button"
          onClick={goToPrev}
          className="hero-carousel__nav-btn hero-carousel__nav-btn--prev"
          aria-label="Previous product slide"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>

        {/* Next Navigation Button */}
        <button
          type="button"
          onClick={goToNext}
          className="hero-carousel__nav-btn hero-carousel__nav-btn--next"
          aria-label="Next product slide"
        >
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>

      {/* 10 Interactive Pagination Dots */}
      <div className="hero-carousel__dots" role="tablist" aria-label="Slide selectors">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === current;
          return (
            <button
              key={`dot-${slide.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Go to slide ${index + 1}: ${slide.title}`}
              onClick={() => goToSlide(index)}
              className={`hero-carousel__dot ${isActive ? 'hero-carousel__dot--active' : ''}`}
            />
          );
        })}
      </div>

      {/* Product Caption & Explore Button */}
      <div className="hero-carousel__caption">
        <span className="hero-carousel__caption-title">{activeSlide.title}</span>
        <Link
          to={activeSlide.link}
          className="hero-carousel__explore"
          aria-label={`Explore ${activeSlide.title}`}
        >
          <span>Explore</span>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};

export default HeroProductCarousel;
