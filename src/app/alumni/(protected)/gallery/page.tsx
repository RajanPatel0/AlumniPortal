// src/app/alumni/(protected)/gallery/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { apiFetch } from "@/lib/api";
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
  Trash2,
  User,
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
        const res = await apiFetch('/upload', { method: 'POST', body: formData });
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

interface PostedBy {
  id?: string;
  name: string;
  avatar?: string | null;
  type?: 'alumni' | 'staff' | 'admin';
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
  alumniId?: string | null;
  postedBy?: PostedBy;
  images: AlbumImage[];
  viewsCount: number;
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
}

export default function GalleryPage() {
  const [mounted, setMounted] = useState(false);
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({
    'College Days': false,
    'Video Gallery': false,
    'Festivals': false,
    'Reunions': false
  });
  const [sortBy, setSortBy] = useState('Newest');
  
  // Current User context & My Gallery toggle
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showMyGalleryOnly, setShowMyGalleryOnly] = useState(false);

  // Album Deletion Modal State
  const [confirmDeleteAlbum, setConfirmDeleteAlbum] = useState<AlbumItem | null>(null);
  const [deletingAlbumId, setDeletingAlbumId] = useState<string | null>(null);

  // Image Viewer Lightbox Modal state
  const [activeAlbum, setActiveAlbum] = useState<AlbumItem | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch albums & user profile from API on mount
  useEffect(() => {
    apiFetch('/alumni/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const id = data?.user?.id || data?.alumni?.id || data?.id;
        if (id) setCurrentUserId(id);
      })
      .catch(() => {});

    apiFetch('/alumni/gallery')
      .then(res => res.ok ? res.json() : { albums: [] })
      .then(data => {
        setAlbums(data.albums || []);
        setLoadingAlbums(false);
      })
      .catch(() => {
        setAlbums([]);
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
      const res = await apiFetch('/alumni/gallery', {
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
        setAlbums(prev => [data.album, ...prev]);
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

  const handleDeleteAlbum = async (album: AlbumItem) => {
    setDeletingAlbumId(album.id);
    try {
      const res = await apiFetch(`/alumni/gallery?id=${album.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Album deleted successfully!');
        setAlbums(prev => prev.filter(a => a.id !== album.id));
        if (activeAlbum?.id === album.id) {
          setActiveAlbum(null);
        }
        setConfirmDeleteAlbum(null);
      } else {
        toast.error(data.error || 'Failed to delete album');
      }
    } catch (err) {
      console.error('[DELETE_ALBUM_ERROR]', err);
      toast.error('Failed to delete album. Please try again.');
    } finally {
      setDeletingAlbumId(null);
    }
  };

  const handleLikeAlbum = async (albumId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    let newIsLiked = false;
    let newLikesCount = 0;

    setAlbums(prev => prev.map(a => {
      if (a.id === albumId) {
        newIsLiked = !a.isLiked;
        newLikesCount = Math.max(0, (a.likesCount || 0) + (newIsLiked ? 1 : -1));
        return {
          ...a,
          isLiked: newIsLiked,
          likesCount: newLikesCount,
        };
      }
      return a;
    }));

    if (activeAlbum?.id === albumId) {
      setActiveAlbum(prev => prev ? {
        ...prev,
        isLiked: newIsLiked,
        likesCount: newLikesCount,
      } : null);
    }

    try {
      const res = await apiFetch('/alumni/gallery/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, isLiked: data.isLiked, likesCount: data.likesCount } : a));
        if (activeAlbum?.id === albumId) {
          setActiveAlbum(prev => prev ? { ...prev, isLiked: data.isLiked, likesCount: data.likesCount } : null);
        }
      }
    } catch (err) {
      console.error('[LIKE_ALBUM_ERROR]', err);
    }
  };

  // Filter logic
  const filteredAlbums = albums.filter(album => {
    const matchesSearch = album.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (album.description && album.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // check if any category filter is active
    const activeCats = Object.keys(selectedCategories).filter(k => selectedCategories[k]);
    const matchesCategory = activeCats.length === 0 || activeCats.includes(album.category);

    const isMine = currentUserId && (album.alumniId === currentUserId || album.postedBy?.id === currentUserId);
    const matchesMyGallery = !showMyGalleryOnly || isMine;

    return matchesSearch && matchesCategory && matchesMyGallery;
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

  const openViewer = async (album: AlbumItem) => {
    const newViewsCount = (album.viewsCount || 0) + 1;
    const updatedAlbum = { ...album, viewsCount: newViewsCount };
    
    setActiveAlbum(updatedAlbum);
    setViewerIndex(0);

    setAlbums(prev => prev.map(a => a.id === album.id ? { ...a, viewsCount: newViewsCount } : a));

    try {
      await apiFetch('/alumni/gallery/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: album.id }),
      });
    } catch (err) {
      console.error('[INCREMENT_VIEW_ERROR]', err);
    }
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

            {/* My Gallery Filter Toggle */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="block text-xs font-bold text-gray-700">Filter By Owner</span>
              <label className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 cursor-pointer transition">
                <div className="flex items-center gap-2.5">
                  <input 
                    type="checkbox"
                    checked={showMyGalleryOnly}
                    onChange={(e) => setShowMyGalleryOnly(e.target.checked)}
                    className="rounded border-slate-300 text-[#003D7A] focus:ring-[#003D7A] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">My Gallery</span>
                </div>
                {currentUserId && (
                  <span className="text-[10px] font-bold bg-[#003D7A]/10 text-[#003D7A] px-2 py-0.5 rounded-full">
                    {albums.filter(a => a.alumniId === currentUserId || a.postedBy?.id === currentUserId).length}
                  </span>
                )}
              </label>
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
                const isMine = Boolean(currentUserId && (album.alumniId === currentUserId || album.postedBy?.id === currentUserId));
                const canDelete = isMine || showMyGalleryOnly;
                const authorName = album.postedBy?.name || 'Alumni Cell';

                return (
                  <div 
                    key={album.id}
                    onClick={() => openViewer(album)}
                    className="group cursor-pointer bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
                  >
                    {/* Cover photo block - edge to edge top */}
                    <div className="aspect-[4/3] w-full relative bg-slate-900 overflow-hidden">
                      <img 
                        src={coverImage} 
                        alt={album.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      
                      {/* Delete Cross Button for Owned / My Gallery Albums */}
                      {canDelete && (
                        <button
                          type="button"
                          title="Delete album"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteAlbum(album);
                          }}
                          className="absolute top-3 right-3 z-30 w-8 h-8 bg-black/60 hover:bg-rose-600 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-lg group/btn cursor-pointer"
                        >
                          <X size={15} className="group-hover/btn:scale-110 transition stroke-[2.5]" />
                        </button>
                      )}
                    </div>

                    {/* Meta info block */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-[#003D7A] transition line-clamp-1">
                          {album.title}
                        </h4>
                        
                        {/* Posted By Author Badge with Profile Link */}
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          className="mt-1.5 inline-flex items-center"
                        >
                          <Link
                            href={
                              album.postedBy?.id && album.postedBy.id !== 'admin'
                                ? album.postedBy.id === currentUserId
                                  ? '/alumni/profile'
                                  : `/alumni/profile/${album.postedBy.id}`
                                : '/alumni/profile'
                            }
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#003D7A] transition group/author"
                          >
                            {album.postedBy?.avatar ? (
                              <img src={album.postedBy.avatar} alt={authorName} className="w-4.5 h-4.5 rounded-full object-cover border border-slate-200 group-hover/author:border-[#003D7A] transition" />
                            ) : (
                              <div className="w-4.5 h-4.5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-[#003D7A] group-hover/author:bg-blue-50 transition">
                                {authorName[0]?.toUpperCase() || 'A'}
                              </div>
                            )}
                            <span className="truncate">Posted by <strong className="text-slate-800 font-semibold group-hover/author:underline group-hover/author:text-[#003D7A]">{authorName}</strong></span>
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2.5 border-t border-slate-100">
                        <span className="text-slate-400 font-medium">{album.images.length} {album.images.length === 1 ? 'Item' : 'Items'}</span>
                        
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-slate-600 font-bold">
                            <Eye size={13} className="text-slate-400" />
                            {album.viewsCount ?? 0}
                          </span>
                          
                          {/* Interactive Like Button on Card */}
                          <button
                            type="button"
                            title={album.isLiked ? "Unlike album" : "Like album"}
                            onClick={(e) => handleLikeAlbum(album.id, e)}
                            className={`flex items-center gap-1 font-bold text-xs transition px-2 py-0.5 rounded-lg cursor-pointer ${
                              album.isLiked 
                                ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <ThumbsUp size={12} className={album.isLiked ? 'fill-rose-600 text-rose-600' : 'text-slate-400'} />
                            <span>{album.likesCount ?? 0}</span>
                          </button>
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
      {mounted && activeAlbum && createPortal(
        <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden max-h-[90vh] relative">
            
            {/* Modal Top Header Bar */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 gap-4 shrink-0">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-extrabold text-base sm:text-lg text-white leading-snug truncate">
                    {activeAlbum.title}
                  </h3>
                  {activeAlbum.postedBy && (
                    <Link
                      href={
                        activeAlbum.postedBy.id && activeAlbum.postedBy.id !== 'admin'
                          ? activeAlbum.postedBy.id === currentUserId
                            ? '/alumni/profile'
                            : `/alumni/profile/${activeAlbum.postedBy.id}`
                          : '/alumni/profile'
                      }
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-full font-semibold transition border border-slate-700/60 inline-flex items-center gap-1.5"
                    >
                      <User size={12} className="text-blue-400" />
                      <span>By <strong className="text-white font-bold">{activeAlbum.postedBy.name}</strong></span>
                    </Link>
                  )}
                </div>
                {activeAlbum.description && (
                  <p className="text-xs text-slate-400 max-w-2xl line-clamp-1">
                    {activeAlbum.description}
                  </p>
                )}
              </div>

              {/* Views, Likes & Close Controls */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-3 text-xs bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60">
                  <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <Eye size={14} className="text-blue-400" />
                    {activeAlbum.viewsCount ?? 0}
                  </span>
                  <span className="w-px h-3 bg-slate-700" />
                  <button
                    type="button"
                    onClick={() => handleLikeAlbum(activeAlbum.id)}
                    className={`flex items-center gap-1.5 font-bold transition cursor-pointer ${
                      activeAlbum.isLiked ? 'text-rose-400' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <ThumbsUp size={13} className={activeAlbum.isLiked ? 'fill-rose-400 text-rose-400' : 'text-slate-400'} />
                    <span>{activeAlbum.likesCount ?? 0}</span>
                  </button>
                </div>

                <button 
                  type="button"
                  title="Close viewer"
                  onClick={() => setActiveAlbum(null)}
                  className="w-9 h-9 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md border border-slate-700/80 active:scale-95"
                >
                  <X size={18} className="stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Slider Container / Main Image View */}
            <div className="flex-1 relative flex items-center justify-center p-4 bg-black/60 min-h-[350px] overflow-hidden">
              
              {/* Left navigation arrow */}
              {activeAlbum.images.length > 1 && (
                <button 
                  onClick={prevSlide}
                  className="absolute left-3 sm:left-5 z-20 w-10 h-10 bg-slate-900/80 hover:bg-[#003D7A] text-white rounded-full flex items-center justify-center border border-slate-700/80 backdrop-blur-md transition shadow-lg active:scale-95 cursor-pointer"
                >
                  <ChevronLeft size={22} />
                </button>
              )}

              {/* Main Image */}
              <div className="relative max-w-full max-h-[60vh] flex flex-col items-center justify-center">
                <img 
                  src={activeAlbum.images[viewerIndex]?.imageUrl} 
                  alt={`Photo ${viewerIndex + 1}`}
                  className="max-w-full max-h-[55vh] object-contain rounded-2xl shadow-2xl border border-slate-800" 
                />
                {activeAlbum.images[viewerIndex]?.caption && (
                  <p className="text-slate-200 text-xs font-medium mt-3 text-center bg-slate-900/90 border border-slate-800 px-4 py-1.5 rounded-full max-w-lg shadow-md">
                    {activeAlbum.images[viewerIndex].caption}
                  </p>
                )}
              </div>

              {/* Right navigation arrow */}
              {activeAlbum.images.length > 1 && (
                <button 
                  onClick={nextSlide}
                  className="absolute right-3 sm:right-5 z-20 w-10 h-10 bg-slate-900/80 hover:bg-[#003D7A] text-white rounded-full flex items-center justify-center border border-slate-700/80 backdrop-blur-md transition shadow-lg active:scale-95 cursor-pointer"
                >
                  <ChevronRight size={22} />
                </button>
              )}

            </div>

            {/* Modal Bottom Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400 font-semibold shrink-0">
              <span>Image {viewerIndex + 1} of {activeAlbum.images.length}</span>

              {/* Mobile Likes / Views button */}
              <div className="flex sm:hidden items-center gap-3">
                <span className="flex items-center gap-1">
                  <Eye size={13} className="text-blue-400" />
                  {activeAlbum.viewsCount ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => handleLikeAlbum(activeAlbum.id)}
                  className={`flex items-center gap-1 ${activeAlbum.isLiked ? 'text-rose-400 font-bold' : 'text-slate-400'}`}
                >
                  <ThumbsUp size={12} className={activeAlbum.isLiked ? 'fill-rose-400 text-rose-400' : ''} />
                  <span>{activeAlbum.likesCount ?? 0}</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {mounted && confirmDeleteAlbum && createPortal(
        <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">Delete Album?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <strong className="text-gray-800">"{confirmDeleteAlbum.title}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteAlbum(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingAlbumId === confirmDeleteAlbum.id}
                onClick={() => handleDeleteAlbum(confirmDeleteAlbum)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingAlbumId === confirmDeleteAlbum.id ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal - Create Album */}
      {mounted && isCreateModalOpen && createPortal(
        <div className="fixed inset-0 z-[999999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-900 text-sm">Create an album</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
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
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
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
        </div>,
        document.body
      )}

    </div>
  );
}
