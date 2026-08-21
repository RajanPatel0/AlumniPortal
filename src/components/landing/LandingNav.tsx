'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BASE_PATH, apiFetch } from '@/lib/api';
import { ArrowRight, User } from 'lucide-react';

interface AlumniUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  email: string;
}

export default function LandingNav({ initialAlumni = null }: { initialAlumni?: AlumniUser | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [alumni, setAlumni] = useState<AlumniUser | null>(initialAlumni);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!initialAlumni) {
      apiFetch('/alumni/me')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setAlumni(data.user);
          }
        })
        .catch(() => {});
    } else {
      setAlumni(initialAlumni);
    }
  }, [initialAlumni]);

  const links = [
    { href: '#leadership', label: 'Message' },
    { href: '#events', label: 'Events' },
    { href: '#news', label: 'News' },
    { href: '#testimonials', label: 'Spotlight' },
    { href: '#gallery', label: 'Gallery' },
    { href: 'https://ptu.ac.in/alumni/distinguished-alumni', label: 'Notable Alumni' },
    { href: 'https://ptu.ac.in/alumni/jobs-for-alumni', label: 'Govt Vacancies' },
    { href: 'https://placements.ptu.ac.in', label: 'Placement portal' },
  ];

  return (
    <nav className={`sticky top-0 z-[2000] transition-all duration-300 w-full ${
      scrolled 
        ? 'bg-[#012140]/95 backdrop-blur-md shadow-lg py-2.5 border-b border-white/5' 
        : 'bg-[#012140] py-3.5 border-b border-white/10'
    }`}>
      <div className="max-w-[95vw] xl:max-w-[1440px] mx-auto px-3 sm:px-6 flex items-center justify-between gap-4">
        {/* Crest & Title Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-white shadow-md overflow-hidden border border-slate-100/10 shrink-0">
            <img src={`${BASE_PATH}/icon.png`} alt="logo" className="w-full h-full object-cover" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight leading-none whitespace-nowrap">
                IKGPTU Alumni
              </h1>
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none bg-red-950/40 px-2 py-0.5 rounded-full border border-red-500/30 whitespace-nowrap">
                Since 1997
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-300 tracking-tight leading-none mt-1 whitespace-nowrap">
              (Formerly Punjab Technical University)
            </p>
          </div>
        </div>

        {/* Desktop Links - Blended Style */}
        <div className="hidden lg:flex items-center bg-white/5 border border-white/10 rounded-full px-2 py-1 gap-0.5 xl:gap-1 shrink-0">
          {links.map((link) => (
            <a 
              key={link.href} 
              href={link.href} 
              className="text-[10px] xl:text-[11px] font-extrabold text-slate-300 hover:text-white px-2.5 xl:px-3 py-1.5 rounded-full transition-all duration-200 uppercase tracking-wider relative hover:bg-[#C41E3A] active:scale-95 whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Action Button - Dynamic depending on Auth status */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {alumni ? (
            <Link
              href="/alumni/feed"
              className="inline-flex items-center gap-2 px-4 xl:px-5 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-[#003D7A] via-[#002654] to-[#C41E3A] hover:from-[#002b56] hover:to-[#a0162e] transition-all duration-300 shadow-md shadow-black/20 hover:scale-105 active:scale-95 border border-white/20 whitespace-nowrap"
            >
              {alumni.avatarUrl ? (
                <img src={alumni.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-white/50" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-white/20 text-white font-black text-[10px] flex items-center justify-center">
                  <User size={12} />
                </div>
              )}
              <span>Enter Portal</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link
              href="/alumni/login"
              className="px-5 xl:px-6 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-[#C41E3A] via-[#b01630] to-[#003D7A] hover:from-[#d31c3a] hover:to-[#004e9a] transition-all duration-300 shadow-md shadow-black/20 hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden flex flex-col items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition cursor-pointer gap-1.5 shrink-0"
          aria-label="Toggle navigation"
        >
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 z-40 bg-[#012140]/98 backdrop-blur-lg border-b border-white/10 shadow-2xl p-6 flex flex-col gap-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all duration-200 uppercase tracking-wide"
              >
                {link.label}
              </a>
            ))}
          </div>
          {alumni ? (
            <Link
              href="/alumni/feed"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center py-3 rounded-xl text-sm font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-[#003D7A] to-[#C41E3A] hover:opacity-90 transition active:scale-98 mt-2 flex items-center justify-center gap-2 border border-white/20 shadow-lg"
            >
              <span>Welcome Back, {alumni.name.split(' ')[0]}</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <Link
              href="/alumni/login"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#C41E3A] to-[#003D7A] hover:opacity-90 transition active:scale-98 mt-2"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

