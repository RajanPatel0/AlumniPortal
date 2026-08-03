'use client';

import { useState, useRef, useEffect } from 'react';
import { apiFetch } from "@/lib/api";
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import { getInitials } from '@/lib/utils/avatar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Briefcase, 
  Users, 
  Award, 
  Image as ImageIcon, 
  FileText, 
  Rocket, 
  GraduationCap, 
  Loader2,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ProfileCompletionModal from './ProfileCompletionModal';
import MyPostsModal from './MyPostsModal';
import PostCard from '@/components/alumni/PostCard';

export interface AlumniProfile {
  id?: string;
  name: string;
  email: string;
  batchYear: number;
  branch: string;
  college: string;
  currentRole?: string;
  currentCompany?: string;
  city?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
}

export interface FeedPost {
  id: string;
  author: {
    id?: string;
    name: string;
    batchYear: number;
    avatarUrl?: string;
    currentRole?: string;
    currentCompany?: string;
    isAdmin?: boolean;
  };
  content: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  hasLiked?: boolean;
  media?: {
    type: 'video' | 'image';
    title?: string;
    url: string;
    thumbnailUrl?: string;
  };
  images?: { imageUrl: string }[];
}

interface AlumniFeedClientProps {
  initialProfile: AlumniProfile | null;
  initialPosts: FeedPost[];
}

