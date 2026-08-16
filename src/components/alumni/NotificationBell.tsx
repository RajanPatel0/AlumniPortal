'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import {
  Bell,
  CheckCheck,
  UserPlus,
  FileText,
  Megaphone,
  Sparkles,
  Clock,
  ExternalLink,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface NotificationItem {
  id: string;
  type: 'ADMIN_ANNOUNCEMENT' | 'FOLLOW' | 'ANALYTICS_MILESTONE' | 'POST_CREATED';
  title: string;
  body: string;
  url?: string | null;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Unread count query (polls every 30s, refetches on window focus)
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: async () => {
      const res = await apiFetch('/alumni/notifications/unread-count');
      if (!res.ok) return { unreadCount: 0 };
      return res.json() as Promise<{ unreadCount: number }>;
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const unreadCount = unreadData?.unreadCount ?? 0;

  // 2. Infinite query for notification list (enabled when bell panel is open)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async ({ pageParam = null }) => {
      const url = pageParam
        ? `/alumni/notifications?cursor=${pageParam}&limit=20`
        : '/alumni/notifications?limit=20';
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json() as Promise<{ data: NotificationItem[]; nextCursor: string | null }>;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: isOpen,
  });

  const notifications = data?.pages.flatMap((page) => page.data) || [];

  // Infinite scroll sentinel ref
  const sentinelRef = useInfiniteScroll({
    onLoadMore: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
  });

  // Close dropdown on outside click (desktop)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Optimistic Mark-As-Read
  const handleMarkAsRead = async (notificationId: string) => {
    // Optimistic cache update
    queryClient.setQueryData(['notifications', 'unreadCount'], (old: { unreadCount: number } | undefined) => ({
      unreadCount: Math.max(0, (old?.unreadCount || 1) - 1),
    }));

    queryClient.setQueryData(['notifications', 'list'], (oldData: unknown) => {
      if (!oldData || typeof oldData !== 'object' || !('pages' in oldData)) return oldData;
      const infiniteData = oldData as { pages: { data: NotificationItem[]; nextCursor: string | null }[] };
      return {
        ...infiniteData,
        pages: infiniteData.pages.map((page) => ({
          ...page,
          data: page.data.map((item) =>
            item.id === notificationId ? { ...item, isRead: true } : item
          ),
        })),
      };
    });

    try {
      await apiFetch('/alumni/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Optimistic Mark-All-Read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    queryClient.setQueryData(['notifications', 'unreadCount'], { unreadCount: 0 });

    queryClient.setQueryData(['notifications', 'list'], (oldData: unknown) => {
      if (!oldData || typeof oldData !== 'object' || !('pages' in oldData)) return oldData;
      const infiniteData = oldData as { pages: { data: NotificationItem[]; nextCursor: string | null }[] };
      return {
        ...infiniteData,
        pages: infiniteData.pages.map((page) => ({
          ...page,
          data: page.data.map((item) => ({ ...item, isRead: true })),
        })),
      };
    });

    toast.success('All notifications marked as read');

    try {
      await apiFetch('/alumni/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      toast.error('Failed to update notifications');
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }
    setIsOpen(false);
    if (item.url) {
      router.push(item.url);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'FOLLOW':
        return <UserPlus size={15} className="text-indigo-600" />;
      case 'POST_CREATED':
        return <FileText size={15} className="text-[#003D7A]" />;
      case 'ANALYTICS_MILESTONE':
        return <Sparkles size={15} className="text-amber-600" />;
      default:
        return <Megaphone size={15} className="text-[#C41E3A]" />;
    }
  };

  // Lock body scroll on mobile when modal panel is open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white hover:bg-slate-50 text-[#003D7A] hover:text-[#002b56] transition-all duration-200 border-2 border-[#003D7A]/25 hover:border-[#003D7A]/60 shadow-xs active:scale-95 cursor-pointer group"
        title="Notifications"
        aria-label="Personal Notifications"
      >
        <Bell size={17} className="stroke-[2.2] group-hover:scale-105 transition-transform" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#C41E3A] text-white text-[10px] font-black tracking-tight border-2 border-white shadow-md animate-in zoom-in-50 duration-200">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop Overlay for Mobile Modal */}
      {isOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[9990] animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown / Mobile Responsive Panel */}
      {isOpen && (
        <div className="fixed inset-x-3 top-16 max-h-[78vh] z-[9999] rounded-3xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-[400px] sm:max-h-[480px] sm:z-[1060] sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/60 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#003D7A]/10 text-[#003D7A]">
                <Bell size={16} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-none">Notifications</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Account alerts &amp; portal updates</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#003D7A] bg-blue-50 hover:bg-blue-100 rounded-lg transition active:scale-95"
                >
                  <CheckCheck size={13} />
                  <span>Read all</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 max-h-[380px] sm:max-h-[420px] p-2 space-y-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-[#003D7A]" />
                <span className="text-xs font-semibold">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-xs font-bold text-slate-800">You&apos;re all caught up</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  When you receive follow alerts, announcement updates, or post releases, they will appear here.
                </p>
              </div>
            ) : (
              <>
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3 rounded-2xl flex items-start gap-3 transition-all duration-150 cursor-pointer group relative ${
                      item.isRead
                        ? 'hover:bg-slate-50 text-slate-600'
                        : 'bg-blue-50/50 hover:bg-blue-50/90 text-slate-900 border-l-3 border-[#003D7A]'
                    }`}
                  >
                    {/* Type Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        item.type === 'FOLLOW'
                          ? 'bg-indigo-50 border border-indigo-100'
                          : item.type === 'POST_CREATED'
                          ? 'bg-blue-50 border border-blue-100'
                          : item.type === 'ANALYTICS_MILESTONE'
                          ? 'bg-amber-50 border border-amber-100'
                          : 'bg-rose-50 border border-rose-100'
                      }`}
                    >
                      {getIconForType(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4
                          className={`text-xs font-bold truncate ${
                            item.isRead ? 'text-slate-700 font-semibold' : 'text-slate-900 font-extrabold'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5 flex-shrink-0">
                          <Clock size={9} />
                          {formatTimestamp(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                        {item.body}
                      </p>

                      {item.url && (
                        <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#003D7A] group-hover:underline">
                          <span>View details</span>
                          <ExternalLink size={9} />
                        </div>
                      )}
                    </div>

                    {/* Unread Dot Indicator */}
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#003D7A] flex-shrink-0 self-center" />
                    )}
                  </div>
                ))}

                {/* Infinite Scroll Sentinel */}
                <div ref={sentinelRef} className="py-2 text-center">
                  {isFetchingNextPage && (
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                      <Loader2 size={12} className="animate-spin text-[#003D7A]" />
                      <span>Loading more...</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
