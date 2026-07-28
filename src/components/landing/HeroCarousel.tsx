'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Slide {
  id: string;
  imageUrl: string;
  headline: string;
  subtext: string;
  ctaText: string;
  ctaLink: string;
}

export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides]);

  const handlePrev = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  if (!slides || slides.length === 0) return null;

  return (
    /* Mobile: 45vh height with min 280px so content is visible but not full screen.
       Desktop (md+): original 80vh with min 550px for immersive experience. */
    <div className="relative h-[45vh] min-h-[280px] md:h-[80vh] md:min-h-[550px] w-full overflow-hidden bg-slate-950">
      {/* Slides */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* Background Image — object-cover ensures it fills without distortion */}
          <div
            className={`absolute inset-0 bg-cover bg-center transition-transform duration-[6000ms] ease-out ${
              idx === current ? 'scale-105' : 'scale-100'
            }`}
            style={{ backgroundImage: `url(${slide.imageUrl})` }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/65 to-transparent" />

          {/* Slide Content — scaled down on mobile for compact hero */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-3xl text-white">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C41E3A] rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white mb-3 md:mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  IKGPTU Global Network
                </span>
                <h2 className="text-2xl sm:text-4xl md:text-6xl font-black mb-3 md:mb-6 leading-tight tracking-tight drop-shadow-md line-clamp-2 md:line-clamp-none">
                  {slide.headline}
                </h2>
                <p className="text-sm md:text-lg text-slate-200 mb-5 md:mb-10 leading-relaxed font-light max-w-xl hidden sm:block">
                  {slide.subtext}
                </p>
                <div className="flex flex-wrap gap-3 md:gap-4">
                  <Link
                    href="/alumni/login"
                    className="px-5 md:px-8 py-2.5 md:py-3.5 bg-gradient-to-r from-[#C41E3A] to-[#e62648] text-white font-extrabold rounded-xl hover:shadow-xl hover:shadow-red-900/30 transition-all duration-300 text-xs md:text-sm tracking-wide"
                  >
                    Are You Alumni?
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Slide Navigation Buttons */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 hover:border-white/50 transition-all duration-200 backdrop-blur-sm"
            aria-label="Previous Slide"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 hover:border-white/50 transition-all duration-200 backdrop-blur-sm"
            aria-label="Next Slide"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === current ? 'bg-white w-6 md:px-2' : 'bg-white/40 hover:bg-white/70 w-2.5'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
