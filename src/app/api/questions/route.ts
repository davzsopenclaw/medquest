import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

// Normalize options: accept both object {"A":"text"} and array [{id,text}] formats
// Always output array format [{id, text}]
function normalizeOptions(opts: unknown): { id: string; text: string }[] {
  if (Array.isArray(opts)) {
    return opts.map((o: { id?: string; text?: string }, i: number) => ({
      id: o.id || String.fromCharCode(65 + i),
      text: o.text || String(o),
    }))
  }
  if (opts && typeof opts === 'object') {
    return Object.entries(opts as Record<string, string>).map(([key, val]) => ({
      id: key,
      text: String(val),
    }))
  }
  return []
}

// Normalize pyp_frequency to a number
function normalizePypFreq(val: unknown): number {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const map: Record<string, number> = { 'Low': 1, 'Medium': 3, 'High': 5, 'Very High': 7 }
    return map[val] ?? (parseInt(val, 10) || 0)
  }
  return 0
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const system = url.searchParams.get('system')
  const difficulty = url.searchParams.get('difficulty')
  
  // Load questions from the unified JSON file
  const dataPath = path.join(process.cwd(), 'data', 'all_questions.json')
  
  let allQuestions: Record<string, unknown>[] = []
  
  try {
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf-8')
      const questions = JSON.parse(content)
      if (Array.isArray(questions)) {
        allQuestions = questions
      }
    } else {
      console.warn('all_questions.json not found')
    }
  } catch (e) {
    console.error(`Error loading all_questions.json:`, e)
  }
  
  // Filter
  if (system) {
    allQuestions = allQuestions.filter(q => q.system === system)
  }
  if (difficulty) {
    allQuestions = allQuestions.filter(q => q.difficulty === difficulty)
  }

  // Remove malformed questions (no question text, no options, no correct answer)
  allQuestions = allQuestions.filter(q =>
    q.question_text &&
    q.options &&
    q.correct_option &&
    q.id
  )

  // Normalize every question
  const normalized = allQuestions.map(q => ({
    ...q,
    options: normalizeOptions(q.options),
    pyp_frequency: normalizePypFreq(q.pyp_frequency),
    tags: Array.isArray(q.tags) ? q.tags : [],
    question_type: q.question_type || 'MCQ',
    vignette: q.vignette || '',
    explanation: q.explanation || '',
    explanation_mechanism: q.explanation_mechanism || '',
    high_yield_pearl: q.high_yield_pearl || '',
  }))
  
  return NextResponse.json({
    questions: normalized,
    count: normalized.length,
    systems: [...new Set(allQuestions.map(q => q.system))],
  })
}
