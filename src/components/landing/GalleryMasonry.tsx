'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GalleryItem {
  id: string;
  image: string;
  caption: string;
  album: string;
  uploadDate: string;
  displayOrder: number;
}

export default function GalleryMasonry({ items }: { items: GalleryItem[] }) {
  const [selectedAlbum, setSelectedAlbum] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Extract unique album names dynamically
  const albums = ['All', ...Array.from(new Set(items.map((item) => item.album)))];

  const sortedItems = [...items].sort((a, b) => a.displayOrder - b.displayOrder);

  const filteredItems = sortedItems.filter((item) => {
    if (selectedAlbum === 'All') return true;
    return item.album === selectedAlbum;
  });

  const currentItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth * 0.75
        : scrollLeft + clientWidth * 0.75;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handlePrev = useCallback(() => {
    if (lightboxIndex === null || filteredItems.length === 0) return;
    setLightboxIndex(lightboxIndex === 0 ? filteredItems.length - 1 : lightboxIndex - 1);
  }, [lightboxIndex, filteredItems.length]);

  const handleNext = useCallback(() => {
    if (lightboxIndex === null || filteredItems.length === 0) return;
    setLightboxIndex(lightboxIndex === filteredItems.length - 1 ? 0 : lightboxIndex + 1);
  }, [lightboxIndex, filteredItems.length]);

  const handleClose = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handlePrev, handleNext, handleClose]);

  return (
    <section id="gallery" className="py-14 md:py-18 bg-gradient-to-b from-slate-50/60 via-sky-50/50 to-white scroll-mt-16 border-b border-sky-100/50">
      <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <h3 className="text-xs font-extrabold text-[#C41E3A] uppercase tracking-widest mb-3">Campus Life</h3>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">Memories &amp; Gallery</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] mx-auto rounded-full mb-4" />
          <p className="text-slate-600 max-w-4xl mx-auto text-xs sm:text-sm md:text-base font-medium leading-relaxed">
            Relive your college days and see snapshots of latest convocations, fests, and alumni meetups.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-2 mb-8 md:mb-12 flex-wrap">
          {albums.map((album) => (
            <button
              key={album}
              onClick={() => {
                setSelectedAlbum(album);
                setLightboxIndex(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                selectedAlbum === album
                  ? 'bg-gradient-to-r from-[#003D7A] to-[#002b56] text-white shadow-md'
                  : 'bg-slate-50 text-gray-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {album}
            </button>
          ))}
        </div>

        {/* ── MOBILE: 2-row horizontal scroll with always-visible nav buttons ── */}
        <div className="sm:hidden relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">{filteredItems.length} photos</span>
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
          {/* 2-row horizontal scroll grid */}
          <div
            ref={scrollRef}
            className="grid grid-rows-2 grid-flow-col gap-3 overflow-x-auto scroll-smooth scrollbar-none pb-4 -mx-4 px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setLightboxIndex(idx)}
                className="w-[160px] flex-shrink-0 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 relative group"
              >
                <img
                  src={item.image}
                  alt={item.caption}
                  className="w-full h-28 object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#C41E3A] mb-0.5">{item.album}</span>
                  <p className="text-white text-[10px] font-semibold leading-relaxed line-clamp-2">{item.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── DESKTOP / SM+: Fixed height window (140vh max window) with internal scroll ── */}
        <div className="hidden sm:block relative rounded-3xl border border-slate-200/60 bg-white/50 backdrop-blur-xs p-4 sm:p-6 shadow-inner">
          <div className="max-h-[120vh] xl:max-h-[140vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 scroll-smooth">
            <div className="columns-2 md:columns-3 lg:columns-4 gap-6">
              {filteredItems.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxIndex(idx)}
                  className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 relative break-inside-avoid mb-6 group"
                >
                  <img
                    src={item.image}
                    alt={item.caption}
                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#C41E3A] mb-1">{item.album}</span>
                    <p className="text-white text-xs font-semibold leading-relaxed line-clamp-2">{item.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lightbox Modal — elevated z-index (z-[9999]) above header navbar (z-[2000]) */}
        {currentItem !== null && lightboxIndex !== null && (
          <div
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[9999] flex flex-col justify-between p-4 sm:p-6"
            onClick={handleClose}
          >
            {/* Top Bar inside modal frame — Close button & counter */}
            <div
              className="flex items-center justify-between text-white border-b border-white/10 pb-3 z-[10000] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#C41E3A] text-white">
                  {currentItem.album}
                </span>
                <span className="text-xs font-bold text-white/70">
                  Image {lightboxIndex + 1} of {filteredItems.length}
                </span>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-full transition cursor-pointer"
                aria-label="Close Lightbox"
              >
                <X size={22} />
              </button>
            </div>

            {/* Slider Container with Prev/Next arrows */}
            <div
              className="flex-1 flex items-center justify-center relative my-2 z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Navigation Arrow */}
              {filteredItems.length > 1 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-6 z-20 p-3 text-white/90 hover:text-white bg-slate-900/60 hover:bg-[#003D7A] rounded-full transition-all shadow-xl backdrop-blur-sm border border-white/10 cursor-pointer"
                  aria-label="Previous Image"
                >
                  <ChevronLeft size={28} />
                </button>
              )}

              {/* Main Image View */}
              <div className="max-w-4xl max-h-[72vh] flex flex-col items-center justify-center overflow-hidden">
                <img
                  key={currentItem.id}
                  src={currentItem.image}
                  alt={currentItem.caption}
                  className="max-w-full max-h-[62vh] object-contain rounded-xl shadow-2xl border border-white/10"
                />
                {currentItem.caption && (
                  <div className="mt-3 text-center bg-slate-900/80 border border-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl max-w-xl">
                    <p className="text-white text-xs font-semibold">{currentItem.caption}</p>
                    {currentItem.uploadDate && (
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Uploaded on {currentItem.uploadDate}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Navigation Arrow */}
              {filteredItems.length > 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-2 sm:right-6 z-20 p-3 text-white/90 hover:text-white bg-slate-900/60 hover:bg-[#003D7A] rounded-full transition-all shadow-xl backdrop-blur-sm border border-white/10 cursor-pointer"
                  aria-label="Next Image"
                >
                  <ChevronRight size={28} />
                </button>
              )}
            </div>

            {/* Bottom Keyboard Hint */}
            <div
              className="text-center text-[11px] font-medium text-white/40 pt-1 z-[10000] hidden sm:block"
              onClick={(e) => e.stopPropagation()}
            >
              Use <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-white font-mono text-[10px]">←</kbd> and <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-white font-mono text-[10px]">→</kbd> arrows to navigate, <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-white font-mono text-[10px]">Esc</kbd> to close
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
