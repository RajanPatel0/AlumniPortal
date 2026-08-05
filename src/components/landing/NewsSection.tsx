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

// Shared news card UI
function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.linkTo || 'https://ptu.ac.in/news-events'}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full group cursor-pointer"
    >
      <div className="relative aspect-[16/10] md:aspect-[16/9] w-full bg-slate-100 overflow-hidden flex-shrink-0">
        <img
          src={item.coverImage}
          alt={item.title}
          className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
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
      <div className="p-4 md:p-6 flex flex-col flex-grow">
        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
          {item.publishedDate} • By {item.author}
        </div>
        <h4 className="text-sm md:text-base font-extrabold text-gray-900 mb-2 md:mb-3 group-hover:text-[#003D7A] transition-colors leading-snug line-clamp-2">
          {item.title}
        </h4>
        <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 md:line-clamp-3 mb-4 md:mb-6 font-medium">
          {item.summary}
        </p>
        <div className="mt-auto pt-3 md:pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-[#003D7A]">
          <span className="group-hover:text-[#C41E3A] transition-colors">Read Full Story →</span>
          <span className="text-slate-500 font-bold">📍 {item.campusTag}</span>
        </div>
      </div>
    </a>
  );
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
    <section id="news" className="py-12 md:py-16 bg-gradient-to-b from-white via-slate-50/70 to-slate-100/40 scroll-mt-16">
      <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-10">
          <h3 className="text-xs font-extrabold text-[#C41E3A] uppercase tracking-widest mb-3">Stay Updated</h3>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">News &amp; Campus Updates</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] mx-auto rounded-full mb-4" />
          <p className="text-slate-600 max-w-2xl mx-auto font-medium">
            Read about student placements, faculty breakthroughs, and alumni milestones.
          </p>
        </div>

        {/* ── MOBILE: Always 2-row horizontal scroll with always-visible nav buttons ── */}
        <div className="md:hidden relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">{news.length} articles</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="bg-white hover:bg-[#003D7A] hover:text-white text-slate-800 p-2 rounded-full shadow-md border border-slate-200 transition-all duration-200 flex items-center justify-center"
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} className="stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="bg-white hover:bg-[#003D7A] hover:text-white text-slate-800 p-2 rounded-full shadow-md border border-slate-200 transition-all duration-200 flex items-center justify-center"
                aria-label="Scroll right"
              >
                <ChevronRight size={16} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
          <div
            ref={scrollRef}
            className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto scroll-smooth scrollbar-none pb-4 -mx-4 px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {news.map((item) => (
              <div key={item.id} className="w-[260px] flex-shrink-0">
                <NewsCard item={item} />
              </div>
            ))}
          </div>
        </div>

        {/* ── DESKTOP: Scroll if >6, otherwise grid ── */}
        {news.length > 6 ? (
          <div className="hidden md:block relative group/scroll px-2 sm:px-4">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 bg-white hover:bg-[#003D7A] text-[#003D7A] hover:text-white p-3.5 sm:p-4 rounded-full shadow-2xl border-2 border-slate-200/90 z-30 transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} className="stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 bg-white hover:bg-[#003D7A] text-[#003D7A] hover:text-white p-3.5 sm:p-4 rounded-full shadow-2xl border-2 border-slate-200/90 z-30 transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} className="stroke-[3]" />
            </button>
            <div
              ref={scrollRef}
              className="grid grid-rows-2 grid-flow-col gap-6 md:gap-8 overflow-x-auto scroll-smooth scrollbar-none pb-6"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {news.map((item) => (
                <div key={item.id} className="w-[360px] flex-shrink-0">
                  <NewsCard item={item} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {news.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
