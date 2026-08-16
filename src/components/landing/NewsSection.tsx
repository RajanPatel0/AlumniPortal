'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar, User, MapPin, ExternalLink, Info } from 'lucide-react';

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
function NewsCard({
  item,
  setSelectedNews,
}: {
  item: NewsItem;
  setSelectedNews: (news: NewsItem) => void;
}) {
  return (
    <div
      onClick={() => setSelectedNews(item)}
      className="bg-gradient-to-b from-white via-sky-50/20 to-white rounded-3xl overflow-hidden border border-sky-100 shadow-md hover:shadow-xl hover:shadow-blue-900/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full group cursor-pointer relative"
    >
      {/* Decorative top accent gradient bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#003D7A] via-sky-400 to-[#C41E3A]" />

      <div className="relative aspect-[16/10] md:aspect-[16/9] w-full bg-slate-100 overflow-hidden flex-shrink-0">
        <img
          src={item.coverImage}
          alt={item.title}
          className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
        />
        {item.featured && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-[#C41E3A] to-[#e62648] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-white/20">
            ★ Featured
          </span>
        )}
        <span className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-lg border border-white/20 shadow-md">
          {item.category}
        </span>
      </div>

      <div className="p-5 md:p-6 flex flex-col flex-grow">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider mb-2.5 text-sky-800">
          <span className="inline-flex items-center gap-1.5 bg-sky-50 border border-sky-200/60 px-2 py-1 rounded-md">
            <Calendar size={12} className="text-[#003D7A]" />
            <span>{item.publishedDate}</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1.5 bg-sky-50 border border-sky-200/60 px-2 py-1 rounded-md">
            <User size={12} className="text-[#003D7A]" />
            <span>By {item.author}</span>
          </span>
        </div>

        <h4 className="text-base md:text-lg font-black text-slate-900 mb-2 md:mb-3 group-hover:text-[#003D7A] transition-colors leading-snug line-clamp-2">
          {item.title}
        </h4>
        <p className="text-slate-600 text-xs md:text-sm leading-relaxed line-clamp-2 md:line-clamp-3 mb-4 font-medium">
          {item.summary}
        </p>

        <div className="mt-auto pt-4 border-t border-sky-100/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNews(item);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#003D7A] to-[#012140] group-hover:from-[#C41E3A] group-hover:to-[#e62648] text-white text-xs font-extrabold shadow-sm transition-all duration-300 flex items-center gap-1 cursor-pointer flex-shrink-0"
          >
            <span>Read Story</span>
            <span className="text-xs">→</span>
          </button>
          <span className="text-slate-600 font-bold text-xs truncate max-w-[130px]">📍 {item.campusTag}</span>
        </div>
      </div>
    </div>
  );
}

export default function NewsSection({ news }: { news: NewsItem[] }) {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
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
    <section id="news" className="py-14 md:py-18 bg-gradient-to-b from-white via-sky-50/40 to-slate-50/60 scroll-mt-16 border-b border-sky-100/50">
      <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-10">
          <h3 className="text-xs font-extrabold text-[#C41E3A] uppercase tracking-widest mb-3">Stay Updated</h3>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">News &amp; Campus Updates</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] mx-auto rounded-full mb-4" />
          <p className="text-slate-600 max-w-4xl mx-auto text-xs sm:text-sm md:text-base font-medium leading-relaxed">
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
              <div key={item.id} className="w-[280px] flex-shrink-0">
                <NewsCard item={item} setSelectedNews={setSelectedNews} />
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
                  <NewsCard item={item} setSelectedNews={setSelectedNews} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {news.map((item) => (
              <NewsCard key={item.id} item={item} setSelectedNews={setSelectedNews} />
            ))}
          </div>
        )}

        {/* ── NEWS ARTICLE DETAILS MODAL ── */}
        {selectedNews && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-start justify-center z-[9999] pt-20 sm:pt-24 pb-8 px-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 relative my-auto max-h-[85vh] flex flex-col">
              {/* Dual-Layer Banner Header (No Cropping / No Zooming) */}
              <div className="relative h-56 sm:h-72 w-full bg-slate-950 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {/* Background Ambient Blur */}
                <img
                  src={selectedNews.coverImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/20 pointer-events-none" />

                {/* Foreground Image - Complete Aspect Ratio with Object Contain */}
                <img
                  src={selectedNews.coverImage}
                  alt={selectedNews.title}
                  className="relative z-10 w-full h-full object-contain p-2"
                />

                {/* Floating Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-20">
                  {selectedNews.featured && (
                    <span className="bg-gradient-to-r from-[#C41E3A] to-[#e62648] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-white/20">
                      ★ Featured
                    </span>
                  )}
                  <span className="bg-slate-900/85 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 shadow-md">
                    {selectedNews.category}
                  </span>
                </div>

                {/* Floating Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedNews(null)}
                  className="absolute top-4 right-4 bg-slate-900/80 hover:bg-[#C41E3A] text-white p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all z-20 shadow-lg cursor-pointer"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-grow text-slate-800">
                {/* Article Title */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight mb-1">
                    {selectedNews.title}
                  </h2>
                </div>
                {/* Meta Pills */}
                <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 text-sky-900 font-bold">
                    <Calendar size={15} className="text-[#003D7A]" />
                    <span>{selectedNews.publishedDate}</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5 text-sky-900 font-bold">
                    <User size={15} className="text-[#003D7A]" />
                    <span>By {selectedNews.author}</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <MapPin size={15} className="text-[#C41E3A]" />
                    <span>{selectedNews.campusTag}</span>
                  </div>
                </div>

                {/* Full Article Content */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#003D7A] mb-2 flex items-center gap-1.5">
                    <Info size={15} /> Article Summary &amp; Bulletin
                  </h4>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
                    {selectedNews.summary}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedNews(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
                >
                  Close
                </button>

                <a
                  href={selectedNews.linkTo || 'https://ptu.ac.in/news-events'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#003D7A] to-[#012140] hover:from-[#C41E3A] hover:to-[#e62648] text-white font-extrabold text-xs shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Visit Article Page</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

