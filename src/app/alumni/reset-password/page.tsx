'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch, BASE_PATH } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No reset token found. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/alumni/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => router.push('/alumni/login'), 3000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getStrength = () => {
    if (!newPassword) return { level: 0, label: '', color: '' };
    if (newPassword.length < 6) return { level: 1, label: 'Too short', color: 'bg-red-400' };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    if (score <= 1) return { level: 2, label: 'Weak', color: 'bg-orange-400' };
    if (score === 2) return { level: 3, label: 'Fair', color: 'bg-yellow-400' };
    if (score === 3) return { level: 4, label: 'Strong', color: 'bg-emerald-400' };
    return { level: 5, label: 'Very strong', color: 'bg-green-500' };
  };

  const strength = getStrength();

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-8 md:p-10 relative z-10 my-auto">
      {success ? (
        /* Success state */
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Password updated!</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Your password has been reset successfully. You will be redirected to the sign-in page in a moment.
          </p>
          <Link
            href="/alumni/login"
            className="inline-block w-full py-3 bg-[#003D7A] text-white rounded-xl font-bold text-sm hover:bg-[#002654] transition text-center"
          >
            Go to Sign In
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#003D7A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#003D7A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Set a new password</h2>
            <p className="text-sm font-medium text-gray-500">
              Choose a strong password you haven't used before.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-[#C41E3A] text-red-800 p-4 rounded-xl text-sm mb-6 font-medium leading-relaxed shadow-sm">
              {error}
              {!token && (
                <Link href="/alumni/forgot-password" className="block mt-2 underline font-bold text-[#C41E3A] hover:text-red-900">
                  Request a new reset link →
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={!token}
                  className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-[#003D7A]/10 transition font-medium text-sm text-gray-900 placeholder:text-gray-400 disabled:opacity-50"
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                >
                  {showNew ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Strength meter */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!token}
                  className={`w-full px-4 py-3 pr-12 bg-slate-50 border rounded-xl focus:outline-none focus:bg-white focus:ring-4 transition font-medium text-sm text-gray-900 placeholder:text-gray-400 disabled:opacity-50 ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-slate-200 focus:border-[#003D7A] focus:ring-[#003D7A]/10'
                  }`}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-gradient-to-r from-[#003D7A] to-[#002b56] text-white font-bold py-3.5 rounded-xl hover:from-[#C41E3A] hover:to-[#a01830] hover:shadow-lg shadow-blue-900/10 transition-all duration-300 disabled:opacity-50 text-sm tracking-wide transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Updating password...' : 'Set New Password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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

        <Suspense fallback={
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-10 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#003D7A] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
