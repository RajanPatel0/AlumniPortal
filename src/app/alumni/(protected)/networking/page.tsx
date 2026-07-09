'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Search, User, MapPin, Briefcase, GraduationCap, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';

// Inline LinkedIn icon (not in older lucide-react builds)
function LinkedinIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

interface DirectoryAlumni {
  id: string;
  name: string;
  avatarUrl?: string;
  currentRole?: string;
  currentCompany?: string;
  city?: string;
  branch: string;
  batchYear: number;
  college: string;
  course?: string;
  linkedinUrl?: string;
}

const BRANCHES = ['All', 'Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Chemical Engineering'];

function getInitials(name: string) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'AL';
}

export default function NetworkingPage() {
  const [alumni, setAlumni] = useState<DirectoryAlumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDirectory = useCallback(async (searchVal: string, branchVal: string, pageVal: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageVal),
        limit: '12',
        search: searchVal,
        branch: branchVal,
      });
      const res = await fetch(`/api/alumni/directory?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAlumni(data.alumni || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setPage(1);
      fetchDirectory(search, branch, 1);
    }, 350);
  }, [search, branch, fetchDirectory]);

  // Paginate
  useEffect(() => {
    fetchDirectory(search, branch, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003D7A] to-[#0057B8] text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_50%,white,transparent_70%)]" />
        <div className="relative">
          <p className="text-blue-200 text-xs font-bold tracking-widest uppercase mb-2">Alumni Network</p>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Connect with Alumni</h1>
          <p className="text-blue-100 text-sm max-w-lg">
            Browse through {total > 0 ? `${total}+` : ''} registered alumni across batches and branches. View profiles, connect on LinkedIn, and grow your network.
          </p>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, role, company, or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-[#012140] pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] focus:ring-1 focus:ring-[#003D7A]/20 text-sm transition"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm transition ${showFilters ? 'bg-[#003D7A] text-white border-[#003D7A]' : 'border-slate-200 text-slate-600 hover:border-[#003D7A] hover:text-[#003D7A]'}`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>

        {/* Branch Filters */}
        {showFilters && (
          <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-100">
            {BRANCHES.map(b => (
              <button
                key={b}
                onClick={() => { setBranch(b); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${branch === b
                  ? 'bg-gradient-to-r from-[#003D7A] to-[#0057B8] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {b}
              </button>
            ))}
          </div>
        )}

        {/* Active filters badge */}
        {(search || branch !== 'All') && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Active filters:</span>
            {search && (
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#003D7A] rounded-full text-xs font-semibold">
                "{search}"
                <button onClick={() => setSearch('')}><X size={10} /></button>
              </span>
            )}
            {branch !== 'All' && (
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#003D7A] rounded-full text-xs font-semibold">
                {branch}
                <button onClick={() => setBranch('All')}><X size={10} /></button>
              </span>
            )}
            <span className="ml-auto text-xs text-slate-400">{total} result{total !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Alumni Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded mb-2" />
              <div className="h-8 bg-slate-100 rounded mt-4" />
            </div>
          ))}
        </div>
      ) : alumni.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-slate-400" />
          </div>
          <p className="text-lg font-bold text-slate-700 mb-1">No alumni found</p>
          <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {alumni.map(person => (
            <div
              key={person.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              {/* Card Top Bar */}
              <div className="h-1.5 bg-gradient-to-r from-[#003D7A] to-[#C41E3A]" />

              <div className="p-6">
                {/* Avatar + Name */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#003D7A]/10 to-[#C41E3A]/10 border-2 border-white shadow-md flex items-center justify-center text-[#003D7A] font-extrabold text-lg overflow-hidden flex-shrink-0">
                    {person.avatarUrl ? (
                      <img src={person.avatarUrl} alt={person.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(person.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate">{person.name}</h3>
                    <p className="text-xs text-[#003D7A] font-semibold truncate">
                      {person.currentRole || 'Alumni'}
                      {person.currentCompany ? ` · ${person.currentCompany}` : ''}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <GraduationCap size={11} />
                      <span>{person.branch} · Batch {person.batchYear}</span>
                    </div>
                  </div>
                </div>

                {/* Location + College */}
                <div className="space-y-1.5 mb-4">
                  {person.city && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin size={12} className="text-[#C41E3A] flex-shrink-0" />
                      <span className="truncate">{person.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Briefcase size={12} className="text-[#003D7A] flex-shrink-0" />
                    <span className="truncate">{person.course || 'B.Tech'} · {person.college}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <Link
                    href={`/alumni/profile/${person.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-[#003D7A] text-[#003D7A] text-xs font-bold rounded-lg hover:bg-[#003D7A] hover:text-white transition"
                  >
                    <User size={13} />
                    View Profile
                  </Link>
                  {person.linkedinUrl ? (
                    <a
                      href={person.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0A66C2] text-white text-xs font-bold rounded-lg hover:bg-[#084398] transition"
                    >
                      <LinkedinIcon size={13} />
                      LinkedIn
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed"
                    >
                      <LinkedinIcon size={13} />
                      LinkedIn
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-[#003D7A] hover:text-[#003D7A] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <span className="text-sm text-slate-500 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-[#003D7A] hover:text-[#003D7A] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// For the empty state icon usage
function Users({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}