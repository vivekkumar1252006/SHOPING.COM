import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Clock, ArrowRight, Sparkles } from 'lucide-react';

const DealsCountdown = () => {
  // 12 hours countdown loop
  const [timeLeft, setTimeLeft] = useState({
    hours: 11,
    minutes: 42,
    seconds: 19
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="my-14 rounded-3xl bg-gradient-to-r from-amber-900 via-indigo-900 to-slate-900 p-8 sm:p-12 text-white border border-amber-800/40 shadow-2xl relative overflow-hidden">
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold uppercase tracking-wider mb-3">
            <Flame className="w-3.5 h-3.5 text-red-400 fill-red-400 animate-bounce" />
            <span>AI Flash Deal of the Day</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Up to 50% Off On Premium Tech
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mt-2">
            Limited stock flash offers automatically matched by our AI pricing engine. Apply code <code className="text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600">FLAT50</code> at checkout for flat ₹500 off.
          </p>
        </div>

        {/* Timer Box */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-slate-950/80 rounded-2xl border border-amber-400/30 backdrop-blur-md">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-amber-300 uppercase font-semibold">Hours</span>
            </div>
            <span className="text-2xl font-black text-amber-400">:</span>
            <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-slate-950/80 rounded-2xl border border-amber-400/30 backdrop-blur-md">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-amber-300 uppercase font-semibold">Minutes</span>
            </div>
            <span className="text-2xl font-black text-amber-400">:</span>
            <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-slate-950/80 rounded-2xl border border-amber-400/30 backdrop-blur-md">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-amber-300 uppercase font-semibold">Seconds</span>
            </div>
          </div>

          <Link
            to="/products"
            className="py-3.5 px-6 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm shadow-xl flex items-center space-x-2 transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <span>Claim Flash Deals</span>
            <ArrowRight className="w-4 h-4 text-amber-500" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DealsCountdown;
