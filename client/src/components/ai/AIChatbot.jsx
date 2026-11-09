import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, Loader2, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/slices/cartSlice';
import { aiApi } from '../../services/api';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "👋 Hi! I'm **Nova**, your shoping.com Personal Shopping Concierge. Looking for tech recommendations, budget deals, or product comparisons? How can I help you today?",
      suggestedProducts: []
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    const newHistory = [...messages, { role: 'user', text: userMsg }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await aiApi.chat({
        message: userMsg,
        conversationHistory: newHistory.map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.text
        }))
      });

      const data = res.data.data;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply,
          suggestedProducts: data.suggestedProducts || []
        }
      ]);
    } catch (err) {
      console.error('AI chat error', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "I'm having a little trouble connecting right now, but I'm still here! Please check out our trending electronics and wearable collections.",
          suggestedProducts: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q) => {
    setInput(q);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center space-x-2 py-3 px-5 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <div className="relative">
              <Bot className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
            </div>
            <span className="font-bold text-sm tracking-wide">Ask shoping.com</span>
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
          </button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[95vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-extrabold text-sm tracking-tight">Nova AI Concierge</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-amber-300">
                  Powered by Google Gemini Pro
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-medium rounded-br-none shadow-md shadow-amber-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-bl-none shadow-sm border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Suggested product cards inside chat */}
                {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                  <div className="mt-2.5 w-full space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Recommended Matches:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.suggestedProducts.map((p) => (
                        <div
                          key={p._id}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between shadow-sm"
                        >
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            <img
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                              alt={p.title}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                            />
                            <div className="overflow-hidden">
                              <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {p.title}
                              </h5>
                              <span className="text-xs font-extrabold text-amber-500 dark:text-amber-400">
                                ₹{p.price?.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0 ml-2">
                            <button
                              onClick={() => dispatch(addToCart({ ...p, quantity: 1 }))}
                              className="p-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                              title="Add to cart"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </button>
                            <Link
                              to={`/products/${p._id}`}
                              onClick={() => setIsOpen(false)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-500"
                              title="View details"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-28">
                <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                <span className="text-xs text-slate-500 font-medium">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length === 1 && (
            <div className="p-2.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-1.5 overflow-x-auto text-xs">
              {[
                'Best laptops under ₹1,50,000?',
                'Noise cancelling headphones',
                'What coupons are active?'
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickQuestion(q)}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-amber-500 shrink-0 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about our products..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-bold shadow-md transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
