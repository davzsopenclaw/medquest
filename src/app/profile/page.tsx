'use client'

import Link from 'next/link'

// Mock — will come from Supabase
const profile = {
  display_name: 'David Zhang',
  email: 'e0123456@u.nus.edu',
  matric: 'A0291234X',
  xp: 1840,
  level: 14,
  streak_current: 7,
  streak_longest: 12,
  questions_answered: 142,
  questions_correct: 118,
  total_study_time_minutes: 480,
  badges_earned: 3,
  badges_total: 10,
  joined: '15 Feb 2026',
}

const recentSessions = [
  { date: 'Today', mode: 'Daily Grand Rounds', questions: 10, correct: 8, xp: 180 },
  { date: 'Yesterday', mode: 'Practice — Renal', questions: 15, correct: 12, xp: 220 },
  { date: '22 Feb', mode: 'Boss Battle', questions: 20, correct: 14, xp: 310 },
  { date: '21 Feb', mode: 'Weak Spots', questions: 10, correct: 7, xp: 140 },
]

export default function ProfilePage() {
  const accuracy = Math.round((profile.questions_correct / profile.questions_answered) * 100)
  const studyHours = Math.floor(profile.total_study_time_minutes / 60)
  const studyMins = profile.total_study_time_minutes % 60

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
      <nav className="border-b border-white/10 px-4 py-3 sticky top-0 bg-slate-950/95 backdrop-blur z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏥</span>
            <span className="font-bold">MedQuest</span>
          </div>
          <button className="text-slate-500 hover:text-red-400 text-sm transition-colors">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* PROFILE HEADER */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-2xl font-black">
            {profile.display_name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h1 className="text-2xl font-black">{profile.display_name}</h1>
            <p className="text-slate-400 text-sm">{profile.email}</p>
            <p className="text-blue-400 text-xs font-medium mt-0.5">Level {profile.level} · Medical Officer</p>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total XP', value: profile.xp.toLocaleString(), icon: '⚡', color: 'text-yellow-400' },
            { label: 'Accuracy', value: `${accuracy}%`, icon: '🎯', color: 'text-green-400' },
            { label: 'Current Streak', value: `${profile.streak_current}d`, icon: '🔥', color: 'text-orange-400' },
            { label: 'Study Time', value: `${studyHours}h ${studyMins}m`, icon: '⏱️', color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span>{s.icon}</span> {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* LIFETIME STATS */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <h2 className="font-bold text-sm text-slate-300">Lifetime Stats</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Questions Answered</span><span className="font-semibold">{profile.questions_answered}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Correct Answers</span><span className="font-semibold text-green-400">{profile.questions_correct}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Longest Streak</span><span className="font-semibold text-orange-400">{profile.streak_longest} days</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Badges Earned</span><span className="font-semibold">{profile.badges_earned}/{profile.badges_total}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Member Since</span><span className="font-semibold">{profile.joined}</span></div>
          </div>
        </div>

        {/* RECENT SESSIONS */}
        <div>
          <h2 className="font-bold mb-3">Recent Sessions</h2>
          <div className="space-y-2">
            {recentSessions.map((s, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{s.mode}</div>
                  <div className="text-xs text-slate-500">{s.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-400">{s.correct}/{s.questions}</div>
                  <div className="text-xs text-yellow-400">+{s.xp} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DANGER ZONE */}
        <div className="border border-red-900/50 rounded-2xl p-5">
          <h2 className="font-bold text-sm text-red-400 mb-2">Account</h2>
          <p className="text-xs text-slate-500 mb-3">Your data is stored securely. Contact David to delete your account.</p>
          <button className="text-xs text-red-400 hover:text-red-300 transition-colors">
            Sign out from all devices
          </button>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/95 backdrop-blur px-6 py-2 flex justify-around md:hidden">
        {[
          { href: '/dashboard', icon: '🏠', label: 'Home' },
          { href: '/quiz', icon: '📝', label: 'Quiz' },
          { href: '/leaderboard', icon: '🏆', label: 'Ranks' },
          { href: '/profile', icon: '👤', label: 'Profile', active: true },
        ].map((item) => (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              item.active ? 'text-blue-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  )
}
