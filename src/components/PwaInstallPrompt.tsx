'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'ptu_pwa_prompt_dismissed';
const DISMISS_DAYS = 7; // show again after 7 days if dismissed

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return /android|iphone|ipad|ipod|blackberry|windows phone|mobile/i.test(ua);
}

function isAlreadyInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

function wasDismissedRecently(): boolean {
  try {
    const stored = localStorage.getItem(DISMISS_KEY);
    if (!stored) return false;
    const ts = parseInt(stored, 10);
    const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return days < DISMISS_DAYS;
  } catch {
    return false;
  }
}

export default function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Don't show on desktop, already-installed PWA, or if dismissed recently
    if (!isMobileDevice() || isAlreadyInstalled() || wasDismissedRecently()) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(ios);

    if (ios) {
      // On iOS there's no beforeinstallprompt — show our manual instructions
      const timer = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(timer);
    }

    // Android/Chrome: wait for the browser's install event
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setTimeout(() => setVisible(true), 2500);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {}
  };

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.current.prompt();
      const choice = await deferredPrompt.current.userChoice;
      if (choice.outcome === 'accepted') {
        setVisible(false);
        deferredPrompt.current = null;
      }
    } catch {}
    setIsInstalling(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Popup card */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999] mx-auto max-w-sm px-4 pb-6"
        style={{ animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, #012140 0%, #003D7A 60%, #0a4fa0 100%)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition"
            style={{ position: 'absolute', top: 12, right: 12 }}
            aria-label="Dismiss"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="p-5">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <Image src="/icon.png" alt="PTU Alumni" width={44} height={44} className="rounded-xl" />
              </div>
              <div>
                <p className="text-white/60 text-[11px] font-semibold uppercase tracking-widest">PTU Alumni</p>
                <h2 className="text-white font-extrabold text-lg leading-tight">Add to Home Screen</h2>
                <p className="text-white/55 text-xs mt-0.5">Access instantly, like a native app</p>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="flex gap-3 mb-5">
              {[
                { icon: '⚡', label: 'Instant access' },
                { icon: '📴', label: 'Works offline' },
                { icon: '🔔', label: 'Notifications' },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex-1 text-center py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="text-base">{f.icon}</div>
                  <div className="text-white/60 text-[10px] font-semibold mt-0.5">{f.label}</div>
                </div>
              ))}
            </div>

            {/* iOS instructions vs Android button */}
            {isIos ? (
              <div
                className="rounded-2xl p-4 mb-4"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <p className="text-white/80 text-xs font-semibold mb-3">To install on iPhone / iPad:</p>
                <div className="space-y-2.5">
                  {[
                    { step: '1', text: 'Tap the Share button', icon: '⬆️' },
                    { step: '2', text: 'Scroll and tap "Add to Home Screen"', icon: '➕' },
                    { step: '3', text: 'Tap "Add" to confirm', icon: '✅' },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-3">
                      <span className="text-lg">{s.icon}</span>
                      <span className="text-white/70 text-xs">{s.text}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={dismiss}
                  className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white transition"
                >
                  Maybe later
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="w-full py-3.5 rounded-2xl text-sm font-extrabold transition active:scale-95 disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #e31e24, #c41219)',
                    color: '#fff',
                    boxShadow: '0 4px 20px rgba(227,30,36,0.45)',
                  }}
                >
                  {isInstalling ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10" />
                      </svg>
                      Installing…
                    </span>
                  ) : (
                    '📲 Install App'
                  )}
                </button>
                <button
                  onClick={dismiss}
                  className="w-full py-2.5 rounded-2xl text-xs font-semibold text-white/40 hover:text-white/70 transition"
                >
                  Not now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%) scale(0.95); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
