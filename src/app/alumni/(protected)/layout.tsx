// src/app/alumni/(protected)/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifyAlumniAccessToken } from '@/lib/auth/alumni-jwt';
import { verifyAccessToken } from '@/lib/auth/jwt';
import AlumniBottomNav from '@/components/AlumniBottomNav';

export default async function ProtectedAlumniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const alumniToken = cookieStore.get('alumniAccessToken')?.value;
  const staffToken = cookieStore.get('accessToken')?.value;

  if (!alumniToken && !staffToken) {
    redirect('/alumni/login');
  }

  let authorized = false;
  let isStaff = false;

  if (alumniToken) {
    try {
      verifyAlumniAccessToken(alumniToken);
      authorized = true;
    } catch {}
  }

  if (staffToken) {
    try {
      verifyAccessToken(staffToken);
      isStaff = true;
      if (!authorized) {
        authorized = true;
      }
    } catch {}
  }

  if (!authorized) {
    redirect('/alumni/login');
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-28 antialiased selection:bg-[#C41E3A]/10">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {/* Refined Institutional Crest Wrapper */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-900/10 tracking-wider flex-shrink-0">
                <img src="/icon.png" alt="logo" className="w-full h-full object-cover" />
              </div>
              
              <Link href="/" className="group block focus:outline-none max-w-[160px] sm:max-w-none">
                <h1 className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight text-slate-900 group-hover:text-[#003D7A] transition-colors leading-tight">
                  I.K.G. Punjab Technical University
                </h1>
                <p className="hidden sm:block text-[10px] font-semibold text-slate-500 tracking-wider uppercase transition-colors group-hover:text-[#C41E3A] mt-0.5">
                  Alumni Relations
                </p>
              </Link>
            </div>

            {/* Center Yearbook Nav Link - Hidden on Mobile */}
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/alumni/yearbook"
                className="group flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#003D7A]/20 bg-[#003D7A]/5 hover:bg-[#003D7A]/10 hover:border-[#003D7A]/40 transition-all duration-200"
              >
                <span className="text-xs font-bold text-[#003D7A] tracking-wide">Yearbook</span>
              </Link>
              {isStaff && (
                <a
                  href="/admin/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#012140] to-[#1a4ea3] hover:from-[#0f2e75] hover:to-[#2558c4] text-white text-xs font-bold rounded-full transition shadow-sm"
                >
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
                  <span>Admin Mode | Exit to Admin</span>
                </a>
              )}
            </div>

            {/* Quick Live Status Dot */}
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10 flex-shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Portal Connected</span>
              <span className="sm:hidden">Connected</span>
            </div>
        </div>
      </header>

      {/* Main Content Area - Maximized for High-Density Dashboard Views */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Persistent Navigation */}
      <AlumniBottomNav />
    </div>
  );
}