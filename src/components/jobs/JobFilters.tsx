import { useState, useEffect } from 'react';
import { Search, Filter, ChevronUp, ChevronDown } from 'lucide-react';

interface JobFiltersProps {
  searchQuery: string;
  selectedType: string;
  selectedWorkplace: string;
  selectedExp: string;
  selectedIndustry: string;
  showOpenOnly: boolean;
  types: string[];
  workplaces: string[];
  experiences: string[];
  industries: string[];
  onFilterChange: (key: string, value: string | boolean) => void;
}

export function JobFilters({
  searchQuery,
  selectedType,
  selectedWorkplace,
  selectedExp,
  selectedIndustry,
  showOpenOnly,
  types,
  workplaces,
  experiences,
  industries,
  onFilterChange,
}: JobFiltersProps) {
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
    type: true,
    workplace: true,
    industry: true,
    experience: true,
  });

  const toggleFilter = (key: keyof typeof filtersOpen) => {
    setFiltersOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
      <div className="flex items-center gap-2 text-sm font-bold text-gray-900 pb-2 border-b border-slate-50">
        <Filter size={16} />
        <span>Filters</span>
      </div>

      {/* Search filter input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
        <input 
          type="text" 
          placeholder="Search by company, title, skills..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-slate-200 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-gray-800 placeholder:text-gray-400 transition"
        />
      </div>

      {/* Checkbox: show open only */}
      <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer hover:text-slate-900">
        <input 
          type="checkbox"
          checked={showOpenOnly}
          onChange={(e) => onFilterChange('openOnly', e.target.checked)}
          className="rounded border-slate-300 text-[#003D7A] focus:ring-[#003D7A] w-4 h-4"
        />
        <span>Show open opportunities only</span>
      </label>

      {/* Opportunity Type Accordion */}
      <div className="space-y-2 pt-3 border-t border-slate-50">
        <button 
          onClick={() => toggleFilter('type')}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-700 hover:text-gray-950"
        >
          <span>Opportunity Type</span>
          {filtersOpen.type ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {filtersOpen.type && (
          <div className="pt-1 flex flex-col gap-1.5">
            {types.map((t) => (
              <label key={t} className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-900">
                <input 
                  type="radio" 
                  name="type" 
                  checked={selectedType === t}
                  onChange={() => onFilterChange('type', t)}
                  className="rounded border-slate-300 text-[#003D7A] focus:ring-[#003D7A]"
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Workplace type Accordion */}
      <div className="space-y-2 pt-3 border-t border-slate-50">
        <button 
          onClick={() => toggleFilter('workplace')}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-700 hover:text-gray-950"
        >
          <span>Workplace Type</span>
          {filtersOpen.workplace ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {filtersOpen.workplace && (
          <div className="pt-1 flex flex-col gap-1.5">
            {workplaces.map((w) => (
              <label key={w} className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-900">
                <input 
                  type="radio" 
                  name="workplace" 
                  checked={selectedWorkplace === w}
                  onChange={() => onFilterChange('workplace', w)}
                  className="rounded border-slate-300 text-[#003D7A] focus:ring-[#003D7A]"
                />
                <span>{w}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Industry Accordion */}
      <div className="space-y-2 pt-3 border-t border-slate-50">
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

      {/* Work experience Accordion */}
      <div className="space-y-2 pt-3 border-t border-slate-50">
        <button 
          onClick={() => toggleFilter('experience')}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-700 hover:text-gray-950"
        >
          <span>Work Experience</span>
          {filtersOpen.experience ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {filtersOpen.experience && (
          <div className="pt-1 flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
            {experiences.map((exp) => (
              <label key={exp} className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-900">
                <input 
                  type="radio" 
                  name="experience" 
                  checked={selectedExp === exp}
                  onChange={() => onFilterChange('experience', exp)}
                  className="rounded border-slate-300 text-[#003D7A] focus:ring-[#003D7A]"
                />
                <span>{exp}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
