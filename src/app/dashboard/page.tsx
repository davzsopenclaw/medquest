'use client'

import Link from 'next/link'

// Mock data — will be replaced with Supabase queries
const mockProfile = {
  display_name: 'David Z.',
  xp: 1840,
  level: 14,
  streak_current: 7,
  questions_answered: 142,
  questions_correct: 118,
}

const mockMastery = [
  { system: 'Renal', icon: '🫘', mastery: 0.78, topics: 12, mastered: 9 },
  { system: 'Blood', icon: '🩸', mastery: 0.65, topics: 10, mastered: 6 },
  { system: 'Cardiovascular', icon: '🫀', mastery: 0.42, topics: 14, mastered: 5 },
  { system: 'Respiratory', icon: '🫁', mastery: 0.31, topics: 9, mastered: 2 },
  { system: 'Foundation', icon: '🧬', mastery: 0.55, topics: 8, mastered: 4 },
  { system: 'Gastrointestinal', icon: '🦠', mastery: 0.20, topics: 11, mastered: 2 },
]

const mockDaily = [
  { system: 'Cardiovascular', icon: '🫀', reason: 'Low mastery', count: 4, color: 'from-pink-600 to-rose-700' },
  { system: 'Respiratory', icon: '🫁', reason: 'Not reviewed today', count: 3, color: 'from-cyan-600 to-cyan-800' },
  { system: 'Renal', icon: '🫘', reason: 'High yield topics', count: 3, color: 'from-blue-600 to-blue-800' },
]

const mockBadges = [
  { icon: '🩸', name: 'First Blood', earned: true },
  { icon: '🔥', name: 'On a Roll', earned: true },
  { icon: '📅', name: 'Week Warrior', earned: true },
  { icon: '💯', name: 'Century Club', earned: false },
  { icon: '🧪', name: 'Renal God', earned: false },
  { icon: '🏥', name: 'The Consultant', earned: false },
]

