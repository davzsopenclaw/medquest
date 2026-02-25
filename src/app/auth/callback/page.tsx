'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'pending' | 'error'>('loading')
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = getSupabase()

        // 1. Try PKCE code exchange
        const code = searchParams.get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
        }

        // 2. Get session (either from code exchange or from hash/cookie)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (!session) {
          // Wait for auth state change (implicit flow / hash tokens)
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (event === 'SIGNED_IN' && newSession) {
              subscription.unsubscribe()
              await processLogin(newSession)
            }
          })

          // Timeout
          setTimeout(() => {
            subscription.unsubscribe()
            setStatus('error')
            setError('No authentication session found. Please try again.')
          }, 8000)
          return
        }

        await processLogin(session)
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    async function processLogin(session: any) {
      const supabase = getSupabase()
      const email = (session.user.email || '').toLowerCase()
      const isNUS = email.endsWith('@u.nus.edu') || 
                    email.endsWith('@nus.edu.sg') || 
                    email.endsWith('@comp.nus.edu.sg') ||
                    email.endsWith('@u.nus.edu.sg')

      console.log('Processing login for:', email, 'isNUS:', isNUS)

      // Upsert profile
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: session.user.id,
        email: email,
        display_name: session.user.user_metadata?.full_name || email.split('@')[0],
        avatar_url: session.user.user_metadata?.avatar_url || null,
        is_whitelisted: isNUS, // Auto-whitelist NUS emails
      }, { onConflict: 'id' })

      if (upsertError) {
        console.error('Profile sync error:', upsertError)
        // If it's an RLS error, we might still want to proceed if isNUS is true
        // But better to fail and fix the policy
        throw upsertError
      }

      // Check if whitelisted
      if (isNUS) {
        router.push('/dashboard')
        return
      }

      // Check manual whitelist
      const { data: whitelisted } = await supabase
        .from('email_whitelist')
        .select('id')
        .eq('email', email)
        .single()

      if (whitelisted) {
        // Update profile to whitelisted
        await supabase.from('profiles').update({ is_whitelisted: true }).eq('id', session.user.id)
        router.push('/dashboard')
      } else {
        // Not whitelisted — show pending screen
        setUserEmail(email)
        setStatus('pending')
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (status === 'pending') {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <span className="text-5xl block mb-4">🔒</span>
          <h1 className="text-2xl font-bold mb-3">Access Requested</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-2">
            You've signed in as <strong className="text-white">{userEmail}</strong>.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            MedQuest is currently restricted to NUS YLL students. Your access request has been logged — the admin will review it shortly.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-400">
            <p>💡 <strong className="text-slate-300">NUS student?</strong> Sign in with your <code className="text-blue-400">@u.nus.edu</code> Google account for instant access.</p>
          </div>
          <a href="/login" className="inline-block mt-6 text-blue-400 hover:text-blue-300 text-sm">
            ← Try a different account
          </a>
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h1 className="text-xl font-bold mb-2">Authentication Error</h1>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <a href="/login" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Try logging in again
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Signing you in...</p>
      </div>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
      </main>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
