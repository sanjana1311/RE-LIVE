
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-4 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200">
      <div className="flex items-center gap-3">
        {/* Logo: Time Loop + Frame */}
        <div className="relative w-8 h-8">
           <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <defs>
                 <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c084fc" /> {/* Lavender */}
                    <stop offset="50%" stopColor="#f472b6" /> {/* Blush */}
                    <stop offset="100%" stopColor="#fbbf24" /> {/* Gold */}
                 </linearGradient>
              </defs>
              {/* The "Time Loop": A circle arc that spirals inward */}
              <path 
                d="M 16 4 A 12 12 0 1 0 28 16" 
                stroke="url(#logo-gradient)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                className="opacity-90"
              />
              {/* The "Frame": A square corner completing the loop, symbolizing the panel */}
              <path 
                d="M 28 16 V 26 H 18" 
                stroke="url(#logo-gradient)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="opacity-90"
              />
           </svg>
        </div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
          RE:LIVE
        </h1>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-stone-400 uppercase tracking-widest">
        <span>AI Powered Studio</span>
      </div>
    </header>
  );
};

export default Header;
