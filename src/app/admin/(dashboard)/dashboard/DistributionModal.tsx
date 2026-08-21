'use client';

import { useState, useEffect } from 'react';
import { apiFetch, BASE_PATH } from '@/lib/api';
import { X, Search, Download, ChevronLeft, ChevronRight, Loader2, Building, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

interface DistributionItem {
  name: string;
  count: number;
  percentage: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface DistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'branches' | 'companies';
  campusId?: string;
}

export default function DistributionModal({
  isOpen,
  onClose,
  type,
  campusId = '',
}: DistributionModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [items, setItems] = useState<DistributionItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 15,
    total: 0,
    pages: 1,
  });

  const isBranches = type === 'branches';
  const title = isBranches ? 'All Branches / Departments' : 'All Represented Companies';
  const icon = isBranches ? <GraduationCap size={20} className="text-[#003D7A]" /> : <Building size={20} className="text-[#C41E3A]" />;

  // 350ms search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 350);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch paginated data
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: '15',
        });
        if (debouncedSearch) queryParams.append('search', debouncedSearch);
        if (campusId) queryParams.append('campusId', campusId);

        const endpoint = isBranches
          ? `/admin/dashboard/branches?${queryParams.toString()}`
          : `/admin/dashboard/companies?${queryParams.toString()}`;

        const res = await apiFetch(endpoint);
        if (res.ok) {
          const json = await res.json();
          const mappedData = (json.data || [])
            .map((row: any) => ({
              name: isBranches ? row.branch : row.company,
              count: row.count,
              percentage: row.percentage,
            }))
            .filter((item: any) => {
              if (!isBranches && item.name) {
                const lower = item.name.toLowerCase();
                return lower !== 'not specified' && lower !== 'unspecified';
              }
              return true;
            });
          setItems(mappedData);
          setPagination(json.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
        } else {
          toast.error('Failed to load details');
        }
      } catch (err) {
        console.error('Error fetching distribution modal data:', err);
        toast.error('Network error loading details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, page, debouncedSearch, campusId, isBranches]);

  // Handle Excel Export
  const handleExport = async () => {
    setExporting(true);
    try {
      const queryParams = new URLSearchParams({ export: 'true' });
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (campusId) queryParams.append('campusId', campusId);

      const endpoint = isBranches
        ? `${BASE_PATH}/api/admin/dashboard/branches?${queryParams.toString()}`
        : `${BASE_PATH}/api/admin/dashboard/companies?${queryParams.toString()}`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const fileName = isBranches
        ? `all_branches_export_${Date.now()}.xlsx`
        : `all_companies_export_${Date.now()}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Excel report downloaded successfully!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to generate export file');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  const maxCount = items.length > 0 ? Math.max(...items.map((i) => i.count)) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              {icon}
            </div>
            <div>
              <h2 className="text-lg font-black text-[#012140] tracking-tight">{title}</h2>
              <p className="text-xs text-slate-500">
                {pagination.total} total {isBranches ? 'branches' : 'companies'} recorded
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter & Export Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${isBranches ? 'branches' : 'companies'}...`}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#003D7A] focus:bg-white focus:ring-4 focus:ring-blue-50 transition"
            />
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || items.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-sm transition disabled:opacity-50"
          >
            {exporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating Excel...
              </>
            ) : (
              <>
                <Download size={14} />
                Export to Excel
              </>
            )}
          </button>
        </div>

        {/* Content List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 min-h-[300px]">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 size={28} className="animate-spin text-[#003D7A]" />
              <p className="text-xs font-semibold text-slate-400">Loading data...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs italic">
              {debouncedSearch ? `No ${isBranches ? 'branches' : 'companies'} matching "${debouncedSearch}"` : 'No data available'}
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="space-y-1.5 p-3 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span className="truncate pr-4">{item.name}</span>
                  <div className="flex items-center gap-2 text-right shrink-0">
                    <span className="text-slate-900 font-extrabold">{item.count} alumni</span>
                    <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isBranches
                        ? 'bg-gradient-to-r from-[#003D7A] to-[#002654]'
                        : 'bg-gradient-to-r from-[#C41E3A] to-red-700'
                    }`}
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Page {pagination.page} of {pagination.pages || 1} ({pagination.total} records)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
