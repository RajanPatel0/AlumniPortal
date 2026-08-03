'use client';

import { useState, useEffect, useRef } from 'react';
import { Building, Check, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useDebounce } from '@/lib/useDebounce';

interface CompanySuggestion {
  value: string;
  count: number;
}

interface CompanyAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  name?: string;
  autoComplete?: string;
  id?: string;
}

export default function CompanyAutocomplete({
  value,
  onChange,
  placeholder = 'e.g. Google India',
  required = false,
  className = '',
  name,
  autoComplete = 'off',
  id,
}: CompanyAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedValue = useDebounce(inputValue, 350);

  // Sync internal input value when external value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Handle debounced search query
  useEffect(() => {
    const trimmed = debouncedValue.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    let isSubscribed = true;
    setLoading(true);

    apiFetch(`/alumni/company-search?q=${encodeURIComponent(trimmed)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Search failed');
        return res.json();
      })
      .then((data) => {
        if (isSubscribed) {
          const list: CompanySuggestion[] = data.suggestions || [];
          setSuggestions(list);
          setIsOpen(list.length > 0);
          setSelectedIndex(-1);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          console.error('Failed to search companies:', err);
          setSuggestions([]);
          setIsOpen(false);
        }
      })
      .finally(() => {
        if (isSubscribed) setLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [debouncedValue]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
  };

  const handleSelectSuggestion = (companyName: string) => {
    setInputValue(companyName);
    onChange(companyName);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex].value);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          id={id}
          name={name}
          autoComplete={autoComplete}
          required={required}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={
            className ||
            'w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:border-[#003D7A] transition shadow-xs'
          }
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Loader2 size={14} className="animate-spin" />
          </div>
        )}
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-sm max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center gap-1">
            <Building size={11} /> Existing Companies
          </div>
          {suggestions.map((item, index) => {
            const isSelected = inputValue.trim().toLowerCase() === item.value.toLowerCase();
            const isHighlighted = selectedIndex === index;

            return (
              <button
                key={`${item.value}-${index}`}
                type="button"
                onClick={() => handleSelectSuggestion(item.value)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition cursor-pointer ${
                  isHighlighted || isSelected
                    ? 'bg-blue-50/80 font-bold text-[#003D7A]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="truncate pr-2">{item.value}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                    {item.count} {item.count === 1 ? 'alumni' : 'alumni'}
                  </span>
                  {isSelected && <Check size={13} className="text-[#003D7A]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
