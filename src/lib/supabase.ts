import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    _supabase = createClient(url, key)
  }
  return _supabase
}

export type QuestionSystem = 
  | 'Foundation' | 'Blood' | 'Cardiovascular' | 'Renal' 
  | 'Respiratory' | 'Gastrointestinal' | 'Metabolism' 
  | 'Immunology' | 'Pharmacology' | 'Pathology' | 'Mixed'

export type DifficultyTier = 'Tier1_Recall' | 'Tier2_Application' | 'Tier3_Integration'
export type QuestionType = 'MCQ' | 'MEQ'
export type MasteryLevel = 'unstarted' | 'learning' | 'familiar' | 'mastered'

export interface Question {
  id: string
  question_type: QuestionType
  system: QuestionSystem
  topic: string
  subtopic?: string
  vignette?: string
  question_text: string
  image_url?: string
  image_caption?: string
  options?: { id: string; text: string }[]
  correct_option?: string
  meq_model_answer?: string
  meq_total_marks?: number
  explanation: string
  explanation_mechanism?: string
  high_yield_pearl?: string
  difficulty: DifficultyTier
  source: string
  tags?: string[]
  pyp_frequency: number
  high_yield_score: number
}

export interface Profile {
  id: string
  email: string
  display_name?: string
  xp: number
  level: number
  streak_current: number
  streak_longest: number
  questions_answered: number
  questions_correct: number
}

export interface TopicMastery {
  system: QuestionSystem
  topic: string
  attempts: number
  correct: number
  mastery_score: number
  mastery_level: MasteryLevel
  next_review_date?: string
}

// XP required per level: level^2 * 100
export function xpForLevel(level: number): number {
  return level * level * 100
}

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1)
}

export function xpProgressInLevel(xp: number): { current: number; needed: number; percent: number } {
  const level = levelFromXp(xp)
  const levelStart = xpForLevel(level - 1)
  const levelEnd = xpForLevel(level)
  const current = xp - levelStart
  const needed = levelEnd - levelStart
  return { current, needed, percent: Math.round((current / needed) * 100) }
}

export const LEVEL_TITLES = [
  'Medical Student',   // 1-4
  'House Officer',     // 5-9
  'Medical Officer',   // 10-14
  'Registrar',         // 15-19
  'Senior Registrar',  // 20-24
  'Consultant',        // 25+
]

export function getLevelTitle(level: number): string {
  if (level < 5) return LEVEL_TITLES[0]
  if (level < 10) return LEVEL_TITLES[1]
  if (level < 15) return LEVEL_TITLES[2]
  if (level < 20) return LEVEL_TITLES[3]
  if (level < 25) return LEVEL_TITLES[4]
  return LEVEL_TITLES[5]
}

export const SYSTEM_COLORS: Record<QuestionSystem, string> = {
  Foundation: 'bg-purple-100 text-purple-800 border-purple-200',
  Blood: 'bg-red-100 text-red-800 border-red-200',
  Cardiovascular: 'bg-pink-100 text-pink-800 border-pink-200',
  Renal: 'bg-blue-100 text-blue-800 border-blue-200',
  Respiratory: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  Gastrointestinal: 'bg-orange-100 text-orange-800 border-orange-200',
  Metabolism: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Immunology: 'bg-green-100 text-green-800 border-green-200',
  Pharmacology: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Pathology: 'bg-gray-100 text-gray-800 border-gray-200',
  Mixed: 'bg-slate-100 text-slate-800 border-slate-200',
}

export const SYSTEM_ICONS: Record<QuestionSystem, string> = {
  Foundation: '🧬',
  Blood: '🩸',
  Cardiovascular: '🫀',
  Renal: '🫘',
  Respiratory: '🫁',
  Gastrointestinal: '🦠',
  Metabolism: '⚡',
  Immunology: '🛡️',
  Pharmacology: '💊',
  Pathology: '🔬',
  Mixed: '🎲',
}

export const DIFFICULTY_CONFIG: Record<DifficultyTier, { label: string; color: string; xp: number }> = {
  Tier1_Recall: { label: 'Recall', color: 'text-green-600 bg-green-50', xp: 10 },
  Tier2_Application: { label: 'Application', color: 'text-amber-600 bg-amber-50', xp: 20 },
  Tier3_Integration: { label: 'Integration', color: 'text-red-600 bg-red-50', xp: 35 },
}
