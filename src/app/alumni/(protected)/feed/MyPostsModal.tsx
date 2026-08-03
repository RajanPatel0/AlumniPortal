'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Trash2, Loader2, Calendar, FileText, Sparkles, Image as ImageIcon } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { FeedPost } from './AlumniFeedClient';

interface MyPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyPostsModal({ isOpen, onClose }: MyPostsModalProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const fetchMyPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/alumni/posts?self=true&limit=100');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      } else {
        toast.error('Failed to load your posts');
      }
    } catch {
      toast.error('Failed to load your posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMyPosts();
    }
  }, [isOpen, fetchMyPosts]);

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Delete this post? This action cannot be undone.')) return;
    
    setDeletingId(postId);
    try {
      const res = await apiFetch(`/alumni/posts?id=${postId}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Post deleted successfully');
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        // Invalidate feed query so deleted post is instantly removed from main feed
        queryClient.invalidateQueries({ queryKey: ['alumni-feed-posts'] });
      } else {
        toast.error(data.error || 'Failed to delete post');
      }
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[#003D7A] to-[#012140] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-200">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">My Published Posts</h2>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {posts.length} {posts.length === 1 ? 'Post' : 'Posts'}
                </span>
              </div>
              <p className="text-[11px] text-blue-100/80 font-medium">Manage and review all your shared community posts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 size={28} className="animate-spin text-[#003D7A] mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading your posts...</p>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <div 
                key={post.id} 
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3 hover:border-slate-300 transition"
              >
                {/* Header row with date & delete button */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <Calendar size={13} className="text-[#003D7A]" />
                    {post.createdAt}
                  </span>

                  <button
                    onClick={() => handleDeletePost(post.id)}
                    disabled={deletingId === post.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-100 disabled:opacity-50 cursor-pointer"
                  >
                    {deletingId === post.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    <span>Delete</span>
                  </button>
                </div>

                {/* Content */}
                {post.content && (
                  <p className="text-xs font-medium text-slate-800 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                )}

                {/* Image preview if any */}
                {post.media?.url && (
                  <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-100 max-h-48 flex items-center justify-center">
                    <img 
                      src={post.media.url} 
                      alt="Post attachment" 
                      className="w-full h-48 object-cover" 
                    />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200/80">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#003D7A] flex items-center justify-center mx-auto">
                <Sparkles size={22} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Posts Yet</h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                You haven&apos;t shared any posts with the community yet. Share updates using the composer above!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
