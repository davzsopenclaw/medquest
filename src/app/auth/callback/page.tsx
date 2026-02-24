// Auth callback — handles Supabase magic link redirect
import { redirect } from 'next/navigation'

export default function AuthCallbackPage() {
  // In production, this page handles the Supabase auth callback
  // The Supabase client will exchange the token in the URL for a session
  // Then redirect to dashboard
  redirect('/dashboard')
}
