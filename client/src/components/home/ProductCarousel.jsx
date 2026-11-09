import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../product/ProductCard';

const AUTO_SLIDE_INTERVAL = 3500;
const CLONE_COUNT = 6;

const ProductCarousel = ({ eyebrow, title, description, products, loading, href = '/products' }) => {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const dragRef = useRef(null);
  const draggedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const cloneCount = Math.min(products.length, CLONE_COUNT);

  const getStep = () => {
    const track = trackRef.current;
    const firstItem = track?.firstElementChild;
    if (!track || !firstItem) return 0;
    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
    return firstItem.getBoundingClientRect().width + gap;
  };

  useLayoutEffect(() => {
    const track = trackRef.current;
    const step = getStep();
    if (track && step > 0) track.scrollLeft = step * cloneCount;
  }, [cloneCount, loading, products.length]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '120px' }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (loading || isPaused || !isVisible || products.length < 2) return undefined;

    const timer = window.setInterval(() => {
      const track = trackRef.current;
      const step = getStep();
      if (track && step > 0) track.scrollBy({ left: step, behavior: 'smooth' });
    }, AUTO_SLIDE_INTERVAL);

    return () => window.clearInterval(timer);
  }, [isPaused, isVisible, loading, products.length]);

  const handleScroll = () => {
    const track = trackRef.current;
    const step = getStep();
    if (!track || !step || products.length < 2) return;

    const realStart = cloneCount * step;
    const realWidth = products.length * step;
    if (track.scrollLeft < realStart - step / 2) {
      track.scrollLeft += realWidth;
    } else if (track.scrollLeft >= realStart + realWidth) {
      track.scrollLeft -= realWidth;
    }
  };

  const scrollByCard = (direction) => {
    const track = trackRef.current;
    const step = getStep();
    if (track && step > 0) track.scrollBy({ left: step * direction, behavior: 'smooth' });
  };

  const handlePointerDown = (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    if (event.target.closest('button, a, input, select, textarea, [role="button"]')) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: event.currentTarget.scrollLeft,
    };
    draggedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const distance = event.clientX - dragRef.current.startX;
    if (Math.abs(distance) > 4) draggedRef.current = true;
    if (draggedRef.current) event.currentTarget.scrollLeft = dragRef.current.startScroll - distance;
  };

  const handlePointerUp = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (draggedRef.current) {
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 0);
    }
  };

  return (
    <section
      className="product-carousel"
      ref={sectionRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
    >
      <div className="product-carousel__heading">
        <div className="product-carousel__title-group">
          {eyebrow && <p className="product-carousel__eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
          {description && <p className="product-carousel__description">{description}</p>}
        </div>
        <div className="product-carousel__controls">
          <Link to={href} className="product-carousel__view-all">
            View all
          </Link>
          <button
            type="button"
            className="product-carousel__arrow"
            onClick={() => scrollByCard(-1)}
            aria-label={`Previous ${title}`}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="product-carousel__arrow"
            onClick={() => scrollByCard(1)}
            aria-label={`Next ${title}`}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {loading ? (
        <div
          className="product-carousel__track product-carousel__track--loading"
          aria-label={`Loading ${title}`}
        >
          {Array.from({ length: 5 }, (_, index) => (
            <div className="store-product-skeleton" key={index} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div
          className="product-carousel__track"
          ref={trackRef}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClickCapture={(event) => {
            if (draggedRef.current) {
              event.preventDefault();
              event.stopPropagation();
              draggedRef.current = false;
            }
          }}
          onDragStart={(event) => event.preventDefault()}
          aria-label={`${title} products`}
        >
          {[
            ...products.slice(-cloneCount),
            ...products,
            ...products.slice(0, cloneCount),
          ].map((product, index) => (
            <div className="product-carousel__item" key={`${product._id}-${index}`}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <p className="product-carousel__empty">
          No products are available in this collection yet.
        </p>
      )}
    </section>
  );
};

export default ProductCarousel;
