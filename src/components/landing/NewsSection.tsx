'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  coverImage: string;
  category: string;
  publishedDate: string;
  author: string;
  campusTag: string;
  featured: boolean;
  linkTo?: string;
}

export default function NewsSection({ news }: { news: NewsItem[] }) {
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

  return (
    <section id="news" className="py-16 bg-gradient-to-b from-white via-slate-50/70 to-slate-100/40 scroll-mt-16">
      <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h3 className="text-xs font-extrabold text-[#C41E3A] uppercase tracking-widest mb-3">Stay Updated</h3>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">News & Campus Updates</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] mx-auto rounded-full mb-4"></div>
          <p className="text-gray-600 max-w-2xl mx-auto font-medium">
            Read about student placements, faculty breakthroughs, and alumni milestones.
          </p>
        </div>

        {news.length > 6 ? (
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
              {news.map((item) => (
                <a
                  key={item.id}
                  href={item.linkTo || "https://ptu.ac.in/news-events"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full group w-[290px] md:w-[360px] flex-shrink-0 cursor-pointer"
                >
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img 
                      src={item.coverImage} 
                      alt={item.title} 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.featured && (
                      <span className="absolute top-4 left-4 bg-gradient-to-r from-[#C41E3A] to-[#e62648] text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full shadow">
                        ★ Featured
                      </span>
                    )}
                    <span className="absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                      {item.publishedDate} • By {item.author}
                    </div>
                    <h4 className="text-base font-extrabold text-gray-900 mb-3 group-hover:text-[#003D7A] transition-colors leading-snug line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-gray-650 text-xs leading-relaxed line-clamp-3 mb-6">
                      {item.summary}
                    </p>
                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-[#003D7A]">
                      <span>Read Full Story →</span>
                      <span className="text-slate-400 font-medium">📍 {item.campusTag}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {news.map((item) => (
              <a
                key={item.id}
                href={item.linkTo || "https://ptu.ac.in/news-events"}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full group w-full cursor-pointer"
              >
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img 
                    src={item.coverImage} 
                    alt={item.title} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  {item.featured && (
                    <span className="absolute top-4 left-4 bg-gradient-to-r from-[#C41E3A] to-[#e62648] text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full shadow">
                      ★ Featured
                    </span>
                  )}
                  <span className="absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded">
                    {item.category}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                    {item.publishedDate} • By {item.author}
                  </div>
                  <h4 className="text-base font-extrabold text-gray-900 mb-3 group-hover:text-[#003D7A] transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-gray-650 text-xs leading-relaxed line-clamp-3 mb-6">
                    {item.summary}
                  </p>
                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-[#003D7A]">
                    <span>Read Full Story →</span>
                    <span className="text-slate-400 font-medium">📍 {item.campusTag}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
