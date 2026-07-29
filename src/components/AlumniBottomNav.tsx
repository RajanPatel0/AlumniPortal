'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Calendar, Briefcase, User, LogOut, Bell, BookOpen, ArrowLeftCircle, Map, Users } from 'lucide-react';
import { useEffect, useState, Suspense } from 'react';
import { apiFetch, BASE_PATH } from "@/lib/api";

const navItems = [
  { name: 'Feed', href: '/alumni/feed', icon: Home },
  { name: 'Communities', href: '/alumni/communities', icon: Users },
  { name: 'Noticeboard', href: '/alumni/noticeboard', icon: Bell },
  { name: 'Yearbook', href: '/alumni/yearbook', icon: BookOpen },
  { name: 'Map', href: '/alumni/map', icon: Map },
  { name: 'Events', href: '/alumni/events', icon: Calendar },
  { name: 'Jobs', href: '/alumni/jobs', icon: Briefcase },
  { name: 'Profile', href: '/alumni/profile', icon: User },
];

interface AlumniBottomNavProps {
  isStaff?: boolean;
}

function AlumniBottomNavInner({ isStaff }: AlumniBottomNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(isStaff ?? false);

  // Detect the alumni id being viewed (from path parameter or ?id= query param)
  const pathId = pathname?.startsWith('/alumni/profile/') ? pathname.split('/')[3] : null;
  const viewingId = searchParams.get('id') || pathId;

  useEffect(() => {
    // Sync state if prop changes
    if (typeof isStaff === 'boolean') {
      setIsAdmin(isStaff);
      return;
    }
    // Check if current user is an admin/staff browsing the alumni portal only if not passed as prop
    apiFetch('/admin/me')
      .then(res => {
        if (res.ok) setIsAdmin(true);
      })
      .catch(() => {});
  }, [isStaff]);

  const handleLogout = async () => {
    await apiFetch('/alumni/logout', { method: 'POST' });
    window.location.href = `${BASE_PATH}/alumni/login`;
  };

  const handleExitToAdmin = () => {
    window.location.href = `${BASE_PATH}/admin/dashboard`;
  };

  // Build the profile link: for admin, if viewing a specific alumni, keep that context
  const profileHref = isAdmin && viewingId
    ? `/alumni/profile/${viewingId}`
    : '/alumni/profile';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-6px_32px_rgba(0,61,122,0.10),0_-1px_0_rgba(0,0,0,0.04)] z-[1050]">
      <div className="flex justify-around items-center max-w-lg mx-auto px-1 pb-[env(safe-area-inset-bottom,12px)] pt-1.5">
        {navItems.map((item) => {
          const href = item.href === '/alumni/profile' ? profileHref : item.href;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={href}
              className={`flex flex-col items-center py-1.5 px-1 transition-all duration-200 relative group flex-1 rounded-2xl ${
                isActive ? '' : 'hover:bg-blue-50/70'
              }`}
            >
              {/* Active pill background */}
              {isActive && (
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#003D7A]/10 to-[#C41E3A]/8 border border-[#003D7A]/10" />
              )}

              {/* Icon */}
              <span className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-br from-[#003D7A] to-[#C41E3A] text-white shadow-md shadow-[#003D7A]/30 scale-105'
                  : 'text-[#012140] group-hover:text-[#003D7A] group-hover:bg-blue-100/70'
              }`}>
                <item.icon size={18} className="transition-transform duration-200 group-hover:scale-110" />
              </span>

              {/* Label */}
              <span className={`relative z-10 text-[9px] mt-0.5 tracking-wide font-bold transition-colors duration-200 ${
                isActive
                  ? 'text-[#003D7A]'
                  : 'text-slate-500 group-hover:text-[#003D7A]'
              }`}>
                {item.name}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gradient-to-r from-[#003D7A] to-[#C41E3A]" />
              )}
            </Link>
          );
        })}

        {/* Logout or Exit Admin button */}
        {isAdmin ? (
          <button
            onClick={handleExitToAdmin}
            className="flex flex-col items-center py-1.5 px-1 flex-1 rounded-2xl hover:bg-amber-50/60 transition-all duration-200 group"
            title="Exit to Admin Dashboard"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-xl text-amber-700 group-hover:bg-amber-100/70 transition-all duration-200">
              <ArrowLeftCircle size={18} className="transition-transform duration-200 group-hover:scale-110" />
            </span>
            <span className="text-[9px] mt-0.5 font-bold text-amber-700 group-hover:text-amber-800 tracking-wide">Exit</span>
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center py-1.5 px-1 flex-1 rounded-2xl hover:bg-rose-50/60 transition-all duration-200 group"
            title="Logout"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-xl text-[#012140] group-hover:text-rose-600 group-hover:bg-rose-100/60 transition-all duration-200">
              <LogOut size={18} className="transition-transform duration-200 group-hover:scale-110" />
            </span>
            <span className="text-[9px] mt-0.5 font-bold text-slate-500 group-hover:text-rose-600 tracking-wide">Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
}

export default function AlumniBottomNav({ isStaff }: AlumniBottomNavProps) {
  return (
    <Suspense fallback={
      <nav className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-6px_32px_rgba(0,61,122,0.10)] z-[1050] h-[68px]" />
    }>
      <AlumniBottomNavInner isStaff={isStaff} />
    </Suspense>
  );
}