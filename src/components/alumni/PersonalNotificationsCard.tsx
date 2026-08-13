'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  UserPlus,
  Sparkles,
  Megaphone,
  Clock,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationItem {
  id: string;
  type: 'ADMIN_ANNOUNCEMENT' | 'FOLLOW' | 'ANALYTICS_MILESTONE';
  title: string;
  body: string;
  url?: string | null;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export default function PersonalNotificationsCard() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFetch('/alumni/notifications?limit=20');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching personal notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiFetch('/alumni/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await apiFetch('/alumni/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      toast.error('Failed to update notifications');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiFetch(`/alumni/notifications?id=${id}`, {
        method: 'DELETE',
      });

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification removed');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      toast.error('Failed to delete notification');
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
        return <UserPlus size={16} className="text-indigo-600" />;
      case 'ANALYTICS_MILESTONE':
        return <Sparkles size={16} className="text-amber-600" />;
      default:
        return <Megaphone size={16} className="text-[#003D7A]" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#003D7A]/10 text-[#003D7A] flex items-center justify-center">
            <Bell size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Personal Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-[#C41E3A] text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Activity and updates specific to your account</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#003D7A] bg-blue-50 hover:bg-blue-100 rounded-xl transition disabled:opacity-50"
            >
              <CheckCheck size={14} />
              <span>Mark all read</span>
            </button>
          )}

          <button
            onClick={fetchNotifications}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            title="Refresh notifications"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-[#003D7A]" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-300 mx-auto flex items-center justify-center">
            <Bell size={22} />
          </div>
          <p className="text-xs font-bold text-slate-600">No notifications yet</p>
          <p className="text-[11px] text-slate-400">When you receive new followers or alerts, they will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto pr-1.5 space-y-1">
          {notifications.map((n) => {
            const destination = n.url || '/alumni/feed';
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                className={`py-3 px-3 rounded-2xl flex items-start gap-3 transition-colors cursor-pointer group ${
                  n.isRead ? 'hover:bg-slate-50/80 opacity-80' : 'bg-blue-50/50 hover:bg-blue-50/80'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    n.type === 'FOLLOW'
                      ? 'bg-indigo-50'
                      : n.type === 'ANALYTICS_MILESTONE'
                      ? 'bg-amber-50'
                      : 'bg-blue-50'
                  }`}
                >
                  {getIconForType(n.type)}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-xs font-bold truncate ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                      {n.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                        <Clock size={10} />
                        {formatTimestamp(n.createdAt)}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#003D7A]" title="Unread"></span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                    {n.body}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1">
                    {n.url ? (
                      <Link
                        href={destination}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!n.isRead) handleMarkAsRead(n.id);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#003D7A] hover:underline"
                      >
                        <span>View details</span>
                        <ExternalLink size={10} />
                      </Link>
                    ) : (
                      <span></span>
                    )}

                    <button
                      onClick={(e) => handleDelete(n.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete notification"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
