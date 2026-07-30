'use client';

import { useState } from 'react';
import { subscribeToNewsletter } from '@/app/actions/newsletter';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await subscribeToNewsletter(email);
      if (res.success) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(res.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Failed to connect to the server.');
    }
  };

  return (
    <section className="py-10 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-950/10"></div>
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C41E3A] rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white mb-6">
          Stay Tuned
        </span>
        <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Stay Connected</h2>
        <p className="text-slate-350 text-sm md:text-base mb-10 max-w-xl mx-auto font-light leading-relaxed">
          Subscribe to our official newsletter. Get occasional notifications about mega fests, reunions, and key university milestones.
        </p>

        {status === 'success' ? (
          <div className="max-w-md mx-auto bg-slate-800/50 border border-emerald-500/30 rounded-2xl p-6 shadow-xl animate-fade-in backdrop-blur-sm">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-emerald-400 text-lg font-bold">✓</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mb-1">Subscription Successful!</h3>
            <p className="text-xs text-slate-350 leading-relaxed font-medium">
              Thank you for subscribing. You've been successfully added to our community newsletter.
            </p>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                disabled={status === 'loading'}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-grow px-5 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/40 focus:border-[#C41E3A] transition-all duration-300 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-3.5 bg-gradient-to-r from-[#C41E3A] to-[#e62648] text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 text-sm whitespace-nowrap disabled:opacity-50"
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            {status === 'error' && (
              <p className="text-xs text-rose-400 mt-2.5 text-left font-semibold">{message}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
