'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      setOtpToken(data.otpToken)
      setStep('verify')
      setSuccess('OTP sent to your email. Please check.')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, otpToken }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      setSuccess('Email verified! You can now login.')
      setTimeout(() => router.push('/admin/auth/login'), 1800)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#012140] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-8 h-56 w-56 rounded-full bg-[#d61c1c]/25 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute -right-16 bottom-8 h-64 w-64 rounded-full bg-white/10 blur-3xl sm:h-80 sm:w-80" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/15 bg-white shadow-2xl lg:grid-cols-2">
          <div className="relative hidden bg-[#012140] p-8 text-white lg:block xl:p-10">
            <div className="absolute -right-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-[#d61c1c]/35 blur-3xl" />
            <div className="relative z-10">
              <p className="text-sm uppercase tracking-[0.2em] text-white/80">Admin Portal</p>
              <h1 className="mt-4 text-3xl font-bold leading-tight">
                PTU Alumni
                <span className="block text-[#ffd5d5]">Staff Registration</span>
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">
                Create your admin account with secure email verification to access the management dashboard.
              </p>

              <div className="mt-10 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">1</span>
                  Fill in your name, email and password
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">2</span>
                  Verify the OTP sent to your email
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">3</span>
                  Login and manage the portal
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 md:p-10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#012140]/70">Secure Onboarding</p>
                <h2 className="mt-2 text-2xl font-bold text-[#012140]">
                  {step === 'register' ? 'Register Admin Account' : 'Verify OTP'}
                </h2>
              </div>
              <span className="rounded-full bg-[#d61c1c]/10 px-3 py-1 text-xs font-semibold text-[#d61c1c]">
                {step === 'register' ? 'Step 1/2' : 'Step 2/2'}
              </span>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-[#d61c1c]/20 bg-[#d61c1c]/10 px-4 py-3 text-sm text-[#9f1414]">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            {step === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#012140]">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#012140] focus:ring-4 focus:ring-[#012140]/15"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#012140]">Email Address</label>
                  <input
                    type="email"
                    placeholder="admin@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#012140] focus:ring-4 focus:ring-[#012140]/15"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#012140]">Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#012140] focus:ring-4 focus:ring-[#012140]/15"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full cursor-pointer rounded-xl bg-[#d61c1c] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#d61c1c]/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#b31616] hover:shadow-xl hover:shadow-[#d61c1c]/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? 'Sending OTP...' : 'Register & Send OTP'}
                </button>

                <p className="text-center text-xs text-slate-500">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/admin/auth/login')}
                    className="cursor-pointer font-semibold text-[#012140] underline decoration-[#012140]/40 underline-offset-2 transition hover:text-[#d61c1c]"
                  >
                    Go to login
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#012140]">One-Time Password (OTP)</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-center text-base tracking-[0.3em] text-slate-900 outline-none transition duration-200 placeholder:tracking-normal focus:border-[#012140] focus:ring-4 focus:ring-[#012140]/15"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full cursor-pointer rounded-xl bg-[#012140] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#012140]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#001731] hover:shadow-xl hover:shadow-[#012140]/25 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('register')
                    setOtp('')
                    setError('')
                    setSuccess('')
                  }}
                  className="w-full cursor-pointer rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition duration-200 hover:border-[#012140] hover:bg-slate-50 hover:text-[#012140]"
                >
                  Edit registration details
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}