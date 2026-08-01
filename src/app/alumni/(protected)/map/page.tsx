'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Map, Search, SlidersHorizontal, Globe, Building2, GraduationCap } from 'lucide-react';
import { apiFetch } from '@/lib/api';

const AlumniMap = dynamic(() => import('@/components/map/AlumniMap'), {
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
  const [city, setCity] = useState('');
  const [course, setCourse] = useState('');

  // Dropdown list states loaded from endpoints
  const [availableYears, setAvailableYears] = useState<{ year: number; count: number }[]>([]);
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);

  // Load initial dropdown list data on mount
  useEffect(() => {
    // Fetch available years from yearbook endpoint
    apiFetch('/yearbook/years')
      .then((res) => res.json())
      .then((data) => {
        if (data.years) setAvailableYears(data.years);
      })
      .catch((err) => console.error('Failed to load years:', err));

    // Fetch branches, companies, countries, and cities from options endpoint
    apiFetch('/alumni/options')
      .then((res) => res.json())
      .then((data) => {
        if (data.branches) setAvailableBranches(data.branches);
        if (data.courses) setAvailableCourses(data.courses);
        if (data.companies) setAvailableCompanies(data.companies);
        if (data.countries) setAvailableCountries(data.countries);
        if (data.cities) setAvailableCities(data.cities);
      })
      .catch((err) => console.error('Failed to load options:', err));
  }, []);

  // Update available branches dynamically based on selected batch year
  useEffect(() => {
    if (batchYear) {
      apiFetch(`/yearbook/branches?year=${batchYear}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.branches) {
            setAvailableBranches(data.branches.map((b: any) => b.branch));
          }
        })
        .catch((err) => console.error('Failed to load dynamic branches:', err));
    } else {
      // Re-fetch all unique branches from options
      apiFetch('/alumni/options')
        .then((res) => res.json())
        .then((data) => {
          if (data.branches) setAvailableBranches(data.branches);
        })
        .catch(() => {});
    }
    // Reset selected branch when batch year changes
    setBranch('');
  }, [batchYear]);

  // Fast, responsive filters sync with TanStack Query
  const [debouncedFilters, setDebouncedFilters] = useState({
    batchYear: '',
    branch: '',
    course: '',
    company: '',
    country: '',
    city: '',
  });

  useEffect(() => {
    // Dropdown selects (batchYear, branch) apply immediately; text searches debounce fast (200ms)
    const handler = setTimeout(() => {
      setDebouncedFilters({
        batchYear,
        branch,
        course,
        company,
        country,
        city,
      });
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [batchYear, branch, course, company, country, city]);

  const activeFiltersCount = [batchYear, branch, course, company, country, city].filter(Boolean).length;
  const totalAlumniCount = availableYears.reduce((acc, y) => acc + y.count, 0);

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

        {/* Quick Stats Pill Header */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-gradient-to-br from-blue-50/80 to-slate-50 rounded-2xl border border-blue-100/60 shadow-xs transition duration-200 hover:shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#003D7A] shadow-2xs border border-blue-100/50">
              <GraduationCap size={16} />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Alumni</p>
              <p className="text-xs font-black text-slate-900">{totalAlumniCount > 0 ? totalAlumniCount.toLocaleString() : '1,000+'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-gradient-to-br from-red-50/80 to-slate-50 rounded-2xl border border-red-100/60 shadow-xs transition duration-200 hover:shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#C41E3A] shadow-2xs border border-red-100/50">
              <Globe size={16} />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Countries</p>
              <p className="text-xs font-black text-slate-900">{availableCountries.length > 0 ? availableCountries.length : '10+'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200/60 shadow-xs transition duration-200 hover:shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#003D7A] shadow-2xs border border-slate-200/50">
              <Building2 size={16} />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Companies</p>
              <p className="text-xs font-black text-slate-900">{availableCompanies.length > 0 ? availableCompanies.length : '50+'}</p>
            </div>
          </div>
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

          {/* Course Select Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Course</label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#003D7A] focus:ring-4 focus:ring-blue-50/50 bg-white cursor-pointer transition-all duration-200"
            >
              <option value="">All Courses</option>
              {availableCourses.map((c) => (
                <option key={c} value={c}>
                  {c}
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
          
          {/* City Input with Autocomplete Datalist */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">City</label>
            <div className="relative">
              <input
                type="text"
                list="cities-datalist"
                placeholder="Search or select city..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#003D7A] focus:ring-4 focus:ring-blue-50/50 placeholder:text-slate-400 transition-all duration-200"
              />
              <Search className="absolute left-3.5 top-3 text-slate-400" size={13} />
              <datalist id="cities-datalist">
                {availableCities.map((c) => (
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
              setCourse('');
              setCompany('');
              setCountry('');
              setCity('');
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
