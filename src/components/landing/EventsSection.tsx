'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

export default function EventsSection({ events }: { events: Event[] }) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'reunion' | 'webinar' | 'workshop'>('all');
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

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName || !rsvpEmail) return;
    
    // Simulate API registration request
    console.log(`RSVP submitted for event ${rsvpEvent?.title} by ${rsvpName} (${rsvpEmail})`);
    setRsvpSubmitted(true);
    setTimeout(() => {
      setRsvpEvent(null);
      setRsvpSubmitted(false);
      setRsvpName('');
      setRsvpEmail('');
    }, 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section id="events" className="py-16 bg-gradient-to-b from-white via-slate-50/55 to-white scroll-mt-16">
      <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h3 className="text-xs font-extrabold text-[#C41E3A] uppercase tracking-widest mb-3">Get Involved</h3>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Upcoming Alumni Events</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] mx-auto rounded-full mb-4"></div>
          <p className="text-gray-600 max-w-2xl mx-auto font-medium">
            Reconnect in person or tune in virtually to expand your industry insights and mentor networks.
          </p>
          <div className="mt-5">
            <a
              href="https://ptu.ac.in/alumni/alumni-events"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C41E3A] hover:bg-[#003D7A] text-white hover:text-white text-xs font-bold transition-all duration-300 shadow-xs border border-slate-200"
            >
              <span>Previous Alumni Events</span>
              <span className="text-xs">↗</span>
            </a>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex justify-center gap-2 mb-12 flex-wrap">
          {(['all', 'reunion', 'webinar', 'workshop'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-300 ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#003D7A] to-[#002b56] text-white border-transparent shadow-md'
                  : 'bg-slate-50 text-gray-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Card Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-medium">
            No upcoming events listed in this category right now. Check back soon!
          </div>
        ) : filteredEvents.length > 6 ? (
          <div className="relative group/scroll px-1">
            {/* Scroll Buttons */}
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

            {/* Horizontal Scroll Grid (2 rows, col flow) */}
            <div
              ref={scrollRef}
              className="grid grid-rows-2 grid-flow-col gap-6 md:gap-8 overflow-x-auto scroll-smooth scrollbar-none pb-6 -mx-4 px-4 sm:mx-0 sm:px-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full w-[290px] md:w-[360px] flex-shrink-0"
                >
                  {/* Event Cover Photo */}
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={event.bannerImage}
                      alt={event.title}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                    />
                    <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white shadow-sm ${
                      event.category === 'reunion' ? 'bg-amber-500' :
                      event.category === 'webinar' ? 'bg-[#003D7A]' : 'bg-[#C41E3A]'
                    }`}>
                      {event.category}
                    </span>
                    <span className="absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-semibold">
                      📍 {event.campusTag}
                    </span>
                  </div>

                  {/* Event Body */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="text-[#C41E3A] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(event.dateTime)}
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3 hover:text-[#003D7A] transition-colors line-clamp-1">
                      {event.title}
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3">
                      {event.description}
                    </p>
                    
                    {/* Location and Info */}
                    <div className="mt-auto pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-2 mb-4 text-xs font-medium text-gray-500">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          event.venueType === 'virtual' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          {event.venueType}
                        </span>
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full w-full"
              >
                {/* Event Cover Photo */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={event.bannerImage}
                    alt={event.title}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                  <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white shadow-sm ${
                    event.category === 'reunion' ? 'bg-amber-500' :
                    event.category === 'webinar' ? 'bg-[#003D7A]' : 'bg-[#C41E3A]'
                  }`}>
                    {event.category}
                  </span>
                  <span className="absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-semibold">
                    📍 {event.campusTag}
                  </span>
                </div>

                {/* Event Body */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="text-[#C41E3A] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(event.dateTime)}
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3 hover:text-[#003D7A] transition-colors line-clamp-1">
                    {event.title}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3">
                    {event.description}
                  </p>
                  
                  {/* Location and Info */}
                  <div className="mt-auto pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-4 text-xs font-medium text-gray-500">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        event.venueType === 'virtual' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        {event.venueType}
                      </span>
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RSVP Modal */}
        {rsvpEvent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all p-6 relative border border-slate-100">
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
                    className="w-full py-3 bg-gradient-to-r from-[#003D7A] to-[#002b56] text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Submit RSVP
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
