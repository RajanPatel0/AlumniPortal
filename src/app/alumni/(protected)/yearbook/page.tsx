'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Users, ChevronRight, GraduationCap, Sparkles } from 'lucide-react';

interface YearData {
  year: number;
  count: number;
}

const GRADIENT_PALETTE = [
  'from-[#003D7A] to-[#005fb8]',
  'from-[#C41E3A] to-[#e8325a]',
  'from-[#1a1a2e] to-[#16213e]',
  'from-[#0f3460] to-[#533483]',
  'from-[#003D7A] to-[#C41E3A]',
  'from-[#1d3557] to-[#457b9d]',
  'from-[#2d6a4f] to-[#52b788]',
  'from-[#7b2d8b] to-[#c77dff]',
];

export default function YearbookPage() {
  const [years, setYears] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch('/api/yearbook/years');
        if (!res.ok) throw new Error('Failed to fetch years');
        const data = await res.json();
        setYears(data.years || []);
      } catch {
        setError('Failed to load yearbook data.');
      } finally {
        setLoading(false);
      }
    };
    fetchYears();
  }, []);

  const totalAlumni = years.reduce((sum, y) => sum + y.count, 0);

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl mb-10 bg-gradient-to-br from-[#001d3d] via-[#003D7A] to-[#0a1628] p-8 sm:p-12 shadow-2xl">
        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
        {/* Glow orbs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#C41E3A]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#005fb8]/30 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <BookOpen className="text-white" size={24} />
              </div>
              <span className="text-white/60 text-sm font-semibold tracking-widest uppercase">
                Alumni Portal
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Alumni Yearbook
            </h1>
            <p className="text-white/60 text-sm mt-2 font-medium max-w-md">
              Browse through the graduating classes of I.K.G. Punjab Technical University. 
              Select a batch year to explore alumni by branch.
            </p>
          </div>

          {!loading && years.length > 0 && (
            <div className="flex gap-4 flex-shrink-0">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-white">{totalAlumni.toLocaleString()}</p>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mt-0.5">Total Alumni</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-white">{years.length}</p>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mt-0.5">Batch Years</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section heading */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="text-[#003D7A]" size={20} />
          <h2 className="text-lg font-bold text-slate-800">Select Year</h2>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
        {!loading && (
          <span className="text-xs text-slate-500 font-semibold">{years.length} batches</span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-16 text-slate-500">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Year Cards Grid */}
      {!loading && !error && years.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-lg">No yearbook data available yet.</p>
          <p className="text-sm mt-1">Alumni data will appear here once records are added.</p>
        </div>
      )}

      {!loading && !error && years.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {years.map((y, idx) => {
            const gradient = GRADIENT_PALETTE[idx % GRADIENT_PALETTE.length];
            return (
              <Link
                key={y.year}
                href={`/alumni/yearbook/${y.year}`}
                id={`year-card-${y.year}`}
                className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                {/* Glow on hover */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 p-5 flex flex-col h-full min-h-[128px]">
                  <div className="flex items-start justify-between mb-auto">
                    <div className="p-1.5 bg-white/15 rounded-lg">
                      <GraduationCap size={16} className="text-white" />
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200"
                    />
                  </div>
                  <div className="mt-4">
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                      Class Of
                    </p>
                    <p className="text-white text-2xl font-black leading-none mt-0.5">{y.year}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Users size={11} className="text-white/60" />
                      <p className="text-white/70 text-xs font-semibold">
                        {y.count} {y.count === 1 ? 'Member' : 'Members'}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
