'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Trash2,
  Globe,
  ChevronLeft,
  ChevronRight,
  Rocket,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StartupItem {
  id: string;
  name: string;
  description: string;
  industry: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  foundedYear: number | null;
  createdAt: string;
  founder: {
    id: string;
    name: string;
    email: string;
    currentRole: string | null;
    avatarUrl: string | null;
    city: string | null;
    batchYear: number;
    branch: string;
  };
}

interface StartupsResponse {
  startups: StartupItem[];
  pagination: { page: number; limit: number; totalCount: number; totalPages: number };
  filters: { industries: string[] };
}

// ─── Main Client ──────────────────────────────────────────────────────────────

function AdminStartupsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const search = searchParams.get('search') || '';
  const industry = searchParams.get('industry') || 'All';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [deleteTarget, setDeleteTarget] = useState<StartupItem | null>(null);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'All') params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  // ── Data fetch ────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery<StartupsResponse>({
    queryKey: ['admin-startups', { search, industry, sort, page }],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (search) p.set('search', search);
      if (industry && industry !== 'All') p.set('industry', industry);
      p.set('sort', sort);
      p.set('page', String(page));
      p.set('limit', '10');
      const res = await fetch(`/api/admin/startups?${p.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/admin/startups', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      return data;
    },
    onSuccess: () => {
      toast.success('Startup deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-startups'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete'),
  });

  const startups = data?.startups || [];
  const pagination = data?.pagination;
  const industries = ['All', ...(data?.filters?.industries || [])];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alumni Startups</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isLoading ? '…' : `${pagination?.totalCount ?? 0} startups registered`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, description, or founder..."
              defaultValue={search}
              onBlur={(e) => setParam('search', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setParam('search', (e.target as HTMLInputElement).value)}
              className="w-full text-[#012140] pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-sm"
            />
          </div>

          {/* Industry filter */}
          <select
            value={industry}
            onChange={(e) => setParam('industry', e.target.value)}
            className="px-3 py-2 text-[#012140] border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-sm bg-white"
          >
            {industries.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
            className="px-3 py-2 text-[#012140] border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-sm bg-white"
          >
            <option value="newest">Newest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      {/* Startups Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-4 animate-pulse">
                <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : startups.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Rocket className="mx-auto mb-3 text-slate-300" size={40} />
            <p className="font-semibold">No startups found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {startups.map((startup) => (
              <StartupRow
                key={startup.id}
                startup={startup}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600 border-t border-slate-100 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setParam('page', String(page - 1))}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <span className="font-semibold text-slate-700">Page {page} of {pagination.totalPages}</span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setParam('page', String(page + 1))}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-100 p-6 space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="text-rose-600" size={20} />
              </div>
              <h3 className="font-bold text-gray-900">Delete Startup?</h3>
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-semibold">"{deleteTarget.name}"</span> will be permanently removed.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition text-sm disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Row Component ────────────────────────────────────────────────────────────

function StartupRow({
  startup,
  onDelete,
}: {
  startup: StartupItem;
  onDelete: (s: StartupItem) => void;
}) {
  const getInitials = (name: string) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2) : 'S';

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-slate-50 transition">
      {/* Logo */}
      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
        {startup.logoUrl ? (
          <img src={startup.logoUrl} alt={startup.name} className="w-full h-full object-contain p-1" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#003D7A] to-[#C41E3A] flex items-center justify-center text-white font-bold text-xs">
            {getInitials(startup.name)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-sm text-gray-900 truncate">{startup.name}</p>
              {startup.industry && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold shrink-0">
                  {startup.industry}
                </span>
              )}
              {startup.foundedYear && (
                <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                  Est. {startup.foundedYear}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{startup.description}</p>

            {/* Founder info */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Link
                href={`/alumni/profile/${startup.founder.id}`}
                target="_blank"
                className="flex items-center gap-1.5 hover:opacity-80 transition"
              >
                <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-[8px] font-bold text-slate-600 shrink-0">
                  {startup.founder.avatarUrl ? (
                    <img src={startup.founder.avatarUrl} alt={startup.founder.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(startup.founder.name)
                  )}
                </div>
                <span className="text-xs font-bold text-[#003D7A] hover:underline">
                  {startup.founder.name}
                </span>
              </Link>
              <span className="text-[10px] text-slate-400">
                {startup.founder.batchYear} · {startup.founder.branch}
              </span>
              {startup.founder.currentRole && (
                <span className="text-[10px] text-slate-500 font-semibold">{startup.founder.currentRole}</span>
              )}
              {startup.founder.city && (
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                  <MapPin size={9} />
                  {startup.founder.city}
                </span>
              )}
            </div>

            {startup.websiteUrl && (
              <a
                href={startup.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-semibold mt-1"
              >
                <Globe size={10} />
                {startup.websiteUrl}
                <ExternalLink size={9} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onDelete(startup)}
          title="Delete"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-slate-200 rounded w-1/3" />
      <div className="h-16 bg-slate-200 rounded-2xl" />
      <div className="h-64 bg-slate-200 rounded-2xl" />
    </div>
  );
}

export default function AdminStartupsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminStartupsClient />
    </Suspense>
  );
}
