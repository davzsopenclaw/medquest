'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabase, xpForLevel, levelFromXp, SYSTEM_ICONS } from '@/lib/supabase'

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [mastery, setMastery] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.getSession()
        
        // Handle bypass or real session
        let userEmail = ''
        let userId = ''
        
        if (session) {
          userEmail = session.user.email!
          userId = session.user.id
        } else {
          const bypass = localStorage.getItem('medquest_bypass_user')
          if (bypass) {
            const data = JSON.parse(bypass)
            userEmail = data.email
            userId = '00000000-0000-0000-0000-000000000000'
          }
        }

        if (!userEmail) return

        // Fetch real profile from Supabase
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail)
          .single()

        if (profileData) {
          setProfile(profileData)
        } else {
          // Fallback if DB entry missing
          setProfile({
            display_name: userEmail.split('@')[0],
            xp: 0,
            level: 1,
            streak_current: 0,
            questions_answered: 0,
            questions_correct: 0
          })
        }

        // Fetch mastery
        const { data: masteryData } = await supabase
          .from('topic_mastery')
          .select('*')
          .eq('user_id', userId)
        
        setMastery(masteryData || [])
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const p = profile || { display_name: 'User', xp: 0, level: 1, streak_current: 0, questions_answered: 0, questions_correct: 0, is_admin: false }
  const accuracy = p.questions_answered > 0 ? Math.round((p.questions_correct / p.questions_answered) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* TOP NAV */}
      <nav className="border-b border-white/10 px-4 py-3 sticky top-0 bg-slate-950/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏥</span>
            <span className="font-bold">MedQuest</span>
            {p.is_admin && (
              <Link href="/admin/whitelist" className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ml-2">
                Admin
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-orange-400 text-sm font-semibold">
              <span>🔥</span>
              <span>{p.streak_current}</span>
            </div>
            <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-semibold">
              <span>⚡</span>
              <span>{p.xp.toLocaleString()}</span>
            </div>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              {p.display_name[0].toUpperCase()}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* GREETING */}
        <div>
          <h1 className="text-2xl font-black">
            Welcome, {p.display_name.split('@')[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Ready to crush some high-yield questions?
          </p>
        </div>

        {/* XP BAR */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-2xl font-black">Level {p.level}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-yellow-400">{p.xp.toLocaleString()} XP</div>
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (p.xp % 100))}%` }}
            />
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-xl font-bold">{p.streak_current}</div>
            <div className="text-sm text-slate-400">Day Streak</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-xl font-bold">{p.questions_answered}</div>
            <div className="text-sm text-slate-400">Answered</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-xl font-bold">{accuracy}%</div>
            <div className="text-sm text-slate-400">Accuracy</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-xl font-bold">#--</div>
            <div className="text-sm text-slate-400">Rank</div>
          </div>
        </div>

        {/* DAILY GRAND ROUNDS */}
        <div className="bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-800/50 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                🏥 Start Your Daily Rounds
              </h2>
              <p className="text-blue-200/60 text-sm mt-1">10 personalized questions to keep your knowledge sharp.</p>
            </div>
            <Link
              href="/quiz"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl text-center transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              Begin Session →
            </Link>
          </div>
        </div>

        {/* REAL CONTENT SECTION */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* MASTERY LIST */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Your Mastery</h2>
            <div className="space-y-3">
              {['Foundation', 'Blood', 'Cardiovascular', 'Renal', 'Respiratory', 'Gastrointestinal', 'Metabolism', 'Immunology'].map(sys => {
                const sysMastery = mastery.find(m => m.system === sys)
                const score = sysMastery ? Math.round(sysMastery.mastery_score * 100) : 0
                return (
                  <Link key={sys} href={`/quiz?system=${sys}`} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                    <span className="text-2xl">{(SYSTEM_ICONS as any)[sys]}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{sys}</span>
                        <span className="text-slate-400">{score}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full transition-all" style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Recent Activity</h2>
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-slate-400 text-sm">No recent sessions yet. Start your first quiz to see stats here!</p>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE NAV */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/95 backdrop-blur px-6 py-2 flex justify-around md:hidden">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-blue-500 py-1">
          <span className="text-xl">🏠</span>
          <span className="text-xs">Home</span>
        </Link>
        <Link href="/quiz" className="flex flex-col items-center gap-1 text-slate-400 py-1">
          <span className="text-xl">📝</span>
          <span className="text-xs">Quiz</span>
        </Link>
        <Link href="/leaderboard" className="flex flex-col items-center gap-1 text-slate-400 py-1">
          <span className="text-xl">🏆</span>
          <span className="text-xs">Ranks</span>
        </Link>
      </nav>
    </div>
  )
}
