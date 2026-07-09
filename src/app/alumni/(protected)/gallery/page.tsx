// src/app/alumni/(protected)/gallery/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  Eye, 
  ThumbsUp, 
  Image as ImageIcon, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Upload,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ─── Multi-image uploader for albums ─────────────────────────────────────────
function AlbumImagesUploader({
  images,
  onChange,
}: {
  images: { url: string; caption: string }[];
  onChange: (imgs: { url: string; caption: string }[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const uploaded: { url: string; caption: string }[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'alumni_gallery');
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) uploaded.push({ url: data.url, caption: '' });
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    onChange([...images, ...uploaded]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const updateCaption = (idx: number, caption: string) => {
    const updated = [...images];
    updated[idx] = { ...updated[idx], caption };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 group">
              <img src={img.url} alt={`img-${idx}`} className="w-full h-24 object-cover" />
              <div className="absolute top-1.5 right-1.5">
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center hover:bg-rose-700 transition cursor-pointer"
                >
                  <X size={10} />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                <input
                  type="text"
                  placeholder="Caption..."
                  value={img.caption}
                  onChange={e => updateCaption(idx, e.target.value)}
                  className="w-full text-[9px] text-white bg-transparent placeholder:text-slate-300 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-[#003D7A] hover:text-[#003D7A] hover:bg-blue-50/30 transition text-xs font-semibold cursor-pointer"
      >
        {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Add Photos</>}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
    </div>
  );
}

interface AlbumImage {
  id: string;
  imageUrl: string;
  caption?: string;
}

interface AlbumItem {
  id: string;
  title: string;
  description?: string;
  category: 'College Days' | 'Video Gallery' | 'Festivals' | 'Reunions';
  images: AlbumImage[];
  viewsCount: number;
  likesCount: number;
  createdAt: string;
}

const initialAlbums: AlbumItem[] = [
  {
    id: 'album-1',
    title: 'Reunions',
    description: 'Reliving the best memories of Batch 2010 during our silver jubilee meet.',
    category: 'Reunions',
    images: [
      { id: 'img-1-1', imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f30312245d5?q=80&w=600&auto=format&fit=crop', caption: 'Inauguration address by our Vice Chancellor' },
      { id: 'img-1-2', imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=600&auto=format&fit=crop', caption: 'Networking brunch at campus gardens' }
    ],
    viewsCount: 46,
    likesCount: 3,
    createdAt: '2026-06-10'
  },
  {
    id: 'album-2',
    title: 'Album 1',
    description: 'Glimpses of daily life at the hostel and classrooms.',
    category: 'College Days',
    images: [
      { id: 'img-2-1', imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=600&auto=format&fit=crop', caption: 'Morning discussions in front of Senate building' },
      { id: 'img-2-2', imageUrl: 'https://images.unsplash.com/photo-1498243691211-84de3e1ad0cf?q=80&w=600&auto=format&fit=crop', caption: 'Library study session before final tests' }
    ],
    viewsCount: 39,
    likesCount: 5,
    createdAt: '2026-06-12'
  },
  {
    id: 'album-3',
    title: 'Alumni Life in Delhi',
    description: 'Alumni chapters gathering in New Delhi to discuss collaborative mentorship initiatives.',
    category: 'Reunions',
    images: [
      { id: 'img-3-1', imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600&auto=format&fit=crop', caption: 'Panel discussion on AI advancement and roles' },
      { id: 'img-3-2', imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=600&auto=format&fit=crop', caption: 'Delhi Chapter Core Team 2026' }
    ],
    viewsCount: 84,
    likesCount: 14,
    createdAt: '2026-06-14'
  },
  {
    id: 'album-4',
    title: 'Cultural Festival 2025',
    description: 'Moments of joy and performances during the annual cultural fest.',
    category: 'Festivals',
    images: [
      { id: 'img-4-1', imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=600&auto=format&fit=crop', caption: 'Traditional folk performance on Main Stage' }
    ],
    viewsCount: 120,
    likesCount: 28,
    createdAt: '2026-06-08'
  }
];

export default function GalleryPage() {
  const [albums, setStartups] = useState<AlbumItem[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({
    'College Days': false,
    'Video Gallery': false,
    'Festivals': false,
    'Reunions': false
  });
  const [sortBy, setSortBy] = useState('Newest');
  
  // Image Viewer Lightbox Modal state
  const [activeAlbum, setActiveAlbum] = useState<AlbumItem | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Fetch albums from API on mount
  useEffect(() => {
    fetch('/api/alumni/gallery')
      .then(res => res.ok ? res.json() : { albums: [] })
      .then(data => {
        setStartups(data.albums || []);
        setLoadingAlbums(false);
      })
      .catch(() => {
        setStartups([]);
        setLoadingAlbums(false);
      });
  }, []);

  // Album creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<'College Days' | 'Video Gallery' | 'Festivals' | 'Reunions'>('College Days');
  const [formImages, setFormImages] = useState<{ url: string; caption: string }[]>([]);
  const [isSubmittingAlbum, setIsSubmittingAlbum] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) return;
    if (formImages.length === 0) {
      toast.error('Please upload at least one image.');
      return;
    }
    setIsSubmittingAlbum(true);

    try {
      const res = await fetch('/api/alumni/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          category: formCategory,
          images: formImages
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Album created successfully!');
        setStartups(prev => [data.album, ...prev]);
        setIsCreateModalOpen(false);
        // Reset Form
        setFormTitle('');
        setFormDesc('');
        setFormImages([]);
      } else {
        toast.error(data.error || 'Failed to create album');
      }
    } catch (err) {
      console.error('[CREATE_ALBUM_ERROR]', err);
      toast.error('Failed to create album. Please try again.');
    } finally {
      setIsSubmittingAlbum(false);
    }
  };

  // Filter logic
  const filteredAlbums = albums.filter(album => {
    const matchesSearch = album.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (album.description && album.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // check if any category filter is active
    const activeCats = Object.keys(selectedCategories).filter(k => selectedCategories[k]);
    const matchesCategory = activeCats.length === 0 || activeCats.includes(album.category);

    return matchesSearch && matchesCategory;
  });

  // Sort logic
  const sortedAlbums = [...filteredAlbums].sort((a, b) => {
    if (sortBy === 'Newest') {
      return b.createdAt.localeCompare(a.createdAt);
    }
    if (sortBy === 'Popular') {
      return b.viewsCount - a.viewsCount;
    }
    return 0;
  });

  const openViewer = (album: AlbumItem) => {
    setActiveAlbum(album);
    setViewerIndex(0);
  };

  const nextSlide = () => {
    if (!activeAlbum) return;
    setViewerIndex((viewerIndex + 1) % activeAlbum.images.length);
  };

  const prevSlide = () => {
    if (!activeAlbum) return;
    setViewerIndex((viewerIndex - 1 + activeAlbum.images.length) % activeAlbum.images.length);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-950">Gallery</h2>
          
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-500">Sort:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-bold text-gray-800 bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 focus:outline-none focus:border-[#003D7A]"
            >
              <option value="Newest">Newest</option>
              <option value="Popular">Popular</option>
            </select>
          </div>
        </div>

        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-[0.98]"
        >
          <Plus size={16} />
          <span>Create an album</span>
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: search and checkboxes filter */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-5">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input 
                type="text" 
                placeholder="Search gallery"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-slate-200 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-gray-800 placeholder:text-gray-400 transition"
              />
            </div>

            {/* Categories Toggles */}
            <div className="space-y-3">
              <span className="block text-xs font-bold text-gray-700">Categories</span>
              <div className="flex flex-col gap-2.5">
                {['College Days', 'Video Gallery', 'Festivals', 'Reunions'].map((cat) => (
                  <label key={cat} className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-900">
                    <input 
                      type="checkbox"
                      checked={selectedCategories[cat]}
                      onChange={() => toggleCategory(cat)}
                      className="rounded border-slate-300 text-[#003D7A] focus:ring-[#003D7A] w-4 h-4"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right column: Album Grid */}
        <div className="lg:col-span-9">
          {loadingAlbums ? (
            /* Skeleton Grid — matches the 3-col album card layout */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="space-y-2.5 animate-pulse">
                  <div className="aspect-[4/3] rounded-2xl bg-slate-200" />
                  <div className="px-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-slate-200 rounded w-1/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedAlbums.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500 font-semibold">
              No albums match your search query.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sortedAlbums.map((album) => {
                const coverImage = album.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=600&auto=format&fit=crop';
                
                return (
                  <div 
                    key={album.id}
                    onClick={() => openViewer(album)}
                    className="group cursor-pointer space-y-2.5"
                  >
                    {/* Cover photo block */}
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-100 relative bg-slate-50">
                      <img 
                        src={coverImage} 
                        alt={album.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition" />
                    </div>

                    {/* Meta info */}
                    <div className="px-1">
                      <h4 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-[#003D7A] transition">
                        {album.title}
                      </h4>
                      
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mt-1">
                        <span>{album.images.length} {album.images.length === 1 ? 'Item' : 'Items'}</span>
                        
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-0.5">
                            <Eye size={12} />
                            {album.viewsCount}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <ThumbsUp size={11} />
                            {album.likesCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Lightbox / Slider Modal */}
      {activeAlbum && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 md:p-8">
          {/* Modal Header */}
          <div className="flex items-center justify-between text-white border-b border-white/10 pb-4">
            <div>
              <h3 className="font-bold text-md leading-tight">{activeAlbum.title}</h3>
              {activeAlbum.description && (
                <p className="text-xs text-white/60 mt-1 max-w-xl hidden md:block">
                  {activeAlbum.description}
                </p>
              )}
            </div>
            
            <button 
              onClick={() => setActiveAlbum(null)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Slider Container */}
          <div className="flex-1 flex items-center justify-center relative my-4">
            
            {/* Left navigation arrow */}
            {activeAlbum.images.length > 1 && (
              <button 
                onClick={prevSlide}
                className="absolute left-2 md:left-4 z-10 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Main Image View */}
            <div className="max-w-4xl max-h-[70vh] flex flex-col items-center justify-center overflow-hidden">
              <img 
                src={activeAlbum.images[viewerIndex]?.imageUrl} 
                alt={`Photo ${viewerIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
              />
              {activeAlbum.images[viewerIndex]?.caption && (
                <p className="text-white text-xs font-semibold mt-4 text-center bg-black/40 px-4 py-2 rounded-full max-w-xl">
                  {activeAlbum.images[viewerIndex].caption}
                </p>
              )}
            </div>

            {/* Right navigation arrow */}
            {activeAlbum.images.length > 1 && (
              <button 
                onClick={nextSlide}
                className="absolute right-2 md:right-4 z-10 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
              >
                <ChevronRight size={28} />
              </button>
            )}

          </div>

          {/* Slider Footer count */}
          <div className="text-center text-xs font-bold text-white/50 pt-2">
            Image {viewerIndex + 1} of {activeAlbum.images.length}
          </div>

        </div>
      )}

      {/* Modal - Create Album */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-900 text-sm">Create an album</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateAlbum} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Album Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Reunion Batch 2015"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Description</label>
                <textarea 
                  rows={2}
                  placeholder="Enter a brief description..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Category *</label>
                <select 
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800"
                >
                  <option value="College Days">College Days</option>
                  <option value="Video Gallery">Video Gallery</option>
                  <option value="Festivals">Festivals</option>
                  <option value="Reunions">Reunions</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Images *</label>
                <AlbumImagesUploader images={formImages} onChange={setFormImages} />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingAlbum || formImages.length === 0}
                  className="flex-1 py-2.5 bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingAlbum && <Loader2 size={12} className="animate-spin" />}
                  <span>Create Album</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
