'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

// Sample question data (will come from Supabase)
const sampleQuestions: {
  id: string; question_type: string; system: string; topic: string; subtopic: string;
  vignette: string; question_text: string; image_url?: string; image_caption?: string;
  options: { id: string; text: string }[]; correct_option: string;
  explanation: string; explanation_mechanism: string; high_yield_pearl: string;
  difficulty: string; tags: string[]; pyp_frequency: number;
}[] = [
  {
    id: '1',
    question_type: 'MCQ',
    system: 'Renal',
    topic: 'Glomerulonephritis',
    subtopic: 'IgA Nephropathy',
    vignette: 'A 24-year-old male presents to the emergency department with macroscopic haematuria 2 days after an upper respiratory tract infection. He is otherwise well with no significant past medical history. Blood pressure is 128/78 mmHg. Urinalysis shows 3+ blood and 1+ protein. Serum creatinine is 88 μmol/L.',
    question_text: 'What is the most likely underlying glomerular pathology, and what finding on immunofluorescence microscopy would confirm this diagnosis?',
    options: [
      { id: 'A', text: 'Post-infectious glomerulonephritis — granular C3 deposits in mesangium and subendothelial space' },
      { id: 'B', text: 'IgA nephropathy — mesangial IgA deposits on immunofluorescence' },
      { id: 'C', text: 'Goodpasture syndrome — linear IgG deposits along the glomerular basement membrane' },
      { id: 'D', text: 'Minimal change disease — no immune deposits on immunofluorescence' },
      { id: 'E', text: 'Membranous nephropathy — subepithelial IgG and C3 deposits' },
    ],
    correct_option: 'B',
    explanation: 'IgA nephropathy (Berger disease) is the most common glomerulonephritis worldwide. The classic presentation is synpharyngitic haematuria — macroscopic haematuria occurring concurrently with or within 1-2 days of an URTI, unlike post-infectious GN which occurs 2-3 weeks later (latent period). The hallmark immunofluorescence finding is mesangial IgA deposits (often with IgG and C3).',
    explanation_mechanism: 'Abnormally glycosylated IgA1 is produced in excess and forms immune complexes that deposit in the mesangium, activating complement and causing local inflammation and haematuria.',
    high_yield_pearl: '⚡ Synpharyngitic = IgA nephropathy. Post-URTI with 2-3 week latency = Post-infectious GN.',
    difficulty: 'Tier2_Application',
    tags: ['Glomerulonephritis', 'Immunofluorescence', 'Haematuria'],
    pyp_frequency: 4,
  },
  {
    id: '2',
    question_type: 'MCQ',
    system: 'Cardiovascular',
    topic: 'Ischaemic Heart Disease',
    subtopic: 'ECG Localisation',
    vignette: 'A 58-year-old male smoker with hypertension presents with severe crushing central chest pain radiating to his left arm for the past 90 minutes. He is diaphoretic and pale. ECG shows ST elevation in leads II, III, and aVF.',
    question_text: 'Which coronary artery is most likely occluded, and which territory is at risk?',
    options: [
      { id: 'A', text: 'Left anterior descending (LAD) — anterior and septal wall' },
      { id: 'B', text: 'Left circumflex (LCx) — lateral wall' },
      { id: 'C', text: 'Right coronary artery (RCA) — inferior wall and AV node' },
      { id: 'D', text: 'Left main coronary artery — extensive anterior territory' },
      { id: 'E', text: 'Posterior descending artery — posterior wall' },
    ],
    correct_option: 'C',
    explanation: 'ST elevation in leads II, III, and aVF = inferior STEMI. The inferior wall of the left ventricle is supplied by the RCA in 80-85% of individuals (right dominant circulation). RCA also supplies the AV node, so inferior MI can cause complete heart block — a dangerous complication to anticipate.',
    explanation_mechanism: 'ECG lead territories: I, aVL, V5-V6 = Lateral (LCx). V1-V4 = Anterior/Septal (LAD). II, III, aVF = Inferior (RCA). V1-V2 reciprocal changes suggest posterior (posterior descending).',
    high_yield_pearl: '⚡ II, III, aVF = Inferior = RCA. Always check for AV block in inferior MI!',
    difficulty: 'Tier2_Application',
    tags: ['ECG', 'STEMI', 'Coronary Anatomy'],
    pyp_frequency: 6,
  },
]

type AnswerState = 'unanswered' | 'correct' | 'wrong' | 'revealed'

