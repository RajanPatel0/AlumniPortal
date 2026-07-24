'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  count?: number;
}

interface ComboboxSelectProps {
  label: string;
  placeholder?: string;
  value: string;
  options: ComboboxOption[];
  onChange: (value: string) => void;
  allLabel?: string;
}

export function ComboboxSelect({
  label,
  placeholder = 'Search...',
  value,
  options,
  onChange,
  allLabel = 'All',
}: ComboboxSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedDisplay = value && value !== 'All' ? value : allLabel;

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>

      {/* Select button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm text-[#012140] hover:border-[#003D7A] focus:outline-none transition shadow-sm"
      >
        <span className={`truncate ${value && value !== 'All' ? 'font-semibold text-[#003D7A]' : 'text-slate-600'}`}>
          {selectedDisplay}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown popup */}
      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-200 py-2 text-sm max-h-60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search box inside dropdown */}
          <div className="px-2 pb-2 border-b border-slate-100 relative">
            <Search className="absolute left-4 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full pl-8 pr-7 py-1.5 text-xs text-[#012140] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 py-1">
            <button
              type="button"
              onClick={() => handleSelect('All')}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 transition ${
                !value || value === 'All' ? 'bg-blue-50/70 font-bold text-[#003D7A]' : 'text-slate-700'
              }`}
            >
              <span>{allLabel}</span>
              {(!value || value === 'All') && <Check size={14} className="text-[#003D7A]" />}
            </button>

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-slate-400">No matching options</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-blue-50 transition ${
                      isSelected ? 'bg-blue-50/70 font-bold text-[#003D7A]' : 'text-slate-700'
                    }`}
                  >
                    <span className="truncate pr-2">{opt.value}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.count !== undefined && (
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                          {opt.count}
                        </span>
                      )}
                      {isSelected && <Check size={14} className="text-[#003D7A]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
