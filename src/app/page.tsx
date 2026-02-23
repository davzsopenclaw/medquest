'use client'

import Link from 'next/link'
import { useState } from 'react'

const systems = [
  { name: 'Foundation', icon: '🧬', color: 'from-purple-600 to-purple-800', count: 42 },
  { name: 'Blood', icon: '🩸', color: 'from-red-600 to-red-800', count: 58 },
  { name: 'Cardiovascular', icon: '🫀', color: 'from-pink-600 to-rose-800', count: 74 },
  { name: 'Renal', icon: '🫘', color: 'from-blue-600 to-blue-800', count: 63 },
  { name: 'Respiratory', icon: '🫁', color: 'from-cyan-600 to-cyan-800', count: 51 },
  { name: 'Gastrointestinal', icon: '🦠', color: 'from-orange-600 to-orange-800', count: 45 },
  { name: 'Metabolism', icon: '⚡', color: 'from-yellow-600 to-yellow-800', count: 38 },
  { name: 'Immunology', icon: '🛡️', color: 'from-green-600 to-green-800', count: 29 },
]

const features = [
  {
    icon: '🎯',
    title: 'High-Yield Weighted',
    desc: 'Questions ranked by how often they appear in YLL exams. Know what actually matters.',
  },
  {
    icon: '🏆',
    title: 'Compete With Batchmates',
    desc: 'Live leaderboard, XP, streaks, and badges. Make grinding actually fun.',
  },
  {
    icon: '🧠',
    title: 'Mastery Tracking',
    desc: 'Tracks every topic, recommends what to study today. No more guessing.',
  },
  {
    icon: '📚',
    title: 'Real PYP Questions',
    desc: 'Parsed directly from YLL past year papers. Same format, same difficulty.',
  },
]

export default function HomePage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* NAV */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏥</span>
            <span className="font-bold text-xl tracking-tight">MedQuest</span>
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full ml-1">YLL</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/login"
              className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Get Access
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-950 text-blue-300 border border-blue-800 rounded-full px-4 py-1.5 text-sm mb-8">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          Built for NUS YLL M1 — Phase I papers parsed & ready
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
          Revise smarter.
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Rank higher.
          </span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The only revision platform that knows what YLL actually tests. Real past-year questions,
          high-yield weighted, with gamification that makes you want to study.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 inline-flex items-center gap-2"
          >
            Start Studying Free
            <span>→</span>
          </Link>
          <Link
            href="/demo"
            className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all hover:bg-white/5 inline-flex items-center gap-2"
          >
            Try a Question
          </Link>
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto">
          {[
            { val: '400+', label: 'PYP Questions' },
            { val: '8', label: 'Systems Covered' },
            { val: '∞', label: 'AI-Generated' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black text-blue-400">{s.val}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SYSTEMS */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-center mb-3">Every System. Covered.</h2>
        <p className="text-slate-400 text-center mb-10">From Foundation to Metabolism — all Phase I content.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {systems.map((sys) => (
            <div
              key={sys.name}
              className={`bg-gradient-to-br ${sys.color} rounded-2xl p-5 cursor-pointer hover:scale-105 transition-transform`}
            >
              <div className="text-3xl mb-2">{sys.icon}</div>
              <div className="font-bold text-sm">{sys.name}</div>
              <div className="text-white/70 text-xs mt-1">{sys.count} questions</div>
            </div>
          ))}
        </div>
      </section>

      {/* GAMIFICATION PREVIEW */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-800/50 rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black mb-4">
                Medicine is already hard.{' '}
                <span className="text-blue-400">Your revision app shouldn't be boring.</span>
              </h2>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Earn XP for every correct answer. Maintain streaks. Climb the leaderboard against your
                batchmates. Unlock badges like <strong>Renal God</strong> and <strong>The Consultant</strong>.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '⚡', label: 'XP & Levels' },
                  { icon: '🔥', label: 'Daily Streaks' },
                  { icon: '🏆', label: 'Batch Leaderboard' },
                  { icon: '🎖️', label: '10+ Badges' },
                ].map((g) => (
                  <div key={g.label} className="flex items-center gap-2 text-sm">
                    <span>{g.icon}</span>
                    <span className="text-slate-300">{g.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock leaderboard card */}
            <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <span className="font-bold text-sm">🏆 Batch Leaderboard</span>
                <span className="text-xs text-slate-500">This week</span>
              </div>
              {[
                { rank: 1, name: 'David Z.', xp: 2840, streak: 12, medal: '🥇' },
                { rank: 2, name: 'Sarah L.', xp: 2610, streak: 8, medal: '🥈' },
                { rank: 3, name: 'Marcus T.', xp: 2380, streak: 6, medal: '🥉' },
                { rank: 4, name: 'Priya K.', xp: 1920, streak: 5, medal: '4️⃣' },
                { rank: 5, name: 'You', xp: 1650, streak: 3, medal: '5️⃣' },
              ].map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 p-3 border-b border-white/5 last:border-0 ${
                    entry.name === 'You' ? 'bg-blue-950/50' : ''
                  }`}
                >
                  <span className="text-lg w-6 text-center">{entry.medal}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{entry.name}</div>
                    <div className="text-xs text-slate-500">🔥 {entry.streak} day streak</div>
                  </div>
                  <div className="text-blue-400 font-bold text-sm">{entry.xp.toLocaleString()} XP</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-black mb-4">Ready to actually enjoy revising?</h2>
        <p className="text-slate-400 mb-8">NUS email required. Free. Always.</p>
        {!submitted ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSubmitted(true)
            }}
            className="flex gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="your-id@u.nus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
              required
            />
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
            >
              Get Access
            </Link>
          </form>
        ) : (
          <div className="text-green-400 font-semibold">✅ You're on the list — check your email!</div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-8 text-center text-slate-600 text-sm">
        <p>MedQuest · Built for NUS YLL M1 Students · Not affiliated with NUS officially</p>
      </footer>
    </main>
  )
}
