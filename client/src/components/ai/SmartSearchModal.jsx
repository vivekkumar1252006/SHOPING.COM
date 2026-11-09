import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, X, ArrowRight, Loader2, Tag, TrendingUp, Sliders } from 'lucide-react';
import { aiApi } from '../../services/api';

const SmartSearchModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // all | ai
    const navigate = useNavigate();
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
            setResults(null);
        }
    }, [isOpen]);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const res = await aiApi.smartSearch(query.trim());
            setResults(res.data.data);
        } catch (err) {
            console.error('Smart search error', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProduct = (productId) => {
        onClose();
        navigate(`/products/${productId}`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-start justify-center pt-20 px-4">
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                SmartCart AI Semantic Search
                            </h3>
                            <p className="text-xs text-slate-500">
                                Search in plain English (e.g. &quot;wireless noise cancelling headphones under ₹15000 for travel&quot;)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Input bar */}
                <form onSubmit={handleSearch} className="mt-4 relative">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 dark:text-purple-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Describe what you want to buy..."
                        className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none transition-all shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <span>AI Search</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </>
                        )}
                    </button>
                </form>

                {/* Quick sample prompts */}
                {!results && !loading && (
                    <div className="mt-6 space-y-3">
                        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                            <span>Try intelligent prompts:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                'Best laptop for coding and video editing under ₹150000',
                                'Wireless noise cancelling headphones for gym and flights',
                                'Smart watch with heart rate and sleep tracking battery life',
                                'Gaming accessories under ₹5000'
                            ].map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setQuery(prompt);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs text-left hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                                >
                                    &quot;{prompt}&quot;
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Results view */}
                {results && (
                    <div className="mt-6 space-y-4 max-h-96 overflow-y-auto pr-1">
                        {/* AI Reasoning pill */}
                        {results.aiReasoning && (
                            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 text-xs text-slate-700 dark:text-slate-200 flex items-start space-x-2.5">
                                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-purple-700 dark:text-purple-300">SmartCart AI Insight: </span>
                                    {results.aiReasoning}
                                </div>
                            </div>
                        )}

                        {results.products?.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                No direct matches found. Try broadening your query or check spelling.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {results.products?.map((prod) => (
                                    <div
                                        key={prod._id}
                                        onClick={() => handleSelectProduct(prod._id)}
                                        className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-colors group"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={prod.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120'}
                                                alt={prod.title}
                                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                                            />
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                                                    {prod.title}
                                                </h4>
                                                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                                                    <span>{prod.brand}</span>
                                                    <span>•</span>
                                                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                                                        ₹{prod.price?.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartSearchModal;

