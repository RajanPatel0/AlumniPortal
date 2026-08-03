import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, MoreHorizontal, Heart, MessageCircle, Trash2, Send, Loader2
} from 'lucide-react';
import { apiFetch } from "@/lib/api";
import { toast } from 'react-hot-toast';
import { getInitials } from '@/lib/utils/avatar';
import PostTextContent from './PostTextContent';
import ImageGallery from './ImageGallery';
import { toggleFollowAlumni } from '@/actions/alumni-follow';
import { useQueryClient } from '@tanstack/react-query';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  alumniId: string;
  alumni: {
    id: string;
    name: string;
    avatarUrl: string | null;
    currentRole: string | null;
    currentCompany: string | null;
    batchYear: number;
  };
}

interface PostCardProps {
  post: {
    id: string;
    content: string;
    createdAt: string | Date;
    likesCount: number;
    commentsCount: number;
    hasLiked?: boolean;
    media?: { url: string } | null;
    images?: { imageUrl: string }[];
    author: {
      id?: string | null;
      name: string;
      batchYear: number;
      avatarUrl?: string | null;
      currentRole?: string | null;
      currentCompany?: string | null;
      isAdmin?: boolean;
      isFollowing?: boolean;
    };
  };
  currentUser: {
    id?: string;
    name: string;
    avatarUrl?: string;
    isAdmin?: boolean;
  } | null;
  onDeleteSuccess?: (postId: string) => void;
  priority?: boolean;
}

function shortenText(text: string, maxLength: number = 20): string {
  if (!text) return '';
  
  // Extract abbreviation in parentheses if present, e.g. "Punjab State Board (PSB)" -> "PSB"
  const parenMatch = text.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const inside = parenMatch[1].trim();
    if (inside.length >= 2 && inside.length <= 6 && /^[A-Za-z0-9&\s]+$/.test(inside)) {
      return inside;
    }
  }
  
  // Clean parentheses from text
  let cleaned = text.replace(/\s*\([^)]*\)/g, '').trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Try taking the first 2 words
  const words = cleaned.split(/\s+/);
  if (words.length > 1) {
    const candidate = words.slice(0, 2).join(' ');
    if (candidate.length <= maxLength) {
      return candidate;
    }
  }
  
  // Fallback to first word or simple truncation
  if (words[0].length <= maxLength) {
    return words[0];
  }
  
  return words[0].substring(0, maxLength) + '...';
}


