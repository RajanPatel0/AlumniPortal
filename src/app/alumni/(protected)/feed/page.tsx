// src/app/alumni/(protected)/feed/page.tsx
'use client';

import { useState, useRef } from 'react';
import { apiFetch } from "@/lib/api";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Briefcase, 
  Users, 
  Award, 
  Image as ImageIcon, 
  FileText, 
  MoreHorizontal, 
  ThumbsUp, 
  Share2, 
  Rocket, 
  GraduationCap, 
  MessageCircle,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AlumniProfile {
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

interface FeedPost {
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
  media?: {
    type: 'video' | 'image';
    title?: string;
    url: string;
    thumbnailUrl?: string;
  };
}

export default function AlumniFeed() {
  const [shareText, setShareText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // Image upload states
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
  });

  // ── Feed posts query (cached for 5 minutes — persists across page navigation) ──
  const {
    data: postsData,
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useQuery<{ posts: FeedPost[] }>({
    queryKey: ['alumni-feed-posts'],
    queryFn: async () => {
      const res = await apiFetch('/alumni/posts');
      if (!res.ok) throw new Error('Failed to fetch feed');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,   // 5 minutes — won't refetch when navigating back
    enabled: !profileLoading,   // wait until we know if user is authenticated
  });

  const posts = postsData?.posts || [];
  const loading = profileLoading;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
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
        setUploadedImageUrl(data.url);
        toast.success('Image uploaded successfully!');
      } else {
        toast.error(data.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('[IMAGE_UPLOAD_ERROR]', err);
      toast.error('Image upload failed');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async () => {
    if (!shareText.trim() && !uploadedImageUrl) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/alumni/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: shareText,
          imageUrl: uploadedImageUrl || undefined
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Posted to community feed!');
        setShareText('');
        setUploadedImageUrl('');
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

  const handleLike = (id: string) => {
    setLikedPosts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-8">
        {/* Left Sidebar Skeleton (Hidden on mobile) */}
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-pulse">
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="w-2/3 h-5 bg-slate-200 rounded"></div>
            <div className="w-1/2 h-4 bg-slate-200 rounded"></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3 animate-pulse">
            <div className="w-1/3 h-5 bg-slate-200 rounded"></div>
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="w-20 h-7 bg-slate-200 rounded-full"></div>
              <div className="w-28 h-7 bg-slate-200 rounded-full"></div>
              <div className="w-24 h-7 bg-slate-200 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Right Feed Skeleton */}
        <div className="lg:col-span-8 space-y-6">
          {/* Composer Skeleton */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200"></div>
              <div className="flex-1 h-10 bg-slate-200 rounded-full"></div>
            </div>
          </div>

          {/* Feed Post Skeletons */}
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-200"></div>
                <div className="space-y-2 flex-1">
                  <div className="w-1/4 h-4 bg-slate-200 rounded"></div>
                  <div className="w-1/6 h-3 bg-slate-200 rounded"></div>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="w-full h-4 bg-slate-200 rounded"></div>
                <div className="w-11/12 h-4 bg-slate-200 rounded"></div>
                <div className="w-3/4 h-4 bg-slate-200 rounded"></div>
              </div>
              <div className="h-48 bg-slate-200 rounded-xl pt-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Get initial letters of user's name for placeholder avatar
  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'A';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-8">
      
      {/* Left Sidebar - Profile & Communities & Quick Links */}
      <div className="hidden lg:block lg:col-span-4 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Banner Graphic */}
          <div className="h-28 bg-gradient-to-r from-blue-900/10 via-slate-100 to-indigo-900/10 relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#003D7A_1px,transparent_1px)] [background-size:16px_16px]"></div>
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
              { label: 'Business Connect', icon: Award, href: '/alumni/networking' },
              { label: 'Mentorship', icon: GraduationCap, href: '/alumni/networking' },
              { label: 'Events', icon: Calendar, href: '/alumni/events' },
              { label: 'Jobs & Internships', icon: Briefcase, href: '/alumni/jobs' },
            ].map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-blue-50 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-100 text-xs font-bold text-[#003D7A] transition"
              >
                <link.icon size={14} className="text-[#003D7A]" />
                <span className="truncate">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Right Content Area - Feed Composer, Promo Carousel & Posts */}
      <div className="lg:col-span-8 space-y-6">

        {/* Composer Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
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
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-slate-250 focus:bg-white focus:outline-none rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 transition resize-none"
            />
          </div>

          {/* Uploaded Image Preview Row */}
          {uploadedImageUrl && (
            <div className="relative rounded-xl overflow-hidden border border-slate-100 max-w-sm group bg-slate-50 ml-13">
              <img src={uploadedImageUrl} alt="Upload preview" className="max-h-60 w-auto object-contain rounded-xl" />
              <button
                type="button"
                onClick={() => setUploadedImageUrl('')}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition shadow cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Actions Bar */}
          {!profile?.isAdmin && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-50 ml-13">
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-emerald-650 hover:bg-emerald-50 transition disabled:opacity-50 cursor-pointer"
                >
                  {isUploadingImage ? <Loader2 size={15} className="animate-spin text-emerald-600" /> : <ImageIcon size={15} className="text-emerald-600" />}
                  <span>Add Photo</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCreatePost}
                disabled={isSubmitting || isUploadingImage || (!shareText.trim() && !uploadedImageUrl)}
                className="px-5 py-2 bg-[#C41E3A] hover:bg-[#a3182f] text-white text-xs font-bold rounded-full transition active:scale-95 disabled:opacity-50 cursor-pointer"
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
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Promotions Carousel / Scroll Grid (Birthday wish card removed) */}
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]">
          {[
            {
              title: 'Are You Startup Owner?',
              desc: 'List your Startup here and stand out in the community!',
              btn: 'List Now',
              iconColor: 'bg-orange-500',
              icon: Rocket,
              href: '/alumni/startups'
            },
            {
              title: 'Job Openings You May Like',
              desc: 'Posted by your fellow alumni within the community',
              btn: 'View Openings',
              iconColor: 'bg-emerald-500',
              icon: Briefcase,
              href: '/alumni/jobs'
            },
            {
              title: 'Looking for Guidance?',
              desc: 'Browse Senior Alumnis and get the Guidance',
              btn: 'See Mentors',
              iconColor: 'bg-blue-500',
              icon: GraduationCap,
              href: '/alumni/networking'
            },
            {
              title: 'Get Your Story Published!',
              desc: 'Share it on the Post and inspire the community',
              btn: 'Post Now',
              iconColor: 'bg-[#009688]',
              icon: FileText,
              href: '/alumni/newscorner'
            },
            {
              title: 'Memories Fade, Photos',
              desc: 'Share Photos of your time here and help us preserve them',
              btn: 'Share Photos',
              iconColor: 'bg-pink-500',
              icon: ImageIcon,
              href: '/alumni/gallery'
            }
          ].map((promo, idx) => (
            <div 
              key={idx} 
              className="w-[200px] flex-shrink-0 bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition duration-200"
            >
              <div>
                <div className={`w-9 h-9 rounded-full ${promo.iconColor} flex items-center justify-center text-white mb-3 shadow-sm`}>
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
                <button className="w-full py-1.5 bg-[#003D7A] hover:bg-[#002b56] text-white text-[11px] font-bold rounded-lg transition active:scale-[0.98]">
                  {promo.btn}
                </button>
              </Link>
            </div>
          ))}
        </div>

        {/* Feed Posts */}
        <div className="space-y-6">
          {/* Posts loading skeleton — only on initial fetch, not on navigating back */}
          {postsLoading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="w-1/4 h-4 bg-slate-200 rounded" />
                    <div className="w-1/6 h-3 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="w-full h-4 bg-slate-200 rounded" />
                  <div className="w-11/12 h-4 bg-slate-200 rounded" />
                  <div className="w-3/4 h-4 bg-slate-200 rounded" />
                </div>
                <div className="h-48 bg-slate-200 rounded-xl" />
              </div>
            ))
          ) : posts.length > 0 ? (
            posts.map((post) => {
              const hasLiked = likedPosts[post.id];
              const isPostAdmin = post.author?.isAdmin;
              
              return (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  
                  {/* Post Header */}
                  <div className="p-4 flex items-center justify-between border-b border-slate-50">
                    {(() => {
                      const authorProfileUrl = isPostAdmin || !post.author.id
                        ? null
                        : post.author.id === (profile as any)?.id
                          ? '/alumni/profile'
                          : `/alumni/profile?id=${post.author.id}`;

                      const authorInfo = (
                        <>
                          <div className="w-10 h-10 rounded-full bg-indigo-50 border border-slate-100 flex items-center justify-center text-[#003D7A] font-bold text-sm overflow-hidden flex-shrink-0">
                            {post.author.avatarUrl ? (
                              <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(post.author.name)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm font-bold text-gray-900 hover:text-[#003D7A] cursor-pointer">
                                {post.author.name}
                              </h4>
                              {isPostAdmin ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#012140] text-white tracking-wider">
                                  ADMIN
                                </span>
                              ) : post.author.batchYear ? (
                                <span className="text-[11px] font-semibold text-slate-400">
                                  Class of &apos;{String(post.author.batchYear).slice(-2)}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[10px] font-semibold text-slate-500 font-medium">
                              {isPostAdmin ? 'System Administrator at IKGPTU' : `${post.author.currentRole || 'Alumni'} ${post.author.currentCompany ? `at ${post.author.currentCompany}` : ''}`}
                            </p>
                            <p className="text-[9px] font-medium text-slate-400 mt-0.5">
                              {post.createdAt}
                            </p>
                          </div>
                        </>
                      );

                      return authorProfileUrl ? (
                        <Link href={authorProfileUrl} className="flex items-center gap-3 hover:opacity-90 transition">
                          {authorInfo}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3">
                          {authorInfo}
                        </div>
                      );
                    })()}
                    
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="px-5 py-4">
                    <p className="text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-line">
                      {post.content}
                    </p>
                  </div>

                  {/* Post Media Area */}
                  {post.media && post.media.url && (
                    <div className="border-t border-slate-50 bg-slate-50 relative group overflow-hidden">
                      <div className="w-full max-h-[480px] overflow-hidden flex items-center justify-center bg-slate-100">
                        <img 
                          src={post.media.url} 
                          alt="Attached media" 
                          className="w-full h-auto max-h-[480px] object-contain group-hover:scale-[1.01] transition duration-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Engagement bar and buttons removed */}

                </div>
              );
            })
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

              {/* Quick Links Panel */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Quick links</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Business Connect', icon: Award, href: '/alumni/networking' },
                    { label: 'Mentorship', icon: GraduationCap, href: '/alumni/networking' },
                    { label: 'Events', icon: Calendar, href: '/alumni/events' },
                    { label: 'Jobs & Internships', icon: Briefcase, href: '/alumni/jobs' },
                  ].map((link, idx) => (
                    <Link
                      key={idx}
                      href={link.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-blue-50 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-100 text-[10px] font-bold text-[#003D7A] transition"
                    >
                      <link.icon size={12} className="text-[#003D7A]" />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
