'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, CheckCircle2, AlertCircle, Sparkles, ArrowRight, Clock } from 'lucide-react';
import { calculateProfileCompleteness } from '@/lib/alumni/profile-completeness';

interface ProfileCompletionModalProps {
  profile: any;
}

export default function ProfileCompletionModal({ profile }: ProfileCompletionModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!profile || profile.isAdmin) return;

    // Check if dismissed in current browser session
    const isDismissed = sessionStorage.getItem('profile_nudge_dismissed') === 'true';
    const { percentage } = calculateProfileCompleteness(profile);

    if (percentage < 100 && !isDismissed) {
      setIsOpen(true);
    }
  }, [profile]);

  if (!isOpen || !profile || profile.isAdmin) return null;

  const { percentage, missing, completed } = calculateProfileCompleteness(profile);

  if (percentage >= 100) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('profile_nudge_dismissed', 'true');
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-[#003D7A] to-[#012140] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">Complete Your Profile</h2>
              <p className="text-xs text-blue-100/80 font-medium">Help fellow alumni & recruiters connect with you</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
            title="Dismiss for now"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar Section */}
        <div className="p-6 space-y-5 bg-white">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-extrabold text-slate-800">
              <span>Profile Completeness</span>
              <span className="text-[#003D7A] bg-blue-50 px-2.5 py-0.5 rounded-full text-sm">
                {percentage}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-[#003D7A] to-blue-600 h-full rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Checklist items */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Profile Items Checklist
            </p>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {/* Missing items */}
              {missing.map((item, idx) => (
                <div
                  key={`missing-${idx}`}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-slate-800 text-xs font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertCircle size={16} className="text-amber-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    Action Needed
                  </span>
                </div>
              ))}

              {/* Completed items */}
              {completed.map((item, idx) => (
                <div
                  key={`completed-${idx}`}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 text-xs font-medium"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span className="line-through">{item}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Done
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
          <button
            onClick={handleDismiss}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <Clock size={14} />
            Remind Me Later
          </button>

          <Link
            href="/alumni/profile?edit=true"
            onClick={handleDismiss}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#003D7A] to-[#012140] hover:from-[#002654] hover:to-[#00172e] text-white text-xs font-bold rounded-2xl shadow-md transition transform hover:-translate-y-0.5"
          >
            Complete Profile Now
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
