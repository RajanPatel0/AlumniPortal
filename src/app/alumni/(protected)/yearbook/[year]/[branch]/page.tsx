'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { use } from 'react';
import {
  ArrowLeft, ChevronRight, Search, Users, MapPin,
  Briefcase, GraduationCap, BookOpen, ExternalLink, X
} from 'lucide-react';

interface AlumniCard {
  id: string;
  name: string;
  avatarUrl?: string | null;
  currentRole?: string | null;
  currentCompany?: string | null;
  city?: string | null;
  branch: string;
  batchYear: number;
  isRegistered: boolean;
  college: string;
  course?: string | null;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

const AVATAR_BG_COLORS = [
  'from-[#003D7A] to-[#005fb8]',
  'from-[#C41E3A] to-[#e8325a]',
  'from-[#1d3557] to-[#457b9d]',
  'from-[#2d6a4f] to-[#52b788]',
  'from-[#7b2d8b] to-[#c77dff]',
  'from-[#0f3460] to-[#533483]',
  'from-[#b5451b] to-[#e07a5f]',
  'from-[#1b4332] to-[#40916c]',
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_BG_COLORS.length;
  return AVATAR_BG_COLORS[idx];
}

export default function YearbookAlumniPage({
  params,
}: {
  params: Promise<{ year: string; branch: string }>;
}) {
  const { year, branch } = use(params);
  const decodedBranch = decodeURIComponent(branch);

  const [alumni, setAlumni] = useState<AlumniCard[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAlumni = useCallback(async (searchVal: string, pageNum: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        year,
        branch: decodedBranch,
        page: String(pageNum),
        limit: '12',
        ...(searchVal ? { search: searchVal } : {}),
      });
      const res = await fetch(`/api/yearbook/alumni?${params}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAlumni(data.alumni || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setError('Failed to load alumni. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [year, decodedBranch]);

  // Initial load
  useEffect(() => {
    fetchAlumni('', 1);
  }, [fetchAlumni]);

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
      fetchAlumni(val, 1);
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
    fetchAlumni('', 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchAlumni(search, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/alumni/yearbook/${year}`}
          id="back-to-branches"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#003D7A] hover:border-[#003D7A] transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
          <Link href="/alumni/yearbook" className="hover:text-[#003D7A] transition-colors">Yearbook</Link>
          <ChevronRight size={12} />
          <Link href={`/alumni/yearbook/${year}`} className="hover:text-[#003D7A] transition-colors">
            Class of {year}
          </Link>
          <ChevronRight size={12} />
          <span className="text-slate-700 font-semibold">{decodedBranch}</span>
        </div>
      </div>

      {/* Header card */}
      <div className="bg-gradient-to-br from-[#001d3d] via-[#003D7A] to-[#0a1628] rounded-3xl p-7 sm:p-10 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#C41E3A]/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="text-white/60" size={16} />
            <span className="text-white/60 text-xs font-bold uppercase tracking-widest">
              {year} · {decodedBranch}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            {decodedBranch}
          </h1>
          <p className="text-white/60 text-sm mt-1 font-medium">
            {loading ? 'Loading members…' : `${total} ${total === 1 ? 'Member' : 'Members'} · Class of ${year}`}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id="yearbook-search"
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name, role or city…"
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 font-medium focus:outline-none focus:border-[#003D7A] focus:ring-2 focus:ring-[#003D7A]/10 shadow-sm transition"
        />
        {searchInput && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-16 text-slate-500">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-slate-100 animate-pulse overflow-hidden">
              <div className="h-44 bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-200 rounded w-1/3 mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && alumni.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <GraduationCap size={40} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-lg">
            {search ? 'No alumni match your search.' : 'No alumni found for this branch.'}
          </p>
          {search && (
            <button
              onClick={handleClearSearch}
              className="mt-3 text-sm text-[#003D7A] font-semibold hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Alumni Cards Grid */}
      {!loading && !error && alumni.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {alumni.map((a) => {
              const gradColor = getAvatarColor(a.name);
              return (
                <div
                  key={a.id}
                  id={`alumni-card-${a.id}`}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Avatar section */}
                  <div className="relative h-44 overflow-hidden bg-slate-50">
                    {a.avatarUrl ? (
                      <img
                        src={a.avatarUrl}
                        alt={a.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${gradColor} flex items-center justify-center`}>
                        <span className="text-white text-4xl font-black tracking-wide select-none">
                          {getInitials(a.name)}
                        </span>
                      </div>
                    )}

                    {/* Registered badge */}
                    {a.isRegistered && (
                      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm" title="Registered Alumni">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                    )}
                  </div>

                  {/* Info section */}
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{a.name}</h3>

                    {(a.currentRole || a.currentCompany) && (
                      <div className="flex items-center gap-1 mt-1">
                        <Briefcase size={11} className="text-slate-400 flex-shrink-0" />
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          {a.currentRole}{a.currentRole && a.currentCompany ? ' · ' : ''}{a.currentCompany}
                        </p>
                      </div>
                    )}

                    {a.city && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                        <p className="text-[11px] text-slate-500 font-medium truncate">{a.city}</p>
                      </div>
                    )}

                    {!a.currentRole && !a.city && (
                      <p className="text-[11px] text-slate-400 italic mt-1">{a.branch} · {a.batchYear}</p>
                    )}

                    {/* View More */}
                    <Link
                      href={`/alumni/profile?id=${a.id}`}
                      id={`view-profile-${a.id}`}
                      className="flex items-center gap-1.5 mt-3 text-[#003D7A] text-[11px] font-bold hover:gap-2 transition-all duration-200 group/link"
                    >
                      <span>View More</span>
                      <ExternalLink size={11} className="group-hover/link:scale-110 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                id="prev-page"
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-[#003D7A] hover:text-[#003D7A] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p as number)}
                      id={`page-btn-${p}`}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                        p === page
                          ? 'bg-[#003D7A] text-white shadow-md'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-[#003D7A] hover:text-[#003D7A]'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                id="next-page"
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-[#003D7A] hover:text-[#003D7A] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          )}

          {/* Bottom meta */}
          <p className="text-center text-xs text-slate-400 mt-4 font-medium">
            Showing {(page - 1) * 12 + 1}–{Math.min(page * 12, total)} of {total} members
          </p>
        </>
      )}
    </div>
  );
}
