import React from 'react';
import { Continent } from '../types';

interface IconProps {
  continent: Continent;
  className?: string;
}

export const ContinentIcon: React.FC<IconProps> = ({ continent, className = 'w-8 h-8' }) => {
  switch (continent) {
    case 'All':
      return (
        <div className={`relative flex items-center justify-center p-2 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] ${className}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-cyan-300 animate-spin-slow">
            <circle cx="12" cy="12" r="9" strokeWidth="1.5" strokeDasharray="3 3" />
            <ellipse cx="12" cy="12" rx="9" ry="4" strokeWidth="1.5" />
            <path d="M12 3v18" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        </div>
      );

    case 'Europe':
      return (
        <div className={`relative flex items-center justify-center p-2 rounded-2xl bg-gradient-to-br from-blue-600/20 to-yellow-500/20 border border-blue-400/40 shadow-[0_0_15px_rgba(59,130,246,0.3)] ${className}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            {/* Stars ring */}
            <circle cx="12" cy="4" r="1" fill="#facc15" />
            <circle cx="18" cy="7" r="1" fill="#facc15" />
            <circle cx="20" cy="12" r="1" fill="#facc15" />
            <circle cx="18" cy="17" r="1" fill="#facc15" />
            <circle cx="12" cy="20" r="1" fill="#facc15" />
            <circle cx="6" cy="17" r="1" fill="#facc15" />
            <circle cx="4" cy="12" r="1" fill="#facc15" />
            <circle cx="6" cy="7" r="1" fill="#facc15" />
            {/* Compass emblem */}
            <path d="M12 7l1.5 3.5L17 12l-3.5 1.5L12 17l-1.5-3.5L7 12l3.5-1.5L12 7z" fill="#60a5fa" />
          </svg>
        </div>
      );

    case 'Africa':
      return (
        <div className={`relative flex items-center justify-center p-2 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-600/20 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.3)] ${className}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            {/* Glowing Safari Sun */}
            <circle cx="12" cy="9" r="5" fill="#f59e0b" opacity="0.8" />
            {/* Mountain contour */}
            <path d="M3 18l5-7 4 5 5-8 4 10H3z" fill="#059669" opacity="0.9" />
            <path d="M10 18l3-4 4 4" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'Asia':
      return (
        <div className={`relative flex items-center justify-center p-2 rounded-2xl bg-gradient-to-br from-rose-500/20 to-purple-600/20 border border-rose-400/40 shadow-[0_0_15px_rgba(244,63,94,0.3)] ${className}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            {/* Sun */}
            <circle cx="12" cy="8" r="4" fill="#f43f5e" />
            {/* Pagoda roof silhouettes */}
            <path d="M6 19h12M7 16h10M8 13h8M12 8v5" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 19c2-1 4-1 6-1s4 0 6 1" stroke="#e879f9" strokeWidth="1.5" />
          </svg>
        </div>
      );

    case 'North America':
      return (
        <div className={`relative flex items-center justify-center p-2 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 border border-indigo-400/40 shadow-[0_0_15px_rgba(99,102,241,0.3)] ${className}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            {/* Eagle Wings / Shield */}
            <path d="M12 3l8 4-8 14L4 7l8-4z" stroke="#818cf8" strokeWidth="1.5" fill="#1e1b4b" fillOpacity="0.6" />
            {/* Star */}
            <path d="M12 7l1.2 2.5 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4L12 7z" fill="#38bdf8" />
          </svg>
        </div>
      );

    case 'South America':
      return (
        <div className={`relative flex items-center justify-center p-2 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] ${className}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            {/* Tropical Leaf */}
            <path d="M12 3c5 0 9 4 9 9 0 5-4 9-9 9-5 0-9-4-9-9 0-5 4-9 9-9z" fill="#047857" opacity="0.4" />
            <path d="M12 3c4 3 6 7 6 11 0 4-2 7-6 7s-6-3-6-7c0-4 2-8 6-11z" fill="#10b981" />
            <path d="M12 3v18M12 8l4 3M12 12l-4 3M12 15l4 3" stroke="#a7f3d0" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'Oceania':
      return (
        <div className={`relative flex items-center justify-center p-2 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-400/40 shadow-[0_0_15px_rgba(20,184,166,0.3)] ${className}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            {/* Pacific Wave Swell */}
            <path d="M2 16c3-3 6-3 9 0s6 3 9 0" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M2 11c3-3 6-3 9 0s6 3 9 0" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
            {/* Southern Cross Star */}
            <circle cx="16" cy="5" r="1.5" fill="#38bdf8" />
            <circle cx="18" cy="8" r="1.2" fill="#38bdf8" />
            <circle cx="14" cy="9" r="1" fill="#38bdf8" />
          </svg>
        </div>
      );

    default:
      return null;
  }
};
