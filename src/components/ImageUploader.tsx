'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2, Upload } from 'lucide-react';
import { apiFetch } from "@/lib/api";

interface ImageUploaderProps {
  /** Current image/file URL (controlled value) */
  value: string;
  /** Called with the new local upload URL after a successful upload, or '' to clear */
  onChange: (url: string) => void;
  /** Upload folder/category (default: 'alumni_portal') */
  folder?: string;
  /** Placeholder text shown when no file is selected */
  placeholder?: string;
  /** Extra class names for the container */
  className?: string;
  /** File acceptance filter (default: 'image/*') */
  accept?: string;
}

/**
 * Reusable image upload component that integrates with Cloudinary via /api/upload.
 * Shows a file picker, preview, upload progress, and a clear button.
 */
export function ImageUploader({
  value,
  onChange,
  folder = 'alumni_portal',
  placeholder = 'Click to upload an image',
  className = '',
  accept = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    // Start with a generic processing fallback state
    setIsProcessing(true);

    try {
      // Dynamic import of file preprocessor
      const { preprocessImageFile } = await import('@/lib/utils/fileHelper');
      const processed = await preprocessImageFile(file);
      if (processed.error) {
        throw new Error(processed.error);
      }
      file = processed.file;
      
      // Update states: if it wasn't a HEIC image, we transition immediately to uploading
      if (!processed.wasProcessed) {
        setIsProcessing(false);
      }
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await apiFetch('/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleClear = () => {
    onChange('');
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isLoading = isUploading || isProcessing;

  return (
    <div className={`space-y-2 ${className}`}>
      {value ? (
        /* Preview state */
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          {value.endsWith('.mp4') || value.endsWith('.webm') || value.endsWith('.ogg') || value.endsWith('.mov') || accept.includes('video') ? (
            <video
              src={value}
              controls
              className="w-full h-40 object-cover bg-slate-950"
            />
          ) : (
            <img
              src={value}
              alt="Uploaded preview"
              className="w-full h-40 object-cover"
            />
          )}
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Change
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition cursor-pointer"
            >
              <X size={12} />
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* Upload state */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className="w-full h-32 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-[#003D7A] hover:bg-slate-550 rounded-xl text-slate-400 hover:text-[#003D7A] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 size={24} className="animate-spin text-[#003D7A]" />
              <span className="text-xs font-semibold text-[#003D7A]">
                {isProcessing ? 'Processing Photo...' : 'Uploading...'}
              </span>
            </>
          ) : (
            <>
              <ImagePlus size={24} />
              <span className="text-xs font-semibold">{placeholder}</span>
              <span className="text-[10px] text-slate-300">
                {accept.includes('video') ? 'MP4, WebM, OGG, MOV · max 50 MB' : 'JPG, PNG, WebP · max 5 MB'}
              </span>
            </>
          )}
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
          <X size={10} />
          {error}
        </p>
      )}
    </div>
  );
}
