'use client';

import { useState } from 'react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    
    // Simulate backend capture
    setTimeout(() => {
      console.log(`Newsletter captured: ${email} from Home Page at ${new Date().toISOString()}`);
      setStatus('success');
      setEmail('');
    }, 1500);
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
          <div className="bg-green-950/30 border border-green-800 text-green-400 p-4 rounded-xl max-w-md mx-auto animate-fade-in">
            <p className="text-sm font-semibold">✓ Subscription successful! Welcome aboard.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
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
        )}
      </div>
    </section>
  );
}