export default function PostCard({ post, currentUser, onDeleteSuccess, priority = false }: PostCardProps) {
  const queryClient = useQueryClient();
  const [hasLiked, setHasLiked] = useState(post.hasLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount ?? 0);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeMenu, setActiveMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(post.author?.isFollowing || false);

  // Pagination states
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasNextCommentsPage, setHasNextCommentsPage] = useState(false);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);

  useEffect(() => {
    setHasLiked(post.hasLiked || false);
    setLikesCount(post.likesCount ?? 0);
    setCommentsCount(post.commentsCount ?? 0);
    setIsFollowing(post.author?.isFollowing || false);
  }, [post]);

  const handleLikeToggle = async () => {
    if (!currentUser) {
      toast.error('Please log in to like posts');
      return;
    }
    // Optimistic Update
    const nextState = !hasLiked;
    setHasLiked(nextState);
    setLikesCount(prev => nextState ? prev + 1 : prev - 1);

    try {
      const res = await apiFetch('/alumni/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id })
      });
      const data = await res.json();
      if (!res.ok) {
        // Rollback
        setHasLiked(!nextState);
        setLikesCount(prev => !nextState ? prev + 1 : prev - 1);
        toast.error(data.error || 'Failed to toggle like');
      }
    } catch {
      // Rollback
      setHasLiked(!nextState);
      setLikesCount(prev => !nextState ? prev + 1 : prev - 1);
      toast.error('Failed to toggle like');
    }
  };

  const handlePostFollowToggle = async () => {
    if (!currentUser) {
      toast.error('Please log in to follow users');
      return;
    }
    if (!post.author?.id) return;

    const nextState = !isFollowing;
    setIsFollowing(nextState);

    // Optimistically update all posts by the same author in the query cache
    const updateCache = (state: boolean) => {
      queryClient.setQueriesData(
        { queryKey: ['alumni-feed-posts'] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              posts: page.posts.map((p: any) => {
                if (p.author && p.author.id === post.author.id) {
                  return {
                    ...p,
                    author: {
                      ...p.author,
                      isFollowing: state,
                    },
                  };
                }
                return p;
              }),
            })),
          };
        }
      );
    };

    updateCache(nextState);

    try {
      const res = await toggleFollowAlumni(post.author.id);
      if (res.success) {
        toast.success(res.isFollowing ? 'Following user!' : 'Unfollowed user');
        const finalState = !!res.isFollowing;
        setIsFollowing(finalState);
        updateCache(finalState);
      } else {
        setIsFollowing(!nextState);
        updateCache(!nextState);
        toast.error(res.error || 'Failed to update follow status');
      }
    } catch {
      setIsFollowing(!nextState);
      updateCache(!nextState);
      toast.error('Failed to update follow status');
    }
  };

  const loadComments = async (pageNum = 1) => {
    if (pageNum === 1) {
      setIsLoadingComments(true);
    } else {
      setIsLoadingMoreComments(true);
    }
    try {
      const res = await apiFetch(`/alumni/posts/comments?postId=${post.id}&page=${pageNum}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 1) {
          setComments(data.comments || []);
        } else {
          setComments(prev => [...(data.comments || []), ...prev]);
        }
        setCommentsPage(pageNum);
        setHasNextCommentsPage(data.pagination?.hasNextPage || false);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoadingComments(false);
      setIsLoadingMoreComments(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await apiFetch('/alumni/posts/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, content: newCommentText })
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data.comment]);
        setCommentsCount(prev => prev + 1);
        setNewCommentText('');
        toast.success('Comment added!');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add comment');
      }
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await apiFetch(`/alumni/posts/comments?commentId=${commentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setCommentsCount(prev => Math.max(0, prev - 1));
        toast.success('Comment deleted');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete comment');
      }
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post? This action cannot be undone.')) return;
    try {
      const res = await apiFetch(`/alumni/posts?id=${post.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Post deleted successfully');
        if (onDeleteSuccess) {
          onDeleteSuccess(post.id);
        }
      } else {
        toast.error(data.error || 'Failed to delete post');
      }
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setActiveMenu(false);
    }
  };

  const toggleCommentsView = () => {
    const nextShow = !showComments;
    setShowComments(nextShow);
    if (nextShow && comments.length === 0) {
      loadComments();
    }
  };

  const authorProfileUrl = post.author?.isAdmin || !post.author?.id
    ? null
    : post.author.id === currentUser?.id
      ? '/alumni/profile'
      : `/alumni/profile/${post.author.id}`;

  const isPostAdmin = post.author?.isAdmin;
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const postImages = post.images || (post.media ? [{ imageUrl: post.media.url }] : []);

  const canDeletePost = Boolean(
    currentUser?.isAdmin || (currentUser?.id && post.author?.id === currentUser.id)
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4 hover:shadow-md transition duration-300">
      {/* Post Author Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003D7A] to-[#C41E3A] p-0.5 flex-shrink-0">
            <div className="w-full h-full rounded-[10px] bg-slate-100 overflow-hidden flex items-center justify-center">
              {post.author?.avatarUrl ? (
                <img 
                  src={post.author.avatarUrl} 
                  alt={post.author.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-slate-400 font-extrabold text-sm">{getInitials(post.author?.name || 'Alumni')}</span>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {authorProfileUrl ? (
                <Link href={authorProfileUrl} className="text-sm font-bold text-slate-900 hover:text-[#003D7A] truncate transition-colors">
                  {post.author?.name}
                </Link>
              ) : (
                <span className="text-sm font-bold text-slate-900 truncate">
                  {post.author?.name}
                </span>
              )}
              {isPostAdmin ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#012140]/10 text-[#012140]">
                  ADMIN
                </span>
              ) : post.author?.batchYear ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#003D7A]/10 text-[#003D7A]">
                  Class of &apos;{String(post.author.batchYear).slice(-2)}
                </span>
              ) : null}

              {!isPostAdmin && post.author?.id && currentUser && currentUser.id !== post.author.id && (
                <button
                  onClick={handlePostFollowToggle}
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[8px] font-bold border-none cursor-pointer transition ${
                    isFollowing
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-blue-50 text-[#003D7A] hover:bg-blue-100'
                  }`}
                >
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </button>
              )}
            </div>
            <p className="text-[10px] font-semibold text-slate-400 truncate">
              {isPostAdmin ? 'System Administrator' : `${shortenText(post.author?.currentRole || 'Alumni')} ${post.author?.currentCompany ? `at ${shortenText(post.author.currentCompany)}` : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
            <Calendar size={12} className="text-slate-400" />
            <span>{formattedDate}</span>
          </div>

          {canDeletePost && (
            <div className="relative">
              <button 
                onClick={() => setActiveMenu(!activeMenu)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <MoreHorizontal size={16} />
              </button>
              {activeMenu && (
                <div 
                  className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-20"
                  onMouseLeave={() => setActiveMenu(false)}
                >
                  <button
                    onClick={handleDeletePost}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                  >
                    <Trash2 size={14} />
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="py-1">
        <PostTextContent content={post.content} />
      </div>

      {/* Media Gallery */}
      {postImages.length > 0 && (
        <ImageGallery images={postImages} priority={priority} />
      )}

      {/* Action Buttons Footer */}
      <div className="flex items-center gap-4 text-xs font-bold text-slate-400 pt-2 border-t border-slate-100/50">
        <button 
          onClick={handleLikeToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
            hasLiked 
              ? 'bg-rose-50 text-rose-600' 
              : 'hover:bg-slate-50 hover:text-slate-600'
          }`}
        >
          <Heart size={14} className={hasLiked ? 'fill-rose-500 text-rose-500' : ''} />
          <span>{likesCount} Likes</span>
        </button>

        <button 
          onClick={toggleCommentsView}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
            showComments
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-slate-50 hover:text-slate-600'
          }`}
        >
          <MessageCircle size={14} />
          <span>{commentsCount} Comments</span>
        </button>
      </div>

      {/* Inline Comments Accordion Panel */}
      {showComments && (
        <div className="pt-3 border-t border-slate-100 space-y-4 animate-[fadeIn_0.2s_ease-out]">
          {/* Comments List */}
          {isLoadingComments ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={18} className="animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {hasNextCommentsPage && (
                <button
                  type="button"
                  onClick={() => loadComments(commentsPage + 1)}
                  disabled={isLoadingMoreComments}
                  className="w-full text-center py-1.5 text-[10px] font-bold text-[#003D7A] hover:text-[#C41E3A] hover:bg-slate-100 transition flex items-center justify-center gap-1 bg-slate-50 rounded-xl"
                >
                  {isLoadingMoreComments ? (
                    <Loader2 size={10} className="animate-spin text-slate-400" />
                  ) : null}
                  <span>Load older comments</span>
                </button>
              )}

              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-2">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => {
                  const commentAuthorUrl = comment.alumni?.id === currentUser?.id
                    ? '/alumni/profile'
                    : `/alumni/profile/${comment.alumni?.id}`;

                  const canDeleteComment = Boolean(
                    currentUser?.isAdmin || (currentUser?.id && comment.alumniId === currentUser.id)
                  );

                  return (
                    <div key={comment.id} className="flex gap-2.5 items-start bg-slate-50/70 p-3 rounded-2xl relative group/comment">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {comment.alumni?.avatarUrl ? (
                          <img src={comment.alumni.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">{getInitials(comment.alumni?.name)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link href={commentAuthorUrl} className="text-xs font-bold text-slate-800 hover:underline truncate">
                            {comment.alumni?.name}
                          </Link>
                          {comment.alumni?.batchYear ? (
                            <span className="text-[9px] font-semibold text-slate-400 bg-slate-200 px-1 py-0.2 rounded">
                              &apos;{String(comment.alumni.batchYear).slice(-2)}
                            </span>
                          ) : null}
                          <span className="text-[9px] text-slate-400 ml-auto">
                            {new Date(comment.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed whitespace-pre-line">{comment.content}</p>
                      </div>

                      {canDeleteComment && (
                        <button
                          onClick={() => handleCommentDelete(comment.id)}
                          className="opacity-0 group-hover/comment:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200/50 transition shrink-0 ml-1"
                          title="Delete Comment"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Comment Form */}
          {currentUser && !currentUser.isAdmin && (
            <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-[#003D7A] focus:bg-white focus:outline-none rounded-xl transition font-medium"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newCommentText.trim()}
                className="p-2 bg-[#003D7A] hover:bg-[#002b56] text-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
              >
                {isSubmittingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
