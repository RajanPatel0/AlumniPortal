'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  photo: string;
  batch: string;
  quote: string;
  rating?: number;
  status: 'approved' | 'pending';
}

// Shared testimonial card
function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between relative h-full">
      <div className="absolute top-5 right-5 md:top-8 md:right-8 text-slate-100 text-5xl md:text-6xl font-serif select-none pointer-events-none">
        &ldquo;
      </div>
      <div className="mb-4 md:mb-6">
        {/* Rating */}
        {t.rating && (
          <div className="flex gap-1 mb-3 md:mb-4 text-amber-400">
            {Array.from({ length: t.rating }).map((_, i) => (
              <span key={i}>★</span>
            ))}
          </div>
        )}
        <p className="text-gray-650 italic text-xs md:text-sm leading-relaxed relative z-10">
          &quot;{t.quote}&quot;
        </p>
      </div>

      {/* Profile Card */}
      <div className="flex items-center gap-3 md:gap-4 pt-3 md:pt-4 border-t border-slate-50">
        <img
          src={t.photo}
          alt={t.name}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border border-slate-200 flex-shrink-0"
        />
        <div>
          <h4 className="text-sm font-bold text-gray-900">{t.name}</h4>
          <p className="text-xs text-gray-500 font-medium">Batch of {t.batch}</p>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection({ initialTestimonials }: { initialTestimonials: Testimonial[] }) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [name, setName] = useState('');
  const [batch, setBatch] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

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

  const approvedTestimonials = testimonials.filter((t) => t.status === 'approved');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !batch || !quote) return;

    const newTestimonial: Testimonial = {
      id: `temp-${Date.now()}`,
      name,
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      batch,
      quote,
      rating,
      status: 'pending',
    };

    setTestimonials((prev) => [...prev, newTestimonial]);
    setSubmitted(true);

    setTimeout(() => {
      setShowSubmitModal(false);
      setSubmitted(false);
      setName('');
      setBatch('');
      setQuote('');
      setRating(5);
    }, 2000);
  };

  return (
    <section id="testimonials" className="py-12 md:py-16 bg-gradient-to-b from-slate-50 via-slate-100/55 to-white scroll-mt-16">
      <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10 relative">
          <h3 className="text-xs font-extrabold text-[#C41E3A] uppercase tracking-widest mb-3">Words of Pride</h3>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Alumni Testimonials</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] mx-auto rounded-full mb-4" />
          <p className="text-gray-600 max-w-2xl mx-auto font-medium">
            Hear from our global alumni community about how their time at IKGPTU shaped their careers.
          </p>
        </div>

        {/* ── MOBILE: Always horizontal scroll with always-visible nav buttons ── */}
        <div className="md:hidden relative mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">{approvedTestimonials.length} testimonials</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="bg-white hover:bg-[#003D7A] hover:text-white text-slate-800 p-2 rounded-full shadow-md border border-slate-200 transition-all duration-200 flex items-center justify-center"
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} className="stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="bg-white hover:bg-[#003D7A] hover:text-white text-slate-800 p-2 rounded-full shadow-md border border-slate-200 transition-all duration-200 flex items-center justify-center"
                aria-label="Scroll right"
              >
                <ChevronRight size={16} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-none pb-4 -mx-4 px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {approvedTestimonials.map((t) => (
              <div key={t.id} className="w-[270px] flex-shrink-0">
                <TestimonialCard t={t} />
              </div>
            ))}
          </div>
        </div>

        {/* ── DESKTOP: Scroll if >4, otherwise grid ── */}
        {approvedTestimonials.length > 4 ? (
          <div className="hidden md:block relative group/scroll px-1 mb-12">
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
              {approvedTestimonials.map((t) => (
                <div key={t.id} className="w-[480px] flex-shrink-0">
                  <TestimonialCard t={t} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="hidden md:grid grid-cols-2 gap-8 mb-12">
            {approvedTestimonials.map((t) => (
              <TestimonialCard key={t.id} t={t} />
            ))}
          </div>
        )}

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#003D7A] to-[#002b56] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:shadow-lg transition-all duration-300"
          >
            Share Your Experience
          </button>
        </div>

        {/* Submit Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all p-6 relative border border-slate-100">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {!submitted ? (
                <form onSubmit={handleSubmit}>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-2">Write a Testimonial</h3>
                  <p className="text-gray-500 text-xs mb-6">
                    Submissions are moderated and will appear publicly once approved by admins.
                  </p>

                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Full Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#003D7A]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Graduation Batch</label>
                        <input
                          type="text"
                          required
                          value={batch}
                          onChange={(e) => setBatch(e.target.value)}
                          placeholder="e.g., 2015"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#003D7A]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Rating (1-5)</label>
                      <select
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#003D7A]/20"
                      >
                        <option value={5}>5 Stars (Excellent)</option>
                        <option value={4}>4 Stars (Good)</option>
                        <option value={3}>3 Stars (Average)</option>
                        <option value={2}>2 Stars (Fair)</option>
                        <option value={1}>1 Star (Poor)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Your Quote / Experience</label>
                      <textarea
                        required
                        rows={4}
                        value={quote}
                        onChange={(e) => setQuote(e.target.value)}
                        placeholder="Write your testimonial here..."
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#003D7A]/20 resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-[#003D7A] to-[#002b56] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Submit Testimonial
                  </button>
                </form>
              ) : (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-2">Thank You!</h3>
                  <p className="text-gray-500 text-sm">
                    Your testimonial has been submitted successfully and is pending administrative approval.
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
