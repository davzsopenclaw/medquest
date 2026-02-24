import { Question } from './supabase'

// In development: load questions from local JSON files via API route
// In production: load from Supabase

const IS_DEV = process.env.NODE_ENV === 'development' || typeof window === 'undefined'

// Client-side question store
let questionCache: Question[] | null = null

export async function loadQuestions(): Promise<Question[]> {
  if (questionCache) return questionCache
  
  try {
    const res = await fetch('/api/questions')
    if (!res.ok) throw new Error('Failed to load questions')
    const data = await res.json()
    questionCache = data.questions
    return questionCache!
  } catch {
    console.warn('API load failed, using bundled questions')
    return getBundledQuestions()
  }
}

export function getQuestionsBySystem(questions: Question[], system: string): Question[] {
  return questions.filter(q => q.system === system)
}

export function getQuestionsByDifficulty(questions: Question[], difficulty: string): Question[] {
  return questions.filter(q => q.difficulty === difficulty)
}

export function getHighYieldQuestions(questions: Question[], minScore: number = 3): Question[] {
  return questions
    .filter(q => q.pyp_frequency >= minScore)
    .sort((a, b) => b.high_yield_score - a.high_yield_score)
}

export function getWeakestTopics(
  questions: Question[], 
  attempts: Map<string, { correct: number; total: number }>
): Question[] {
  // Sort questions by lowest user accuracy per topic
  return questions.sort((a, b) => {
    const aAttempt = attempts.get(a.topic) || { correct: 0, total: 0 }
    const bAttempt = attempts.get(b.topic) || { correct: 0, total: 0 }
    const aAcc = aAttempt.total > 0 ? aAttempt.correct / aAttempt.total : 0
    const bAcc = bAttempt.total > 0 ? bAttempt.correct / bAttempt.total : 0
    return aAcc - bAcc // lowest accuracy first
  })
}

export function buildDailyRecommendation(
  questions: Question[],
  attempts: Map<string, { correct: number; total: number }>,
  count: number = 10
): Question[] {
  // Algorithm: 40% weak topics, 30% high yield unseen, 30% spaced review
  const weak = getWeakestTopics(questions, attempts).slice(0, Math.ceil(count * 0.4))
  
  const answeredIds = new Set([...attempts.keys()])
  const highYieldUnseen = getHighYieldQuestions(questions)
    .filter(q => !answeredIds.has(q.id))
    .slice(0, Math.ceil(count * 0.3))
  
  const review = questions
    .filter(q => answeredIds.has(q.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, count - weak.length - highYieldUnseen.length)
  
  const combined = [...weak, ...highYieldUnseen, ...review]
  // Shuffle
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]]
  }
  return combined.slice(0, count)
}

// Bundled fallback questions (subset for when API is unavailable)
function getBundledQuestions(): Question[] {
  return [] // Will be populated by the generated data
}
