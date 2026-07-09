'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { href: '#leadership', label: 'Message' },
    { href: '#events', label: 'Events' },
    { href: '#news', label: 'News' },
    { href: '#testimonials', label: 'Spotlight' },
    { href: '#gallery', label: 'Gallery' },
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 w-full ${
      scrolled 
        ? 'bg-[#012140]/95 backdrop-blur-md shadow-lg py-3 border-b border-white/5' 
        : 'bg-[#012140] py-4 border-b border-white/10'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Crest & Title Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-md overflow-hidden border border-slate-100/10 flex-shrink-0">
            <img src="/icon.png" alt="logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-none">
              IKGPTU Alumni
            </h1>
            <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-1">
              Since 1997
            </p>
          </div>
        </div>

        {/* Desktop Links - Blended Style */}
        <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
          {links.map((link) => (
            <a 
              key={link.href} 
              href={link.href} 
              className="text-xs font-bold text-slate-300 hover:text-white px-4 py-2 rounded-full transition-all duration-200 uppercase tracking-wider relative hover:bg-white/5 active:scale-95"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Action Button - Blended Blue/Red Gradient */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/alumni/login"
            className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#C41E3A] via-[#b01630] to-[#003D7A] hover:from-[#d31c3a] hover:to-[#004e9a] transition-all duration-300 shadow-md shadow-black/20 hover:scale-105 active:scale-95"
          >
            Sign In
          </Link>
        </div>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition cursor-pointer gap-1.5"
          aria-label="Toggle navigation"
        >
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 z-40 bg-[#012140]/98 backdrop-blur-lg border-b border-white/10 shadow-2xl p-6 flex flex-col gap-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-200 uppercase tracking-wide"
              >
                {link.label}
              </a>
            ))}
          </div>
          <Link
            href="/alumni/login"
            onClick={() => setMobileOpen(false)}
            className="w-full text-center py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#C41E3A] to-[#003D7A] hover:opacity-90 transition active:scale-98 mt-2"
          >
            Sign In
          </Link>
        </div>
      )}
    </nav>
  );
}
