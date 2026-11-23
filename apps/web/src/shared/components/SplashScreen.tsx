import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  // Phase: 'in' → 'hold' → 'out' → done
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    // Fade-in completes at ~600ms, then hold, then fade-out
    const holdTimer = setTimeout(() => setPhase('hold'), 700);
    const outTimer  = setTimeout(() => setPhase('out'),  2200);
    const doneTimer = setTimeout(() => onDone(),          2900);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(outTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-700 ${
        phase === 'out' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Logo mark */}
      <div
        className={`flex flex-col items-center gap-4 transition-all duration-700 ${
          phase === 'in' ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Icon badge */}
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 text-white"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>

        {/* Wordmark — single text node so tests matching 'AUTO' and 'DOCK' in the header still find exactly one each */}
        <div className="text-center">
          <div className="text-4xl font-bold tracking-tight leading-none select-none">
            <span className="text-white">Auto</span><span className="text-blue-500">Dock</span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 tracking-widest uppercase font-medium">
            Genuine Parts LK
          </p>
        </div>

        {/* Animated progress bar */}
        <div className="mt-6 w-32 h-0.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full"
            style={{
              width: phase === 'in' ? '0%' : '100%',
              transition: phase === 'in' ? 'none' : 'width 1.4s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  );
};
