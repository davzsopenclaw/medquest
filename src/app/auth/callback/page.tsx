'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically picks up the token from the URL hash
        const { data, error: authError } = await getSupabase().auth.getSession()
        
        if (authError) {
          setError(authError.message)
          return
        }

        if (data.session) {
          // Create/update profile
          const user = data.session.user
          await getSupabase().from('profiles').upsert({
            id: user.id,
            email: user.email!,
            display_name: user.email!.split('@')[0],
          }, { onConflict: 'id' })
          
          router.push('/dashboard')
        } else {
          // Try to exchange the code if present
          const params = new URLSearchParams(window.location.search)
          const code = params.get('code')
          if (code) {
            const { error: exchangeError } = await getSupabase().auth.exchangeCodeForSession(code)
            if (exchangeError) {
              setError(exchangeError.message)
              return
            }
            router.push('/dashboard')
          } else {
            setError('No authentication session found.')
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    handleCallback()
  }, [router])

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
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Signing you in...</p>
      </div>
    </main>
  )
}
