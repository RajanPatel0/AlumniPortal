'use client';

import { useState } from 'react';

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
  const [lightboxImage, setLightboxImage] = useState<GalleryItem | null>(null);

  // Extract unique album names dynamically
  const albums = ['All', ...Array.from(new Set(items.map((item) => item.album)))];

  const sortedItems = [...items].sort((a, b) => a.displayOrder - b.displayOrder);

  const filteredItems = sortedItems.filter((item) => {
    if (selectedAlbum === 'All') return true;
    return item.album === selectedAlbum;
  });

  return (
    <section id="gallery" className="py-24 bg-gradient-to-b from-white via-slate-50/55 to-white scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h3 className="text-xs font-extrabold text-[#C41E3A] uppercase tracking-widest mb-3">Campus Life</h3>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Memories & Gallery</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] mx-auto rounded-full mb-4"></div>
          <p className="text-gray-600 max-w-2xl mx-auto font-medium">
            Relive your college days and see snapshots of latest convocations, fests, and alumni meetups.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-2 mb-12 flex-wrap">
          {albums.map((album) => (
            <button
              key={album}
              onClick={() => setSelectedAlbum(album)}
              className={`px-4.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                selectedAlbum === album
                  ? 'bg-gradient-to-r from-[#003D7A] to-[#002b56] text-white'
                  : 'bg-slate-50 text-gray-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {album}
            </button>
          ))}
        </div>

        {/* Masonry-like Grid on Desktop, Horizontal Scroll on Mobile */}
        <div className="flex overflow-x-auto gap-6 sm:columns-2 md:columns-3 lg:columns-4 sm:block pb-4 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] -mx-4 px-4 sm:mx-0 sm:px-0">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setLightboxImage(item)}
              className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 relative w-[240px] flex-shrink-0 sm:w-auto sm:break-inside-avoid sm:mb-6"
            >
              <img
                src={item.image}
                alt={item.caption}
                className="w-full h-44 sm:h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C41E3A] mb-1">
                  {item.album}
                </span>
                <p className="text-white text-xs font-semibold leading-relaxed line-clamp-2">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setLightboxImage(null)}
          >
            <div
              className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors"
                aria-label="Close Lightbox"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900">
                <img
                  src={lightboxImage.image}
                  alt={lightboxImage.caption}
                  className="max-h-[70vh] object-contain mx-auto"
                />
                <div className="bg-slate-950/95 p-4 text-white">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C41E3A]">
                    {lightboxImage.album}
                  </span>
                  <h4 className="text-sm font-semibold mt-1">{lightboxImage.caption}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Uploaded on {lightboxImage.uploadDate}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