function QuizEngine() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') || 'practice'
  const system = searchParams.get('system') || null

  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered')
  const [showExplanation, setShowExplanation] = useState(false)
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0, xp: 0 })
  const [timeLeft, setTimeLeft] = useState(mode === 'timed' ? 2400 : null) // 40 min for timed
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [finished, setFinished] = useState(false)

  const questions = sampleQuestions
  const q = questions[currentIdx]

  // Timer for timed mode
  useEffect(() => {
    if (!timeLeft) return
    if (timeLeft <= 0) { setFinished(true); return }
    const t = setTimeout(() => setTimeLeft(t => t! - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleAnswer = useCallback((optionId: string) => {
    if (answerState !== 'unanswered') return
    setSelected(optionId)
    const isCorrect = optionId === q.correct_option
    setAnswerState(isCorrect ? 'correct' : 'wrong')
    setShowExplanation(true)
    const xpEarned = isCorrect ? (q.difficulty === 'Tier3_Integration' ? 35 : q.difficulty === 'Tier2_Application' ? 20 : 10) : 0
    setSessionScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
      xp: prev.xp + xpEarned,
    }))
  }, [answerState, q])

  const handleNext = () => {
    if (currentIdx >= questions.length - 1) {
      setFinished(true)
      return
    }
    setCurrentIdx(i => i + 1)
    setSelected(null)
    setAnswerState('unanswered')
    setShowExplanation(false)
    setStartTime(Date.now())
  }

  const difficultyConfig = {
    Tier1_Recall: { label: 'Recall', color: 'text-green-400 bg-green-950 border-green-800' },
    Tier2_Application: { label: 'Application', color: 'text-amber-400 bg-amber-950 border-amber-800' },
    Tier3_Integration: { label: 'Integration', color: 'text-red-400 bg-red-950 border-red-800' },
  }

  if (finished) {
    const accuracy = sessionScore.total > 0 ? Math.round((sessionScore.correct / sessionScore.total) * 100) : 0
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-7xl mb-6">{accuracy >= 70 ? '🎉' : '📚'}</div>
          <h1 className="text-3xl font-black mb-2">Session Complete!</h1>
          <p className="text-slate-400 mb-8">Here's how you did</p>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-black text-green-400">{sessionScore.correct}/{sessionScore.total}</div>
                <div className="text-xs text-slate-500 mt-1">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-400">{accuracy}%</div>
                <div className="text-xs text-slate-500 mt-1">Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-black text-yellow-400">+{sessionScore.xp}</div>
                <div className="text-xs text-slate-500 mt-1">XP Earned</div>
              </div>
            </div>
            {accuracy >= 90 && (
              <div className="bg-yellow-950 border border-yellow-700 rounded-xl px-4 py-3 text-sm text-yellow-300">
                🎖️ Accuracy Ace badge progress: {accuracy}% ≥ 90% ✓
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setCurrentIdx(0); setSessionScore({ correct: 0, total: 0, xp: 0 }); setFinished(false); setSelected(null); setAnswerState('unanswered'); setShowExplanation(false) }}
              className="flex-1 border border-white/20 hover:bg-white/5 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              Dashboard →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
      <div className="sticky top-0 bg-slate-950/95 backdrop-blur border-b border-white/10 px-4 py-3 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white transition-colors text-sm">
            ← Back
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {currentIdx + 1} / {questions.length}
            </span>
            {timeLeft !== null && (
              <span className={`text-sm font-mono font-bold ${timeLeft < 300 ? 'text-red-400' : 'text-slate-300'}`}>
                ⏱ {formatTime(timeLeft)}
              </span>
            )}
            <span className="text-sm text-yellow-400 font-bold">+{sessionScore.xp} XP</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-3xl mx-auto mt-2">
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* METADATA PILLS */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs border rounded-full px-3 py-1 bg-blue-950 border-blue-800 text-blue-300">
            {q.system}
          </span>
          <span className="text-xs border rounded-full px-3 py-1 bg-slate-800 border-slate-700 text-slate-300">
            {q.topic}
          </span>
          <span className={`text-xs border rounded-full px-3 py-1 ${difficultyConfig[q.difficulty as keyof typeof difficultyConfig].color}`}>
            {difficultyConfig[q.difficulty as keyof typeof difficultyConfig].label}
          </span>
          {q.pyp_frequency >= 3 && (
            <span className="text-xs border rounded-full px-3 py-1 bg-orange-950 border-orange-800 text-orange-300">
              🎯 High Yield ×{q.pyp_frequency}
            </span>
          )}
        </div>

        {/* VIGNETTE */}
        {q.vignette && (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Clinical Scenario</div>
            <p className="text-slate-200 leading-relaxed text-sm md:text-base">{q.vignette}</p>
          </div>
        )}

        {/* IMAGE PLACEHOLDER */}
        {q.image_url && (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 text-center">
            <img src={q.image_url} alt={q.image_caption || 'Question image'} className="max-w-full rounded-xl mx-auto" />
            {q.image_caption && <p className="text-xs text-slate-500 mt-2">{q.image_caption}</p>}
          </div>
        )}

        {/* QUESTION */}
        <div>
          <h2 className="text-base md:text-lg font-semibold leading-relaxed">{q.question_text}</h2>
        </div>

        {/* MCQ OPTIONS */}
        {q.question_type === 'MCQ' && q.options && (
          <div className="space-y-2.5">
            {q.options.map((opt) => {
              let optStyle = 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20 cursor-pointer'
              if (selected === opt.id && answerState === 'correct') {
                optStyle = 'bg-green-950 border-green-600 cursor-default'
              } else if (selected === opt.id && answerState === 'wrong') {
                optStyle = 'bg-red-950 border-red-600 cursor-default'
              } else if (answerState !== 'unanswered' && opt.id === q.correct_option) {
                optStyle = 'bg-green-950 border-green-700 cursor-default opacity-90'
              } else if (answerState !== 'unanswered') {
                optStyle = 'bg-white/5 border-white/10 cursor-default opacity-50'
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer(opt.id)}
                  className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all ${optStyle}`}
                >
                  <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold mt-0.5 ${
                    selected === opt.id && answerState === 'correct' ? 'bg-green-600' :
                    selected === opt.id && answerState === 'wrong' ? 'bg-red-600' :
                    answerState !== 'unanswered' && opt.id === q.correct_option ? 'bg-green-700' :
                    'bg-white/10'
                  }`}>
                    {selected === opt.id && answerState === 'correct' ? '✓' :
                     selected === opt.id && answerState === 'wrong' ? '✗' :
                     answerState !== 'unanswered' && opt.id === q.correct_option ? '✓' :
                     opt.id}
                  </span>
                  <span className="text-sm leading-relaxed">{opt.text}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* EXPLANATION (shown after answer) */}
        {showExplanation && (
          <div className={`rounded-2xl border p-5 space-y-4 ${
            answerState === 'correct'
              ? 'bg-green-950/50 border-green-800'
              : 'bg-red-950/50 border-red-800'
          }`}>
            {/* Result header */}
            <div className="flex items-center gap-2">
              <span className="text-xl">{answerState === 'correct' ? '✅' : '❌'}</span>
              <span className="font-bold">
                {answerState === 'correct' ? `Correct! +${q.difficulty === 'Tier3_Integration' ? 35 : q.difficulty === 'Tier2_Application' ? 20 : 10} XP` : 'Incorrect'}
              </span>
            </div>

            {/* Explanation */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Explanation</div>
              <p className="text-sm leading-relaxed text-slate-200">{q.explanation}</p>
            </div>

            {/* Mechanism */}
            {q.explanation_mechanism && (
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">The Mechanism</div>
                <p className="text-sm text-slate-300">{q.explanation_mechanism}</p>
              </div>
            )}

            {/* High-yield pearl */}
            {q.high_yield_pearl && (
              <div className="bg-yellow-950 border border-yellow-800 rounded-xl p-3">
                <p className="text-sm text-yellow-200 font-medium">{q.high_yield_pearl}</p>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {q.tags?.map(tag => (
                <span key={tag} className="text-xs bg-white/10 rounded-full px-2 py-0.5 text-slate-400">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* NEXT BUTTON */}
        {showExplanation && (
          <button
            onClick={handleNext}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors"
          >
            {currentIdx >= questions.length - 1 ? 'Finish Session →' : 'Next Question →'}
          </button>
        )}

        {/* Flag button */}
        {answerState !== 'unanswered' && (
          <button className="w-full text-slate-600 hover:text-slate-400 text-xs py-2 transition-colors">
            🚩 Flag this question for review
          </button>
        )}
      </div>
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
      <QuizEngine />
    </Suspense>
  )
}
