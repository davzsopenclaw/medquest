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
      console.log('Auth callback initiated');
      try {
        const supabase = getSupabase()
        if (!supabase) throw new Error('Supabase client not initialized')

        // 1. Try PKCE code exchange
        const code = searchParams.get('code')
        if (code) {
          console.log('Exchanging code for session...');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
        }

        // 2. Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (!session) {
          console.log('No active session, waiting for auth state change...');
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('Auth event:', event);
            if (event === 'SIGNED_IN' && newSession) {
              subscription.unsubscribe()
              await processLogin(newSession)
            }
          })

          setTimeout(() => {
            if (status === 'loading') {
              console.log('Auth timeout reached');
              setError('No authentication session found. Try clicking the link again.')
              setStatus('error')
              subscription.unsubscribe()
            }
          }, 10000)
          return
        }

        await processLogin(session)
      } catch (err: any) {
        console.error('Fatal callback error:', err);
        setStatus('error')
        const msg = err?.message || err?.error_description || (typeof err === 'string' ? err : 'Authentication failed')
        setError(msg)
      }
    }

    async function processLogin(session: any) {
      console.log('Processing login for:', session.user?.email);
      try {
        const supabase = getSupabase()
        const email = (session.user.email || '').toLowerCase()
        
        // sync profile to DB
        // We do this even if not whitelisted so we have a record of the request
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: session.user.id,
          email: email,
          display_name: session.user.user_metadata?.full_name || email.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url || null,
        }, { onConflict: 'id' })

        if (upsertError) {
          console.error('Profile upsert failed:', upsertError);
          // Don't block login just because profile sync failed, unless it's a critical error
          // But for now let's see the error
          throw new Error(`Profile sync failed: ${upsertError.message}`)
        }

        // Check manual whitelist table
        const { data: whitelisted, error: whitelistError } = await supabase
          .from('email_whitelist')
          .select('id')
          .eq('email', email)
          .maybeSingle()

        if (whitelistError) {
          console.error('Whitelist check failed:', whitelistError);
          throw new Error(`Whitelist check failed: ${whitelistError.message}`)
        }

        if (whitelisted) {
          console.log('User is whitelisted, updating profile and redirecting...');
          await supabase.from('profiles').update({ is_whitelisted: true }).eq('id', session.user.id)
          router.push('/dashboard')
        } else {
          console.log('User not whitelisted.');
          setUserEmail(email)
          setStatus('pending')
        }
      } catch (err: any) {
        console.error('Login process error:', err);
        setStatus('error')
        setError(err?.message || 'Failed to process login data')
      }
    }

    handleCallback()
  }, [router, searchParams, status])

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
            MedQuest is currently restricted. Your access request has been logged — David will review it shortly.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-400">
            <p>💡 <strong className="text-slate-300">NUS student?</strong> Ensure your email is on the whitelist or use the bypass key if you have it.</p>
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
        <div className="text-center max-w-md">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h1 className="text-xl font-bold mb-2">Authentication Error</h1>
          <p className="text-red-400 text-sm mb-6 font-mono bg-red-900/20 p-3 rounded-lg border border-red-900/50">{error}</p>
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
