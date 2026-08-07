'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2, UserCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Testimonial {
  id: string;
  name: string;
  photo: string;
  batch: string;
  company?: string;
  designation?: string;
  linkedIn?: string;
  quote: string;
  rating?: number;
  status: 'approved' | 'pending';
}

// Shared testimonial card
function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="bg-gradient-to-b from-white via-sky-50/25 to-white p-6 md:p-8 rounded-3xl shadow-md hover:shadow-xl border border-sky-100/90 hover:border-sky-300/80 flex flex-col justify-between relative h-full group transition-all duration-300">
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-[#003D7A] via-sky-400 to-[#C41E3A] rounded-b-full opacity-70 group-hover:opacity-100 transition-opacity" />

      <div className="absolute top-6 right-6 text-sky-200/70 group-hover:text-sky-300/90 transition-colors text-5xl md:text-6xl font-serif select-none pointer-events-none">
        &ldquo;
      </div>
      <div className="mb-4 md:mb-6 pt-2">
        {/* Rating */}
        {t.rating && (
          <div className="flex gap-1 mb-3 text-amber-400 text-sm font-bold">
            {Array.from({ length: t.rating }).map((_, i) => (
              <span key={i}>★</span>
            ))}
          </div>
        )}
        <p className="text-slate-800 italic text-xs md:text-sm leading-relaxed relative z-10 font-medium">
          &quot;{t.quote}&quot;
        </p>
      </div>

      {/* Profile Card */}
      <div className="flex items-center gap-3.5 md:gap-4 pt-4 border-t border-sky-100/80">
        {t.photo ? (
          <img
            src={t.photo}
            alt={t.name}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-sky-400/40 shadow-md flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#003D7A] to-[#012140] text-white flex items-center justify-center border-2 border-sky-400/40 shadow-md flex-shrink-0">
            <UserCircle size={36} className="text-sky-200" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm md:text-base font-bold text-gray-900 truncate">{t.name}</h4>
          <p className="text-xs text-slate-500 font-semibold mb-1">Batch of {t.batch}</p>
          {(t.designation || t.company) && (
            <div className="inline-block bg-sky-50 text-[#003D7A] border border-sky-200/80 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold max-w-full truncate">
              {t.designation}{t.designation && t.company ? ' @ ' : ''}{t.company}
            </div>
          )}
          {t.linkedIn && (
            <a
              href={t.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-extrabold text-[#003D7A] hover:text-[#C41E3A] hover:underline flex items-center gap-1 mt-1.5 transition-colors"
            >
              LinkedIn Profile ↗
            </a>
          )}
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

  const [submitLoading, setSubmitLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !batch || !quote) return;

    setSubmitLoading(true);
    try {
      const res = await fetch('/api/testimonials/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          batch,
          quote,
          rating,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        toast.success('Testimonial submitted for admin approval!');
        setTimeout(() => {
          setShowSubmitModal(false);
          setSubmitted(false);
          setName('');
          setBatch('');
          setQuote('');
          setRating(5);
        }, 2000);
      } else {
        toast.error(data.error || 'Failed to submit testimonial');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error submitting testimonial');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <section id="testimonials" className="py-14 md:py-18 bg-gradient-to-b from-slate-50/60 via-sky-50/70 to-blue-50/30 scroll-mt-16 border-b border-sky-100/60">
      <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10 relative">
          <h3 className="text-xs font-extrabold text-[#C41E3A] uppercase tracking-widest mb-3">Words of Pride</h3>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">Alumni Testimonials</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] mx-auto rounded-full mb-4" />
          <p className="text-slate-600 max-w-4xl mx-auto text-xs sm:text-sm md:text-base font-medium leading-relaxed">
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
                    disabled={submitLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-[#003D7A] to-[#002b56] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Testimonial...</span>
                      </>
                    ) : (
                      'Submit Testimonial'
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
