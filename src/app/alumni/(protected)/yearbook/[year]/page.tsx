'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { BookOpen, Users, ChevronRight, ArrowLeft, GraduationCap } from 'lucide-react';

interface BranchData {
  branch: string;
  count: number;
}

const BRANCH_ICONS: Record<string, string> = {
  default: '🎓',
  'computer': '💻',
  'cse': '💻',
  'cs': '💻',
  'information': '🖥️',
  'it': '🖥️',
  'electronics': '📡',
  'ece': '📡',
  'electrical': '⚡',
  'ee': '⚡',
  'mechanical': '⚙️',
  'me': '⚙️',
  'civil': '🏗️',
  'chemical': '⚗️',
  'biotechnology': '🧬',
  'mba': '📊',
  'mca': '🖥️',
  'bio': '🧬',
  'physics': '⚛️',
  'mathematics': '📐',
  'pharmacy': '💊',
};

function getBranchIcon(branch: string) {
  const lower = branch.toLowerCase();
  for (const [key, icon] of Object.entries(BRANCH_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return BRANCH_ICONS.default;
}

const CARD_COLORS = [
  { bg: 'bg-blue-50 hover:bg-blue-100', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700', accent: 'bg-blue-500' },
  { bg: 'bg-rose-50 hover:bg-rose-100', border: 'border-rose-200', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-700', accent: 'bg-rose-500' },
  { bg: 'bg-purple-50 hover:bg-purple-100', border: 'border-purple-200', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-700', accent: 'bg-purple-500' },
  { bg: 'bg-emerald-50 hover:bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700', accent: 'bg-emerald-500' },
  { bg: 'bg-amber-50 hover:bg-amber-100', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700', accent: 'bg-amber-500' },
  { bg: 'bg-sky-50 hover:bg-sky-100', border: 'border-sky-200', text: 'text-sky-800', badge: 'bg-sky-100 text-sky-700', accent: 'bg-sky-500' },
];

export default function YearbookYearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = use(params);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch(`/api/yearbook/branches?year=${year}`);
        if (!res.ok) throw new Error('Failed to fetch branches');
        const data = await res.json();
        setBranches(data.branches || []);
      } catch {
        setError('Failed to load branch data.');
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, [year]);

  const totalMembers = branches.reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/alumni/yearbook"
          id="back-to-yearbook"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#003D7A] hover:border-[#003D7A] transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link href="/alumni/yearbook" className="hover:text-[#003D7A] transition-colors">Yearbook</Link>
            <ChevronRight size={12} />
            <span className="text-slate-700 font-semibold">Class of {year}</span>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl mb-10 bg-gradient-to-br from-[#0a1628] via-[#001d3d] to-[#003D7A] p-8 sm:p-10 shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#C41E3A]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#005fb8]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="text-white/70" size={18} />
              <span className="text-white/60 text-xs font-bold uppercase tracking-widest">
                Alumni Yearbook
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white">
              Class of <span className="text-[#f4a261]">{year}</span>
            </h1>
            <p className="text-white/60 text-sm mt-2 font-medium">
              Select a branch to view alumni profiles from the {year} graduating class.
            </p>
          </div>

          {!loading && branches.length > 0 && (
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center min-w-[90px]">
                <p className="text-2xl font-black text-white">{totalMembers}</p>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wide mt-0.5">Alumni</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center min-w-[90px]">
                <p className="text-2xl font-black text-white">{branches.length}</p>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wide mt-0.5">Branches</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section heading */}
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="text-[#003D7A]" size={20} />
        <h2 className="text-lg font-bold text-slate-800">Select Branch</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-16 text-slate-500">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* No data */}
      {!loading && !error && branches.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <GraduationCap size={40} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-lg">No branches found for {year}.</p>
        </div>
      )}

      {/* Branch Cards */}
      {!loading && !error && branches.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {branches.map((b, idx) => {
            const color = CARD_COLORS[idx % CARD_COLORS.length];
            const icon = getBranchIcon(b.branch);
            const encodedBranch = encodeURIComponent(b.branch);
            return (
              <Link
                key={b.branch}
                href={`/alumni/yearbook/${year}/${encodedBranch}`}
                id={`branch-card-${b.branch.replace(/\s+/g, '-').toLowerCase()}`}
                className={`group relative overflow-hidden rounded-2xl border ${color.bg} ${color.border} p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
              >
                {/* Top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${color.accent} rounded-t-2xl`} />

                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{icon}</span>
                  <ChevronRight
                    size={16}
                    className={`${color.text} opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 mt-1`}
                  />
                </div>

                <p className={`text-sm font-extrabold ${color.text} leading-tight`}>{b.branch}</p>

                <div className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full ${color.badge}`}>
                  <Users size={11} />
                  <span className="text-[11px] font-bold">{b.count} {b.count === 1 ? 'Member' : 'Members'}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
