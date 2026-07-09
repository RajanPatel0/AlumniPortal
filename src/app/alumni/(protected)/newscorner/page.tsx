'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, X, Calendar as CalendarIcon, FileText, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { getEventsAction, createEventAction, updateEventAction } from '@/actions/events';
import { NEWSCORNER_CATEGORIES } from '@/schemas/event';
import type { EventItemType, EventFilterParams } from '@/types/events';
import { ImageUploader } from '@/components/ImageUploader';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: Date | string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return String(dateStr); }
}

// ─── Empty form state ────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Campus News',
  eventDate: new Date().toISOString().slice(0, 16),
  venue: 'Campus',
  coverImageUrl: '',
  isPublished: true,
  rsvpDeadline: undefined as unknown as Date,
};

// ─── Main Client Component ───────────────────────────────────────────────────

function NewsCornerClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Read filters from URL
  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || 'All';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const showDrafts = searchParams.get('showDrafts') === 'true';
  const activeTab = (searchParams.get('tab') || 'all') as EventFilterParams['tab'];
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItemType | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // ── URL param helper ──────────────────────────────────────────────────────
  const setParam = (key: string, value: string | boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    const v = typeof value === 'boolean' ? String(value) : value;
    if (v && v !== 'false' && v !== 'All' && v !== '') params.set(key, v);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  // ── Query ─────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['newscorner', { searchQuery, selectedCategory, dateFrom, dateTo, showDrafts, activeTab, page }],
    queryFn: () =>
      getEventsAction({
        search: searchQuery,
        category: selectedCategory,
        dateFrom,
        dateTo,
        showDrafts,
        tab: activeTab,
        page,
        limit: 12,
        categoryScope: [...NEWSCORNER_CATEGORIES],
        postedBy: 'alumni',
      }),
  });

  // ── Create / Update mutation ──────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (formData: typeof EMPTY_FORM) =>
      editingEvent
        ? updateEventAction(editingEvent.id, { ...formData, eventDate: new Date(formData.eventDate) })
        : createEventAction({ ...formData, eventDate: new Date(formData.eventDate) }),
    onSuccess: (result: any) => {
      if (result.success) {
        toast.success(editingEvent ? 'Post updated!' : 'Post created!');
        queryClient.invalidateQueries({ queryKey: ['newscorner'] });
        closeModal();
      } else {
        toast.error((result as any).error || 'Something went wrong');
      }
    },
    onError: () => toast.error('Something went wrong'),
  });

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingEvent(null);
    setForm({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  const openEdit = (item: EventItemType) => {
    setEditingEvent(item);
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      eventDate: new Date(item.eventDate).toISOString().slice(0, 16),
      venue: item.venue,
      coverImageUrl: item.coverImageUrl || '',
      isPublished: item.isPublished,
      rsvpDeadline: undefined as unknown as Date,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingEvent(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const events = data?.events || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">NewsCorner</h2>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-[0.98] self-end"
        >
          <Plus size={16} />
          <span>Make a post</span>
        </button>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Sidebar Filters */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-5">

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search posts..."
                defaultValue={searchQuery}
                onBlur={(e) => setParam('search', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setParam('search', (e.target as HTMLInputElement).value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-slate-200 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-gray-800 placeholder:text-gray-400 transition"
              />
            </div>

            {/* Show drafts */}
            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer hover:text-slate-900">
              <input
                type="checkbox"
                checked={showDrafts}
                onChange={(e) => setParam('showDrafts', e.target.checked)}
                className="rounded border-slate-300 text-[#003D7A] focus:ring-[#003D7A] w-4 h-4"
              />
              <span>Show my draft posts</span>
            </label>

            {/* Date range */}
            <div className="space-y-3 pt-3 border-t border-slate-50">
              <span className="block text-xs font-bold text-gray-700">Date Range</span>
              <div className="space-y-2">
                {([['From', 'dateFrom', dateFrom], ['To', 'dateTo', dateTo]] as const).map(([label, key, val]) => (
                  <div key={key}>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">{label}</label>
                    <input
                      type="date"
                      defaultValue={val}
                      onChange={(e) => setParam(key, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-700"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3 pt-3 border-t border-slate-50">
              <span className="block text-xs font-bold text-gray-700">Categories</span>
              <div className="flex flex-col gap-2.5">
                {NEWSCORNER_CATEGORIES.map((cat) => (
                  <label key={cat} className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-900">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat}
                      onChange={() => setParam('category', cat)}
                      className="border-slate-300 text-[#003D7A] focus:ring-[#003D7A] w-4 h-4"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-900">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === 'All'}
                    onChange={() => setParam('category', 'All')}
                    className="border-slate-300 text-[#003D7A] focus:ring-[#003D7A] w-4 h-4"
                  />
                  <span>All categories</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="lg:col-span-9 space-y-4">

          {/* Tabs */}
          <div className="flex gap-2 pb-2">
            {[
              { id: 'all', label: 'All Posts' },
              { id: 'posted', label: 'My Posts' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setParam('tab', tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTab === tab.id ? 'bg-slate-200/80 text-gray-800' : 'text-slate-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Count */}
          <p className="text-xs font-semibold text-slate-500">
            {isLoading ? 'Loading…' : `Showing ${pagination?.totalCount ?? 0} posts`}
          </p>

          {isLoading ? (
            <NewsCornerSkeletons />
          ) : events.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500 font-semibold">
              No posts match your filters.
            </div>
          ) : (
            <>
              {events.map((item) => (
                <NewsCard key={item.id} item={item} onEdit={openEdit} />
              ))}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <button
                    disabled={page <= 1}
                    onClick={() => setParam('page', String(page - 1))}
                    className="px-3.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="font-semibold text-slate-700">Page {page} of {pagination.totalPages}</span>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setParam('page', String(page + 1))}
                    className="px-3.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">

            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="font-bold text-gray-900 text-sm">
                {editingEvent ? 'Edit Post' : 'Make a Post'}
              </h3>
              <button onClick={closeModal} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Outstanding Alumni Achievement"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write the story, announcement, or report here..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800"
                  >
                    {NEWSCORNER_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Post Date */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Post Date *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Venue */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Campus"
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400"
                  />
                </div>

                {/* Publish Status */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Status</label>
                  <select
                    value={form.isPublished ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800"
                  >
                    <option value="true">Published</option>
                    <option value="false">Draft</option>
                  </select>
                </div>
              </div>

              {/* Cover Image - Cloudinary Upload */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Cover Image</label>
                <ImageUploader
                  value={form.coverImageUrl}
                  onChange={(url) => setForm({ ...form, coverImageUrl: url })}
                  folder="newscorner_covers"
                  placeholder="Upload a cover image for your post"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 py-2.5 bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold rounded-xl transition disabled:opacity-60"
                >
                  {saveMutation.isPending ? 'Saving…' : editingEvent ? 'Save Changes' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── News Card ───────────────────────────────────────────────────────────────

function NewsCard({
  item,
  onEdit,
}: {
  item: EventItemType;
  onEdit: (item: EventItemType) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition flex flex-col md:flex-row relative">

      {/* Cover image */}
      <div className="md:w-56 h-40 flex-shrink-0 relative bg-slate-50 border-r border-slate-50">
        {item.coverImageUrl ? (
          <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
            <FileText size={40} />
          </div>
        )}
        {!item.isPublished && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-yellow-500 text-white font-bold text-[8px] uppercase tracking-wider rounded shadow-sm">
            Draft
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <CalendarIcon size={12} />
              <span>{formatDate(item.eventDate)}</span>
            </div>
            <span>•</span>
            <span className="text-slate-500">{item.category}</span>
          </div>
          <h3 className="text-sm font-bold text-gray-950 hover:text-blue-600 cursor-pointer transition">
            {item.title}
          </h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2">
            {item.description}
          </p>
        </div>

        {/* Author + edit */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-semibold">
            {item.postedByAlumni?.name || item.postedByStaff?.name || 'Staff'}
          </span>

          {item.postedByMe && (
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-[#003D7A] transition px-2 py-1 rounded-lg hover:bg-slate-50"
            >
              <Pencil size={11} />
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function NewsCornerSkeletons() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="bg-white rounded-2xl border border-slate-100 p-5 flex gap-4 animate-pulse">
          <div className="w-48 h-36 bg-slate-200 rounded-xl shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-3 bg-slate-100 rounded w-1/4" />
            <div className="h-4 bg-slate-200 rounded w-2/3" />
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/4" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 h-96 bg-slate-200 rounded-2xl" />
        <div className="lg:col-span-9 space-y-4">
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Page Export ─────────────────────────────────────────────────────────────

export default function NewsCornerPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewsCornerClient />
    </Suspense>
  );
}
