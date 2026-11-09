import React from 'react';
import { Star, Quote, CheckCircle } from 'lucide-react';
import RatingStars from '../common/RatingStars';

const reviews = [
    {
        name: 'Aarav Sharma',
        role: 'Software Architect at Bengaluru',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        content:
            'The Gemini AI shopping assistant on SmartCart is genuinely next level. I told it my budget and tech stack requirements, and it matched me with the MacBook Pro M3 and Bose headphones in seconds. Delivery was under 24 hours!',
        rating: 5,
        product: 'Apple MacBook Pro M3'
    },
    {
        name: 'Priya Iyer',
        role: 'Product Designer',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        content:
            'I compared 3 different smartwatches side by side using the Compare Tool. The matrix breakdown of battery life and health sensors made my decision so clear. Will never shop anywhere else.',
        rating: 5,
        product: 'Apple Watch Ultra 2'
    },
    {
        name: 'Rohan Mehra',
        role: 'Tech Content Creator',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        content:
            'Payment was instant with Razorpay, tracking was updated live at every checkpoint, and the packaging was ultra-premium. SmartCart sets the new standard for e-commerce in India.',
        rating: 5,
        product: 'Sony WH-1000XM5'
    }
];

const TestimonialsSection = () => {
    return (
        <section className="my-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                    Real Verified Shoppers
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
                    Loved by 250,000+ Customers
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Here is what engineers, designers, and tech enthusiasts say about shopping on SmartCart AI.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.map((rev, idx) => (
                    <div
                        key={idx}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-600/50 transition-all flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <RatingStars rating={rev.rating} size="sm" />
                                <Quote className="w-8 h-8 text-purple-200 dark:text-purple-900/60" />
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-6">
                                &quot;{rev.content}&quot;
                            </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-3">
                            <img
                                src={rev.avatar}
                                alt={rev.name}
                                className="w-11 h-11 rounded-full object-cover border-2 border-purple-500"
                            />
                            <div>
                                <div className="flex items-center space-x-1.5">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{rev.name}</h4>
                                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500 text-white" />
                                </div>
                                <p className="text-xs text-slate-400">{rev.role}</p>
                                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                                    Verified Purchase: {rev.product}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default TestimonialsSection;

