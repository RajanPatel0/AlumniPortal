'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WelcomeNote {
  id?: string;
  title: string;
  body: string;
  photo: string;
  name: string;
  designation: string;
}

export default function LeadershipWelcomeSection({
  welcomeNotes,
}: {
  welcomeNotes: WelcomeNote[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const AUTO_SCROLL_DELAY_MS = 4000;

  const resetAutoScroll = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => (prev === welcomeNotes.length - 1 ? 0 : prev + 1));
    }, AUTO_SCROLL_DELAY_MS);
  };

  useEffect(() => {
    if (welcomeNotes.length <= 1) return;

    resetAutoScroll();

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [welcomeNotes.length]);

  if (!welcomeNotes || welcomeNotes.length === 0) return null;

  const current = welcomeNotes[currentIndex] || welcomeNotes[0];
  const hasMultiple = welcomeNotes.length > 1;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? welcomeNotes.length - 1 : prev - 1));
    resetAutoScroll();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === welcomeNotes.length - 1 ? 0 : prev + 1));
    resetAutoScroll();
  };

  return (
    <section id="leadership" className="scroll-mt-16 py-12 md:py-16 bg-gradient-to-b from-white via-slate-50/60 to-white relative overflow-hidden">
      <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header bar with navigation controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <span className="inline-block px-3.5 py-1 bg-[#003D7A]/5 border border-[#003D7A]/10 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-[#003D7A]">
              Message from Leadership
            </span>
          </div>

          {/* Navigation controls — always visible on all screen sizes */}
          {hasMultiple && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">
                {currentIndex + 1} of {welcomeNotes.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-[#003D7A] hover:border-[#003D7A] hover:bg-slate-50 transition shadow-sm cursor-pointer"
                  aria-label="Previous Message"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-[#003D7A] hover:border-[#003D7A] hover:bg-slate-50 transition shadow-sm cursor-pointer"
                  aria-label="Next Message"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Layout: Clean card with full leader photo + leader details & message below */}
        <div className="block lg:hidden">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
            {/* Leader Photo — ample height & top object positioning so face is clearly visible */}
            <div className="relative h-72 sm:h-80 w-full bg-slate-100 overflow-hidden">
              <img
                key={current.photo || current.name}
                src={current.photo}
                alt={current.name}
                className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Leader Details Header Bar */}
            <div className="px-5 pt-4 pb-2 border-b border-slate-100 bg-slate-50/70">
              <h4 className="font-extrabold text-slate-900 text-lg leading-tight">{current.name}</h4>
              <p className="text-xs text-[#C41E3A] font-bold uppercase tracking-wider mt-0.5">
                {current.designation}
              </p>
            </div>

            {/* Message content */}
            <div className="p-5">
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight leading-snug">
                {current.title}
              </h2>
              <div
                className="text-gray-600 text-sm leading-relaxed font-light"
                dangerouslySetInnerHTML={{ __html: current.body }}
              />
            </div>
          </div>
        </div>

        {/* Desktop Layout: Original 12-column grid */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-12 items-center min-h-[380px]">
          {/* Message Text */}
          <div className="lg:col-span-7 transition-all duration-300">
            <h2 className="text-3xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
              {current.title}
            </h2>
            <div
              className="text-gray-600 text-sm leading-relaxed font-light mb-8 max-w-prose"
              dangerouslySetInnerHTML={{ __html: current.body }}
            />
            <div>
              <h4 className="font-extrabold text-gray-900 text-base">{current.name}</h4>
              <p className="text-xs text-[#C41E3A] font-bold uppercase tracking-wider mt-0.5">
                {current.designation}
              </p>
            </div>
          </div>

          {/* Leadership Photo Card with Layered Offset Borders */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="absolute -inset-2.5 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] rounded-[2.5rem] blur opacity-15 -rotate-1 scale-95" />
            <div className="absolute -top-3 -left-3 w-16 h-16 border-t-4 border-l-4 border-[#C41E3A] rounded-tl-3xl hidden sm:block" />
            <div className="absolute -bottom-3 -right-3 w-16 h-16 border-b-4 border-r-4 border-[#003D7A] rounded-br-3xl hidden sm:block" />
            <div className="relative p-3.5 bg-white border border-slate-100 rounded-[2.2rem] shadow-2xl max-w-sm w-full z-10 transition-transform duration-300 hover:scale-[1.02]">
              <div className="relative h-96 w-full rounded-3xl overflow-hidden bg-slate-50">
                <img
                  key={current.photo || current.name}
                  src={current.photo}
                  alt={current.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Carousel indicators if multiple */}
        {hasMultiple && (
          <div className="flex justify-center gap-2 mt-6 md:mt-8">
            {welcomeNotes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  resetAutoScroll();
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-8 bg-[#003D7A]' : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Go to message ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
