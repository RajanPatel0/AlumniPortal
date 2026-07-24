// src/app/alumni/(protected)/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAlumniAccessToken } from '@/lib/auth/alumni-jwt';
import { verifyAccessToken } from '@/lib/auth/jwt';
import AlumniHeader from '@/components/AlumniHeader';
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
      <AlumniHeader isStaff={isStaff} />

      {/* Main Content Area - Maximized for High-Density Dashboard Views */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Persistent Navigation */}
      <AlumniBottomNav isStaff={isStaff} />
    </div>
  );
}