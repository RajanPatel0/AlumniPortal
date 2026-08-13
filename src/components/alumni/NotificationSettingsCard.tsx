'use client';

import { useWebPush } from '@/hooks/useWebPush';
import { Bell, BellRing, BellOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function NotificationSettingsCard() {
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    operating,
    subscribe,
    unsubscribe,
  } = useWebPush();

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-center min-h-[120px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#003D7A]" />
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Push Notifications Unavailable</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your current browser does not support Web Push notifications. Try using Chrome, Firefox, or Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
              isSubscribed
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-[#003D7A]/10 text-[#003D7A]'
            }`}
          >
            {isSubscribed ? <BellRing size={24} /> : <Bell size={24} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Web Push Notifications</h3>
              {isSubscribed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={12} /> Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Receive real-time notifications about campus announcements, networking requests, and important updates directly on your device.
            </p>
            {permission === 'denied' && (
              <p className="text-xs text-rose-600 font-medium mt-2 flex items-center gap-1">
                <AlertCircle size={14} /> Notifications are blocked in your browser settings. Please allow notifications for this site to subscribe.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {isSubscribed ? (
            <button
              onClick={unsubscribe}
              disabled={operating}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition disabled:opacity-50"
            >
              {operating ? <Loader2 size={14} className="animate-spin" /> : <BellOff size={14} />}
              <span>Disable Push</span>
            </button>
          ) : (
            <button
              onClick={subscribe}
              disabled={operating || permission === 'denied'}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#003D7A] hover:bg-[#002b56] rounded-xl shadow-md transition disabled:opacity-50"
            >
              {operating ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
              <span>Enable Notifications</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
