'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2, Star, Check } from 'lucide-react';
import { apiFetch } from "@/lib/api";

interface MultiImageUploaderProps {
  imageUrls: string[];
  coverImageUrl: string;
  onChange: (images: string[], cover: string) => void;
  folder?: string;
}

export function MultiImageUploader({
  imageUrls = [],
  coverImageUrl = '',
  onChange,
  folder = 'newscorner_covers',
}: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);
    setIsProcessing(true);

    try {
      const { preprocessImageFile } = await import('@/lib/utils/fileHelper');
      const uploadedUrls: string[] = [];

      for (const rawFile of files) {
        const processed = await preprocessImageFile(rawFile);
        if (processed.error) {
          throw new Error(processed.error);
        }
        
        // Update states: finished processing current file, starting upload
        setIsProcessing(false);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', processed.file);
        formData.append('folder', folder);

        const res = await apiFetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        uploadedUrls.push(data.url);
      }

      const nextImages = [...imageUrls, ...uploadedUrls];
      const nextCover = coverImageUrl || nextImages[0] || '';
      onChange(nextImages, nextCover);
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = (indexToRemove: number) => {
    const nextImages = imageUrls.filter((_, idx) => idx !== indexToRemove);
    const removedUrl = imageUrls[indexToRemove];
    let nextCover = coverImageUrl;
    if (removedUrl === coverImageUrl) {
      nextCover = nextImages[0] || '';
    }
    onChange(nextImages, nextCover);
  };

  const handleSetCover = (url: string) => {
    onChange(imageUrls, url);
  };

  const isLoading = isUploading || isProcessing;

  return (
    <div className="space-y-3">
      {/* Grid of uploaded images */}
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {imageUrls.map((url, index) => {
            const isCover = coverImageUrl === url;
            return (
              <div key={url + index} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video">
                <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                  <button
                    type="button"
                    onClick={() => handleSetCover(url)}
                    title={isCover ? 'Current Cover Image' : 'Set as Cover Image'}
                    className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isCover ? 'bg-amber-500 text-white' : 'bg-white/90 hover:bg-white text-slate-700'
                    }`}
                  >
                    <Star size={13} fill={isCover ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    title="Remove image"
                    className="p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </div>
                {isCover && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded shadow-sm flex items-center gap-0.5">
                    <Check size={9} /> Cover
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="w-full h-24 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 hover:border-[#003D7A] hover:bg-slate-550 rounded-xl text-slate-400 hover:text-[#003D7A] transition-all cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin text-[#003D7A]" />
            <span className="text-xs font-semibold text-[#003D7A]">
              {isProcessing ? 'Processing Photos...' : 'Uploading photos…'}
            </span>
          </>
        ) : (
          <>
            <ImagePlus size={20} />
            <span className="text-xs font-semibold">
              {imageUrls.length > 0 ? 'Add more photos' : 'Upload story photos'}
            </span>
            <span className="text-[10px] text-slate-400">JPG, PNG, WebP, HEIC · Select multiple</span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={handleFilesSelect}
        className="hidden"
      />

      {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}
    </div>
  );
}
