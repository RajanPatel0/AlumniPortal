'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from "@/lib/api";
import Link from 'next/link';
import { Search, User, MapPin, Briefcase, GraduationCap, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { ComboboxSelect, ComboboxOption } from '@/components/ComboboxSelect';

// Inline LinkedIn icon
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

interface FilterMeta {
  companies: ComboboxOption[];
  cities: ComboboxOption[];
  branches: ComboboxOption[];
  courses: ComboboxOption[];
  years: { value: number; count: number }[];
}

function getInitials(name: string) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'AL';
}

export default function NetworkingPage() {
  const [alumni, setAlumni] = useState<DirectoryAlumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter States
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('All');
  const [company, setCompany] = useState('All');
  const [course, setCourse] = useState('All');
  const [city, setCity] = useState('All');
  const [batchYear, setBatchYear] = useState('All');
  const [sort, setSort] = useState('name_asc');
  const [showFilters, setShowFilters] = useState(false);

  // Metadata options fetched from /api/alumni/directory/meta
  const [meta, setMeta] = useState<FilterMeta>({
    companies: [],
    cities: [],
    branches: [],
    courses: [],
    years: [],
  });

  // Refs to track debounce timer and whether filters changed (vs. page-only change)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFilterChange = useRef(false);

  // Fetch Directory Metadata once on mount
  useEffect(() => {
    apiFetch('/alumni/directory/meta')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setMeta({
            companies: data.companies || [],
            cities: data.cities || [],
            branches: data.branches || [],
            courses: data.courses || [],
            years: data.years || [],
          });
        }
      })
      .catch((err) => console.error('Failed to load directory meta:', err));
  }, []);

  // Single unified fetch effect — handles both filter changes and page changes
  useEffect(() => {
    // Clear any existing debounce timer
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const doFetch = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '12',
          search,
          branch,
          company,
          course,
          city,
          batchYear,
          sort,
        });

        const res = await apiFetch(`/alumni/directory?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setAlumni(data.alumni || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error('Directory fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce filter changes (300ms), but fetch page changes immediately
    if (isFilterChange.current) {
      debounceRef.current = setTimeout(doFetch, 300);
      isFilterChange.current = false;
    } else {
      doFetch();
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, branch, company, course, city, batchYear, sort]);

  // Helper: update a filter and reset page to 1
  const updateFilter = (setter: (v: string) => void) => (val: string) => {
    isFilterChange.current = true;
    setter(val);
    setPage(1);
  };

  const activeFiltersCount =
    (branch !== 'All' ? 1 : 0) +
    (company !== 'All' ? 1 : 0) +
    (course !== 'All' ? 1 : 0) +
    (city !== 'All' ? 1 : 0) +
    (batchYear !== 'All' ? 1 : 0) +
    (search ? 1 : 0);

  const resetFilters = () => {
    isFilterChange.current = true;
    setSearch('');
    setBranch('All');
    setCompany('All');
    setCourse('All');
    setCity('All');
    setBatchYear('All');
    setSort('name_asc');
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003D7A] to-[#0057B8] text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_50%,white,transparent_70%)]" />
        <div className="relative">
          <p className="text-blue-200 text-xs font-bold tracking-widest uppercase mb-2">Alumni Network</p>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Connect with Alumni</h1>
          <p className="text-blue-100 text-sm max-w-lg">
            Browse through {total > 0 ? `${total}+` : ''} registered alumni across companies, locations, batches, and branches. View profiles, connect on LinkedIn, and grow your network.
          </p>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
        {/* Main Search Row */}
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, role, company, city, or branch..."
              value={search}
              onChange={(e) => {
                isFilterChange.current = true;
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full text-[#012140] pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] focus:ring-1 focus:ring-[#003D7A]/20 text-sm transition"
            />
            {search && (
              <button
                onClick={() => { isFilterChange.current = true; setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm transition ${
              showFilters || activeFiltersCount > 0
                ? 'bg-[#003D7A] text-white border-[#003D7A]'
                : 'border-slate-200 text-slate-600 hover:border-[#003D7A] hover:text-[#003D7A]'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#C41E3A] text-white text-xs flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Filter Grid */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Refine Directory Search</span>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-[#C41E3A] hover:text-[#003D7A] transition flex items-center gap-1"
                >
                  <X size={12} /> Reset All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Company Combobox */}
              <ComboboxSelect
                label="Company / Employer"
                placeholder="Search company..."
                value={company}
                options={meta.companies}
                onChange={updateFilter(setCompany)}
                allLabel="All Companies"
              />

              {/* City Combobox */}
              <ComboboxSelect
                label="Location / City"
                placeholder="Search city..."
                value={city}
                options={meta.cities}
                onChange={updateFilter(setCity)}
                allLabel="All Cities"
              />

              {/* Batch Year Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Batch Year</label>
                <select
                  value={batchYear}
                  onChange={(e) => updateFilter(setBatchYear)(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm text-[#012140] hover:border-[#003D7A] focus:outline-none transition shadow-sm"
                >
                  <option value="All">All Batches</option>
                  {meta.years.map((y) => (
                    <option key={y.value} value={y.value}>
                      Class of {y.value} ({y.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Branch / Specialization</label>
                <select
                  value={branch}
                  onChange={(e) => updateFilter(setBranch)(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm text-[#012140] hover:border-[#003D7A] focus:outline-none transition shadow-sm"
                >
                  <option value="All">All Branches</option>
                  {meta.branches.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.value} ({b.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Course Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Degree / Course</label>
                <select
                  value={course}
                  onChange={(e) => updateFilter(setCourse)(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm text-[#012140] hover:border-[#003D7A] focus:outline-none transition shadow-sm"
                >
                  <option value="All">All Courses</option>
                  {meta.courses.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.value} ({c.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sort Directory By</label>
                <select
                  value={sort}
                  onChange={(e) => updateFilter(setSort)(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm text-[#012140] hover:border-[#003D7A] focus:outline-none transition shadow-sm"
                >
                  <option value="name_asc">Name (A - Z)</option>
                  <option value="newest">Recently Registered</option>
                  <option value="batch_desc">Batch (Newest First)</option>
                  <option value="batch_asc">Batch (Oldest First)</option>
                  <option value="company_asc">Company Name (A - Z)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Badges & Total Results Count */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#003D7A]">
              {total} Alumni Found
            </span>

            {search && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-[#003D7A] border border-blue-100 rounded-full text-xs font-semibold">
                Search: &quot;{search}&quot;
                <button onClick={() => { isFilterChange.current = true; setSearch(''); setPage(1); }} className="hover:text-[#C41E3A]">
                  <X size={12} />
                </button>
              </span>
            )}

            {company !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-[#003D7A] border border-blue-100 rounded-full text-xs font-semibold">
                Company: {company}
                <button onClick={() => updateFilter(setCompany)('All')} className="hover:text-[#C41E3A]">
                  <X size={12} />
                </button>
              </span>
            )}

            {city !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-[#003D7A] border border-blue-100 rounded-full text-xs font-semibold">
                City: {city}
                <button onClick={() => updateFilter(setCity)('All')} className="hover:text-[#C41E3A]">
                  <X size={12} />
                </button>
              </span>
            )}

            {batchYear !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-[#003D7A] border border-blue-100 rounded-full text-xs font-semibold">
                Batch: {batchYear}
                <button onClick={() => updateFilter(setBatchYear)('All')} className="hover:text-[#C41E3A]">
                  <X size={12} />
                </button>
              </span>
            )}

            {branch !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-[#003D7A] border border-blue-100 rounded-full text-xs font-semibold">
                Branch: {branch}
                <button onClick={() => updateFilter(setBranch)('All')} className="hover:text-[#C41E3A]">
                  <X size={12} />
                </button>
              </span>
            )}

            {course !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-[#003D7A] border border-blue-100 rounded-full text-xs font-semibold">
                Degree: {course}
                <button onClick={() => updateFilter(setCourse)('All')} className="hover:text-[#C41E3A]">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-slate-500 hover:text-[#C41E3A] underline transition"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Alumni Cards Grid */}
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
            <UsersIcon size={28} className="text-slate-400" />
          </div>
          <p className="text-lg font-bold text-slate-700 mb-1">No alumni found</p>
          <p className="text-sm text-slate-500 mb-4">Try clearing your filters or broadening your search criteria.</p>
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-[#003D7A] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#002852] transition"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {alumni.map((person) => (
            <div
              key={person.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              {/* Card Top Accent Bar */}
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

// Icon helper
function UsersIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}