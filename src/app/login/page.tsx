'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isAllowedEmail = (e: string) =>
    e.endsWith('@u.nus.edu') || e.endsWith('@nus.edu.sg') || e.endsWith('@comp.nus.edu.sg')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!isAllowedEmail(email)) {
      setError('Please use your NUS email (@u.nus.edu). Contact David for manual whitelisting if you need access with a different email.')
      return
    }

    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({ 
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      })
      if (authError) throw authError
      setSent(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Try again in a moment.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <span className="text-3xl group-hover:scale-110 transition-transform">🏥</span>
            <span className="font-black text-2xl tracking-tight">MedQuest</span>
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">YLL</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Welcome back, future doctor</h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            Sign in with your NUS email. No password needed — we'll send a magic link.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  NUS Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e0123456@u.nus.edu"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-600 transition-all"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-950/80 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all text-sm active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send Magic Link →'
                )}
              </button>
              
              {/* Demo access */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-950 px-3 text-slate-500">or</span>
                </div>
              </div>
              
              <Link
                href="/quiz?mode=demo"
                className="block w-full text-center border border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-300 font-medium py-3 rounded-xl transition-all text-sm"
              >
                Try a demo question first →
              </Link>
            </form>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📬</span>
              </div>
              <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Magic link sent to <strong className="text-white">{email}</strong>.
                <br />Click it to sign in — expires in 10 minutes.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => { setSent(false); setEmail('') }}
                  className="w-full text-sm border border-white/10 hover:bg-white/5 text-slate-300 py-2.5 rounded-xl transition-colors"
                >
                  Use a different email
                </button>
                <button
                  onClick={handleSubmit}
                  className="w-full text-sm text-slate-500 hover:text-slate-300 py-2 transition-colors"
                >
                  Didn't receive it? Resend
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-8 space-y-1">
          <span className="block">Free forever · Built for NUS YLL M1</span>
          <span className="block">Not affiliated with NUS Medicine</span>
        </p>
      </div>
    </main>
  )
}
