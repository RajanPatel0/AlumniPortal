import { useState, useEffect } from 'react';
import { Search, Filter, ChevronUp, ChevronDown } from 'lucide-react';

interface StartupFiltersProps {
  searchQuery: string;
  selectedIndustry: string;
  selectedDesignation: string;
  selectedLocation: string;
  industries: string[];
  designations: string[];
  locations: string[];
  onFilterChange: (key: string, value: string) => void;
}

export function StartupFilters({
  searchQuery,
  selectedIndustry,
  selectedDesignation,
  selectedLocation,
  industries,
  designations,
  locations,
  onFilterChange,
}: StartupFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onFilterChange('search', localSearch);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [localSearch]);

  const [filtersOpen, setFiltersOpen] = useState({
    industry: true,
    designation: true,
    location: true,
  });

  const toggleFilter = (key: keyof typeof filtersOpen) => {
    setFiltersOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Search box */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-2.5">
        <Search size={16} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by name, keyword, etc..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full bg-transparent focus:outline-none text-xs font-medium text-gray-800 placeholder:text-gray-400"
        />
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 pb-2 border-b border-slate-50">
          <Filter size={16} />
          <span>Filters</span>
        </div>

        {/* Industry Filter Accordion */}
        <div className="space-y-2">
          <button 
            onClick={() => toggleFilter('industry')}
            className="w-full flex items-center justify-between text-xs font-bold text-gray-700 hover:text-gray-950"
          >
            <span>Industry</span>
            {filtersOpen.industry ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {filtersOpen.industry && (
            <div className="pt-1 flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {industries.map((ind) => (
                <label key={ind} className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-900">
                  <input 
                    type="radio" 
                    name="industry"
                    checked={selectedIndustry === ind}
                    onChange={() => onFilterChange('industry', ind)}
                    className="rounded border-slate-300 text-[#003D7A] focus:ring-[#003D7A]"
                  />
                  <span>{ind}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Designation Filter Accordion */}
        <div className="space-y-2 pt-2 border-t border-slate-50">
          <button 
            onClick={() => toggleFilter('designation')}
            className="w-full flex items-center justify-between text-xs font-bold text-gray-700 hover:text-gray-950"
          >
            <span>Founder Designation</span>
            {filtersOpen.designation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {filtersOpen.designation && (
            <div className="pt-1 flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {designations.map((des) => (
                <label key={des} className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-900">
                  <input 
                    type="radio" 
                    name="designation"
                    checked={selectedDesignation === des}
                    onChange={() => onFilterChange('designation', des)}
                    className="rounded border-slate-300 text-[#003D7A] focus:ring-[#003D7A]"
                  />
                  <span>{des}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Location Served Accordion */}
        <div className="space-y-2 pt-2 border-t border-slate-50">
          <button 
            onClick={() => toggleFilter('location')}
            className="w-full flex items-center justify-between text-xs font-bold text-gray-700 hover:text-gray-950"
          >
            <span>Location Served</span>
            {filtersOpen.location ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {filtersOpen.location && (
            <div className="pt-1 flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {locations.map((loc) => (
                <label key={loc} className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-900">
                  <input 
                    type="radio" 
                    name="location"
                    checked={selectedLocation === loc}
                    onChange={() => onFilterChange('location', loc)}
                    className="rounded border-slate-300 text-[#003D7A] focus:ring-[#003D7A]"
                  />
                  <span>{loc}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
