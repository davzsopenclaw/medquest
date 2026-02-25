'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      console.log('Auth callback initiated');
      console.log('Current URL:', window.location.href);
      try {
        const supabase = getSupabase()
        
        // 1. Check for 'code' in URL (PKCE flow)
        const code = searchParams.get('code')
        console.log('Auth code found:', !!code);
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error('Exchange error:', exchangeError);
            throw exchangeError
          }
          console.log('Exchange successful, redirecting...');
          router.push('/dashboard')
          return
        }

        // 2. Check if session already exists (Implicit flow)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Session check:', !!session);
        if (sessionError) throw sessionError

        if (session) {
          console.log('Session exists, syncing profile...');
          // Sync profile
          await supabase.from('profiles').upsert({
            id: session.user.id,
            email: session.user.email!,
            display_name: session.user.email!.split('@')[0],
          }, { onConflict: 'id' })
          
          router.push('/dashboard')
        } else {
          console.log('No session, setting up auth state listener...');
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state change event:', event, !!session);
            if (event === 'SIGNED_IN' && session) {
              router.push('/dashboard')
              subscription.unsubscribe()
            }
          })
          
          setTimeout(() => {
            if (window.location.pathname === '/auth/callback') {
              console.log('Auth callback timeout reached');
              setError('No authentication session found. Try clicking the link in your email again.')
              subscription.unsubscribe()
            }
          }, 5000)
        }
      } catch (err) {
        console.error('Callback error caught:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (error) {
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
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 text-center">
      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-400 text-sm">Signing you in...</p>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 text-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading...</p>
      </main>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
