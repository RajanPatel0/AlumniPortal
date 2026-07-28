'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from "@/lib/api";
import { 
  Plus, X, Trash2, ImageIcon, FileText, BookImage, 
  Loader2, Upload, Send, ChevronDown, RefreshCw, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AdminPost {
  id: string;
  content: string | null;
  images: string[];
  createdAt: string;
  itemType?: 'post';
}

interface CommunityPost {
  id: string;
  content: string | null;
  createdAt: string;
  media: { type: string; url: string } | null;
  author: {
    id: string | null;
    name: string;
    batchYear: number;
    avatarUrl: string | null;
    currentRole: string;
    currentCompany: string;
    isAdmin: boolean;
  };
  itemType?: 'post';
}

interface AlbumImage {
  id: string;
  imageUrl: string;
  caption?: string;
}

interface AdminAlbum {
  id: string;
  title: string;
  description: string | null;
  category?: 'College Days' | 'Video Gallery' | 'Festivals' | 'Reunions' | string;
  isPublished: boolean;
  createdAt: string;
  images: AlbumImage[];
  itemType?: 'album';
  postedBy?: {
    id?: string;
    name?: string;
    avatar?: string | null;
    type?: 'alumni' | 'staff' | 'admin';
  };
}

// ─── Image Uploader (reuse design pattern) ────────────────────────────────────
function InlineImageUploader({
  onUploaded,
  label = 'Upload Image',
  folder = 'admin_posts',
}: {
  onUploaded: (url: string) => void;
  label?: string;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await apiFetch('/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setPreview(data.url);
      onUploaded(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
          <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white/90 text-slate-800 text-xs font-bold rounded-lg hover:bg-white transition"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => { setPreview(''); onUploaded(''); }}
              className="px-3 py-1.5 bg-rose-600/90 text-white text-xs font-bold rounded-lg hover:bg-rose-600 transition"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-36 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#003D7A] hover:bg-blue-50/30 transition text-slate-400 hover:text-[#003D7A]"
        >
          {uploading ? (
            <><Loader2 size={20} className="animate-spin" /><span className="text-xs font-medium">Uploading...</span></>
          ) : (
            <><Upload size={20} /><span className="text-xs font-medium">{label}</span></>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

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
        formData.append('folder', 'admin_gallery');
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
              <img src={img.url} alt={`img-${idx}`} className="w-full h-28 object-cover" />
              <div className="absolute top-1.5 right-1.5">
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center hover:bg-rose-700 transition"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1.5">
                <input
                  type="text"
                  placeholder="Caption..."
                  value={img.caption}
                  onChange={e => updateCaption(idx, e.target.value)}
                  className="w-full text-[10px] text-white bg-transparent placeholder:text-slate-300 focus:outline-none"
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
        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-[#003D7A] hover:text-[#003D7A] hover:bg-blue-50/30 transition text-sm font-medium"
      >
        {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Add Photos from Device</>}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminPostsPage() {
  const [activeTab, setActiveTab] = useState<'feed' | 'gallery' | 'community'>('feed');

  // Feed post form
  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  // Album form
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [albumCategory, setAlbumCategory] = useState<'College Days' | 'Video Gallery' | 'Festivals' | 'Reunions'>('College Days');
  const [albumImages, setAlbumImages] = useState<{ url: string; caption: string }[]>([]);
  const [submittingAlbum, setSubmittingAlbum] = useState(false);

  // Staff-published posts & albums
  const [myPosts, setMyPosts] = useState<AdminPost[]>([]);
  const [myAlbums, setMyAlbums] = useState<AdminAlbum[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Community posts (all alumni-authored posts)
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const res = await apiFetch('/admin/posts');
      if (res.ok) {
        const data = await res.json();
        setMyPosts(data.posts || []);
        setMyAlbums(data.albums || []);
      }
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchCommunityPosts = async () => {
    setLoadingCommunity(true);
    try {
      // GET /api/alumni/posts without ?self=true returns the full community feed.
      // The admin's accessToken (staffToken) is accepted by this endpoint.
      const res = await apiFetch('/alumni/posts');
      if (res.ok) {
        const data = await res.json();
        // Filter to alumni-authored posts only (exclude staff/admin posts shown in the Feed tab)
        const alumniOnly = (data.posts || []).filter(
          (p: CommunityPost) => p.author && !p.author.isAdmin
        );
        setCommunityPosts(alumniOnly);
      } else {
        toast.error('Failed to load community posts');
      }
    } catch {
      toast.error('Failed to load community posts');
    } finally {
      setLoadingCommunity(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  // Fetch community posts when that tab is first opened
  useEffect(() => {
    if (activeTab === 'community') {
      fetchCommunityPosts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Create Feed Post ──
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !postImageUrl) {
      toast.error('Please add content or an image');
      return;
    }
    setSubmittingPost(true);
    try {
      const res = await apiFetch('/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'post', content: postContent, imageUrl: postImageUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Post published to alumni feed!');
        setPostContent('');
        setPostImageUrl('');
        fetchItems();
      } else {
        toast.error(data.error || 'Failed to publish post');
      }
    } catch {
      toast.error('Failed to publish post. Please try again.');
    } finally {
      setSubmittingPost(false);
    }
  };

  // ── Create Album ──
  const handleSubmitAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumTitle.trim()) {
      toast.error('Album title is required');
      return;
    }
    if (albumImages.length === 0) {
      toast.error('Please upload at least one photo');
      return;
    }
    setSubmittingAlbum(true);
    try {
      const res = await apiFetch('/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'album',
          title: albumTitle,
          description: albumDesc,
          category: albumCategory,
          images: albumImages,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Album published to gallery!');
        setAlbumTitle('');
        setAlbumDesc('');
        setAlbumCategory('College Days');
        setAlbumImages([]);
        fetchItems();
      } else {
        toast.error(data.error || 'Failed to create album');
      }
    } catch {
      toast.error('Failed to create album. Please try again.');
    } finally {
      setSubmittingAlbum(false);
    }
  };

  // ── Delete Post (canonical endpoint — handles both staff posts and alumni community posts) ──
  const handleDeletePost = async (id: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      const res = await apiFetch(`/alumni/posts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Post deleted');
        // Remove from whichever list contains this post
        setMyPosts(prev => prev.filter(p => p.id !== id));
        setCommunityPosts(prev => prev.filter(p => p.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to delete post');
      }
    } catch {
      toast.error('Failed to delete post');
    }
  };

  // ── Delete Album ──
  const handleDeleteAlbum = async (id: string) => {
    if (!confirm('Delete this album? This cannot be undone.')) return;
    try {
      const res = await apiFetch(`/admin/posts?deleteType=album&id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Album deleted');
        setMyAlbums(prev => prev.filter(a => a.id !== id));
      } else {
        toast.error('Failed to delete album');
      }
    } catch {
      toast.error('Failed to delete album');
    }
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#003D7A]">Posts & Gallery</h1>
          <p className="text-slate-500 text-sm mt-0.5">Publish content to the alumni portal feed and gallery</p>
        </div>
        <button
          onClick={fetchItems}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:border-[#003D7A] hover:text-[#003D7A] text-sm font-semibold transition"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'feed' ? 'bg-white text-[#003D7A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileText size={15} />
          Feed Post
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'gallery' ? 'bg-white text-[#003D7A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <BookImage size={15} />
          Gallery Album
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'community' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={15} />
          Community Posts
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">

        {/* ── Left: Form Panel ── */}
        <div className="xl:col-span-2">

          {/* Feed Post Form */}
          {activeTab === 'feed' && (
            <form onSubmit={handleSubmitPost} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FileText size={18} className="text-[#003D7A]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">New Feed Post</h2>
                  <p className="text-xs text-slate-500">Shown in alumni feed with ADMIN badge</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Content</label>
                <textarea
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  placeholder="Write something for the alumni community..."
                  rows={5}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-gray-800 placeholder:text-slate-400 focus:outline-none focus:border-[#003D7A] focus:ring-1 focus:ring-[#003D7A]/20 resize-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Attach Image (Optional)
                </label>
                <InlineImageUploader
                  onUploaded={url => setPostImageUrl(url)}
                  label="Upload from Device"
                  folder="admin_posts"
                />
              </div>

              <button
                type="submit"
                disabled={submittingPost || (!postContent.trim() && !postImageUrl)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#003D7A] to-[#0057B8] hover:from-[#002b56] hover:to-[#004aad] text-white text-sm font-bold rounded-xl transition shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingPost ? <><Loader2 size={16} className="animate-spin" /> Publishing...</> : <><Send size={16} /> Publish to Feed</>}
              </button>
            </form>
          )}

          {/* Gallery Album Form */}
          {activeTab === 'gallery' && (
            <form onSubmit={handleSubmitAlbum} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-pink-50 rounded-xl flex items-center justify-center">
                  <BookImage size={18} className="text-pink-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">New Gallery Album</h2>
                  <p className="text-xs text-slate-500">Shown in /alumni/gallery page</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Album Title *</label>
                <input
                  type="text"
                  value={albumTitle}
                  onChange={e => setAlbumTitle(e.target.value)}
                  placeholder="e.g., Annual Day 2025"
                  className="w-full text-[#012140] px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#003D7A] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Category *</label>
                <select
                  value={albumCategory}
                  onChange={e => setAlbumCategory(e.target.value as any)}
                  className="w-full text-[#012140] px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:border-[#003D7A] transition"
                >
                  <option value="College Days">College Days</option>
                  <option value="Video Gallery">Video Gallery</option>
                  <option value="Festivals">Festivals</option>
                  <option value="Reunions">Reunions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea
                  value={albumDesc}
                  onChange={e => setAlbumDesc(e.target.value)}
                  placeholder="Describe this album..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#003D7A] resize-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Photos * ({albumImages.length} added)
                </label>
                <AlbumImagesUploader images={albumImages} onChange={setAlbumImages} />
              </div>

              <button
                type="submit"
                disabled={submittingAlbum || !albumTitle.trim() || albumImages.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-sm font-bold rounded-xl transition shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingAlbum ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Plus size={16} /> Create Album</>}
              </button>
            </form>
          )}

          {/* Community Posts — no form panel needed, just an info card */}
          {activeTab === 'community' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
                  <Users size={18} className="text-rose-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Community Post Moderation</h2>
                  <p className="text-xs text-slate-500">Review and remove inappropriate alumni posts</p>
                </div>
              </div>
              <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-xs text-rose-700 font-semibold leading-relaxed">
                Deleting a post here permanently removes it from the alumni feed and cannot be undone.
              </div>
              <button
                onClick={fetchCommunityPosts}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:border-[#003D7A] hover:text-[#003D7A] text-sm font-semibold transition w-full justify-center"
              >
                <RefreshCw size={14} />
                Refresh Community Posts
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Published Items List ── */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              {activeTab === 'feed'
              ? `My Published Posts (${myPosts.length})`
              : activeTab === 'gallery'
              ? `Gallery Albums — All (${myAlbums.length})`
              : `Community Posts — All Alumni (${communityPosts.length})`
            }
            </h2>
          </div>

          {(loadingItems && activeTab !== 'community') || (loadingCommunity && activeTab === 'community') ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : activeTab === 'feed' ? (
            myPosts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-100 text-slate-400">
                <FileText size={32} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No feed posts yet</p>
                <p className="text-sm mt-1">Create your first post using the form on the left.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myPosts.map(post => (
                  <div key={post.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#012140] text-white tracking-wider">
                            ADMIN POST
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium line-clamp-3 whitespace-pre-line">
                          {post.content || '(Image only)'}
                        </p>
                        {post.images.length > 0 && (
                          <div className="mt-2">
                            <img src={post.images[0]} alt="Post media" className="w-20 h-14 object-cover rounded-lg border border-slate-200" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition flex-shrink-0"
                        title="Delete Post"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'gallery' ? (
            myAlbums.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-100 text-slate-400">
                <BookImage size={32} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No albums yet</p>
                <p className="text-sm mt-1">Create your first gallery album using the form on the left.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myAlbums.map(album => (
                  <div key={album.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-600 text-white">
                            GALLERY
                          </span>
                          {album.category && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {album.category}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {new Date(album.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${album.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {album.isPublished ? 'PUBLISHED' : 'DRAFT'}
                          </span>
                          {album.postedBy?.name && (
                            <span className="text-[10px] text-slate-500 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                              By {album.postedBy.name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 truncate">{album.title}</h3>
                        {album.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{album.description}</p>
                        )}
                        {album.images.length > 0 && (
                          <div className="flex gap-1.5 mt-2">
                            {album.images.slice(0, 4).map((img, i) => (
                              <img key={i} src={img.imageUrl} alt={img.caption || ''} className="w-14 h-10 object-cover rounded-lg border border-slate-200 flex-shrink-0" />
                            ))}
                            {album.images.length > 4 && (
                              <div className="w-14 h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                                +{album.images.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteAlbum(album.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition flex-shrink-0"
                        title="Delete Album"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // ── Community Posts Tab ──
            communityPosts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-100 text-slate-400">
                <Users size={32} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No alumni posts found</p>
                <p className="text-sm mt-1">Alumni haven&apos;t published any posts to the feed yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {communityPosts.map(post => (
                  <div key={post.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Author info */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#003D7A] to-[#C41E3A] flex items-center justify-center text-white text-[10px] font-extrabold flex-shrink-0 overflow-hidden">
                            {post.author.avatarUrl ? (
                              <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full object-cover" />
                            ) : (
                              post.author.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{post.author.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {post.author.currentRole || 'Alumni'}
                              {post.author.currentCompany ? ` · ${post.author.currentCompany}` : ''}
                              {post.author.batchYear ? ` · Class of ${post.author.batchYear}` : ''}
                            </p>
                          </div>
                          <span className="ml-auto text-[10px] text-slate-400 flex-shrink-0">{post.createdAt}</span>
                        </div>
                        {/* Content */}
                        {post.content && (
                          <p className="text-sm text-gray-700 font-medium line-clamp-3 whitespace-pre-line mb-2">
                            {post.content}
                          </p>
                        )}
                        {/* Image preview */}
                        {post.media?.url && (
                          <img
                            src={post.media.url}
                            alt="Post media"
                            className="w-24 h-16 object-cover rounded-lg border border-slate-200"
                          />
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition flex-shrink-0"
                        title="Delete Alumni Post"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
