'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      setSuccess('Login successful. Redirecting to dashboard...')
      setTimeout(() => {
        router.push('/admin/dashboard')
        router.refresh()
      }, 800)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#012140] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-12 top-8 h-56 w-56 rounded-full bg-[#d61c1c]/25 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute -right-16 bottom-6 h-64 w-64 rounded-full bg-white/10 blur-3xl sm:h-80 sm:w-80" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/15 bg-white shadow-2xl lg:grid-cols-2">
          <div className="relative hidden bg-[#012140] p-8 text-white lg:block xl:p-10">
            <div className="absolute -right-14 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-[#d61c1c]/35 blur-3xl" />
            <div className="relative z-10">
              <p className="text-sm uppercase tracking-[0.2em] text-white/80">Admin/Sub-Admin Portal</p>
              <h1 className="mt-4 text-3xl font-bold leading-tight">
                Welcome Back
                <span className="block text-[#ffd5d5]">PTU Staff !</span>
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">
                Login securely with your verified admin credentials to access the alumni management dashboard.
              </p>

              <div className="mt-10 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">1</span>
                  Enter your registered admin email
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">2</span>
                  Provide your account password
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">3</span>
                  Access dashboard with secure session cookies
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 md:p-10">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#012140]/70">Secure Access</p>
              <h2 className="mt-2 text-2xl font-bold text-[#012140]">Admin/Sub-Admin Login</h2>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-[#d61c1c]/20 bg-[#d61c1c]/10 px-4 py-3">
                <p className="text-sm text-[#9f1414]">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-sm text-emerald-700">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#012140]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@university.edu"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#012140] focus:ring-4 focus:ring-[#012140]/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#012140]">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#012140] focus:ring-4 focus:ring-[#012140]/15"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full cursor-pointer rounded-xl bg-[#d61c1c] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#d61c1c]/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#b31616] hover:shadow-xl hover:shadow-[#d61c1c]/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? 'Signing in...' : 'Sign in to Dashboard'}
              </button>

              <p className="text-center text-xs text-slate-500">
                New admin?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/admin/auth/register')}
                  className="cursor-pointer font-semibold text-[#012140] underline decoration-[#012140]/40 underline-offset-2 transition hover:text-[#d61c1c]"
                >
                  Register & verify email
                </button>
              </p>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Only verified admin accounts can login.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}