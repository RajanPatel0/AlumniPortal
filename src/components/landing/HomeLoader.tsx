'use client';

import { useEffect, useState } from 'react';

export default function HomeLoader() {
  const [mounted, setMounted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [display, setDisplay] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Start fade out at 1.2s
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1200);

    // Completely unmount loader at 1.8s
    const destroyTimer = setTimeout(() => {
      setDisplay(false);
    }, 1800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(destroyTimer);
    };
  }, []);

  if (!mounted || !display) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#012140] transition-all duration-700 ease-in-out ${
        fadeOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Radial ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(196,30,58,0.2)_0%,transparent_60%)] animate-pulse" />

      <div className="relative flex flex-col items-center max-w-sm px-6 text-center space-y-6 z-10">
        {/* Pulsing Shield */}
        <div className="relative w-28 h-28 rounded-3xl bg-white flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.15)] border-2 border-white/20 p-4 transition-transform hover:scale-105 duration-300">
          <img src="/icon.png" alt="IKGPTU Logo" className="w-18 h-18 object-contain" />
          <div className="absolute inset-0 rounded-3xl border-2 border-[#C41E3A] animate-ping opacity-60" />
        </div>

        {/* Text Brand */}
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white tracking-widest uppercase">IKGPTU</h2>
          <p className="text-xs font-bold text-red-500 tracking-[0.3em] uppercase">Alumni Connect</p>
        </div>

        {/* Custom Progress Line */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 bg-[#C41E3A] rounded-full w-24 animate-[shimmer_1.5s_infinite_ease-in-out]" />
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { left: -50%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
