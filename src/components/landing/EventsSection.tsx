'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Info, X, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface Event {
  id: string;
  title: string;
  description: string;
  bannerImage: string;
  dateTime: string;
  venue: string;
  venueType: 'physical' | 'virtual';
  category: string;
  registrationLink?: string;
  capacity?: number;
  campusTag: string;
  published: boolean;
}

// Countdown timer component for closest next event
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ d, h, m, s });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3 my-4 sm:my-5">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white flex items-center justify-center shadow-md rounded-sm">
        <span className="text-base sm:text-xl font-bold text-[#1B2E3C]">{timeLeft.d}d</span>
      </div>
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white flex items-center justify-center shadow-md rounded-sm">
        <span className="text-base sm:text-xl font-bold text-[#1B2E3C]">{timeLeft.h}h</span>
      </div>
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white flex items-center justify-center shadow-md rounded-sm">
        <span className="text-base sm:text-xl font-bold text-[#1B2E3C]">{timeLeft.m}m</span>
      </div>
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white flex items-center justify-center shadow-md rounded-sm">
        <span className="text-base sm:text-xl font-bold text-[#1B2E3C]">{timeLeft.s}s</span>
      </div>
    </div>
  );
}

function parseDateBox(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { dayMonth: '01 Jan', year: '2026' };
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return { dayMonth: `${day} ${month}`, year: String(year) };
  } catch {
    return { dayMonth: '01 Jan', year: '2026' };
  }
}

