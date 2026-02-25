'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Secret bypass state
  const [clickCount, setClickCount] = useState(0)
  const [showSecret, setShowSecret] = useState(false)
  const [secretKey, setSecretKey] = useState('')
  const [bypassEmail, setBypassEmail] = useState('')

  const handleLogoClick = () => {
    const n = clickCount + 1
    setClickCount(n)
    if (n >= 5) setShowSecret(true)
  }

  async function handleGoogleLogin() {
    setError('')
    setLoading(true)
    try {
      const { error: authError } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (authError) throw authError
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setError(message)
      setLoading(false)
    }
  }

  async function handleBypass(e: React.FormEvent) {
    e.preventDefault()
    if (secretKey === 'jesse' && bypassEmail) {
      localStorage.setItem('medquest_bypass_user', JSON.stringify({
        email: bypassEmail,
        display_name: bypassEmail.split('@')[0],
        xp: 0,
        level: 1
      }))
      router.push('/dashboard?mode=bypass')
    } else {
      setError('Invalid bypass key.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <button
            onClick={handleLogoClick}
            className="inline-flex items-center gap-2 mb-6 group outline-none"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">🏥</span>
            <span className="font-black text-2xl tracking-tight text-white">MedQuest</span>
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">YLL</span>
          </button>
          <h1 className="text-2xl font-bold mt-4">Welcome, future doctor</h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            Sign in to start revising. NUS students get instant access.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur">
          {!showSecret ? (
            <div className="space-y-5">
              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-800 font-semibold py-3.5 rounded-xl transition-all text-sm active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                    Redirecting...
                  </span>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-950/80 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="text-center text-xs text-slate-500 space-y-1 pt-2">
                <p>🔒 NUS emails (@u.nus.edu) get instant access</p>
                <p>Other emails can request access from the admin</p>
              </div>

              {/* Divider */}
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
            </div>
          ) : (
            /* Secret Bypass Form */
            <form onSubmit={handleBypass} className="space-y-4">
              <div className="text-center text-blue-400 text-xs font-mono mb-2">🔓 Admin Bypass</div>
              <input
                type="email"
                value={bypassEmail}
                onChange={(e) => setBypassEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600"
                required
              />
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Secret key"
                className="w-full bg-blue-900/20 border border-blue-500/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 placeholder-blue-900 text-blue-100"
                required
              />
              {error && (
                <div className="text-red-400 text-sm text-center">{error}</div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all text-sm"
              >
                Bypass Login →
              </button>
            </form>
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
