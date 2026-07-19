'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AlumSpotlight {
  id: string;
  name: string;
  photo: string;
  batch: number;
  branch: string;
  designation: string;
  company: string;
  bio: string;
  linkedIn: string;
}

export default function SpotlightSection({ notableAlumni }: { notableAlumni: AlumSpotlight[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!notableAlumni || notableAlumni.length === 0) return null;

  return (
    <section id="spotlight" className="py-24 bg-gradient-to-b from-white via-blue-50/15 to-white scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="text-xs font-extrabold text-[#C41E3A] uppercase tracking-widest mb-3">Hall of Fame</h3>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Alumni Spotlight</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] mx-auto rounded-full mb-4"></div>
          <p className="text-gray-655 max-w-2xl mx-auto font-medium">
            Celebrating our distinguished alumni leading global enterprise domains and pathbreaking research cells.
          </p>
        </div>

        {notableAlumni.length > 6 ? (
          <div className="relative group/scroll px-1">
            {/* Scroll Buttons */}
            <button
              type="button"
              onClick={() => scroll('left')}
              className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-[#003D7A] hover:text-white text-slate-800 p-3 rounded-full shadow-xl border border-slate-100/80 z-20 opacity-0 group-hover/scroll:opacity-100 transition-all duration-300 hover:scale-110 flex items-center justify-center backdrop-blur-sm cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} className="stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-[#003D7A] hover:text-white text-slate-800 p-3 rounded-full shadow-xl border border-slate-100/80 z-20 opacity-0 group-hover/scroll:opacity-100 transition-all duration-300 hover:scale-110 flex items-center justify-center backdrop-blur-sm cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} className="stroke-[2.5]" />
            </button>

            {/* Horizontal Scroll Grid (2 rows, col flow) */}
            <div
              ref={scrollRef}
              className="grid grid-rows-2 grid-flow-col gap-6 md:gap-8 overflow-x-auto scroll-smooth scrollbar-none pb-6 -mx-4 px-4 sm:mx-0 sm:px-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {notableAlumni.map((alum) => (
                <div 
                  key={alum.id}
                  className="bg-white rounded-3xl border border-slate-100 p-6 shadow-md hover:shadow-xl hover:shadow-[#003D7A]/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col text-center w-[285px] md:w-[360px] flex-shrink-0"
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-2 border-slate-200 bg-slate-50 relative p-0.5 bg-gradient-to-tr from-[#003D7A] to-[#C41E3A]">
                    <img 
                      src={alum.photo} 
                      alt={alum.name} 
                      className="w-full h-full object-cover rounded-full bg-white"
                    />
                  </div>
                  <h4 className="text-base font-bold text-gray-900">{alum.name}</h4>
                  <p className="text-xs font-medium text-[#C41E3A] uppercase tracking-wider mt-0.5">
                    Class of {alum.batch} | {alum.branch}
                  </p>
                  <div className="my-3 text-xs bg-slate-50 border border-slate-100 rounded-lg py-1.5 px-3 inline-block mx-auto font-semibold text-gray-700">
                    {alum.designation} @ <span className="text-[#003D7A]">{alum.company}</span>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed font-light my-4 line-clamp-3">
                    "{alum.bio}"
                  </p>
                  <a 
                    href={alum.linkedIn}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto pt-4 text-xs font-bold text-[#003D7A] hover:text-[#C41E3A] transition-colors flex items-center justify-center gap-1.5"
                  >
                    Connect on LinkedIn ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-6 md:grid md:grid-cols-3 md:gap-8 pb-4 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] -mx-4 px-4 sm:mx-0 sm:px-0">
            {notableAlumni.map((alum) => (
              <div 
                key={alum.id}
                className="bg-white rounded-3xl border border-slate-100 p-6 shadow-md hover:shadow-xl hover:shadow-[#003D7A]/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col text-center w-[285px] flex-shrink-0 md:w-auto"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-2 border-slate-200 bg-slate-50 relative p-0.5 bg-gradient-to-tr from-[#003D7A] to-[#C41E3A]">
                  <img 
                    src={alum.photo} 
                    alt={alum.name} 
                    className="w-full h-full object-cover rounded-full bg-white"
                  />
                </div>
                <h4 className="text-base font-bold text-gray-900">{alum.name}</h4>
                <p className="text-xs font-medium text-[#C41E3A] uppercase tracking-wider mt-0.5">
                  Class of {alum.batch} | {alum.branch}
                </p>
                <div className="my-3 text-xs bg-slate-50 border border-slate-100 rounded-lg py-1.5 px-3 inline-block mx-auto font-semibold text-gray-700">
                  {alum.designation} @ <span className="text-[#003D7A]">{alum.company}</span>
                </div>
                <p className="text-gray-550 text-xs leading-relaxed font-light my-4 line-clamp-3">
                  "{alum.bio}"
                </p>
                <a 
                  href={alum.linkedIn}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto pt-4 text-xs font-bold text-[#003D7A] hover:text-[#C41E3A] transition-colors flex items-center justify-center gap-1.5"
                >
                  Connect on LinkedIn ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
