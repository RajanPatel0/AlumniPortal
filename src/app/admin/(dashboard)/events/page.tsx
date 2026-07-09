"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Calendar,
  MapPin,
  Users,
  Eye,
  EyeOff,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";

import {
  getAdminEventsAction,
  createAdminEventAction,
  updateAdminEventAction,
  deleteEventAction,
  toggleEventPublishAction,
  getEventRsvpsAction,
} from "@/actions/events";
import { CALENDAR_CATEGORIES } from "@/schemas/event";
import type { EventItemType, RsvpDetailsType } from "@/types/events";
import Link from "next/link";
import { ImageUploader } from "@/components/ImageUploader";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: Date | string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "General",
  eventDate: "",
  venue: "",
  coverImageUrl: "",
  rsvpDeadline: "",
  isPublished: false,
};

// ─── Admin Events Client ──────────────────────────────────────────────────────

function AdminEventsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const searchTerm = searchParams.get("search") || "";
  const selectedCategory = searchParams.get("category") || "All";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const tab = (searchParams.get("tab") || "all") as "all" | "posted" | "alumni" | "staff";

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItemType | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const [rsvpEventId, setRsvpEventId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventItemType | null>(null);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "All") params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  // ── Events query ──────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["admin-events", { searchTerm, selectedCategory, page, tab }],
    queryFn: () =>
      getAdminEventsAction({
        search: searchTerm,
        category: selectedCategory,
        page,
        limit: 10,
        tab,
      }),
  });

  // ── RSVP query ─────────────────────────────────────────────────────────────
  const { data: rsvpData, isLoading: loadingRsvps } =
    useQuery<RsvpDetailsType | null>({
      queryKey: ["admin-event-rsvps", rsvpEventId],
      queryFn: () =>
        rsvpEventId ? getEventRsvpsAction(rsvpEventId) : Promise.resolve(null),
      enabled: !!rsvpEventId,
    });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (fd: typeof EMPTY_FORM) => {
      const payload = {
        ...fd,
        eventDate: new Date(fd.eventDate),
        rsvpDeadline: fd.rsvpDeadline ? new Date(fd.rsvpDeadline) : undefined,
        coverImageUrl: fd.coverImageUrl || undefined,
      };
      return editingEvent
        ? updateAdminEventAction(editingEvent.id, payload as any)
        : createAdminEventAction(payload as any);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(editingEvent ? "Event updated!" : "Event created!");
        queryClient.invalidateQueries({ queryKey: ["admin-events"] });
        closeModal();
      } else {
        toast.error((result as any).error || "Something went wrong");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEventAction(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Event deleted");
        queryClient.invalidateQueries({ queryKey: ["admin-events"] });
        setDeleteTarget(null);
      } else {
        toast.error((result as any).error || "Failed to delete event");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      toggleEventPublishAction(id, isPublished),
    onSuccess: (result, vars) => {
      if (result.success) {
        toast.success(
          vars.isPublished ? "Event published" : "Event unpublished",
        );
        queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      } else {
        toast.error("Failed to update publish status");
      }
    },
  });

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingEvent(null);
    setFormData({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (event: EventItemType) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      category: event.category,
      eventDate: new Date(event.eventDate).toISOString().slice(0, 16),
      venue: event.venue,
      coverImageUrl: event.coverImageUrl || "",
      rsvpDeadline: event.rsvpDeadline
        ? new Date(event.rsvpDeadline as string).toISOString().slice(0, 16)
        : "",
      isPublished: event.isPublished,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  const events = data?.events || [];
  const pagination = data?.pagination;
  const allCategories = ["All", ...CALENDAR_CATEGORIES];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Events Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isLoading ? "…" : `${pagination?.totalCount ?? 0} events`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#003D7A] hover:bg-[#002b56] text-white text-sm font-bold rounded-xl transition shadow-sm"
        >
          <Plus size={18} />
          <span>Create Event</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search events..."
              defaultValue={searchTerm}
              onBlur={(e) => setParam("search", e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                setParam("search", (e.target as HTMLInputElement).value)
              }
              className="w-full text-[#012140] pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-sm"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setParam("category", e.target.value)}
            className="px-3 py-2 text-[#012140] border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-sm bg-white"
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(
            [
              ["all", "All Events"],
              ["posted", "My Events"],
              ["staff", "Staff Posted"],
              ["alumni", "Alumni Posted"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setParam("tab", id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                tab === id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-4 animate-pulse">
                <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/5" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="mx-auto mb-3 text-slate-300" size={40} />
            <p className="font-semibold">No events found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((event) => (
              <AdminEventRow
                key={event.id}
                event={event}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onViewRsvp={(id) => setRsvpEventId(id)}
                onTogglePublish={(id, pub) =>
                  togglePublishMutation.mutate({ id, isPublished: pub })
                }
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
            onClick={() => setParam("page", String(page - 1))}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <span className="font-semibold text-slate-700">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setParam("page", String(page + 1))}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-gray-900">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-200 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(formData);
              }}
              className="p-6 space-y-4 overflow-y-auto"
            >
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full text-[#012140] px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-sm"
                  placeholder="Annual Alumni Reunion"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full text-[#012140] px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-sm resize-none"
                  placeholder="Describe the event..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full text-[#012140] px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-sm bg-white"
                  >
                    {CALENDAR_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.isPublished ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isPublished: e.target.value === "true",
                      })
                    }
                    className="w-full text-[#012140] px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-sm bg-white"
                  >
                    <option value="true">Published</option>
                    <option value="false">Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Event Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Event Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.eventDate}
                    onChange={(e) =>
                      setFormData({ ...formData, eventDate: e.target.value })
                    }
                    className="w-full text-[#012140] px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-sm"
                  />
                </div>

                {/* RSVP Deadline */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    RSVP Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.rsvpDeadline}
                    onChange={(e) =>
                      setFormData({ ...formData, rsvpDeadline: e.target.value })
                    }
                    className="w-full text-[#012140] px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-sm"
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Venue *
                </label>
                <input
                  type="text"
                  required
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  className="w-full text-[#012140] px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-sm"
                  placeholder="e.g. PTU Main Campus, Kapurthala"
                />
              </div>

              {/* Cover Image - Cloudinary Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Cover Image
                </label>
                <ImageUploader
                  value={formData.coverImageUrl}
                  onChange={(url) => setFormData({ ...formData, coverImageUrl: url })}
                  folder="event_covers"
                  placeholder="Upload event cover image"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 py-2.5 bg-[#003D7A] hover:bg-[#002b56] text-white text-sm font-bold rounded-xl transition disabled:opacity-60"
                >
                  {saveMutation.isPending
                    ? "Saving…"
                    : editingEvent
                      ? "Save Changes"
                      : "Create Event"}
                </button>
              </div>
            </form>
          </div>
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
              <h3 className="font-bold text-gray-900">Delete Event?</h3>
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-semibold">"{deleteTarget.title}"</span>{" "}
                and all RSVPs will be permanently deleted.
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
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RSVP Details Modal */}
      {rsvpEventId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="font-bold text-gray-900">Event RSVPs</h3>
                {rsvpData && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {rsvpData.eventTitle} · {formatDate(rsvpData.eventDate)}
                  </p>
                )}
              </div>
              <button
                onClick={() => setRsvpEventId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingRsvps ? (
                <div className="p-8 text-center text-slate-500">
                  Loading RSVPs…
                </div>
              ) : !rsvpData ? (
                <div className="p-8 text-center text-slate-500">
                  No data found
                </div>
              ) : (
                <>
                  {/* Summary badges */}
                  <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-slate-100">
                    {[
                      {
                        label: "Attending",
                        count: rsvpData.attendingCount,
                        color:
                          "text-emerald-700 bg-emerald-50 border-emerald-200",
                      },
                      {
                        label: "Maybe",
                        count: rsvpData.maybeCount,
                        color: "text-amber-700 bg-amber-50 border-amber-200",
                      },
                      {
                        label: "Not Going",
                        count: rsvpData.notAttendingCount,
                        color: "text-rose-700 bg-rose-50 border-rose-200",
                      },
                    ].map(({ label, count, color }) => (
                      <div
                        key={label}
                        className={`text-center p-3 rounded-xl border ${color}`}
                      >
                        <div className="text-2xl font-black">{count}</div>
                        <div className="text-xs font-bold mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* RSVP list */}
                  <div className="divide-y divide-slate-100">
                    {rsvpData.rsvps.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        No RSVPs yet
                      </div>
                    ) : (
                      rsvpData.rsvps.map((rsvp) => (
                        <div
                          key={rsvp.id}
                          className="flex items-center gap-4 p-4 hover:bg-slate-50"
                        >
                          <Link
                            href={`/alumni/profile/${rsvp.alumni.id}`}
                            target="_blank"
                            className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition group"
                          >
                            <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden shrink-0 ring-1 ring-slate-100 group-hover:ring-[#003D7A]/30">
                              {rsvp.alumni.avatarUrl ? (
                                <img
                                  src={rsvp.alumni.avatarUrl}
                                  alt={rsvp.alumni.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm">
                                  {rsvp.alumni.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-gray-900 group-hover:text-[#003D7A] transition-colors truncate">
                                {rsvp.alumni.name}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {rsvp.alumni.email}
                              </p>
                              <p className="text-xs text-slate-400">
                                {rsvp.alumni.batchYear} · {rsvp.alumni.branch}
                              </p>
                            </div>
                          </Link>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                              rsvp.status === "ATTENDING"
                                ? "bg-emerald-100 text-emerald-800"
                                : rsvp.status === "MAYBE"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {rsvp.status.replace("_", " ")}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Event Row Component ──────────────────────────────────────────────────────

function AdminEventRow({
  event,
  onEdit,
  onDelete,
  onViewRsvp,
  onTogglePublish,
}: {
  event: EventItemType;
  onEdit: (e: EventItemType) => void;
  onDelete: (e: EventItemType) => void;
  onViewRsvp: (id: string) => void;
  onTogglePublish: (id: string, pub: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition">
      {/* Date block */}
      <div className="w-14 h-14 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-center shrink-0 overflow-hidden border border-slate-200">
        <div className="w-full text-white text-[9px] font-bold bg-[#C41E3A] py-0.5">
          {new Date(event.eventDate)
            .toLocaleDateString("en-US", { month: "short" })
            .toUpperCase()}
        </div>
        <div className="text-slate-900 font-black text-xl leading-tight">
          {new Date(event.eventDate).toLocaleDateString("en-US", {
            day: "2-digit",
          })}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-bold text-sm text-gray-900 truncate">
            {event.title}
          </p>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
              event.isPublished
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {event.isPublished ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(event.eventDate)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate max-w-[120px]">{event.venue}</span>
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} />
            {event.attendingCount} attending
          </span>
          {/* Poster tag */}
          {event.postedByAlumni ? (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-[10px] font-bold">
              <UserCircle size={10} />
              {event.postedByAlumni.name}
            </span>
          ) : event.postedByStaff ? (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold">
              <ShieldCheck size={10} />
              {event.postedByStaff.name}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{event.category}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onViewRsvp(event.id)}
          title="View RSVPs"
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
        >
          <Users size={15} />
        </button>
        <button
          onClick={() => onTogglePublish(event.id, !event.isPublished)}
          title={event.isPublished ? "Unpublish" : "Publish"}
          className={`p-2 rounded-lg transition ${
            event.isPublished
              ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
          }`}
        >
          {event.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button
          onClick={() => onEdit(event)}
          title="Edit"
          className="p-2 text-slate-400 hover:text-[#003D7A] hover:bg-blue-50 rounded-lg transition"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => onDelete(event)}
          title="Delete"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton & Page Export ───────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-slate-200 rounded w-1/3" />
      <div className="h-20 bg-slate-200 rounded-2xl" />
      <div className="h-64 bg-slate-200 rounded-2xl" />
    </div>
  );
}

export default function EventsManagementPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminEventsClient />
    </Suspense>
  );
}
