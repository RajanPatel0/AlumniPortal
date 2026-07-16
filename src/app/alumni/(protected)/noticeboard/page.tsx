'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from "@/lib/api";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Briefcase,
  Rocket,
  MapPin,
  Globe,
  ExternalLink,
  ArrowRight,
  Users,
} from 'lucide-react';

interface AlumniProfile {
  name: string;
  email: string;
  batchYear: number;
  branch: string;
  college: string;
  currentRole?: string;
  currentCompany?: string;
  city?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  role?: string;
}

interface EventSnippet {
  id: string;
  title: string;
  eventDate: string;
  venue: string;
  category: string;
  coverImageUrl: string | null;
}

interface JobSnippet {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  createdAt: string;
}

interface StartupSnippet {
  id: string;
  name: string;
  description: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  industry: string | null;
  foundedYear: number | null;
  founder: {
    name: string;
    currentRole: string | null;
    avatarUrl: string | null;
  };
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function getInitials(name: string) {
  return name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'S';
}

export default function AlumniNoticeboard() {
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/alumni/me')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        setProfile(data.user);
        setLoading(false);
      })
      .catch(() => {
        // Check if admin session exists before redirecting to alumni login
        apiFetch('/admin/me')
          .then(res => res.ok ? res.json() : Promise.reject())
          .then((adminData) => {
            // Populate profile with actual admin details from Staff table
            setProfile({
              name: adminData.user?.name || 'Admin',
              email: adminData.user?.email || '',
              isAdmin: true,
              role: adminData.user?.role || 'ADMIN',
              batchYear: 0,
              branch: '',
              college: 'IKGPTU Staff',
              currentRole: adminData.user?.role || 'Administrator',
            });
            setLoading(false);
          })
          .catch(() => {
            router.push('/alumni/login');
          });
      });
  }, [router]);

  // Fetch upcoming events (top 3)
  const { data: eventsData } = useQuery({
    queryKey: ['noticeboard-events'],
    queryFn: async () => {
      const res = await apiFetch(
        '/alumni/events?limit=3&page=1&sort=date&showPast=false'
      );
      if (!res.ok) return { events: [] };
      return res.json();
    },
    enabled: !loading,
  });

  // Fetch recent jobs (top 3)
  const { data: jobsData } = useQuery({
    queryKey: ['noticeboard-jobs'],
    queryFn: async () => {
      const res = await apiFetch('/alumni/jobs?limit=3&page=1');
      if (!res.ok) return { jobs: [] };
      return res.json();
    },
    enabled: !loading,
  });

  // Fetch featured startups (top 4)
  const { data: startupsData } = useQuery({
    queryKey: ['noticeboard-startups'],
    queryFn: async () => {
      const res = await apiFetch('/alumni/startups?limit=4&page=1&sort=Newest');
      if (!res.ok) return { startups: [] };
      return res.json();
    },
    enabled: !loading,
  });

  const events: EventSnippet[] = eventsData?.events || [];
  const jobs: JobSnippet[] = jobsData?.jobs || [];
  const startups: StartupSnippet[] = startupsData?.startups || [];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Welcome Banner Skeleton */}
        <div className="bg-slate-200 h-44 rounded-2xl" />

        {/* Profile Quick Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-1/3" />
              <div className="h-5 bg-slate-200 rounded w-2/3" />
            </div>
          ))}
        </div>

        {/* Upcoming Events Skeleton */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-200 rounded w-12" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-slate-100 overflow-hidden space-y-3 pb-4">
                <div className="w-full h-28 bg-slate-200" />
                <div className="px-4 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Job Opportunities Skeleton */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-200 rounded w-12" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center p-4 rounded-xl border border-slate-100">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                </div>
                <div className="h-8 bg-slate-200 rounded w-16" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#C41E3A] to-[#003D7A] text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }}
        />
        <div className="relative">
          <p className="text-red-200 text-sm font-semibold uppercase tracking-widest mb-1">Welcome back</p>
          <h1 className="text-3xl md:text-4xl font-black mb-1">{profile?.name} 👋</h1>
          {profile?.isAdmin ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/30">
                {profile.role || 'ADMINISTRATOR'}
              </span>
              <p className="text-red-100 text-sm">{profile.email}</p>
            </div>
          ) : (
            <>
              <p className="text-red-100">{profile?.branch} · Class of {profile?.batchYear}</p>
              {profile?.currentCompany && (
                <p className="text-red-100 mt-1 text-sm">
                  📍 {profile.currentRole ? `${profile.currentRole} at ` : ''}{profile.currentCompany}
                  {profile.city ? `, ${profile.city}` : ''}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Profile Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(profile?.isAdmin ? [
          { label: 'Name', value: profile?.name, border: '#C41E3A' },
          { label: 'Email', value: profile?.email, border: '#003D7A' },
          { label: 'Role', value: profile?.role || 'Administrator', border: '#0057B8' },
          { label: 'Department', value: 'IKGPTU Staff Portal', border: '#C41E3A' },
        ] : [
          { label: 'Email', value: profile?.email, border: '#C41E3A' },
          { label: 'College', value: profile?.college, border: '#003D7A' },
          { label: 'Current Role', value: profile?.currentRole || 'Not specified', border: '#0057B8' },
          { label: 'Location', value: profile?.city || 'Not specified', border: '#C41E3A' },
        ]).map(({ label, value, border }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-5 border-t-4" style={{ borderTopColor: border }}>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
            <p className="text-gray-900 font-bold text-sm truncate">{value || '—'}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Events */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#C41E3A]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Upcoming Events</h2>
          </div>
          <Link href="/alumni/events" className="flex items-center gap-1 text-xs font-bold text-[#003D7A] hover:text-[#C41E3A] transition">
            View All <ArrowRight size={13} />
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-slate-400 font-semibold text-center py-6">No upcoming events right now.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {events.map((event) => (
              <div key={event.id} className="rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition group">
                {event.coverImageUrl ? (
                  <img src={event.coverImageUrl} alt={event.title} className="w-full h-28 object-cover group-hover:scale-105 transition" />
                ) : (
                  <div className="w-full h-28 bg-gradient-to-br from-[#003D7A]/10 to-[#C41E3A]/10 flex items-center justify-center">
                    <Calendar className="text-slate-300" size={28} />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-[10px] font-bold text-[#C41E3A] uppercase tracking-wider mb-1">{formatDate(event.eventDate)}</p>
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">{event.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin size={10} />
                    {event.venue}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Job Opportunities */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-[#003D7A]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Job Opportunities</h2>
          </div>
          <Link href="/alumni/jobs" className="flex items-center gap-1 text-xs font-bold text-[#003D7A] hover:text-[#C41E3A] transition">
            View All <ArrowRight size={13} />
          </Link>
        </div>

        {jobs.length === 0 ? (
          <p className="text-sm text-slate-400 font-semibold text-center py-6">No job listings right now.</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-[#003D7A]/30 hover:shadow-sm transition">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{job.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {job.company} · <MapPin size={9} className="inline" /> {job.location}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 font-semibold">{timeAgo(job.createdAt)}</span>
                  <Link
                    href="/alumni/jobs"
                    className="px-3 py-1.5 bg-[#003D7A] text-white rounded-lg text-[10px] font-bold hover:bg-[#002b56] transition"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Alumni Startups */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
              <Rocket className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Alumni Startups</h2>
              <p className="text-[10px] text-slate-400 font-semibold">Businesses launched by your fellow alumni</p>
            </div>
          </div>
          <Link href="/alumni/startups" className="flex items-center gap-1 text-xs font-bold text-[#003D7A] hover:text-[#C41E3A] transition">
            View All <ArrowRight size={13} />
          </Link>
        </div>

        {startups.length === 0 ? (
          <div className="text-center py-8">
            <Rocket className="mx-auto text-slate-200 mb-2" size={32} />
            <p className="text-sm text-slate-400 font-semibold">No startups listed yet.</p>
            <Link href="/alumni/startups" className="inline-block mt-2 text-xs font-bold text-[#003D7A] hover:underline">
              Be the first to list yours →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {startups.map((startup) => (
              <div key={startup.id} className="rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition group flex flex-col">
                {/* Logo */}
                <div className="h-24 bg-slate-50 flex items-center justify-center p-3 border-b border-slate-50">
                  {startup.logoUrl ? (
                    <img src={startup.logoUrl} alt={startup.name} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#003D7A] to-[#C41E3A] flex items-center justify-center text-white font-black text-lg">
                      {getInitials(startup.name)}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <p className="font-bold text-xs text-gray-900 truncate">{startup.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{startup.description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-[8px] font-bold text-slate-500 shrink-0">
                        {startup.founder.avatarUrl ? (
                          <img src={startup.founder.avatarUrl} alt={startup.founder.name} className="w-full h-full object-cover" />
                        ) : getInitials(startup.founder.name)}
                      </div>
                      <span className="text-[9px] font-bold text-slate-600 truncate max-w-[60px]">{startup.founder.name}</span>
                    </div>
                    {startup.websiteUrl && (
                      <a href={startup.websiteUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[#003D7A] hover:text-[#C41E3A] transition shrink-0" title="Visit website">
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-5">
        <Link href="/alumni/profile"
          className="bg-gradient-to-br from-[#C41E3A] to-[#a01830] text-white rounded-2xl p-6 hover:shadow-lg transition group flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="font-bold text-sm">Update Your Profile</p>
            <p className="text-red-200 text-xs mt-0.5">Keep your details current for the network</p>
          </div>
          <ArrowRight size={16} className="ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition" />
        </Link>

        <Link href="/alumni/networking"
          className="bg-gradient-to-br from-[#003D7A] to-[#002654] text-white rounded-2xl p-6 hover:shadow-lg transition group flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="font-bold text-sm">Explore the Network</p>
            <p className="text-blue-200 text-xs mt-0.5">Connect with fellow alumni</p>
          </div>
          <ArrowRight size={16} className="ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition" />
        </Link>
      </div>

    </div>
  );
}
