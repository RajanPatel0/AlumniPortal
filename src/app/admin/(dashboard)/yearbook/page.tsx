'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  BookOpen, Users, ChevronDown, ChevronRight,
  Search, GraduationCap, Briefcase, MapPin,
  TrendingUp, Calendar, ExternalLink, X, ChevronUp
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface YearData {
  year: number;
  count: number;
}

interface BranchData {
  branch: string;
  count: number;
}

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
}

const AVATAR_COLORS = [
  'from-blue-700 to-blue-500',
  'from-rose-700 to-rose-500',
  'from-violet-700 to-violet-500',
  'from-emerald-700 to-emerald-500',
  'from-amber-600 to-amber-400',
  'from-sky-700 to-sky-500',
  'from-pink-700 to-pink-500',
  'from-teal-700 to-teal-500',
];
function getAvatarGradient(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

const BRANCH_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-sky-100 text-sky-800 border-sky-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-teal-100 text-teal-800 border-teal-200',
];

// ─── BranchSection ───────────────────────────────────────────────────────────

function BranchSection({
  year,
  branch,
  colorClass,
}: {
  year: number;
  branch: BranchData;
  colorClass: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [alumni, setAlumni] = useState<AlumniCard[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAlumni = useCallback(
    async (searchVal: string, pageNum: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          year: String(year),
          branch: branch.branch,
          page: String(pageNum),
          limit: '8',
          ...(searchVal ? { search: searchVal } : {}),
        });
        const res = await fetch(`/api/yearbook/alumni?${params}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setAlumni(data.alumni || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [year, branch.branch]
  );

  const handleExpand = () => {
    if (!expanded) {
      setExpanded(true);
      fetchAlumni('', 1);
    } else {
      setExpanded(false);
    }
  };

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
      fetchAlumni(val, 1);
    }, 350);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Branch header row */}
      <button
        onClick={handleExpand}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
            {branch.branch}
          </span>
          <div className="flex items-center gap-1 text-gray-500">
            <Users size={13} />
            <span className="text-xs font-semibold">{branch.count} alumni</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/alumni/yearbook/${year}/${encodeURIComponent(branch.branch)}`}
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:flex items-center gap-1 text-xs text-[#012140] font-semibold hover:underline"
          >
            <ExternalLink size={11} />
            Open in portal
          </Link>
          {expanded ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded alumni section */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          {/* Search */}
          <div className="relative mb-4 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search alumni…"
              className="w-full pl-8 pr-8 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-800 font-medium focus:outline-none focus:border-[#012140] shadow-sm"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setPage(1);
                  fetchAlumni('', 1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && alumni.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-6 font-medium">
              {search ? 'No alumni match your search.' : 'No alumni found.'}
            </p>
          )}

          {/* Alumni grid */}
          {!loading && alumni.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {alumni.map((a) => {
                  const grad = getAvatarGradient(a.name);
                  return (
                    <div
                      key={a.id}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
                    >
                      {/* Avatar */}
                      <div className="relative h-28 overflow-hidden">
                        {a.avatarUrl ? (
                          <img
                            src={a.avatarUrl}
                            alt={a.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
                            <span className="text-white text-2xl font-black">
                              {getInitials(a.name)}
                            </span>
                          </div>
                        )}
                        {a.isRegistered && (
                          <div
                            className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white"
                            title="Registered"
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-gray-900 truncate">{a.name}</p>
                        {a.currentRole && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Briefcase size={10} className="text-gray-400 flex-shrink-0" />
                            <p className="text-[10px] text-gray-500 font-medium truncate">{a.currentRole}</p>
                          </div>
                        )}
                        {a.city && (
                          <div className="flex items-center gap-1">
                            <MapPin size={10} className="text-gray-400 flex-shrink-0" />
                            <p className="text-[10px] text-gray-500 font-medium truncate">{a.city}</p>
                          </div>
                        )}
                        <Link
                          href={`/alumni/profile?id=${a.id}`}
                          target="_blank"
                          className="flex items-center gap-1 mt-1.5 text-[#012140] text-[10px] font-bold hover:text-[#d61c1c] transition-colors"
                        >
                          <span>View Profile</span>
                          <ExternalLink size={9} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-400 font-medium">
                    Page {page} of {totalPages} · {total} total
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { const p = page - 1; setPage(p); fetchAlumni(search, p); }}
                      disabled={page <= 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:border-[#012140] hover:text-[#012140] disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => { const p = page + 1; setPage(p); fetchAlumni(search, p); }}
                      disabled={page >= totalPages}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:border-[#012140] hover:text-[#012140] disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── YearSection ─────────────────────────────────────────────────────────────

function YearSection({ year }: { year: YearData }) {
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const fetchBranches = async () => {
    if (branches.length > 0) return;
    setLoadingBranches(true);
    try {
      const res = await fetch(`/api/yearbook/branches?year=${year.year}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setBranches(data.branches || []);
    } catch {
      // ignore
    } finally {
      setLoadingBranches(false);
    }
  };

  const toggle = () => {
    if (!open) fetchBranches();
    setOpen((v) => !v);
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-12 bottom-0 w-px bg-gradient-to-b from-[#012140]/20 to-transparent" />

      {/* Year dot + header */}
      <div className="flex items-start gap-4">
        {/* Timeline dot */}
        <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg mt-1 ${open ? 'bg-[#d61c1c] text-white' : 'bg-[#012140] text-white'} transition-colors`}>
          <GraduationCap size={18} />
        </div>

        {/* Card */}
        <div className="flex-1 mb-6">
          <button
            onClick={toggle}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-200 text-left ${
              open
                ? 'bg-[#012140] border-[#012140] shadow-lg'
                : 'bg-white border-gray-200 hover:border-[#012140]/40 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-4">
              <div>
                <p className={`text-xl font-black ${open ? 'text-white' : 'text-[#012140]'}`}>
                  Class of {year.year}
                </p>
                <p className={`text-xs font-semibold mt-0.5 flex items-center gap-1 ${open ? 'text-white/60' : 'text-gray-500'}`}>
                  <Users size={11} />
                  {year.count} {year.count === 1 ? 'Alumni' : 'Alumni'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/alumni/yearbook/${year.year}`}
                onClick={(e) => e.stopPropagation()}
                className={`hidden sm:flex items-center gap-1 text-xs font-semibold transition-colors ${open ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-[#012140]'}`}
              >
                <ExternalLink size={12} />
                Open Portal View
              </Link>
              <div className={`p-1.5 rounded-lg ${open ? 'bg-white/10' : 'bg-gray-100'}`}>
                {open ? (
                  <ChevronUp size={16} className={open ? 'text-white' : 'text-gray-500'} />
                ) : (
                  <ChevronDown size={16} className="text-gray-500" />
                )}
              </div>
            </div>
          </button>

          {/* Expanded branches */}
          {open && (
            <div className="mt-3 pl-2 space-y-2">
              {loadingBranches && (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              )}
              {!loadingBranches && branches.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No branch data found.</p>
              )}
              {!loadingBranches && branches.map((b, idx) => (
                <BranchSection
                  key={b.branch}
                  year={year.year}
                  branch={b}
                  colorClass={BRANCH_COLORS[idx % BRANCH_COLORS.length]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Yearbook Page ─────────────────────────────────────────────────

export default function AdminYearbookPage() {
  const [years, setYears] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/yearbook/years');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setYears(data.years || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, []);

  const totalAlumni = years.reduce((s, y) => s + y.count, 0);
  const filteredYears = globalSearch.trim()
    ? years.filter((y) => String(y.year).includes(globalSearch.trim()))
    : years;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-[#012140] rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#d61c1c]/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/10 rounded-lg">
                <BookOpen className="text-white" size={20} />
              </div>
              <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Admin Panel</span>
            </div>
            <h1 className="text-2xl font-black text-white">Alumni Yearbook</h1>
            <p className="text-white/60 text-sm mt-1">
              Browse and manage alumni profiles organized by batch year and branch.
            </p>
          </div>

          {!loading && (
            <div className="flex gap-3 flex-shrink-0">
              <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-center min-w-[80px]">
                <p className="text-xl font-black text-white">{totalAlumni.toLocaleString()}</p>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wide">Total</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-center min-w-[80px]">
                <p className="text-xl font-black text-white">{years.length}</p>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wide">Batches</p>
              </div>
              {years.length > 0 && (
                <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-center min-w-[80px]">
                  <p className="text-xl font-black text-white">{years[years.length - 1].year}</p>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-wide">Earliest</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      {!loading && years.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Largest Batch', value: (() => { const m = years.reduce((a, b) => a.count > b.count ? a : b); return `${m.year} (${m.count})`; })(), icon: TrendingUp, color: 'text-blue-600 bg-blue-50 border-blue-100' },
            { label: 'Latest Year', value: String(years[0]?.year || '—'), icon: Calendar, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            { label: 'Oldest Year', value: String(years[years.length - 1]?.year || '—'), icon: BookOpen, color: 'text-amber-600 bg-amber-50 border-amber-100' },
            { label: 'Total Batches', value: String(years.length), icon: GraduationCap, color: 'text-violet-600 bg-violet-50 border-violet-100' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border p-4 flex items-center gap-3 bg-white shadow-sm ${stat.color.split(' ')[2]}`}>
              <div className={`p-2 rounded-lg ${stat.color.split(' ').slice(1).join(' ')}`}>
                <stat.icon size={16} className={stat.color.split(' ')[0]} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">{stat.label}</p>
                <p className="text-sm font-black text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="admin-yearbook-search"
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Filter by year…"
            className="w-full pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 font-medium focus:outline-none focus:border-[#012140] shadow-sm transition"
          />
          {globalSearch && (
            <button onClick={() => setGlobalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ChevronRight size={13} />
          <span className="font-medium">Click any year to expand branches → click a branch to view alumni</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      {/* No data */}
      {!loading && years.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-lg">No yearbook data available.</p>
          <p className="text-sm mt-1">Import alumni records to populate the yearbook.</p>
        </div>
      )}

      {/* Timeline list */}
      {!loading && filteredYears.length > 0 && (
        <div className="relative pl-0">
          {filteredYears.map((y) => (
            <YearSection key={y.year} year={y} />
          ))}
        </div>
      )}

      {!loading && globalSearch && filteredYears.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="font-semibold">No batch years match &quot;{globalSearch}&quot;.</p>
          <button onClick={() => setGlobalSearch('')} className="mt-2 text-sm text-[#012140] font-semibold hover:underline">
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}
