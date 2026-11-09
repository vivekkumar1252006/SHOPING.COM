import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import loginVideo from '../../assets/animation-loginpages.mp4';
import logoImg from '../../assets/logo.jpg';

/**
 * Shoping.com Auth Split Layout
 * Features:
 * 1. Original Animated Video playing continuously on the left side
 * 2. Premium White & Golden-Yellow Color Theme:
 *    - Background: Soft warm white (#FFFDF7) & Light cream (#FFF8E8)
 *    - Accents: Golden Yellow (#F4C542 / #F5C542)
 *    - Card: Pure White with subtle warm beige borders and soft golden shadows
 *    - Text: Dark charcoal (#252525) & Soft grey (#777777)
 */
const AuthSplitLayout = ({ children, maxFormWidth = 'max-w-[430px]' }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="auth-page min-h-[calc(100vh-140px)] w-full flex items-center justify-center py-8 sm:py-14 px-4 sm:px-6 lg:px-10 xl:px-14 relative overflow-hidden bg-gradient-to-br from-[#FFFDF7] via-[#FFFDF7] to-[#FFF8E8] text-[#252525]">
      
      {/* Subtle Warm Golden Ambient Glows in Background (Complements the Video without blocking it) */}
      <div className="absolute -top-28 -left-28 w-[450px] h-[450px] bg-gradient-to-br from-[#F4C542]/15 via-[#FFF8E8]/50 to-transparent blur-[110px] rounded-full pointer-events-none z-0" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-gradient-to-tl from-[#F4C542]/18 via-[#FFF8E8]/60 to-transparent blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 bg-[radial-gradient(circle,rgba(244,197,66,0.10)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Top Floating Brand Logo for Quick Navigation */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-10 z-20 hidden sm:flex items-center gap-2 select-none">
        <Link
          to="/"
          className="inline-block p-2 px-3.5 rounded-2xl bg-white shadow-sm border border-[#E9DFC9] hover:border-[#F4C542] hover:shadow-md transition-all duration-200"
        >
          <img src={logoImg} alt="shoping.com" className="h-8 sm:h-9 w-auto object-contain" />
        </Link>
      </div>

      {/* Main Split Container */}
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 relative z-10 my-2">
        
        {/* LEFT SIDE: Original Animated Delivery Video (Bright, continuous loop, fully visible) */}
        <div className="w-full lg:flex-[1.15] max-w-lg lg:max-w-[530px] flex items-center justify-center lg:justify-start shrink-0 relative bg-transparent">
          <div className="relative w-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="w-full h-auto max-h-[460px] lg:max-h-[520px] object-contain select-none drop-shadow-[0_15px_35px_rgba(244,197,66,0.20)] border-none outline-none bg-transparent"
              src={loginVideo}
            >
              <source src={loginVideo} type="video/mp4" />
              <source src="/videos/animation-loginpages.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* RIGHT SIDE: Clean White & Golden Yellow Authentication Card */}
        <div className={`w-full lg:flex-[0.88] ${maxFormWidth} shrink-0 flex justify-center lg:justify-end z-20`}>
          {children}
        </div>

      </div>
    </div>
  );
};

export default AuthSplitLayout;
