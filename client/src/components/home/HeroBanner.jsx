import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, ShieldCheck, Truck } from 'lucide-react';
import HeroProductCarousel from './HeroProductCarousel';

const HeroBanner = ({ onOpenAIModal }) => (
  <section className="premium-hero">
    <div className="premium-hero__copy">
      <p className="premium-hero__eyebrow">EVERYDAY FINDS, THOUGHTFULLY CHOSEN</p>
      <h1>
        Find Goods .<br />Better everyday shopping.
      </h1>
      <p className="premium-hero__description">
        Explore customer favourites, new arrivals, and useful picks for every part of your day.
      </p>
      <div className="premium-hero__actions">
        <Link to="/products" className="premium-button premium-button--primary">
          Shop now all products <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <button type="button" className="premium-button premium-button--quiet" onClick={onOpenAIModal}>
          <Bot size={17} aria-hidden="true" /> Smart search
        </button>
      </div>
      <div className="premium-hero__benefits" aria-label="Shopping benefits">
        <span><Truck size={16} aria-hidden="true" /> Convenient delivery</span>
        <span><ShieldCheck size={16} aria-hidden="true" /> Secure checkout</span>
      </div>
    </div>
    <HeroProductCarousel />
  </section>
);

export default HeroBanner;
