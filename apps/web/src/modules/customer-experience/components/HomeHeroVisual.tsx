import React from 'react';
import { ShieldCheck, Wrench } from 'lucide-react';

/**
 * Clean automotive brake rotor and parts illustration for the HomePage hero section.
 * Rendered as inline SVG so it loads reliably offline and across all viewports.
 */
export const HomeHeroVisual: React.FC = () => {
  return (
    <div
      className="relative flex items-center justify-center w-full max-w-[280px] sm:max-w-[320px] mx-auto select-none"
      aria-hidden="true"
    >
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-slate-800/70 border border-slate-700/80 flex items-center justify-center shadow-lg">
        <svg
          viewBox="0 0 240 240"
          className="w-48 h-48 sm:w-56 sm:h-56 text-slate-300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer brake rotor ring */}
          <circle cx="120" cy="120" r="96" stroke="#475569" strokeWidth="10" fill="#1E293B" />
          <circle cx="120" cy="120" r="82" stroke="#64748B" strokeWidth="2" strokeDasharray="6 6" />
          <circle cx="120" cy="120" r="64" stroke="#334155" strokeWidth="2" />

          {/* Cross-drilled rotor ventilation holes */}
          <circle cx="120" cy="48" r="3.5" fill="#94A3B8" />
          <circle cx="171" cy="69" r="3.5" fill="#94A3B8" />
          <circle cx="192" cy="120" r="3.5" fill="#94A3B8" />
          <circle cx="171" cy="171" r="3.5" fill="#94A3B8" />
          <circle cx="120" cy="192" r="3.5" fill="#94A3B8" />
          <circle cx="69" cy="171" r="3.5" fill="#94A3B8" />
          <circle cx="48" cy="120" r="3.5" fill="#94A3B8" />
          <circle cx="69" cy="69" r="3.5" fill="#94A3B8" />

          {/* Brake caliper accent */}
          <path
            d="M174 52C196 72 206 96 206 124C206 138 202 150 194 162L168 148C174 139 177 130 177 120C177 102 170 86 156 72L174 52Z"
            fill="#2563EB"
            stroke="#60A5FA"
            strokeWidth="2"
          />

          {/* Center hub & lug bolts */}
          <circle cx="120" cy="120" r="40" fill="#0F172A" stroke="#475569" strokeWidth="3" />
          <circle cx="120" cy="120" r="16" fill="#1E293B" stroke="#3B82F6" strokeWidth="2.5" />
          <circle cx="120" cy="94" r="4" fill="#CBD5E1" />
          <circle cx="145" cy="112" r="4" fill="#CBD5E1" />
          <circle cx="135" cy="141" r="4" fill="#CBD5E1" />
          <circle cx="105" cy="141" r="4" fill="#CBD5E1" />
          <circle cx="95" cy="112" r="4" fill="#CBD5E1" />
        </svg>

        {/* Floating trust pills */}
        <div className="absolute -bottom-2 -left-2 bg-slate-950/95 border border-slate-700 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-200 whitespace-nowrap">
            Verified Fitment
          </span>
        </div>

        <div className="absolute -top-2 -right-2 bg-slate-950/95 border border-slate-700 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-md">
          <Wrench className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-200 whitespace-nowrap">
            OEM &amp; Aftermarket
          </span>
        </div>
      </div>
    </div>
  );
};