function XPBar({ xp, level }: { xp: number; level: number }) {
  const levelStart = Math.pow(level - 1, 2) * 100
  const levelEnd = Math.pow(level, 2) * 100
  const progress = ((xp - levelStart) / (levelEnd - levelStart)) * 100

  const titles = ['', 'Med Student', 'House Officer', 'Med Officer', 'Registrar', 'Sr. Registrar', 'Consultant']
  const title = level < 5 ? titles[1] : level < 10 ? titles[2] : level < 15 ? titles[3] : level < 20 ? titles[4] : level < 25 ? titles[5] : titles[6]

  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-2xl font-black">Level {level}</div>
          <div className="text-sm text-blue-400 font-medium">{title}</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-yellow-400">{xp.toLocaleString()} XP</div>
          <div className="text-xs text-slate-500">{(levelEnd - xp).toLocaleString()} to next level</div>
        </div>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const accuracy = Math.round((mockProfile.questions_correct / mockProfile.questions_answered) * 100)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* TOP NAV */}
      <nav className="border-b border-white/10 px-4 py-3 sticky top-0 bg-slate-950/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏥</span>
            <span className="font-bold">MedQuest</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-orange-400 text-sm font-semibold">
              <span>🔥</span>
              <span>{mockProfile.streak_current}</span>
            </div>
            <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-semibold">
              <span>⚡</span>
              <span>{mockProfile.xp.toLocaleString()}</span>
            </div>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              {mockProfile.display_name[0]}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* GREETING */}
        <div>
          <h1 className="text-2xl font-black">
            Good afternoon, {mockProfile.display_name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {mockProfile.streak_current} day streak — keep it going!
          </p>
        </div>

        {/* XP BAR */}
        <XPBar xp={mockProfile.xp} level={mockProfile.level} />

        {/* QUICK STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon="🔥" label="Day Streak" value={mockProfile.streak_current} sub="Best: 12 days" />
          <StatCard icon="✅" label="Answered" value={mockProfile.questions_answered} sub="All time" />
          <StatCard icon="🎯" label="Accuracy" value={`${accuracy}%`} sub="Overall" />
          <StatCard icon="🏆" label="Rank" value="#4" sub="In your batch" />
        </div>

        {/* DAILY GRAND ROUNDS */}
        <div className="bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-800/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black flex items-center gap-2">
                🏥 Today's Grand Rounds
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">10 questions · tailored to your weak spots</p>
            </div>
            <Link
              href="/quiz?mode=daily"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Start →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {mockDaily.map((d) => (
              <div key={d.system} className={`bg-gradient-to-br ${d.color} rounded-xl p-3`}>
                <div className="text-2xl mb-1">{d.icon}</div>
                <div className="text-xs font-bold">{d.system}</div>
                <div className="text-xs text-white/70 mt-0.5">{d.count} Qs · {d.reason}</div>
              </div>
            ))}
          </div>
        </div>

        {/* STUDY MODES */}
        <div>
          <h2 className="text-lg font-bold mb-3">Study Modes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/quiz?mode=practice', icon: '📖', label: 'Practice', sub: 'No timer, full explanations', color: 'from-slate-800 to-slate-700' },
              { href: '/quiz?mode=timed', icon: '⏱️', label: 'Timed Set', sub: '20 Qs, 40 minutes', color: 'from-amber-900 to-amber-800' },
              { href: '/quiz?mode=boss', icon: '⚔️', label: 'Boss Battle', sub: 'High-yield sprint', color: 'from-red-900 to-red-800' },
              { href: '/quiz?mode=weak', icon: '🎯', label: 'Weak Spots', sub: 'Your lowest topics', color: 'from-purple-900 to-purple-800' },
            ].map((mode) => (
              <Link
                key={mode.href}
                href={mode.href}
                className={`bg-gradient-to-br ${mode.color} border border-white/10 rounded-xl p-4 hover:scale-105 transition-transform`}
              >
                <div className="text-2xl mb-2">{mode.icon}</div>
                <div className="font-bold text-sm">{mode.label}</div>
                <div className="text-xs text-white/60 mt-1">{mode.sub}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* MASTERY MAP */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Mastery Map</h2>
            <span className="text-xs text-slate-500">Click to drill into a system</span>
          </div>
          <div className="space-y-3">
            {mockMastery.map((sys) => (
              <Link
                key={sys.system}
                href={`/quiz?system=${sys.system}`}
                className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-colors group"
              >
                <span className="text-2xl">{sys.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{sys.system}</span>
                    <span className="text-xs text-slate-400">{sys.mastered}/{sys.topics} topics mastered</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        sys.mastery >= 0.85 ? 'bg-green-500' :
                        sys.mastery >= 0.6 ? 'bg-yellow-500' :
                        sys.mastery >= 0.3 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${sys.mastery * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">
                  {Math.round(sys.mastery * 100)}%
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* BADGES */}
        <div>
          <h2 className="text-lg font-bold mb-3">Badges</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {mockBadges.map((badge) => (
              <div
                key={badge.name}
                className={`rounded-xl p-3 text-center border transition-all ${
                  badge.earned
                    ? 'bg-yellow-950 border-yellow-700 hover:scale-105'
                    : 'bg-white/5 border-white/10 opacity-40'
                }`}
              >
                <div className="text-3xl mb-1">{badge.icon}</div>
                <div className="text-xs font-medium leading-tight">{badge.name}</div>
                {!badge.earned && <div className="text-xs text-slate-600 mt-1">Locked</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM NAV (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/95 backdrop-blur px-6 py-2 flex justify-around md:hidden">
        {[
          { href: '/dashboard', icon: '🏠', label: 'Home' },
          { href: '/quiz', icon: '📝', label: 'Quiz' },
          { href: '/leaderboard', icon: '🏆', label: 'Ranks' },
          { href: '/profile', icon: '👤', label: 'Profile' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors py-1">
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  )
}
