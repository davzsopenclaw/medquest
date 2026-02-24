import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const system = url.searchParams.get('system')
  const difficulty = url.searchParams.get('difficulty')
  
  // Load questions from all JSON files in data directories
  const dataDir = path.join(process.cwd(), 'data')
  const dirs = ['parsed-questions', 'generated-questions']
  
  let allQuestions: Record<string, unknown>[] = []
  
  for (const dir of dirs) {
    const dirPath = path.join(dataDir, dir)
    if (!fs.existsSync(dirPath)) continue
    
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'))
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(dirPath, file), 'utf-8')
        const questions = JSON.parse(content)
        if (Array.isArray(questions)) {
          allQuestions.push(...questions)
        }
      } catch (e) {
        console.error(`Error loading ${file}:`, e)
      }
    }
  }
  
  // Filter
  if (system) {
    allQuestions = allQuestions.filter(q => q.system === system)
  }
  if (difficulty) {
    allQuestions = allQuestions.filter(q => q.difficulty === difficulty)
  }
  
  return NextResponse.json({
    questions: allQuestions,
    count: allQuestions.length,
    systems: [...new Set(allQuestions.map(q => q.system))],
  })
}
