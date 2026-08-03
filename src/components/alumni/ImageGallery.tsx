'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: { imageUrl: string }[];
  priority?: boolean;
}

export default function ImageGallery({ images, priority = false }: ImageGalleryProps) {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeLightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
      } else if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeLightboxIndex, images.length]);

  if (!images || images.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
  };

  return (
    <>
      {images.length === 1 ? (
        <div 
          onClick={() => setActiveLightboxIndex(0)}
          className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 h-[360px] w-full cursor-zoom-in group/img"
        >
          <Image
            src={images[0].imageUrl}
            alt="Post media"
            fill
            sizes="(max-width: 768px) 100vw, 80vw"
            className="object-contain transition duration-300 group-hover/img:scale-[1.01]"
            priority={priority}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-slate-100">
          {images.slice(0, 4).map((img, i) => (
            <div
              key={i}
              onClick={() => setActiveLightboxIndex(i)}
              className={`relative bg-slate-50 aspect-square cursor-zoom-in group/img overflow-hidden ${
                images.length === 3 && i === 0 ? 'row-span-2 !aspect-auto h-full' : ''
              }`}
            >
              <Image
                src={img.imageUrl}
                alt="Post media"
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition duration-300 group-hover/img:scale-[1.03]"
                priority={priority && i === 0}
              />
              {i === 3 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white font-bold text-base z-10 transition group-hover/img:bg-black/50">
                  +{images.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full-Screen Lightbox Modal */}
      {activeLightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center select-none"
          onClick={() => setActiveLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setActiveLightboxIndex(null)}
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition z-50 focus:outline-none"
            title="Close (Esc)"
          >
            <X size={24} />
          </button>

          {/* Image container */}
          <div 
            className="relative w-[90vw] h-[80vh] flex items-center justify-center p-4" 
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[activeLightboxIndex].imageUrl}
              alt={`Expanded post image ${activeLightboxIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain select-none pointer-events-none"
              priority
            />
          </div>

          {/* Navigation - Prev */}
          {images.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-6 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition z-50 focus:outline-none"
              title="Previous"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Navigation - Next */}
          {images.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-6 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition z-50 focus:outline-none"
              title="Next"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-semibold tracking-wide">
              {activeLightboxIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
