'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'

export default function WhitelistPage() {
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [whitelist, setWhitelist] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()
      
      if (profile?.is_admin) {
        setIsAdmin(true)
        fetchWhitelist()
      }
    }
    checkAdmin()
  }, [])

  async function fetchWhitelist() {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('email_whitelist')
      .select('*')
      .order('created_at', { ascending: false })
    setWhitelist(data || [])
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const supabase = getSupabase()
      const { error: insertError } = await supabase
        .from('email_whitelist')
        .insert([{ email: email.toLowerCase().trim(), note }])

      if (insertError) throw insertError

      setMessage(`Successfully added ${email} to whitelist.`)
      setEmail('')
      setNote('')
      fetchWhitelist()
    } catch (err: any) {
      setError(err.message || 'Failed to add email')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this email from whitelist?')) return
    const supabase = getSupabase()
    await supabase.from('email_whitelist').delete().eq('id', id)
    fetchWhitelist()
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center text-slate-400">
          <span className="text-4xl block mb-4">🛡️</span>
          <h1 className="text-xl font-bold text-white mb-2">Admin Only</h1>
          <p>You need admin privileges to access the whitelist manager.</p>
          <a href="/dashboard" className="text-blue-400 mt-4 inline-block hover:underline">← Back to Dashboard</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black">Whitelist Manager</h1>
            <p className="text-slate-400">Control who can access MedQuest</p>
          </div>
          <a href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </a>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Add Form */}
          <div className="md:col-span-1">
            <form onSubmit={handleAdd} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 sticky top-24">
              <h2 className="font-bold text-lg">Add New User</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Note (Optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. David's friend"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              
              {error && <p className="text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}
              {message && <p className="text-green-400 text-xs bg-green-900/20 p-2 rounded border border-green-900/50">{message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all text-sm shadow-lg shadow-blue-900/20"
              >
                {loading ? 'Adding...' : 'Add to Whitelist'}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="md:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-300">Email</th>
                    <th className="px-6 py-4 font-semibold text-slate-300">Note</th>
                    <th className="px-6 py-4 font-semibold text-slate-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {whitelist.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                        No manual whitelist entries yet.
                      </td>
                    </tr>
                  ) : (
                    whitelist.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/2">
                        <td className="px-6 py-4 font-medium">{entry.email}</td>
                        <td className="px-6 py-4 text-slate-400">{entry.note || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-950/30 rounded-lg transition-colors"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
