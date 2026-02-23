'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isNUSEmail = (e: string) =>
    e.endsWith('@u.nus.edu') || e.endsWith('@nus.edu.sg')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!isNUSEmail(email)) {
      setError('Please use your NUS email (@u.nus.edu or @nus.edu.sg). Other emails require manual whitelisting by David.')
      return
    }

    setLoading(true)
    try {
      // TODO: hook up Supabase magic link
      // const { error } = await supabase.auth.signInWithOtp({ email })
      // if (error) throw error
      setSent(true)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">🏥</span>
            <span className="font-black text-2xl">MedQuest</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Sign in to your account</h1>
          <p className="text-slate-400 mt-2 text-sm">
            NUS email only. We'll send you a magic link — no password needed.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  University Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e0123456@u.nus.edu"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600 transition-colors"
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {loading ? 'Sending...' : 'Send Magic Link →'}
              </button>

              <p className="text-center text-xs text-slate-500">
                Don't have an NUS email?{' '}
                <a href="mailto:david@medquest.app" className="text-blue-400 hover:underline">
                  Request access
                </a>
              </p>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="text-xl font-bold mb-2">Check your email</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                We sent a magic link to <strong className="text-white">{email}</strong>.
                Click the link to sign in — it expires in 10 minutes.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm text-blue-400 hover:underline"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Free forever · Built for YLL M1 · Not affiliated with NUS
        </p>
      </div>
    </main>
  )
}
