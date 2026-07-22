'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch, BASE_PATH } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/alumni/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setError(data.error || 'Too many requests. Please try again later.');
        return;
      }

      // Show generic success for any other response — never reveal account existence
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">
      {/* Nav */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group transition-transform duration-200 active:scale-95">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-900/10 tracking-wider overflow-hidden">
              <img src={`${BASE_PATH}/icon.png`} alt="logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none mb-1 group-hover:text-[#003D7A] transition-colors">
                IKGPTU Alumni
              </h1>
              <p className="text-xs font-medium text-[#C41E3A] tracking-widest uppercase">Portal</p>
            </div>
          </Link>
          <Link
            href="/alumni/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#003D7A] transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Login
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-gradient-to-br from-slate-50 via-[#003D7A]/5 to-[#C41E3A]/5">
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#003D7A]/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#C41E3A]/5 rounded-full blur-3xl -z-10" />

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-8 md:p-10 relative z-10 my-auto">
          {submitted ? (
            /* Success state */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Check your email</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                If an account with <strong className="text-gray-700">{email}</strong> exists in our system, we have sent a password reset link to that address. The link expires in 30 minutes.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                Didn't receive it? Check your spam folder, or wait a few minutes and try again.
              </p>
              <Link
                href="/alumni/login"
                className="inline-block w-full py-3 bg-[#003D7A] text-white rounded-xl font-bold text-sm hover:bg-[#002654] transition text-center"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-[#003D7A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-[#003D7A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Forgot your password?</h2>
                <p className="text-sm font-medium text-gray-500">
                  Enter your registered email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-[#C41E3A] text-red-800 p-4 rounded-xl text-sm mb-6 font-medium leading-relaxed shadow-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-[#003D7A]/10 transition font-medium text-sm text-gray-900 placeholder:text-gray-400"
                    placeholder="name@alumni.ptu.ac.in"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#003D7A] to-[#002b56] text-white font-bold py-3.5 rounded-xl hover:from-[#C41E3A] hover:to-[#a01830] hover:shadow-lg shadow-blue-900/10 transition-all duration-300 disabled:opacity-50 text-sm tracking-wide transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {loading ? 'Sending reset link...' : 'Send Reset Link'}
                </button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-6">
                Remembered your password?{' '}
                <Link href="/alumni/login" className="font-bold text-[#003D7A] hover:text-[#C41E3A] transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
