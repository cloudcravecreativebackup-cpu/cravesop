
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
          className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-sm" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Foundation Arc (CloudCrave Blue) */}
          <path 
            d="M30 40C30 25 45 15 60 15C75 15 85 25 85 40C85 55 75 65 60 65" 
            stroke="#1D4ED8" 
            strokeWidth="11" 
            strokeLinecap="round" 
          />
          <circle cx="30" cy="40" r="6" fill="#1D4ED8" />

          {/* Operational Arc (CraveOps Cyan) */}
          <path 
            d="M70 60C70 75 55 85 40 85C25 85 15 75 15 60C15 45 25 35 40 35" 
            stroke="#38BDF8" 
            strokeWidth="11" 
            strokeLinecap="round" 
            style={{ mixBlendMode: 'multiply' }}
          />
          <circle cx="70" cy="60" r="6" fill="#38BDF8" />

          {/* Center Point - The "Eye of Operations" */}
          <circle cx="45" cy="50" r="3" fill="white" className="dark:fill-slate-900" />
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