export default function AlumniFeedClient({ initialProfile, initialPosts }: AlumniFeedClientProps) {
  const [shareText, setShareText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image upload states
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fullscreen Image Lightbox Preview modal state
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // My Posts modal state
  const [myPostsModalOpen, setMyPostsModalOpen] = useState(false);

  // Promotions carousel interaction state
  const promotionsRef = useRef<HTMLDivElement>(null);
  const promotionsDragStartX = useRef(0);
  const promotionsDragStartScrollLeft = useRef(0);
  const promotionsIsDragging = useRef(false);
  const promotionsSuppressClick = useRef(false);

  const router = useRouter();
  const queryClient = useQueryClient();

  // ── Profile query (cached for 10 minutes, resolves alumni OR admin session) ──
  const { data: profile, isLoading: profileLoading } = useQuery<AlumniProfile | null>({
    queryKey: ['alumni-profile-me'],
    queryFn: async () => {
      // Try alumni session first
      const res = await apiFetch('/alumni/me');
      if (res.ok) {
        const data = await res.json();
        return data.user as AlumniProfile;
      }
      // Fall back to admin session (when admin browses the alumni portal)
      const adminRes = await apiFetch('/admin/me');
      if (adminRes.ok) {
        const data = await adminRes.json();
        return {
          name: data.user.name,
          email: data.user.email,
          isAdmin: true,
          currentRole: data.user.role,
          college: data.user.campus?.name || 'All Campuses (Consolidated)',
          batchYear: 0,
          branch: '',
        } as AlumniProfile;
      }
      // Neither session found — redirect to login
      router.push('/alumni/login');
      return null;
    },
    staleTime: 10 * 60 * 1000,   // 10 minutes
    retry: false,
    initialData: initialProfile,
  });

  // ── Feed posts query (cached for 5 minutes — persists across page navigation) ──
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['alumni-feed-posts'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiFetch(`/alumni/posts?page=${pageParam}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch feed');
      return res.json() as Promise<{ posts: FeedPost[]; hasMore: boolean }>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,   // 5 minutes — won't refetch when navigating back
    enabled: !profileLoading,   // wait until we know if user is authenticated
    initialData: {
      pages: [{ posts: initialPosts, hasMore: initialPosts.length === 10 }],
      pageParams: [1],
    },
  });

  const posts = postsData?.pages.flatMap((page) => page.posts) || [];

  const sentinelRef = useInfiniteScroll({
    onLoadMore: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploadingImage(true);
    const uploaded: string[] = [];
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'alumni_posts');

        const res = await apiFetch('/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.url) {
          uploaded.push(data.url);
        } else {
          toast.error(data.error || `Failed to upload ${file.name}`);
        }
      } catch (err) {
        console.error('[IMAGE_UPLOAD_ERROR]', err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setUploadedImageUrls(prev => [...prev, ...uploaded]);
    setIsUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreatePost = async () => {
    if (!shareText.trim() && uploadedImageUrls.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/alumni/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: shareText,
          imageUrls: uploadedImageUrls
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Posted to community feed!');
        setShareText('');
        setUploadedImageUrls([]);
        // Invalidate the cached feed so new post appears immediately
        queryClient.invalidateQueries({ queryKey: ['alumni-feed-posts'] });
      } else {
        toast.error(data.error || 'Failed to submit post');
      }
    } catch (err) {
      toast.error('Failed to submit post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollPromotions = (direction: 'left' | 'right') => {
    promotionsRef.current?.scrollBy({
      left: direction === 'right' ? 420 : -420,
      behavior: 'smooth',
    });
  };

  const handlePromotionsPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    const carousel = promotionsRef.current;
    if (!carousel) return;

    promotionsIsDragging.current = true;
    promotionsSuppressClick.current = false;
    promotionsDragStartX.current = event.clientX;
    promotionsDragStartScrollLeft.current = carousel.scrollLeft;
    carousel.setPointerCapture(event.pointerId);
  };

  const handlePromotionsPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!promotionsIsDragging.current) return;

    const carousel = promotionsRef.current;
    if (!carousel) return;

    const distance = event.clientX - promotionsDragStartX.current;
    if (Math.abs(distance) > 5) promotionsSuppressClick.current = true;
    carousel.scrollLeft = promotionsDragStartScrollLeft.current - distance;
  };

  const handlePromotionsPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    promotionsIsDragging.current = false;
    promotionsRef.current?.releasePointerCapture(event.pointerId);
  };

  const handlePromotionsClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!promotionsSuppressClick.current) return;

    event.preventDefault();
    event.stopPropagation();
    promotionsSuppressClick.current = false;
  };

  useEffect(() => {
    const carousel = promotionsRef.current;
    if (!carousel) return;

    const handleWheel = (e: WheelEvent) => {
      if (carousel.scrollWidth <= carousel.clientWidth) return;

      const horizontalDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY)
        ? e.deltaX
        : e.deltaY;
      if (horizontalDelta === 0) return;

      e.preventDefault();
      carousel.scrollLeft += horizontalDelta;
    };

    carousel.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      carousel.removeEventListener('wheel', handleWheel);
    };
  }, []);



  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-8">
      
      {/* Left Sidebar - Profile & Communities & Quick Links */}
      <div className="hidden lg:block lg:col-span-4 space-y-6 lg:sticky lg:top-24 lg:self-start">
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Banner Graphic */}
          <div className="h-28 bg-gradient-to-br from-blue-50 via-white to-red-50 relative flex items-center justify-center overflow-hidden">
            {/* Brand-color washes, corner-anchored */}
            <div className="absolute -top-14 -left-10 w-52 h-52 bg-[#003D7A]/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-16 -right-10 w-56 h-56 bg-[#C41E3A]/20 rounded-full blur-3xl"></div>

            {/* Diagonal center sweep tying the two brand colors together */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#003D7A]/10 via-transparent to-[#C41E3A]/10"></div>

            {/* Dot-grid texture */}
            <div className="absolute inset-0 opacity-[0.10] bg-[radial-gradient(#003D7A_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Brand accent line along the bottom edge */}
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-[#003D7A] via-[#C41E3A] to-[#003D7A]"></div>

            {/* Text content */}
            <div className="text-center p-3 relative z-10">
              <p className="text-[10px] font-bold tracking-widest text-[#003D7A] uppercase">Creating a platform</p>
              <p className="text-[11px] font-semibold text-slate-600">Where you can connect with Alumni</p>
            </div>
          </div>
          {/* User Info Container */}
          <div className="px-6 pb-6 pt-0 relative flex flex-col items-start">
            {/* Avatar overlapping banner */}
            <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-gradient-to-tr from-[#003D7A] to-[#C41E3A] flex items-center justify-center text-white font-extrabold text-2xl -mt-10 mb-3 overflow-hidden">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(profile?.name || 'Admin')
              )}
            </div>
            
            <h3 className="text-lg font-bold text-gray-900">{profile?.name}</h3>
            {profile?.isAdmin ? (
              <div className="space-y-1 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#012140] text-white">
                  {profile.currentRole || 'ADMINISTRATOR'}
                </span>
                <p className="text-xs text-slate-500 font-semibold">{profile.email}</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Class of {profile?.batchYear}
                </p>
                {profile?.currentRole && (
                  <p className="text-xs text-slate-600 mt-1 font-medium italic">
                    {profile.currentRole} {profile.currentCompany ? `at ${profile.currentCompany}` : ''}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Links Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h4 className="text-md font-bold text-gray-900 mb-4">Quick links</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Campus Clubs', icon: Users, href: '/alumni/communities',
                bg: 'bg-indigo-50 hover:bg-indigo-100', border: 'border-indigo-100 hover:border-indigo-200', text: 'text-indigo-700', icon2: 'text-indigo-600' },
              { label: 'Mentorship', icon: GraduationCap, href: '/alumni/networking',
                bg: 'bg-purple-50 hover:bg-purple-100', border: 'border-purple-100 hover:border-purple-200', text: 'text-purple-700', icon2: 'text-purple-600' },
              { label: 'Events', icon: Calendar, href: '/alumni/events',
                bg: 'bg-orange-50 hover:bg-orange-100', border: 'border-orange-100 hover:border-orange-200', text: 'text-orange-700', icon2: 'text-orange-600' },
              { label: 'Jobs & Internships', icon: Briefcase, href: '/alumni/jobs',
                bg: 'bg-emerald-50 hover:bg-emerald-100', border: 'border-emerald-100 hover:border-emerald-200', text: 'text-emerald-700', icon2: 'text-emerald-600' },    
             { label: 'Business Connect', icon: Award, href: '/alumni/startups', 
                bg: 'bg-blue-50 hover:bg-blue-100', border: 'border-blue-100 hover:border-blue-200', text: 'text-[#003D7A]', icon2: 'text-[#003D7A]' },
            ].map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${link.border} ${link.bg} text-xs font-bold ${link.text} transition-all hover:-translate-y-0.5 hover:shadow-sm`}
              >
                <link.icon size={14} className={link.icon2} />
                <span className="truncate">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Right Content Area - Feed Composer, Promo Carousel & Posts */}
      <div className="lg:col-span-8 space-y-6">

        {/* Composer Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-colors p-4 space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-[#003D7A] font-bold text-sm overflow-hidden flex-shrink-0">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(profile?.name || 'Admin')
              )}
            </div>
            
            <textarea 
              rows={2}
              placeholder={profile?.isAdmin ? "Posting is managed via Admin Posts module" : "Share something with your community..."} 
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              disabled={profile?.isAdmin}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 hover:border-[#003D7A]/30 focus:border-[#003D7A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003D7A]/10 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 transition resize-none"
            />
          </div>

          {/* Uploaded Images Thumbnails Grid */}
          {uploadedImageUrls.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 ml-13 pt-1">
              {uploadedImageUrls.map((url, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square group">
                  <img src={url} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setUploadedImageUrls(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-5 h-5 bg-rose-600/90 text-white rounded-full flex items-center justify-center hover:bg-rose-700 transition cursor-pointer"
                    title="Remove image"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions Bar */}
          {!profile?.isAdmin && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 ml-13">
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition disabled:opacity-50 cursor-pointer"
                >
                  {isUploadingImage ? <Loader2 size={15} className="animate-spin text-emerald-600" /> : <ImageIcon size={15} className="text-emerald-600" />}
                  <span>Add Photo</span>
                </button>

                <button 
                  type="button"
                  onClick={() => setMyPostsModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-[#003D7A] bg-blue-50 hover:bg-blue-100 border border-blue-100 transition cursor-pointer"
                >
                  <FileText size={15} className="text-[#003D7A]" />
                  <span>My Posts</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCreatePost}
                disabled={isSubmitting || isUploadingImage || (!shareText.trim() && uploadedImageUrls.length === 0)}
                className="px-6 py-2 bg-[#C41E3A] hover:bg-[#a3182f] hover:shadow-md hover:shadow-red-200 text-white text-xs font-bold rounded-full transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Promotions Carousel / Scroll Grid (Birthday wish card removed) */}
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => scrollPromotions('left')}
            aria-label="Show previous promotions"
            className="absolute left-1 sm:left-2 top-1/4 z-10 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-md transition hover:bg-white hover:text-[#003D7A] md:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollPromotions('right')}
            aria-label="Show more promotions"
            className="absolute right-1 sm:right-2 top-1/4 z-10 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-md transition hover:bg-white hover:text-[#003D7A] md:flex"
          >
            <ChevronRight size={18} />
          </button>

          <div
            ref={promotionsRef}
            onPointerDown={handlePromotionsPointerDown}
            onPointerMove={handlePromotionsPointerMove}
            onPointerUp={handlePromotionsPointerUp}
            onPointerCancel={handlePromotionsPointerUp}
            onClickCapture={handlePromotionsClickCapture}
            className="flex cursor-grab select-none gap-4 overflow-x-auto pb-2 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] active:cursor-grabbing"
          >
          {[  {
              title: 'Get Your Story Published!',
              desc: 'Share it on the Post and inspire the community',
              btn: 'Post Now',
              icon: FileText,
              href: '/alumni/newscorner',
              theme: {
                cardBg: 'bg-gradient-to-br from-teal-50 to-white',
                border: 'border-teal-100 hover:border-teal-300',
                glow: 'hover:shadow-teal-100',
                iconBg: 'bg-gradient-to-br from-teal-400 to-teal-600',
                btnBg: 'bg-teal-600 hover:bg-teal-700',
              },
            },
            {
              title: 'Memories Fade, Photos',
              desc: 'Share Photos of your time here and help us preserve them',
              btn: 'Share Photos',
              icon: ImageIcon,
              href: '/alumni/gallery',
              theme: {
                cardBg: 'bg-gradient-to-br from-pink-50 to-white',
                border: 'border-pink-100 hover:border-pink-300',
                glow: 'hover:shadow-pink-100',
                iconBg: 'bg-gradient-to-br from-pink-400 to-pink-600',
                btnBg: 'bg-pink-600 hover:bg-pink-700',
              },
            },
            {
              title: 'Are You Startup Owner?',
              desc: 'List your Startup here and stand out in the community!',
              btn: 'List Now',
              icon: Rocket,
              href: '/alumni/startups',
              theme: {
                cardBg: 'bg-gradient-to-br from-orange-50 to-white',
                border: 'border-orange-100 hover:border-orange-300',
                glow: 'hover:shadow-orange-100',
                iconBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
                btnBg: 'bg-orange-600 hover:bg-orange-700',
              },
            },
            {
              title: 'Job Openings You May Like',
              desc: 'Posted by your fellow alumni within the community',
              btn: 'View Openings',
              icon: Briefcase,
              href: '/alumni/jobs',
              theme: {
                cardBg: 'bg-gradient-to-br from-emerald-50 to-white',
                border: 'border-emerald-100 hover:border-emerald-300',
                glow: 'hover:shadow-emerald-100',
                iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
                btnBg: 'bg-emerald-600 hover:bg-emerald-700',
              },
            },
            {
              title: 'Looking for Guidance?',
              desc: 'Browse Senior Alumnis and get the Guidance',
              btn: 'See Mentors',
              icon: GraduationCap,
              href: '/alumni/networking',
              theme: {
                cardBg: 'bg-gradient-to-br from-blue-50 to-white',
                border: 'border-blue-100 hover:border-blue-300',
                glow: 'hover:shadow-blue-100',
                iconBg: 'bg-gradient-to-br from-blue-400 to-[#003D7A]',
                btnBg: 'bg-[#003D7A] hover:bg-[#002b56]',
              },
            },
            ].map((promo, idx) => (
              <div 
                key={idx} 
                className={`w-[200px] flex-shrink-0 ${promo.theme.cardBg} border ${promo.theme.border} rounded-2xl p-4 flex flex-col justify-between hover:shadow-lg ${promo.theme.glow} hover:-translate-y-1 transition-all duration-300`}
              >
                <div>
                  <div className={`w-9 h-9 rounded-xl ${promo.theme.iconBg} flex items-center justify-center text-white mb-3 shadow-sm`}>
                    <promo.icon size={16} />
                  </div>
                  <h5 className="text-xs font-bold text-gray-900 line-clamp-2 min-h-[32px] leading-tight">
                    {promo.title}
                  </h5>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 line-clamp-3 leading-relaxed">
                    {promo.desc}
                  </p>
                </div>
                <Link href={promo.href} className="w-full mt-4">
                  <button className={`w-full py-1.5 ${promo.theme.btnBg} text-white text-[11px] font-bold rounded-lg transition active:scale-[0.98]`}>
                    {promo.btn}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Feed Posts */}
        <div className="space-y-6">
          {posts.length > 0 ? (
            <>
              {posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={profile ? {
                    id: (profile as any).id,
                    name: profile.name,
                    avatarUrl: profile.avatarUrl,
                    isAdmin: profile.isAdmin
                  } : null}
                  onDeleteSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['alumni-feed-posts'] });
                  }}
                  priority={index === 0}
                />
              ))}

              {/* Sentinel element for infinite scroll */}
              <div ref={sentinelRef} className="py-4 flex justify-center border-t border-slate-100/50">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <Loader2 size={14} className="animate-spin text-[#003D7A]" />
                    <span>Loading more posts...</span>
                  </div>
                ) : hasNextPage ? (
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scroll to load more</span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">You&apos;ve reached the end of the feed</span>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-500 font-medium">
              No feed posts available. Start connecting with your community!
            </div>
          )}
        </div>

      </div>

      {/* Floating Sidebar Toggle Button for Mobile */}
      <div className="lg:hidden fixed bottom-24 right-6 z-40">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#003D7A] hover:bg-[#012140] text-white text-xs font-bold rounded-full shadow-lg transition active:scale-95 duration-200 cursor-pointer"
        >
          <Users size={16} />
          <span>My Profile & Groups</span>
        </button>
      </div>

      {/* Slide-in Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileSidebarOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-50 pt-5 pb-4 px-4 overflow-y-auto shadow-2xl transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Navigation</span>
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Sidebar content duplication */}
            <div className="space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-blue-900/10 via-slate-100 to-indigo-900/10 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#003D7A_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  <div className="text-center p-2 relative z-10">
                    <p className="text-[9px] font-bold tracking-widest text-[#003D7A] uppercase">Creating a platform</p>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-0 relative flex flex-col items-start">
                  <div className="w-16 h-16 rounded-full border-4 border-white shadow-md bg-gradient-to-tr from-[#003D7A] to-[#C41E3A] flex items-center justify-center text-white font-extrabold text-xl -mt-8 mb-2 overflow-hidden">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(profile?.name || 'Admin')
                    )}
                  </div>
                  
                  <h3 className="text-md font-bold text-gray-900">{profile?.name}</h3>
                  {profile?.isAdmin ? (
                    <div className="space-y-1 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-[#012140] text-white">
                        {profile.currentRole || 'ADMINISTRATOR'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        Class of {profile?.batchYear}
                      </p>
                      {profile?.currentRole && (
                        <p className="text-xs text-slate-600 mt-1 font-medium italic">
                          {profile.currentRole} {profile.currentCompany ? `at ${profile.currentCompany}` : ''}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Quick Links Panel in Mobile Drawer */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Quick links</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Campus Clubs', icon: Users, href: '/alumni/communities',
                      bg: 'bg-indigo-50 hover:bg-indigo-100', border: 'border-indigo-100 hover:border-indigo-200', text: 'text-indigo-700', icon2: 'text-indigo-600' },
                    { label: 'Mentorship', icon: GraduationCap, href: '/alumni/networking',
                      bg: 'bg-purple-50 hover:bg-purple-100', border: 'border-purple-100 hover:border-purple-200', text: 'text-purple-700', icon2: 'text-purple-600' },
                    { label: 'Events', icon: Calendar, href: '/alumni/events',
                      bg: 'bg-orange-50 hover:bg-orange-100', border: 'border-orange-100 hover:border-orange-200', text: 'text-orange-700', icon2: 'text-orange-600' },
                    { label: 'Jobs & Internships', icon: Briefcase, href: '/alumni/jobs',
                      bg: 'bg-emerald-50 hover:bg-emerald-100', border: 'border-emerald-100 hover:border-emerald-200', text: 'text-emerald-700', icon2: 'text-emerald-600' },
                    { label: 'Business Connect', icon: Award, href: '/alumni/startups', 
                      bg: 'bg-blue-50 hover:bg-blue-100', border: 'border-blue-100 hover:border-blue-200', text: 'text-[#003D7A]', icon2: 'text-[#003D7A]' },
                  ].map((link, idx) => (
                    <Link
                      key={idx}
                      href={link.href}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${link.border} ${link.bg} text-xs font-bold ${link.text} transition-all hover:-translate-y-0.5 hover:shadow-sm`}
                    >
                      <link.icon size={14} className={link.icon2} />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Click Preview Lightbox Modal with X button */}
      {selectedMediaUrl && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedMediaUrl(null)}
        >
          {/* Top Bar with Close X Button */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
            <a
              href={selectedMediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition backdrop-blur-md"
            >
              Open Original
            </a>
            <button
              type="button"
              onClick={() => setSelectedMediaUrl(null)}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-rose-600 text-white flex items-center justify-center transition backdrop-blur-md cursor-pointer shadow-lg active:scale-95"
              title="Close Preview (ESC)"
            >
              <X size={22} />
            </button>
          </div>

          <div
            className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedMediaUrl}
              alt="Enlarged Post View"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-scaleUp"
            />
          </div>
        </div>
      )}

      {/* Profile Completion Nudge Modal */}
      <ProfileCompletionModal profile={profile} />

      {/* My Posts Modal */}
      <MyPostsModal 
        isOpen={myPostsModalOpen}
        onClose={() => setMyPostsModalOpen(false)}
      />
    </div>
  );
}
