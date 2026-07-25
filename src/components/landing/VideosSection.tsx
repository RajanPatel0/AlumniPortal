'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  videoUrl: string;
  description?: string | null;
}

export default function VideosSection({ videos }: { videos: VideoItem[] }) {
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

  if (!videos || videos.length === 0) return null;

  return (
    <section id="videos" className="py-16 bg-gradient-to-b from-slate-50/50 to-white scroll-mt-16 border-t border-slate-100">
      <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h3 className="text-xs font-extrabold text-[#C41E3A] uppercase tracking-widest mb-3">Watch & Relive</h3>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Alumni Videos</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] mx-auto rounded-full mb-4"></div>
          <p className="text-gray-650 max-w-2xl mx-auto font-medium">
            Explore event diaries, campus tours, and guest lectures from our distinguished alumni community.
          </p>
        </div>

        {videos.length > 6 ? (
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
              {videos.map((video) => (
                <div 
                  key={video.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full group w-[290px] md:w-[480px] flex-shrink-0"
                >
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                    <video 
                      src={video.videoUrl} 
                      controls
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h4 className="text-base font-extrabold text-gray-900 mb-2 leading-snug">
                      {video.title}
                    </h4>
                    {video.description && (
                      <p className="text-gray-650 text-xs leading-relaxed line-clamp-2">
                        {video.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {videos.map((video) => (
              <div 
                key={video.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full group"
              >
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                  <video 
                    src={video.videoUrl} 
                    controls
                    preload="metadata"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h4 className="text-base font-extrabold text-gray-900 mb-2 leading-snug">
                    {video.title}
                  </h4>
                  {video.description && (
                    <p className="text-gray-650 text-xs leading-relaxed line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
