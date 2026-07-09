'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, MapPin, Users, Search, Clock,
  Check, X, MessageSquare, Info,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { getEventsAction, submitRsvpAction } from '@/actions/events';
import { CALENDAR_CATEGORIES } from '@/schemas/event';
import type { EventItemType } from '@/types/events';
import type { RsvpStatus } from '@prisma/client';

// ─── Date helpers ────────────────────────────────────────────────────────────

function getDateParts(dateStr: Date | string) {
  const d = new Date(dateStr);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.toLocaleDateString('en-US', { day: '2-digit' }),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    year: d.getFullYear(),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

// ─── Events Page Client ───────────────────────────────────────────────────────

function AlumniEventsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const searchTerm = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || 'All';

  // RSVP modal
  const [rsvpEvent, setRsvpEvent] = useState<EventItemType | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('ATTENDING');
  const [rsvpMessage, setRsvpMessage] = useState('');

  // Detail modal
  const [detailEvent, setDetailEvent] = useState<EventItemType | null>(null);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'All') params.set(key, value); else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  // ── Query ─────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['alumni-events', { searchTerm, selectedCategory }],
    queryFn: () =>
      getEventsAction({
        search: searchTerm,
        category: selectedCategory,
        limit: 50,
        categoryScope: [...CALENDAR_CATEGORIES],
        postedBy: 'staff',
      }),
  });

  // ── RSVP mutation ─────────────────────────────────────────────────────────
  const rsvpMutation = useMutation({
    mutationFn: () => submitRsvpAction(rsvpEvent!.id, rsvpStatus, rsvpMessage),
    onSuccess: (result: any) => {
      if (result.success) {
        toast.success('RSVP submitted!');
        queryClient.invalidateQueries({ queryKey: ['alumni-events'] });
        closeRsvpModal();
      } else {
        toast.error((result as any).error || 'Failed to submit RSVP');
      }
    },
    onError: () => toast.error('Something went wrong'),
  });

  const openRsvpModal = (event: EventItemType) => {
    setRsvpEvent(event);
    setRsvpStatus(event.myRsvp?.status || 'ATTENDING');
    setRsvpMessage(event.myRsvp?.message || '');
  };
  const closeRsvpModal = () => { setRsvpEvent(null); setRsvpMessage(''); };

  const events = data?.events || [];
  const allCategories = ['All', ...CALENDAR_CATEGORIES];

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-1">

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#012140] via-[#003D7A] to-[#0f4068] text-white p-8 sm:p-10 shadow-xl border border-white/10">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#C41E3A]/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wider text-[#C41E3A] border border-white/10 uppercase mb-4">
            University Events
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3 leading-tight">
            PTU Alumni Events
          </h1>
          <p className="text-slate-200 text-sm sm:text-base font-light leading-relaxed">
            Reconnect with classmates, explore professional developments, and expand your network.
          </p>
        </div>
      </div>

      {/* Search + Category Filter */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-5">
        <div className="relative">
          <Search className="absolute left-4 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search events..."
            defaultValue={searchTerm}
            onBlur={(e) => setParam('search', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setParam('search', (e.target as HTMLInputElement).value)}
            className="w-full pl-12 pr-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[#003D7A] hover:border-slate-300 transition text-sm bg-slate-50/50"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setParam('category', cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#003D7A] to-[#012140] text-white shadow-md scale-105'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="py-24 text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-[#003D7A] border-t-transparent rounded-full mb-3" />
          <p className="text-slate-500 font-semibold">Loading events…</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
          <Calendar className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-slate-800">No Events Scheduled</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            No events match your filter. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => {
            const { month, day, weekday, year, time } = getDateParts(event.eventDate);
            const hasPassed = new Date() > new Date(event.eventDate);
            const isRsvped = !!event.myRsvp;

            return (
              <div
                key={event.id}
                className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1"
              >
                <div className="h-2 w-full bg-gradient-to-r from-[#C41E3A] to-[#003D7A]" />

                {event.coverImageUrl && (
                  <div className="h-44 w-full overflow-hidden relative border-b border-slate-100">
                    <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start gap-4">
                    {/* Date block */}
                    <div className="flex flex-col items-center justify-center w-14 h-16 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm shrink-0 overflow-hidden text-center">
                      <div className="w-full bg-[#C41E3A] text-white text-[10px] font-bold py-0.5 tracking-wider uppercase">{month}</div>
                      <div className="text-slate-800 text-xl font-extrabold leading-none mt-1">{day}</div>
                      <div className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">{weekday}</div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="inline-block px-2.5 py-0.5 bg-[#003D7A]/5 text-[#003D7A] font-bold text-[10px] rounded-full uppercase tracking-wider mb-2">
                        {event.category}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#003D7A] transition-colors">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm mt-4 leading-relaxed line-clamp-3 flex-1">
                    {event.description}
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="text-[#003D7A]" size={16} />
                      <span className="truncate">{time} ({weekday}, {year})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="text-[#C41E3A]" size={16} />
                      <span className="truncate" title={event.venue}>{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                      <Users className="text-blue-500" size={16} />
                      <span className="font-semibold text-slate-700">{event.attendingCount} attending alumni</span>
                    </div>
                  </div>

                  {isRsvped && (
                    <div className={`mt-4 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs font-semibold ${
                      event.myRsvp?.status === 'ATTENDING'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                        : event.myRsvp?.status === 'MAYBE'
                        ? 'bg-amber-50 text-amber-800 border border-amber-100'
                        : 'bg-rose-50 text-rose-800 border border-rose-100'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Check size={14} className="shrink-0" />
                        <span>Your RSVP: <span className="uppercase">{event.myRsvp?.status.replace('_', ' ')}</span></span>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => setDetailEvent(event)}
                      className="px-4 py-2.5 border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-2xl transition text-xs shrink-0 flex items-center gap-1.5"
                    >
                      <Info size={14} />Details
                    </button>

                    {hasPassed ? (
                      <button disabled className="flex-1 py-2.5 bg-slate-100 text-slate-400 font-bold rounded-2xl text-xs cursor-not-allowed text-center">
                        Event Concluded
                      </button>
                    ) : (
                      <button
                        onClick={() => openRsvpModal(event)}
                        className={`flex-1 py-2.5 font-bold rounded-2xl text-xs transition shadow-sm text-center ${
                          isRsvped
                            ? 'border-2 border-[#003D7A] text-[#003D7A] hover:bg-[#003D7A] hover:text-white'
                            : 'bg-[#003D7A] hover:bg-[#002654] text-white'
                        }`}
                      >
                        {isRsvped ? 'Change RSVP' : 'RSVP Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RSVP Modal */}
      {rsvpEvent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border-t sm:border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-md font-bold text-slate-900">Event Attendance RSVP</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">For: {rsvpEvent.title}</p>
              </div>
              <button onClick={closeRsvpModal} className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); rsvpMutation.mutate(); }} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Will you attend?</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { status: 'ATTENDING' as RsvpStatus, emoji: '✅', label: 'Going', active: 'border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-2 ring-emerald-500/20' },
                    { status: 'MAYBE' as RsvpStatus, emoji: '❓', label: 'Maybe', active: 'border-amber-500 bg-amber-50/50 text-amber-800 ring-2 ring-amber-500/20' },
                    { status: 'NOT_ATTENDING' as RsvpStatus, emoji: '❌', label: 'Not Going', active: 'border-rose-500 bg-rose-50/50 text-rose-800 ring-2 ring-rose-500/20' },
                  ]).map(({ status, emoji, label, active }) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setRsvpStatus(status)}
                      className={`py-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                        rsvpStatus === status ? active : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{emoji}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <MessageSquare size={12} /> Optional message
                </label>
                <textarea
                  value={rsvpMessage}
                  onChange={(e) => setRsvpMessage(e.target.value)}
                  placeholder="Leave a note for the organizers..."
                  rows={3}
                  maxLength={150}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[#003D7A] transition text-sm bg-slate-50/50"
                />
              </div>

              {rsvpEvent.rsvpDeadline && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex gap-2 text-[11px] text-blue-800 leading-snug">
                  <Info className="shrink-0 mt-0.5" size={14} />
                  <span>
                    RSVPs close on{' '}
                    <span className="font-bold">
                      {new Date(rsvpEvent.rsvpDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeRsvpModal} className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 rounded-2xl text-slate-700 font-bold transition text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rsvpMutation.isPending}
                  className="flex-1 py-3 bg-[#003D7A] hover:bg-[#002654] text-white rounded-2xl font-bold transition text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-900/10 disabled:opacity-60"
                >
                  {rsvpMutation.isPending && <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />}
                  Confirm RSVP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {detailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="relative h-48 bg-gradient-to-r from-[#012140] to-[#003D7A] flex items-end p-6 text-white shrink-0">
              {detailEvent.coverImageUrl && (
                <img src={detailEvent.coverImageUrl} alt={detailEvent.title} className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
              <div className="relative z-10 w-full">
                <span className="px-2.5 py-0.5 bg-[#C41E3A] text-white font-bold text-[9px] rounded-full uppercase tracking-wider mb-2 inline-block">{detailEvent.category}</span>
                <h3 className="text-xl font-bold leading-tight">{detailEvent.title}</h3>
              </div>
              <button onClick={() => setDetailEvent(null)} className="absolute right-4 top-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-slate-700 flex-1">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">About this Event</h4>
                <p className="text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">{detailEvent.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date &amp; Time</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{new Date(detailEvent.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(detailEvent.eventDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Venue</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1 truncate">{detailEvent.venue}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button onClick={() => setDetailEvent(null)} className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-20" />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-48 bg-slate-200 rounded-3xl" />
      <div className="h-24 bg-slate-200 rounded-3xl" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-64 bg-slate-200 rounded-3xl" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    </div>
  );
}

export default function AlumniEventsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AlumniEventsClient />
    </Suspense>
  );
}