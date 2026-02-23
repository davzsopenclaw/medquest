'use client'

const mockLeaderboard = [
  { rank: 1, name: 'Sarah L.', xp: 4210, streak: 21, accuracy: 91, level: 20, badge: '🥇' },
  { rank: 2, name: 'Marcus T.', xp: 3880, streak: 14, accuracy: 87, level: 19, badge: '🥈' },
  { rank: 3, name: 'Priya K.', xp: 3540, streak: 12, accuracy: 84, level: 18, badge: '🥉' },
  { rank: 4, name: 'David Z.', xp: 1840, streak: 7, accuracy: 83, level: 14, badge: '4️⃣', isYou: true },
  { rank: 5, name: 'Jun Wei C.', xp: 1620, streak: 4, accuracy: 79, level: 12, badge: '5️⃣' },
  { rank: 6, name: 'Aisha M.', xp: 1400, streak: 3, accuracy: 76, level: 11, badge: '6️⃣' },
  { rank: 7, name: 'Ryan O.', xp: 1180, streak: 2, accuracy: 72, level: 10, badge: '7️⃣' },
  { rank: 8, name: 'Li Ting W.', xp: 980, streak: 5, accuracy: 81, level: 9, badge: '8️⃣' },
  { rank: 9, name: 'Faizal B.', xp: 760, streak: 1, accuracy: 68, level: 8, badge: '9️⃣' },
  { rank: 10, name: 'Mei Lin T.', xp: 540, streak: 0, accuracy: 65, level: 6, badge: '🔟' },
]

const systemLeaders = [
  { system: 'Renal', icon: '🫘', leader: 'Sarah L.', score: 95 },
  { system: 'CVS', icon: '🫀', leader: 'Marcus T.', score: 92 },
  { system: 'Blood', icon: '🩸', leader: 'David Z.', score: 89 },
]

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
      <div className="border-b border-white/10 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-black">🏆 Leaderboard</h1>
          <p className="text-slate-400 text-sm mt-1">AY25/26 M1 Batch · All time XP</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* TOP 3 PODIUM */}
        <div className="grid grid-cols-3 gap-3 items-end">
          {[mockLeaderboard[1], mockLeaderboard[0], mockLeaderboard[2]].map((entry, i) => {
            const heights = ['h-20', 'h-28', 'h-16']
            const podiumColors = ['bg-slate-600', 'bg-yellow-600', 'bg-orange-700']
            return (
              <div key={entry.rank} className="text-center">
                <div className="mb-2">
                  <div className="text-2xl">{entry.badge}</div>
                  <div className="text-xs font-bold mt-1">{entry.name}</div>
                  <div className="text-xs text-blue-400">{entry.xp.toLocaleString()} XP</div>
                </div>
                <div className={`${heights[i]} ${podiumColors[i]} rounded-t-xl flex items-end justify-center pb-2`}>
                  <span className="text-xl font-black opacity-50">
                    {[2, 1, 3][i]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* FULL TABLE */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-slate-500 border-b border-white/10 uppercase tracking-wider">
            <span className="col-span-1">#</span>
            <span className="col-span-4">Student</span>
            <span className="col-span-3 text-right">XP</span>
            <span className="col-span-2 text-right">Acc.</span>
            <span className="col-span-2 text-right">🔥</span>
          </div>
          {mockLeaderboard.map((entry) => (
            <div
              key={entry.rank}
              className={`grid grid-cols-12 gap-2 px-4 py-3.5 border-b border-white/5 last:border-0 items-center transition-colors ${
                entry.isYou ? 'bg-blue-950/40 border-l-2 border-l-blue-500' : 'hover:bg-white/5'
              }`}
            >
              <span className="col-span-1 text-sm">{entry.badge}</span>
              <div className="col-span-4">
                <div className="text-sm font-semibold flex items-center gap-1.5">
                  {entry.name}
                  {entry.isYou && <span className="text-xs bg-blue-800 text-blue-300 px-1.5 py-0.5 rounded-full">You</span>}
                </div>
                <div className="text-xs text-slate-500">Lv.{entry.level}</div>
              </div>
              <span className="col-span-3 text-right text-sm font-bold text-yellow-400">
                {entry.xp.toLocaleString()}
              </span>
              <span className="col-span-2 text-right text-sm text-slate-300">
                {entry.accuracy}%
              </span>
              <span className="col-span-2 text-right text-sm text-orange-400">
                {entry.streak}d
              </span>
            </div>
          ))}
        </div>

        {/* SYSTEM SPECIALISTS */}
        <div>
          <h2 className="text-lg font-bold mb-3">System Specialists</h2>
          <div className="space-y-2">
            {systemLeaders.map((s) => (
              <div key={s.system} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <span className="text-2xl">{s.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{s.system} Master</div>
                  <div className="text-xs text-slate-400">{s.leader} · {s.score}% accuracy</div>
                </div>
                <span className="text-yellow-400 text-sm font-bold">👑</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/95 backdrop-blur px-6 py-2 flex justify-around md:hidden">
        {[
          { href: '/dashboard', icon: '🏠', label: 'Home' },
          { href: '/quiz', icon: '📝', label: 'Quiz' },
          { href: '/leaderboard', icon: '🏆', label: 'Ranks' },
          { href: '/profile', icon: '👤', label: 'Profile' },
        ].map((item) => (
          <a key={item.href} href={item.href} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors py-1">
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </a>
        ))}
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  )
}
