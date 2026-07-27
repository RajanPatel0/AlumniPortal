'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, X, Calendar as CalendarIcon, FileText, Pencil, Trash2, BookOpen, Clock, ArrowRight, MapPin, User, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { getEventsAction, createEventAction, updateEventAction, deleteEventAction } from '@/actions/events';
import { NEWSCORNER_CATEGORIES } from '@/schemas/event';
import type { EventItemType, EventFilterParams } from '@/types/events';
import { MultiImageUploader } from '@/components/MultiImageUploader';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: Date | string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return String(dateStr); }
}

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// ─── Empty form state ────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Campus News',
  eventDate: new Date().toISOString().slice(0, 16),
  venue: 'Campus',
  coverImageUrl: '',
  imageUrls: [] as string[],
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

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItemType | null>(null);
  const [readingEvent, setReadingEvent] = useState<EventItemType | null>(null);
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

  // ── Delete mutation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEventAction(id),
    onSuccess: (result: any, id: string) => {
      if (result.success) {
        toast.success('Post deleted!');
        queryClient.invalidateQueries({ queryKey: ['newscorner'] });
        if (readingEvent?.id === id) setReadingEvent(null);
      } else {
        toast.error(result.error || 'Failed to delete post');
      }
    },
    onError: () => toast.error('Failed to delete post'),
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate(id);
    }
  };

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
      imageUrls: Array.isArray(item.imageUrls) ? (item.imageUrls as string[]) : item.coverImageUrl ? [item.coverImageUrl] : [],
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">NewsCorner & Stories</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Explore campus updates, alumni achievements, and inspiring stories</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-[0.98] self-start md:self-auto shadow-sm"
        >
          <Plus size={16} />
          <span>Write a Story</span>
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
                  activeTab === tab.id ? 'bg-[#003D7A] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:text-gray-900 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Count */}
          <p className="text-xs font-semibold text-slate-500">
            {isLoading ? 'Loading…' : `Showing ${pagination?.totalCount ?? 0} stories`}
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
                <NewsCard
                  key={item.id}
                  item={item}
                  onReadMore={(post) => setReadingEvent(post)}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
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

      {/* Full Blog Article Reader Modal */}
      {readingEvent && (
        <BlogReaderModal
          item={readingEvent}
          onClose={() => setReadingEvent(null)}
          onEdit={(post) => {
            setReadingEvent(null);
            openEdit(post);
          }}
          onDelete={(id) => {
            handleDelete(id);
          }}
        />
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">

            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="font-bold text-gray-900 text-sm">
                {editingEvent ? 'Edit Post' : 'Write a Story'}
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
                  minLength={3}
                  maxLength={150}
                  placeholder="e.g. Outstanding Alumni Achievement"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400"
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600">Description *</label>
                  <span className="text-[10px] text-slate-400 font-medium">Min 10 characters</span>
                </div>
                <textarea
                  required
                  rows={5}
                  minLength={10}
                  maxLength={5000}
                  placeholder="Write your story, announcement, or report here..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400 resize-y min-h-[120px]"
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
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Venue *</label>
                  <input
                    type="text"
                    required
                    minLength={2}
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

              {/* Story Photos - Multi-Image Upload */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Story Photos</label>
                <MultiImageUploader
                  imageUrls={form.imageUrls}
                  coverImageUrl={form.coverImageUrl}
                  onChange={(images, cover) => setForm({ ...form, imageUrls: images, coverImageUrl: cover })}
                  folder="newscorner_covers"
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
                  {saveMutation.isPending ? 'Saving…' : editingEvent ? 'Save Changes' : 'Publish Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Blog Article Reader Modal ───────────────────────────────────────────────

function BlogReaderModal({
  item,
  onClose,
  onEdit,
  onDelete,
}: {
  item: EventItemType;
  onClose: () => void;
  onEdit: (item: EventItemType) => void;
  onDelete: (id: string) => void;
}) {
  const authorName = item.postedByAlumni?.name || item.postedByStaff?.name || 'Staff';
  const authorRole = item.postedByAlumni?.currentRole || 'Alumni Contributor';
  const authorAvatar = item.postedByAlumni?.avatarUrl;
  const readTime = estimateReadingTime(item.description);

  const allImages = (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0)
    ? (item.imageUrls as string[])
    : item.coverImageUrl ? [item.coverImageUrl] : [];

  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">

        {/* Top Sticky Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 text-[#003D7A] font-bold text-xs rounded-full">
              {item.category}
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
              <Clock size={13} />
              <span>{readTime} min read</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Article Scrollable Body */}
        <div className="p-6 md:p-10 overflow-y-auto space-y-6">

          {/* Article Title */}
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-snug tracking-tight">
            {item.title}
          </h1>

          {/* Author Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-100">
            <div className="flex items-center gap-3">
              {authorAvatar ? (
                <img src={authorAvatar} alt={authorName} className="w-11 h-11 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-blue-100 text-[#003D7A] font-bold flex items-center justify-center text-sm border border-blue-200">
                  {authorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-900">{authorName}</p>
                <p className="text-xs text-slate-500 font-medium">{authorRole}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <CalendarIcon size={14} className="text-slate-400" />
                <span>{formatDate(item.eventDate)}</span>
              </div>
              {item.venue && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  <span>{item.venue}</span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Image Carousel */}
          {allImages.length > 0 && (
            <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-slate-950 group">
              <div className="w-full h-72 md:h-[380px] flex items-center justify-center bg-black/90">
                <img
                  src={allImages[activeIdx]}
                  alt={`${item.title} photo ${activeIdx + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>

              {allImages.length > 1 && (
                <>
                  {/* Left arrow */}
                  <button
                    type="button"
                    onClick={() => setActiveIdx((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition shadow-md cursor-pointer"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Right arrow */}
                  <button
                    type="button"
                    onClick={() => setActiveIdx((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition shadow-md cursor-pointer"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Slide Counter Badge */}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-full shadow">
                    {activeIdx + 1} / {allImages.length}
                  </div>

                  {/* Dots indicator */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveIdx(idx)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          idx === activeIdx ? 'bg-white w-5' : 'bg-white/50 hover:bg-white/80 w-2'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Full Article Content */}
          <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed font-normal text-sm md:text-base whitespace-pre-line space-y-4 pt-2">
            {item.description}
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            {item.postedByMe && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(item)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <Pencil size={13} />
                  <span>Edit Story</span>
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            Close Story
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── News Card ───────────────────────────────────────────────────────────────

function NewsCard({
  item,
  onReadMore,
  onEdit,
  onDelete,
}: {
  item: EventItemType;
  onReadMore: (item: EventItemType) => void;
  onEdit: (item: EventItemType) => void;
  onDelete: (id: string) => void;
}) {
  const authorName = item.postedByAlumni?.name || item.postedByStaff?.name || 'Staff';
  const authorRole = item.postedByAlumni?.currentRole;
  const authorAvatar = item.postedByAlumni?.avatarUrl;
  const readTime = estimateReadingTime(item.description);

  const allImages = (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0)
    ? (item.imageUrls as string[])
    : item.coverImageUrl ? [item.coverImageUrl] : [];
  const displayCover = item.coverImageUrl || allImages[0];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col md:flex-row group">

      {/* Cover image */}
      <div
        onClick={() => onReadMore(item)}
        className="md:w-64 h-48 md:h-auto flex-shrink-0 relative bg-slate-100 overflow-hidden cursor-pointer"
      >
        {displayCover ? (
          <img
            src={displayCover}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100 group-hover:bg-slate-200/60 transition">
            <BookOpen size={44} className="text-slate-300" />
          </div>
        )}
        {!item.isPublished && (
          <span className="absolute top-3 left-3 px-2 py-0.5 bg-yellow-500 text-white font-bold text-[8px] uppercase tracking-wider rounded shadow-sm">
            Draft
          </span>
        )}
        {allImages.length > 1 && (
          <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/65 backdrop-blur-sm text-white font-bold text-[10px] rounded-md flex items-center gap-1 shadow-sm">
            <Camera size={11} /> {allImages.length}
          </span>
        )}
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">

          {/* Meta Header */}
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-0.5 bg-blue-50 text-[#003D7A] rounded-md uppercase tracking-wider">
              {item.category}
            </span>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1 text-slate-400">
              <CalendarIcon size={12} />
              <span>{formatDate(item.eventDate)}</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1 text-slate-400">
              <Clock size={12} />
              <span>{readTime} min read</span>
            </div>
          </div>

          {/* Title */}
          <h3
            onClick={() => onReadMore(item)}
            className="text-base md:text-lg font-extrabold text-gray-900 hover:text-[#003D7A] cursor-pointer transition line-clamp-2 leading-snug"
          >
            {item.title}
          </h3>

          {/* Excerpt */}
          <p className="text-xs md:text-sm text-slate-600 font-normal leading-relaxed line-clamp-3">
            {item.description}
          </p>
        </div>

        {/* Card Footer: Author + Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-semibold text-slate-700">{authorName}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onReadMore(item)}
              className="flex items-center gap-1 text-xs font-bold text-[#003D7A] hover:underline cursor-pointer"
            >
              <span>Read story</span>
              <ArrowRight size={13} />
            </button>

            {item.postedByMe && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-100">
                <button
                  onClick={() => onEdit(item)}
                  title="Edit post"
                  className="p-1.5 text-slate-400 hover:text-[#003D7A] transition rounded-lg hover:bg-slate-100"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  title="Delete post"
                  className="p-1.5 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
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
