'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

/* eslint-disable @typescript-eslint/no-explicit-any */

type AnswerState = 'unanswered' | 'correct' | 'wrong'

// Safe string helper – never returns an object
function s(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return ''
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Normalize a raw question from the API into a safe shape
function normalize(raw: any): any {
  const opts = Array.isArray(raw.options)
    ? raw.options.map((o: any) => ({ id: s(o.id), text: s(o.text) }))
    : typeof raw.options === 'object' && raw.options
      ? Object.entries(raw.options).map(([k, v]) => ({ id: s(k), text: s(v) }))
      : []

  return {
    id: s(raw.id),
    question_type: s(raw.question_type) || 'MCQ',
    system: s(raw.system) || 'General',
    topic: s(raw.topic) || '',
    subtopic: s(raw.subtopic) || '',
    vignette: s(raw.vignette),
    question_text: s(raw.question_text),
    image_url: s(raw.image_url),
    image_caption: s(raw.image_caption),
    options: opts,
    correct_option: s(raw.correct_option),
    explanation: s(raw.explanation),
    explanation_mechanism: s(raw.explanation_mechanism),
    high_yield_pearl: s(raw.high_yield_pearl),
    difficulty: s(raw.difficulty),
    tags: Array.isArray(raw.tags) ? raw.tags.map(s) : [],
    pyp_frequency: typeof raw.pyp_frequency === 'number' ? raw.pyp_frequency : 0,
  }
}

// Difficulty display config
function getDifficulty(d: string): { label: string; color: string } {
  const lower = d.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (lower.includes('3') || lower.includes('integration')) {
    return { label: 'Integration', color: 'text-red-400 bg-red-950 border-red-800' }
  }
  if (lower.includes('2') || lower.includes('application') || lower.includes('comprehension')) {
    return { label: 'Application', color: 'text-amber-400 bg-amber-950 border-amber-800' }
  }
  if (lower.includes('1') || lower.includes('recall')) {
    return { label: 'Recall', color: 'text-green-400 bg-green-950 border-green-800' }
  }
  return { label: 'Standard', color: 'text-slate-400 bg-slate-800 border-slate-700' }
}

function QuizEngine() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') || 'practice'
  const system = searchParams.get('system') || null
  const countParam = searchParams.get('count')
  const sessionSize = countParam ? parseInt(countParam, 10) : 20

  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered')
  const [showExplanation, setShowExplanation] = useState(false)
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0, xp: 0 })
  const [timeLeft, setTimeLeft] = useState<number | null>(mode === 'timed' ? 2400 : null)
  const [finished, setFinished] = useState(false)
  const explanationRef = useRef<HTMLDivElement>(null)

  // Fetch questions
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const params = new URLSearchParams()
        if (system) params.set('system', system)
        const res = await fetch(`/api/questions?${params.toString()}`)
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data = await res.json()
        const raw: any[] = data.questions || []
        // Normalize and validate
        const valid = raw
          .map(normalize)
          .filter((q: any) => q.question_text && q.options.length > 0 && q.correct_option)
        if (!cancelled) {
          if (valid.length === 0) {
            setError('No questions found. Try a different system.')
          } else {
            setQuestions(shuffle(valid).slice(0, sessionSize))
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load questions')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [system, sessionSize])

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft !== null && timeLeft <= 0) setFinished(true)
      return
    }
    const t = setTimeout(() => setTimeLeft(prev => (prev ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft])

  // Keyboard hotkeys: 1-5 to answer, Space to continue
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const q = questions[currentIdx]
      if (!q) return

      // Number keys 1-5 to select an option
      if (answerState === 'unanswered' && e.key >= '1' && e.key <= '5') {
        const idx = parseInt(e.key) - 1
        if (idx < q.options.length) {
          e.preventDefault()
          handleAnswer(q.options[idx].id)
          // Auto-scroll to explanation after a short delay
          setTimeout(() => {
            explanationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        }
      }

      // Space to go to next question (when explanation is showing)
      if (e.key === ' ' && showExplanation) {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [questions, currentIdx, answerState, showExplanation])

  // Early returns
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-pulse">🧠</div>
          <p className="text-slate-400">Loading questions...</p>
        </div>
      </div>
    )
  }

  const q = questions[currentIdx]

  if (error || !q) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-4xl">😕</div>
          <p className="text-slate-300">{error || 'No questions available.'}</p>
          <button onClick={() => router.push('/dashboard')} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const sec = (secs % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const handleAnswer = (optionId: string) => {
    if (answerState !== 'unanswered') return
    setSelected(optionId)
    const isCorrect = optionId === q.correct_option
    setAnswerState(isCorrect ? 'correct' : 'wrong')
    setShowExplanation(true)
    const diff = getDifficulty(q.difficulty)
    const xpEarned = isCorrect
      ? (diff.label === 'Integration' ? 35 : diff.label === 'Application' ? 20 : 10)
      : 0
    setSessionScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
      xp: prev.xp + xpEarned,
    }))
    // Auto-scroll to explanation
    setTimeout(() => {
      explanationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleNext = () => {
    if (currentIdx >= questions.length - 1) {
      setFinished(true)
      return
    }
    setCurrentIdx(i => i + 1)
    setSelected(null)
    setAnswerState('unanswered')
    setShowExplanation(false)
  }

  const diff = getDifficulty(q.difficulty)

  if (finished) {
    const accuracy = sessionScore.total > 0 ? Math.round((sessionScore.correct / sessionScore.total) * 100) : 0
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-7xl mb-6">{accuracy >= 70 ? '🎉' : '📚'}</div>
          <h1 className="text-3xl font-black mb-2">Session Complete!</h1>
          <p className="text-slate-400 mb-8">{"Here's how you did"}</p>

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
                {"🎖️ Accuracy Ace badge progress: "}{accuracy}{"% ≥ 90% ✓"}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 border border-white/20 hover:bg-white/5 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              New Session
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
          {q.topic && (
            <span className="text-xs border rounded-full px-3 py-1 bg-slate-800 border-slate-700 text-slate-300">
              {q.topic}
            </span>
          )}
          <span className={`text-xs border rounded-full px-3 py-1 ${diff.color}`}>
            {diff.label}
          </span>
          {q.pyp_frequency >= 3 && (
            <span className="text-xs border rounded-full px-3 py-1 bg-orange-950 border-orange-800 text-orange-300">
              {"🎯 High Yield ×"}{q.pyp_frequency}
            </span>
          )}
        </div>

        {/* VIGNETTE */}
        {q.vignette ? (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Clinical Scenario</div>
            <p className="text-slate-200 leading-relaxed text-sm md:text-base">{q.vignette}</p>
          </div>
        ) : null}

        {/* IMAGE */}
        {q.image_url ? (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 text-center">
            <img src={q.image_url} alt={q.image_caption || 'Question image'} className="max-w-full rounded-xl mx-auto" />
            {q.image_caption ? <p className="text-xs text-slate-500 mt-2">{q.image_caption}</p> : null}
          </div>
        ) : null}

        {/* QUESTION */}
        <div>
          <h2 className="text-base md:text-lg font-semibold leading-relaxed">{q.question_text}</h2>
        </div>

        {/* OPTIONS */}
        <div className="space-y-2.5">
          {q.options.map((opt: any) => {
            let optStyle = 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer'
            if (selected === opt.id && answerState === 'correct') {
              optStyle = 'bg-green-950 border-green-600 cursor-default'
            } else if (selected === opt.id && answerState === 'wrong') {
              optStyle = 'bg-red-950 border-red-600 cursor-default'
            } else if (answerState !== 'unanswered' && opt.id === q.correct_option) {
              optStyle = 'bg-green-950 border-green-700 cursor-default opacity-90'
            } else if (answerState !== 'unanswered') {
              optStyle = 'bg-white/5 border-white/10 cursor-default opacity-50'
            }

            const iconClass =
              selected === opt.id && answerState === 'correct' ? 'bg-green-600' :
              selected === opt.id && answerState === 'wrong' ? 'bg-red-600' :
              answerState !== 'unanswered' && opt.id === q.correct_option ? 'bg-green-700' :
              'bg-white/10'

            const iconText =
              selected === opt.id && answerState === 'correct' ? '✓' :
              selected === opt.id && answerState === 'wrong' ? '✗' :
              answerState !== 'unanswered' && opt.id === q.correct_option ? '✓' :
              opt.id

            return (
              <button
                key={opt.id}
                onClick={() => handleAnswer(opt.id)}
                className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all ${optStyle}`}
              >
                <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold mt-0.5 ${iconClass}`}>
                  {iconText}
                </span>
                <span className="text-sm leading-relaxed">{opt.text}</span>
              </button>
            )
          })}
        </div>

        {/* EXPLANATION */}
        {showExplanation && (
          <div ref={explanationRef} className={`rounded-2xl border p-5 space-y-4 ${
            answerState === 'correct' ? 'bg-green-950/50 border-green-800' : 'bg-red-950/50 border-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{answerState === 'correct' ? '✅' : '❌'}</span>
              <span className="font-bold">
                {answerState === 'correct'
                  ? `Correct! +${diff.label === 'Integration' ? 35 : diff.label === 'Application' ? 20 : 10} XP`
                  : 'Incorrect'}
              </span>
            </div>

            {q.explanation ? (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Explanation</div>
                <p className="text-sm leading-relaxed text-slate-200">{q.explanation}</p>
              </div>
            ) : null}

            {q.explanation_mechanism ? (
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">The Mechanism</div>
                <p className="text-sm text-slate-300">{q.explanation_mechanism}</p>
              </div>
            ) : null}

            {q.high_yield_pearl ? (
              <div className="bg-yellow-950 border border-yellow-800 rounded-xl p-3">
                <p className="text-sm text-yellow-200 font-medium">{q.high_yield_pearl}</p>
              </div>
            ) : null}

            {q.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {q.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-white/10 rounded-full px-2 py-0.5 text-slate-400">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NEXT */}
        {showExplanation && (
          <button
            onClick={handleNext}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors"
          >
            {currentIdx >= questions.length - 1 ? 'Finish Session →' : 'Next Question →'}
          </button>
        )}

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