export default function EventsSection({ events }: { events: Event[] }) {
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<Event | null>(null);
  const [rsvpEvent, setRsvpEvent] = useState<Event | null>(null);
  const [rsvpEmail, setRsvpEmail] = useState('');
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

  // Sort events strictly: Closest upcoming event FIRST
  const sortedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    const now = new Date().getTime();

    return [...events]
      .filter((e) => e.published !== false)
      .sort((a, b) => {
        const aTime = new Date(a.dateTime).getTime();
        const bTime = new Date(b.dateTime).getTime();
        const aIsFuture = aTime >= now;
        const bIsFuture = bTime >= now;

        if (aIsFuture && !bIsFuture) return -1;
        if (!aIsFuture && bIsFuture) return 1;
        if (aIsFuture && bIsFuture) return aTime - bTime; // closest upcoming first
        return bTime - aTime; // recent past first
      });
  }, [events]);

  const closestNextEvent = sortedEvents.length > 0 ? sortedEvents[0] : null;

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

  const formatDateFull = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section id="events" className="py-12 sm:py-16 md:py-24 bg-[#FAF7F2] text-[#1A2B38] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid: Left Event List, Right Featured Next Event Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-start">
          
          {/* LEFT COLUMN: Section Header & Sorted Upcoming Events */}
          <div className="lg:col-span-7 flex flex-col justify-start">
            
            {/* Header matching screenshot design */}
            <div className="mb-6 sm:mb-8">
              <span className="text-[#8C2D19] font-medium text-xs sm:text-sm md:text-base tracking-wide block mb-1">
                Events
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A2B38] tracking-tight">
                Upcoming events
              </h2>
            </div>

            {/* Event List Box: Displays exactly 3 items at once, scrollable if more */}
            {sortedEvents.length === 0 ? (
              <div className="p-6 sm:p-8 bg-stone-100/60 rounded-md text-stone-500 text-sm">
                No upcoming events listed at the moment. Please check back soon!
              </div>
            ) : (
              <div className="relative">
                <div className="max-h-[480px] sm:max-h-[540px] overflow-y-auto pr-2 space-y-4 sm:space-y-6 [scrollbar-width:thin] [scrollbar-color:#d6d3d1_transparent]">
                  {sortedEvents.map((event, idx) => {
                    const { dayMonth, year } = parseDateBox(event.dateTime);
                    // Alternating date box background color: navy vs rust brown
                    const boxBg = idx % 2 === 0 ? 'bg-[#1B2E3C]' : 'bg-[#8C2D19]';

                    return (
                      <div
                        key={event.id}
                        className="flex flex-row items-start gap-3.5 sm:gap-6 pb-4 sm:pb-6 border-b border-stone-200/80 last:border-none group"
                      >
                        {/* Left Date Box */}
                        <div
                          className={`w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 flex flex-col items-center justify-center text-white ${boxBg} rounded-none shadow-sm transition-transform duration-300 group-hover:scale-105`}
                        >
                          <span className="text-xs sm:text-lg font-bold tracking-tight text-center px-1 leading-tight">
                            {dayMonth}
                          </span>
                          <span className="text-[10px] sm:text-sm font-semibold opacity-90 mt-0.5 sm:mt-1">
                            {year}
                          </span>
                        </div>

                        {/* Right Details */}
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] sm:text-sm font-medium text-[#8C2D19] tracking-wide block mb-0.5 sm:mb-1">
                            {event.category || 'Conference'}
                          </span>
                          <h3
                            onClick={() => setSelectedDetailEvent(event)}
                            className="text-base sm:text-xl md:text-2xl font-bold text-[#1A2B38] leading-snug hover:text-[#8C2D19] cursor-pointer transition-colors mb-1 sm:mb-2 line-clamp-2"
                          >
                            {event.title}
                          </h3>
                          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-3 line-clamp-2">
                            {event.description}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedDetailEvent(event)}
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1A2B38] hover:text-[#8C2D19] cursor-pointer transition-colors group/btn"
                          >
                            <span>Find out more</span>
                            <span className="transform group-hover/btn:translate-x-1 transition-transform">→</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Featured Next Event Card with Live Countdown */}
          {closestNextEvent && (
            <div className="lg:col-span-5 w-full mt-6 lg:mt-0">
              <div className="bg-[#1B2E3C] p-5 sm:p-8 text-white rounded-none shadow-xl flex flex-col items-center text-center">
                
                {/* Event Image */}
                <div className="w-full h-40 sm:h-56 bg-slate-900 rounded-none overflow-hidden relative mb-4 sm:mb-6 shadow-md">
                  <img
                    src={closestNextEvent.bannerImage}
                    alt={closestNextEvent.title}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>

                {/* Card Subheading */}
                <h4 className="text-white text-sm sm:text-lg font-normal tracking-wide mb-1">
                  Next Event
                </h4>
                <p className="text-stone-200 text-xs sm:text-sm font-semibold mb-2 line-clamp-1 max-w-sm">
                  {closestNextEvent.title}
                </p>

                {/* Live Countdown Timer (White Boxes) */}
                <CountdownTimer targetDate={closestNextEvent.dateTime} />

                {/* CTA Button */}
                <button
                  type="button"
                  onClick={() => setRsvpEvent(closestNextEvent)}
                  className="mt-1 sm:mt-2 py-2.5 sm:py-3 px-6 sm:px-8 bg-[#8C2D19] hover:bg-[#a6351f] text-white font-bold text-xs sm:text-base rounded-none transition-all duration-300 shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Book now</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ── EVENT DETAILS MODAL ── */}
        {selectedDetailEvent && (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-stone-200 relative my-auto max-h-[90vh] flex flex-col">
              
              {/* Modal Header Image */}
              <div className="relative h-48 sm:h-64 w-full bg-slate-900 flex-shrink-0">
                <img
                  src={selectedDetailEvent.bannerImage}
                  alt={selectedDetailEvent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/30" />
                
                <span className="absolute top-4 left-4 bg-[#8C2D19] text-white text-xs font-bold px-3 py-1 rounded-sm shadow-md">
                  {selectedDetailEvent.category || 'Conference'}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedDetailEvent(null)}
                  className="absolute top-4 right-4 bg-slate-950/70 hover:bg-[#8C2D19] text-white p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl sm:text-2xl font-bold leading-snug drop-shadow-md">
                    {selectedDetailEvent.title}
                  </h3>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-[#1A2B38] flex-grow">
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-stone-600 bg-stone-50 p-4 rounded-lg border border-stone-200/60">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[#8C2D19]" />
                    <span>{formatDateFull(selectedDetailEvent.dateTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-[#8C2D19]" />
                    <span>{selectedDetailEvent.venue}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C2D19] mb-2">
                    Event Overview
                  </h4>
                  <p className="text-stone-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {selectedDetailEvent.description}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedDetailEvent(null)}
                  className="px-5 py-2.5 rounded-sm border border-stone-300 text-stone-700 font-semibold text-xs sm:text-sm hover:bg-stone-200 transition cursor-pointer"
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
                  className="px-6 py-2.5 rounded-sm bg-[#8C2D19] hover:bg-[#a6351f] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>Book Now</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── RSVP / BOOKING MODAL ── */}
        {rsvpEvent && (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden p-6 relative border border-stone-200 my-auto">
              
              <button
                type="button"
                onClick={() => setRsvpEvent(null)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              {!rsvpSubmitted ? (
                <form onSubmit={handleRsvpSubmit}>
                  <span className="text-[#8C2D19] text-xs font-bold uppercase tracking-wider block mb-1">
                    Event Registration
                  </span>
                  <h3 className="text-xl font-bold text-[#1A2B38] mb-2">Book Your Ticket</h3>
                  <p className="text-stone-500 text-xs mb-6">
                    Reserving spot for <span className="font-semibold text-[#1A2B38]">{rsvpEvent.title}</span>
                  </p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={rsvpName}
                        onChange={(e) => setRsvpName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-2.5 rounded-sm border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2D19]/25 focus:border-[#8C2D19]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={rsvpEmail}
                        onChange={(e) => setRsvpEmail(e.target.value)}
                        placeholder="john.doe@example.com"
                        className="w-full px-4 py-2.5 rounded-sm border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2D19]/25 focus:border-[#8C2D19]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={rsvpLoading}
                    className="w-full py-3 bg-[#8C2D19] hover:bg-[#a6351f] text-white font-bold rounded-sm text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {rsvpLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Confirming Reservation...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Booking</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="py-8 text-center">
                  <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-[#1A2B38] mb-2">Booking Confirmed!</h3>
                  <p className="text-stone-600 text-sm">
                    Your spot has been reserved. Check your email for event confirmation details.
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
