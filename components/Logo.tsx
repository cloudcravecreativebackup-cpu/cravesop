
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-10" }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 
        The "Operational Link" Icon 
        - Top arc (Blue) represents the CloudCrave foundation.
        - Bottom arc (Cyan) represents the Ops/Execution flow.
        - Interlocking geometry symbolizes connectivity.
      */}
      <div className="relative flex-shrink-0">
        <svg 
          viewBox="0 0 100 100" 
          className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-md" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>
          
          {/* Cloud Shape */}
          <path 
            d="M25 70C15 70 10 60 10 50C10 35 25 30 35 30C40 15 60 10 75 25C90 25 95 40 90 55C95 65 90 80 75 80C65 80 60 75 55 70" 
            stroke="url(#logo-gradient)" 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          
          {/* Network Triangle */}
          <g transform="translate(35, 40) scale(0.6)">
            <circle cx="50" cy="20" r="12" fill="url(#logo-gradient)" />
            <circle cx="20" cy="70" r="12" fill="url(#logo-gradient)" />
            <circle cx="80" cy="70" r="12" fill="url(#logo-gradient)" />
            <line x1="50" y1="20" x2="20" y2="70" stroke="url(#logo-gradient)" strokeWidth="6" />
            <line x1="50" y1="20" x2="80" y2="70" stroke="url(#logo-gradient)" strokeWidth="6" />
            <line x1="20" y1="70" x2="80" y2="70" stroke="url(#logo-gradient)" strokeWidth="6" />
          </g>
        </svg>
      </div>

      <div className="flex flex-col justify-center">
        <h1 className="font-black text-slate-800 dark:text-white tracking-tighter leading-none text-xl sm:text-2xl flex items-baseline">
          <span>Crave</span>
          <span className="text-brand-cyan ml-0.5 italic">Ops</span>
        </h1>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-[2px] w-3 bg-brand-blue rounded-full"></div>
          <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
            Deliverables Intel v1.0
          </span>
        </div>
      </div>
    </div>
  );
};

export default Logo;
