import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const HomeHeroVisual: React.FC = () => {
  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-700/80 bg-[#1C2433] shadow-sm">
      <img
        src="/hero-wheel.jpg"
        alt="Forged alloy wheel with ventilated brake rotor and caliper"
        className="w-full aspect-[4/3] object-cover block"
      />
      <div className="px-4 py-3 bg-[#1C2433]/95 border-t border-slate-700/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-200 font-medium">
          <ShieldCheck className="w-4 h-4 text-[#FB2C36] shrink-0" aria-hidden="true" />
          <span>OEM &amp; Aftermarket Verified Fitment</span>
        </div>
        <span className="text-xs text-slate-400 shrink-0">Sri Lanka</span>
      </div>
    </div>
  );
};
