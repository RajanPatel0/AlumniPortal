'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, LogOut, Users, Calendar, Home, Import, Briefcase, Rocket, BookOpen, FileText, LucideIcon, ExternalLink, Globe } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// Define the shape of a navigation item
interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  module: string;
}

// All possible modules (used for filtering)
const allModules: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Home, module: 'dashboard' },
  { name: 'Web Update', href: '/admin/landing-page', icon: Globe, module: 'landing-page' },
  { name: 'Import Alumni', href: '/admin/import', icon: Import, module: 'import' },
  { name: 'Alumni', href: '/admin/alumni', icon: Users, module: 'alumni' },
  { name: 'Posts & Gallery', href: '/admin/posts', icon: FileText, module: 'posts' },
  { name: 'Yearbook', href: '/admin/yearbook', icon: BookOpen, module: 'yearbook' },
  { name: 'Opportunities', href: '/admin/jobs', icon: Briefcase, module: 'jobs' },
  { name: 'Events', href: '/admin/events', icon: Calendar, module: 'events' },
  { name: 'Startups', href: '/admin/startups', icon: Rocket, module: 'startups' },
  { name: 'Registration Requests', href: '/admin/requests', icon: Users, module: 'requests' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/admin/auth/login');
      } else if (user.role !== 'ADMIN') {
        // 1. Subadmins cannot access /admin/subadmins
        if (pathname === '/admin/subadmins' || pathname.startsWith('/admin/subadmins/')) {
          const allowedModules = user.modules || [];
          const firstAllowed = allModules.find(item => allowedModules.includes(item.module));
          if (firstAllowed) {
            router.replace(firstAllowed.href);
          } else {
            router.replace('/admin/auth/login');
          }
          return;
        }

        // 2. Subadmins can only access modules they have permission for
        const currentItem = allModules.find(item => pathname === item.href || pathname.startsWith(`${item.href}/`));
        if (currentItem) {
          const allowedModules = user.modules || [];
          if (!allowedModules.includes(currentItem.module)) {
            // Find first allowed module
            const firstAllowed = allModules.find(item => allowedModules.includes(item.module));
            if (firstAllowed) {
              router.replace(firstAllowed.href);
            } else {
              toast.error("No access to this module.");
            }
          }
        } else if (pathname === '/admin' || pathname === '/admin/') {
          // If accessing root, redirect to first allowed module
          const allowedModules = user.modules || [];
          const firstAllowed = allModules.find(item => allowedModules.includes(item.module));
          if (firstAllowed) {
            router.replace(firstAllowed.href);
          }
        }
      }
    }
  }, [loading, user, pathname, router]);

  // Build dynamic nav items based on role and modules
  let navItems: NavItem[] = []; // ✅ explicit type
  if (user) {
    if (user.role === 'ADMIN') {
      // Admin sees everything
      navItems = [...allModules];
      // Add Sub-Admins link only for admin
      navItems.unshift({ 
        name: 'Sub-Admins', 
        href: '/admin/subadmins', 
        icon: Users, 
        module: 'subadmins' 
      });
    } else {
      // Sub-admin: filter modules by permissions
      const allowedModules = user.modules || [];
      navItems = allModules.filter(item => allowedModules.includes(item.module));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#012140] flex items-center justify-center">
        <div className="text-white text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 transform bg-[#012140] text-white transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-9">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-900/10 tracking-wider">
              <img src="/icon.png" alt="logo" className="w-full h-full object-cover" />
            </div>
          <span className="text-lg font-semibold">IKGPTU Alumni</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-6 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-[#d61c1c] text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-0 w-full px-3 space-y-1">
          {/* Enter Alumni Portal shortcut */}
          <Link
            href="/alumni/feed"
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white border border-white/10"
          >
            <ExternalLink size={18} />
            <span>Enter Alumni Portal</span>
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded p-1 text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-3">
            {/* Enter Alumni Portal button in topbar */}
            <Link
              href="/alumni/feed"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#012140] border border-[#012140]/20 hover:bg-[#012140]/5 rounded-lg transition"
            >
              <ExternalLink size={13} />
              Alumni Portal
            </Link>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-[#012140] flex items-center justify-center text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}