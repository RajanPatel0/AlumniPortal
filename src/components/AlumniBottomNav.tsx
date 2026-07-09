'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Calendar, Briefcase, User, LogOut, Bell, BookOpen, ArrowLeftCircle } from 'lucide-react';
import { useEffect, useState, Suspense } from 'react';

const navItems = [
  { name: 'Feed', href: '/alumni/feed', icon: Home },
  { name: 'Noticeboard', href: '/alumni/noticeboard', icon: Bell },
  { name: 'Yearbook', href: '/alumni/yearbook', icon: BookOpen },
  { name: 'Events', href: '/alumni/events', icon: Calendar },
  { name: 'Jobs', href: '/alumni/jobs', icon: Briefcase },
  { name: 'Profile', href: '/alumni/profile', icon: User },
];

function AlumniBottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);

  // Detect the alumni id being viewed (passed as ?id= query param)
  const viewingId = searchParams.get('id');

  useEffect(() => {
    // Check if current user is an admin/staff browsing the alumni portal
    fetch('/api/admin/me')
      .then(res => {
        if (res.ok) setIsAdmin(true);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/alumni/logout', { method: 'POST' });
    window.location.href = '/alumni/login';
  };

  const handleExitToAdmin = () => {
    window.location.href = '/admin/dashboard';
  };

  // Build the profile link: for admin, if viewing a specific alumni, keep that context
  const profileHref = isAdmin && viewingId
    ? `/alumni/profile?id=${viewingId}`
    : '/alumni/profile';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom,16px)] pt-2">
        {navItems.map((item) => {
          // For profile link, use the admin-aware href
          const href = item.href === '/alumni/profile' ? profileHref : item.href;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={href}
              className={`flex flex-col items-center py-2 px-1 transition-all duration-200 relative group flex-1 ${
                isActive
                  ? 'text-[#C41E3A]'
                  : 'text-slate-500 hover:text-[#003D7A]'
              }`}
            >
              <item.icon size={20} className={`transition-transform group-hover:scale-110 ${isActive ? 'scale-105 text-[#C41E3A]' : ''}`} />
              <span className={`text-[10px] mt-1 tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
              {isActive && <div className="absolute bottom-0 left-4 right-4 h-1 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] rounded-full"></div>}
            </Link>
          );
        })}

        {/* Logout or Exit Admin button */}
        {isAdmin ? (
          <button
            onClick={handleExitToAdmin}
            className="flex flex-col items-center py-2 px-1 text-[#012140] hover:text-[#C41E3A] transition-all duration-200 group flex-1"
            title="Exit to Admin Dashboard"
          >
            <ArrowLeftCircle size={20} className="transition-transform group-hover:scale-110" />
            <span className="text-[10px] mt-1 font-semibold">Exit</span>
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center py-2 px-1 text-slate-500 hover:text-[#C41E3A] transition-all duration-200 group flex-1"
            title="Logout"
          >
            <LogOut size={20} className="transition-transform group-hover:scale-110" />
            <span className="text-[10px] mt-1 font-semibold">Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
}

export default function AlumniBottomNav() {
  return (
    <Suspense fallback={
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 h-[60px]" />
    }>
      <AlumniBottomNavInner />
    </Suspense>
  );
}