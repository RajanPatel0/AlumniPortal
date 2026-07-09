'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

type InvitedAlumni = {
  id: string;
  name: string;
  batchYear: number;
  branch: string;
  college: string;
  email: string;
  course?: string | null;
  campus?: { id: string; name: string } | null;
};

export default function AlumniLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get('error');
  const inviteToken = searchParams.get('token');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [invitedAlumni, setInvitedAlumni] = useState<InvitedAlumni | null>(null);
  const [tokenLoading, setTokenLoading] = useState(!!inviteToken);
  const [tokenError, setTokenError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isInviteSetup = !!inviteToken && !!invitedAlumni;

  useEffect(() => {
    if (!inviteToken) return;

    setTokenLoading(true);
    setTokenError('');
    fetch(`/api/alumni/verify-token?token=${encodeURIComponent(inviteToken)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.valid) {
          setTokenError(data.error || 'Invalid or expired invitation link');
          return;
        }
        setInvitedAlumni(data.alumni);
        setFormData((prev) => ({ ...prev, email: data.alumni.email || '' }));
      })
      .catch(() => setTokenError('Failed to verify invitation link'))
      .finally(() => setTokenLoading(false));
  }, [inviteToken]);

  const handleOAuthSignIn = (provider: string) => {
    if (inviteToken) {
      document.cookie = `invite_token=${encodeURIComponent(inviteToken)}; path=/; max-age=3600; SameSite=Lax`;
    }
    const callbackUrl = inviteToken
      ? `/alumni/oauth-success?token=${encodeURIComponent(inviteToken)}`
      : '/alumni/oauth-success';
    signIn(provider, { callbackUrl });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isInviteSetup) {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);

    try {
      if (isInviteSetup) {
        const res = await fetch('/api/alumni/register-manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: inviteToken,
            email: formData.email,
            name: invitedAlumni?.name,
            password: formData.password,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Account setup failed');
          setLoading(false);
          return;
        }
        router.push('/alumni/feed');
        return;
      }

      const res = await fetch('/api/alumni/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      router.push('/alumni/feed');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#C41E3A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Verifying your invitation...</p>
        </div>
      </div>
    );
  }

  if (inviteToken && tokenError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">!</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{tokenError}</p>
          <Link
            href="/alumni/login"
            className="inline-block w-full py-3 bg-[#003D7A] text-white rounded-xl font-semibold hover:bg-[#002654] transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">
      <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group transition-transform duration-200 active:scale-95">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-900/10 tracking-wider">
              <img src="/icon.png" alt="logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none mb-1 group-hover:text-[#003D7A] transition-colors">
                IKGPTU Alumni
              </h1>
              <p className="text-xs font-medium text-[#C41E3A] tracking-widest uppercase">Portal</p>
            </div>
          </Link>

          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#003D7A] transition-colors px-3 py-2 rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-gradient-to-br from-slate-50 via-[#003D7A]/5 to-[#C41E3A]/5">
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#003D7A]/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#C41E3A]/5 rounded-full blur-3xl -z-10"></div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-8 md:p-10 relative z-10 my-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
              {isInviteSetup ? 'Complete Your Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm font-medium text-gray-500">
              {isInviteSetup
                ? 'Your alumni profile is ready — set a password or use SSO to sign in'
                : 'Sign in to sync with your campus network'}
            </p>
          </div>

          {isInviteSetup && invitedAlumni && (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm">
              <p className="font-bold text-[#003D7A]">{invitedAlumni.name}</p>
              <p className="text-gray-600 mt-1">Batch {invitedAlumni.batchYear} · {invitedAlumni.branch}</p>
              <p className="text-gray-500">{invitedAlumni.college}</p>
              {invitedAlumni.campus?.name && (
                <p className="text-gray-500 mt-1">Campus: {invitedAlumni.campus.name}</p>
              )}
            </div>
          )}

          {(oauthError || error) && (
            <div className="bg-red-50 border-l-4 border-[#C41E3A] text-red-800 p-4 rounded-xl text-sm mb-6 font-medium leading-relaxed shadow-sm">
              {oauthError === 'oauth_failed'
                ? 'Authentication gateway failed. Please ensure your provider profile matches your registered details or use password sign-in.'
                : oauthError === 'login_required'
                  ? 'Access Denied. Please authenticate to step into the dashboard environment.'
                  : oauthError === 'session_expired'
                    ? 'Security context expired. Please re-authenticate your workspace.'
                    : oauthError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 mb-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                readOnly={isInviteSetup}
                className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-[#003D7A]/10 transition font-medium text-sm text-gray-900 placeholder:text-gray-400 ${isInviteSetup ? 'opacity-80 cursor-not-allowed' : ''}`}
                placeholder="name@alumni.ptu.ac.in"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  {isInviteSetup ? 'Create Password' : 'Password'}
                </label>
                {!isInviteSetup && (
                  <a href="#" className="text-xs font-bold text-[#003D7A] hover:text-[#C41E3A] transition-colors">Forgot?</a>
                )}
              </div>
              <input
                type="password"
                required
                minLength={isInviteSetup ? 6 : undefined}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-[#003D7A]/10 transition font-medium text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="••••••••"
              />
            </div>

            {isInviteSetup && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-[#003D7A]/10 transition font-medium text-sm text-gray-900 placeholder:text-gray-400"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#003D7A] to-[#002b56] text-white font-bold py-3.5 rounded-xl hover:from-[#C41E3A] hover:to-[#a01830] hover:shadow-lg shadow-blue-900/10 transition-all duration-300 disabled:opacity-50 text-sm tracking-wide transform hover:-translate-y-0.5"
            >
              {loading
                ? isInviteSetup ? 'Setting up account...' : 'Authenticating Workspace...'
                : isInviteSetup ? 'Create Password & Sign In' : 'Secure Sign In'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
              <span className="bg-white px-3 text-slate-400">Institutional SSO</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => handleOAuthSignIn('google')}
              className="flex items-center justify-center gap-2.5 border border-slate-200 bg-white py-2.5 rounded-xl hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold shadow-sm transition-all duration-200 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
                <path fill="#4285F4" d="M16.04 15.345c-1.077.733-2.415 1.164-4.04 1.164a7.076 7.076 0 01-6.734-4.855L3.24 14.77C5.197 18.72 9.27 21.41 12 21.41c2.935 0 5.626-1.037 7.636-2.882l-3.596-3.183z"/>
                <path fill="#FBBC05" d="M5.266 11.655a7.03 7.03 0 010-2.31L1.24 6.23a11.934 11.934 0 000 8.54l4.026-3.115z"/>
                <path fill="#34A853" d="M23.49 12.275c0-.646-.057-1.3-.17-1.927H12v3.655h6.463a5.53 5.53 0 01-2.4 3.633l3.596 3.183c2.1-1.937 3.83-4.79 3.83-8.544z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignIn('linkedin')}
              className="flex items-center justify-center gap-2.5 border border-slate-200 bg-white py-2.5 rounded-xl hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold shadow-sm transition-all duration-200 active:scale-[0.98]"
            >
              <svg className="w-4 h-4 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9H7.12v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zm15.11 13.02h-3.56v-5.6c0-1.34-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.7H9.33V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z"/>
              </svg>
              LinkedIn
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-400 font-medium leading-relaxed max-w-xs mx-auto mb-6">
            {isInviteSetup
              ? 'Use Google or LinkedIn to link your account — your profile data is already on file.'
              : 'Single-sign-on connects instantly if matching accounts are tied to your primary profile database.'}
          </p>

          {!isInviteSetup && (
            <div className="text-center border-t border-slate-100 pt-5">
              <p className="text-slate-600 text-xs font-semibold">
                Don&apos;t have an account?{' '}
                <Link href="/alumni/register" className="text-[#003D7A] hover:text-[#C41E3A] font-bold transition-colors ml-1">
                  Register here
                </Link>
              </p>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-50">
            <p className="text-[11px] text-slate-400 text-center font-medium">
              {isInviteSetup
                ? 'You were invited by your campus admin. Complete setup above to access the alumni portal.'
                : 'Received an invitation email? Open the link in that email to set up your account.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
