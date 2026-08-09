'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2, X, Calendar, MapPin, Info, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  description: string;
  bannerImage: string;
  dateTime: string;
  venue: string;
  venueType: 'physical' | 'virtual';
  category: 'reunion' | 'webinar' | 'workshop';
  registrationLink?: string;
  capacity?: number;
  campusTag: string;
  published: boolean;
}

// Shared event card UI
function EventCard({
  event,
  formatDate,
  setRsvpEvent,
  setSelectedDetailEvent,
}: {
  event: Event;
  formatDate: (d: string) => string;
  setRsvpEvent: (e: Event) => void;
  setSelectedDetailEvent: (e: Event) => void;
}) {
  return (
    <div
      onClick={() => setSelectedDetailEvent(event)}
      className="bg-gradient-to-b from-white via-sky-50/20 to-white rounded-3xl border border-sky-100 shadow-md hover:shadow-xl hover:shadow-blue-900/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full overflow-hidden group relative cursor-pointer"
    >
      {/* Decorative top accent gradient bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#003D7A] via-sky-400 to-[#C41E3A]" />

      {/* Event Cover Photo */}
      <div className="relative h-44 md:h-48 w-full bg-slate-100 overflow-hidden flex-shrink-0">
        <img
          src={event.bannerImage}
          alt={event.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg border border-white/20 ${
          event.category === 'reunion' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
          event.category === 'webinar' ? 'bg-gradient-to-r from-[#003D7A] to-blue-600' : 'bg-gradient-to-r from-[#C41E3A] to-[#e62648]'
        }`}>
          ★ {event.category}
        </span>
        <span className="absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[11px] font-bold border border-white/20 shadow-md">
          📍 {event.campusTag}
        </span>
      </div>

      {/* Event Body */}
      <div className="p-5 md:p-6 flex flex-col flex-grow">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 text-[#C41E3A] border border-rose-200/60 font-extrabold text-xs tracking-wide mb-2.5 w-fit">
          <Calendar size={14} className="stroke-[2.5]" />
          {formatDate(event.dateTime)}
        </div>
        <h4 className="text-base md:text-lg font-black text-slate-900 mb-2 group-hover:text-[#003D7A] transition-colors leading-snug line-clamp-2">
          {event.title}
        </h4>
        <p className="text-slate-600 text-xs md:text-sm leading-relaxed mb-4 line-clamp-2 font-medium">
          {event.description}
        </p>

        {/* Location and Action Buttons */}
        <div className="mt-auto pt-4 border-t border-sky-100/80 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
              event.venueType === 'virtual' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {event.venueType}
            </span>
            <span className="truncate max-w-[170px] font-bold text-slate-700">📍 {event.venue}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDetailEvent(event);
              }}
              className="py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#003D7A] border border-sky-200/80 text-xs font-extrabold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Info size={13} /> Read Info
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRsvpEvent(event);
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#003D7A] to-[#012140] hover:from-[#C41E3A] hover:to-[#e62648] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer"
            >
              RSVP →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventsSection({ events }: { events: Event[] }) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'reunion' | 'webinar' | 'workshop'>('all');
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<Event | null>(null);
  const [rsvpEvent, setRsvpEvent] = useState<Event | null>(null);
  const [rsvpEmail, setRsvpEmail] = useState('');
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth * 0.75
        : scrollLeft + clientWidth * 0.75;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const filteredEvents = events.filter((event) => {
    if (!event.published) return false;
    if (selectedCategory === 'all') return true;
    return event.category === selectedCategory;
  });

  const [rsvpLoading, setRsvpLoading] = useState(false);

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName || !rsvpEmail || !rsvpEvent) return;

    setRsvpLoading(true);
    try {
      const res = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: rsvpEvent.id,
          eventTitle: rsvpEvent.title,
          name: rsvpName,
          email: rsvpEmail,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setRsvpSubmitted(true);
        toast.success(data.message || 'RSVP confirmed!');
        setTimeout(() => {
          setRsvpEvent(null);
          setRsvpSubmitted(false);
          setRsvpName('');
          setRsvpEmail('');
        }, 2000);
      } else {
        toast.error(data.error || 'Failed to submit RSVP');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error submitting RSVP');
    } finally {
      setRsvpLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section id="events" className="py-20 bg-gradient-to-b from-sky-50/80 via-blue-50/40 to-slate-50/60 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 border border-rose-200/80 rounded-full text-[#C41E3A] text-xs font-black uppercase tracking-widest mb-4 shadow-sm">
            ★ Upcoming Gatherings &amp; Webinars
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Alumni Events Calendar
          </h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-[#003D7A] via-sky-400 to-[#C41E3A] mx-auto rounded-full mb-4" />
          <div className="max-w-4xl mx-auto">
            <p className="text-slate-600 text-sm sm:text-base md:text-lg font-medium leading-relaxed">
              Connect with fellow graduates through university-wide reunions, expert webinars, interactive workshops, and campus meetups.
            </p>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 md:mb-14">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'reunion', label: 'Reunions' },
            { id: 'webinar', label: 'Webinars' },
            { id: 'workshop', label: 'Workshops' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-300 cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-gradient-to-r from-[#003D7A] to-[#012140] text-white shadow-lg shadow-blue-900/20 scale-105'
                  : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Card Layout */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-medium">
            No upcoming events listed in this category right now. Check back soon!
          </div>
        ) : (
          <>
            {/* ── MOBILE: Always 2-row horizontal scroll with always-visible buttons ── */}
            <div className="md:hidden relative">
              <div
                ref={scrollRef}
                className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto scroll-smooth scrollbar-none pb-4 -mx-4 px-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {filteredEvents.map((event) => (
                  <div key={event.id} className="w-[280px] flex-shrink-0">
                    <EventCard
                      event={event}
                      formatDate={formatDate}
                      setRsvpEvent={setRsvpEvent}
                      setSelectedDetailEvent={setSelectedDetailEvent}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ── DESKTOP: Grid or horizontal scroll based on count ── */}
            {filteredEvents.length > 6 ? (
              <div className="hidden md:block relative group/scroll px-1">
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-[#003D7A] hover:text-white text-slate-800 p-3 rounded-full shadow-xl border border-slate-100/80 z-20 opacity-0 group-hover/scroll:opacity-100 transition-all duration-300 hover:scale-110 flex items-center justify-center backdrop-blur-sm cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={20} className="stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => scroll('right')}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-[#003D7A] hover:text-white text-slate-800 p-3 rounded-full shadow-xl border border-slate-100/80 z-20 opacity-0 group-hover/scroll:opacity-100 transition-all duration-300 hover:scale-110 flex items-center justify-center backdrop-blur-sm cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={20} className="stroke-[2.5]" />
                </button>
                <div
                  ref={scrollRef}
                  className="grid grid-rows-2 grid-flow-col gap-6 md:gap-8 overflow-x-auto scroll-smooth scrollbar-none pb-6"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {filteredEvents.map((event) => (
                    <div key={event.id} className="w-[360px] flex-shrink-0">
                      <EventCard
                        event={event}
                        formatDate={formatDate}
                        setRsvpEvent={setRsvpEvent}
                        setSelectedDetailEvent={setSelectedDetailEvent}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    formatDate={formatDate}
                    setRsvpEvent={setRsvpEvent}
                    setSelectedDetailEvent={setSelectedDetailEvent}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── EVENT DETAILS MODAL ── */}
        {selectedDetailEvent && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-start justify-center z-[9999] pt-20 sm:pt-24 pb-8 px-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 relative my-auto max-h-[85vh] flex flex-col">
              {/* Dual-Layer Banner Header (No Cropping / No Zooming) */}
              <div className="relative h-56 sm:h-72 w-full bg-slate-950 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {/* Background Ambient Blur */}
                <img
                  src={selectedDetailEvent.bannerImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/20 pointer-events-none" />

                {/* Foreground Image - Complete Aspect Ratio with Object Contain */}
                <img
                  src={selectedDetailEvent.bannerImage}
                  alt={selectedDetailEvent.title}
                  className="relative z-10 w-full h-full object-contain p-2"
                />

                {/* Floating Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-20">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg border border-white/20 ${
                    selectedDetailEvent.category === 'reunion' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                    selectedDetailEvent.category === 'webinar' ? 'bg-gradient-to-r from-[#003D7A] to-blue-600' : 'bg-gradient-to-r from-[#C41E3A] to-[#e62648]'
                  }`}>
                    ★ {selectedDetailEvent.category}
                  </span>
                  <span className="bg-slate-900/85 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 shadow-md">
                    📍 {selectedDetailEvent.campusTag}
                  </span>
                </div>

                {/* Floating Close X Button */}
                <button
                  type="button"
                  onClick={() => setSelectedDetailEvent(null)}
                  className="absolute top-4 right-4 bg-slate-900/80 hover:bg-[#C41E3A] text-white p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all z-20 shadow-lg cursor-pointer"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content Scroll Area */}
              <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-grow text-slate-800">
                {/* Event Title */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight mb-1">
                    {selectedDetailEvent.title}
                  </h2>
                </div>

                {/* Event Meta Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-100 text-[#C41E3A] flex-shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date &amp; Time</p>
                      <p className="font-extrabold text-slate-900">{formatDate(selectedDetailEvent.dateTime)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 flex-shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Venue ({selectedDetailEvent.venueType})
                      </p>
                      <p className="font-extrabold text-slate-900 truncate">{selectedDetailEvent.venue}</p>
                    </div>
                  </div>
                </div>

                {/* Full Un-truncated Description */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#003D7A] mb-2 flex items-center gap-1.5">
                    <Info size={15} /> Event Overview &amp; Full Description
                  </h4>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
                    {selectedDetailEvent.description}
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedDetailEvent(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const ev = selectedDetailEvent;
                    setSelectedDetailEvent(null);
                    setRsvpEvent(ev);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#003D7A] to-[#012140] hover:from-[#C41E3A] hover:to-[#e62648] text-white font-extrabold text-xs shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                >
                  Register / RSVP Now →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RSVP Modal */}
        {rsvpEvent && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-start justify-center z-[9999] pt-20 sm:pt-24 pb-8 px-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all p-6 relative border border-slate-100 my-auto">
              <button
                onClick={() => setRsvpEvent(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {!rsvpSubmitted ? (
                <form onSubmit={handleRsvpSubmit}>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-2">Secure Your Spot</h3>
                  <p className="text-gray-500 text-xs mb-6">
                    Register for <span className="font-bold text-[#003D7A]">{rsvpEvent.title}</span>.
                  </p>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={rsvpName}
                        onChange={(e) => setRsvpName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003D7A]/25 focus:border-[#003D7A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email Address</label>
                      <input
                        type="email"
                        required
                        value={rsvpEmail}
                        onChange={(e) => setRsvpEmail(e.target.value)}
                        placeholder="john.doe@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003D7A]/25 focus:border-[#003D7A]"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={rsvpLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-[#003D7A] to-[#002b56] text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {rsvpLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting RSVP...</span>
                      </>
                    ) : (
                      'Submit RSVP'
                    )}
                  </button>
                </form>
              ) : (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-2">RSVP Successful!</h3>
                  <p className="text-gray-500 text-sm">
                    We have successfully captured your reservation. A confirmation email has been dispatched.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
