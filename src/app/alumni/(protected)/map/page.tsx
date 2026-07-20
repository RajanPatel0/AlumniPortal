'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Map, Search, SlidersHorizontal } from 'lucide-react';

const AlumniMap = dynamic(() => import('@/components/AlumniMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[480px] sm:h-[560px] lg:h-[650px] rounded-3xl bg-slate-100/80 flex items-center justify-center border border-slate-200/60 animate-pulse">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#003D7A] border-t-[#C41E3A] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-600 font-bold text-sm">Loading Alumni Map Engine...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const [batchYear, setBatchYear] = useState('');
  const [branch, setBranch] = useState('');
  const [company, setCompany] = useState('');
  const [country, setCountry] = useState('');

  // Dropdown list states loaded from endpoints
  const [availableYears, setAvailableYears] = useState<{ year: number; count: number }[]>([]);
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);

  // Load initial dropdown list data on mount
  useEffect(() => {
    // Fetch available years from yearbook endpoint
    fetch('/api/yearbook/years')
      .then((res) => res.json())
      .then((data) => {
        if (data.years) setAvailableYears(data.years);
      })
      .catch((err) => console.error('Failed to load years:', err));

    // Fetch branches, companies, and countries from options endpoint
    fetch('/api/alumni/options')
      .then((res) => res.json())
      .then((data) => {
        if (data.branches) setAvailableBranches(data.branches);
        if (data.companies) setAvailableCompanies(data.companies);
        if (data.countries) setAvailableCountries(data.countries);
      })
      .catch((err) => console.error('Failed to load options:', err));
  }, []);

  // Update available branches dynamically based on selected batch year
  useEffect(() => {
    if (batchYear) {
      fetch(`/api/yearbook/branches?year=${batchYear}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.branches) {
            setAvailableBranches(data.branches.map((b: any) => b.branch));
          }
        })
        .catch((err) => console.error('Failed to load dynamic branches:', err));
    } else {
      // Re-fetch all unique branches from options
      fetch('/api/alumni/options')
        .then((res) => res.json())
        .then((data) => {
          if (data.branches) setAvailableBranches(data.branches);
        })
        .catch(() => {});
    }
    // Reset selected branch when batch year changes
    setBranch('');
  }, [batchYear]);

  // Debounced filters to prevent API calls on every keystroke
  const [debouncedFilters, setDebouncedFilters] = useState({
    batchYear: '',
    branch: '',
    company: '',
    country: '',
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters({
        batchYear,
        branch,
        company,
        country,
      });
    }, 450); // 450ms debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [batchYear, branch, company, country]);

  const activeFiltersCount = [batchYear, branch, company, country].filter(Boolean).length;

  return (
    <div className="space-y-6 pb-32 lg:pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Map className="text-[#C41E3A] shrink-0" size={28} />
            <span>Alumni Connection Map</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 max-w-2xl leading-relaxed">
            Locate classmates and fellow alumni worldwide. Zoom in on clusters to identify alumni in your area, and click markers to view their profiles or connect.
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="text-[#003D7A]" size={16} />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Search Filters</h3>
            </div>
            {activeFiltersCount > 0 && (
              <span className="bg-[#C41E3A] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0">
                {activeFiltersCount} Active
              </span>
            )}
          </div>

          {/* Batch Year Select Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Batch Year</label>
            <select
              value={batchYear}
              onChange={(e) => setBatchYear(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#003D7A] focus:ring-4 focus:ring-blue-50/50 bg-white cursor-pointer transition-all duration-200"
            >
              <option value="">All Batch Years</option>
              {availableYears.map((y) => (
                <option key={y.year} value={y.year}>
                  {y.year} ({y.count} {y.count === 1 ? 'alumnus' : 'alumni'})
                </option>
              ))}
            </select>
          </div>

          {/* Branch Select Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#003D7A] focus:ring-4 focus:ring-blue-50/50 bg-white cursor-pointer transition-all duration-200"
            >
              <option value="">All Branches</option>
              {availableBranches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Current Company Input with Autocomplete Datalist */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Company</label>
            <div className="relative">
              <input
                type="text"
                list="companies-datalist"
                placeholder="Search or select company..."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#003D7A] focus:ring-4 focus:ring-blue-50/50 placeholder:text-slate-400 transition-all duration-200"
              />
              <Search className="absolute left-3.5 top-3 text-slate-400" size={13} />
              <datalist id="companies-datalist">
                {availableCompanies.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Country Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Country</label>
            <input
              type="text"
              list="countries-datalist"
              placeholder="Search or select country..."
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#003D7A] focus:ring-4 focus:ring-blue-50/50 placeholder:text-slate-400 transition-all duration-200"
            />
            <datalist id="countries-datalist">
              {availableCountries.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Reset Filters button */}
          <button
            onClick={() => {
              setBatchYear('');
              setBranch('');
              setCompany('');
              setCountry('');
            }}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 text-xs font-bold rounded-xl transition-all duration-200"
          >
            Clear Filters
          </button>
        </div>

        {/* Map Container */}
        <div className="lg:col-span-3">
          <AlumniMap filters={debouncedFilters} />
        </div>
      </div>
    </div>
  );
}
