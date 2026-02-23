#!/usr/bin/env tsx
/**
 * YLL Past Year Paper PDF Parser
 * Downloads PDFs from Google Drive and extracts MCQ/MEQ questions
 * using Claude to structure them into the database format.
 * 
 * Usage: npx tsx scripts/parse-pyp.ts --file <drive-file-id> --system Renal
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// The Drive files we know about
const DRIVE_FILES: Record<string, { id: string; system: string; year: number; paper: string }> = {
  'foundation': { id: '1MyjzfOmNWeqqUyGjDi2W67puNu7xVIqL', system: 'Foundation', year: 2025, paper: 'Foundation-For-Release-v2' },
  'blood': { id: '1fnCO_7jYdVaxYlwVO6GTGRsVLnnL6trA', system: 'Blood', year: 2025, paper: 'Blood-System-For-Release' },
  'cvs': { id: '1qMYi7pGZkQUx2Kbd4BTrOtPRQD2Nz6qh', system: 'Cardiovascular', year: 2025, paper: 'CVS-For-Release' },
  'renal': { id: '1h9gwsqLMhMiwfr-Vn-tJD9ywZglne4ID', system: 'Renal', year: 2025, paper: 'Renal-System-For-Release' },
  'respiratory': { id: '1nw-tvCoFvis3VfBf1_WyQgxmXQwVJGaL', system: 'Respiratory', year: 2025, paper: 'Respiratory-System-For-Release' },
  'git': { id: '1bGdkDesPc17NZUqqtTiYqSh6gXioQmiH', system: 'Gastrointestinal', year: 2025, paper: 'GIT-For-Release' },
  'metabolism': { id: '175SpTDnLx6TqPZ-FO-nLWX6PsrEMF8bD', system: 'Metabolism', year: 2025, paper: 'Metabolism-For-Release' },
  'mcq1': { id: '1oJUjBpCk58XuiJWJC8xbytB27swSg7Sx', system: 'Mixed', year: 2025, paper: 'Practice-MCQ1-Nov-2025' },
  'mcq2': { id: '15V22oyovtZc7mFAWxydqUfXypyWe_l_b', system: 'Mixed', year: 2025, paper: 'Practice-MCQ2-Nov-2025' },
  'debrief': { id: '1wfysItFPHHqKGRVbZqu627DgkKlrTP5I', system: 'Mixed', year: 2023, paper: 'AY2324-Phase-I-EOY-Debrief' },
}

async function downloadFromDrive(fileId: string, outputPath: string): Promise<void> {
  console.log(`📥 Downloading ${fileId} from Google Drive...`)
  try {
    execSync(`gog drive download ${fileId} --out "${outputPath}" --account davzclawde@gmail.com`, {
      stdio: 'inherit',
      timeout: 120000,
    })
  } catch {
    // Fallback: try direct download via API
    throw new Error(`Failed to download file ${fileId}`)
  }
}

async function extractTextFromPDF(pdfPath: string): Promise<string> {
  console.log(`📄 Extracting text from ${path.basename(pdfPath)}...`)
  // Use pdftotext if available, otherwise pdf-parse
  try {
    const text = execSync(`pdftotext "${pdfPath}" -`, { maxBuffer: 10 * 1024 * 1024 }).toString()
    return text
  } catch {
    // Fallback to pdf-parse
    const pdfParse = require('pdf-parse')
    const buffer = fs.readFileSync(pdfPath)
    const data = await pdfParse(buffer)
    return data.text
  }
}

async function parseQuestionsWithClaude(
  text: string,
  system: string,
  paper: string,
  year: number
): Promise<ParsedQuestion[]> {
  console.log(`🤖 Parsing questions with Claude (${system})...`)
  
  const prompt = `You are parsing a NUS Yong Loo Lin School of Medicine (YLL) past year paper into structured question data.

The paper is: "${paper}" (System: ${system}, Year: ${year})

YLL uses these question formats:
1. MCQ (Single Best Answer): Clinical vignette (2-4 sentences) followed by a question and 5 options (A-E). One correct answer.
2. MEQ (Modified Essay Question): Extended clinical scenario with multiple sub-questions.

Here is the extracted PDF text:
<text>
${text.substring(0, 50000)}
</text>

Extract ALL questions from this text. For each question, return a JSON object with this structure:
{
  "question_type": "MCQ" or "MEQ",
  "system": "${system}",
  "topic": "specific topic (e.g. 'IgA Nephropathy', 'Acute MI', 'Heart Failure')",
  "subtopic": "more specific subtopic if applicable",
  "vignette": "the clinical scenario text (null if none)",
  "question_text": "the actual question being asked",
  "options": [{"id": "A", "text": "..."}, ...] (null for MEQ),
  "correct_option": "A/B/C/D/E" (null for MEQ or if answer key not present),
  "meq_model_answer": "model answer for MEQ (null for MCQ)",
  "meq_total_marks": number (null for MCQ),
  "explanation": "your detailed explanation of why the correct answer is correct",
  "explanation_mechanism": "the underlying mechanism/pathophysiology",
  "high_yield_pearl": "the most important one-liner to remember, starting with ⚡",
  "difficulty": "Tier1_Recall" or "Tier2_Application" or "Tier3_Integration",
  "tags": ["tag1", "tag2"],
  "pyp_frequency": 1,
  "source_paper": "${paper}",
  "source_year": ${year},
  "has_image": true/false (if the question refers to a figure/image/slide)
}

Classify difficulty as:
- Tier1_Recall: Direct factual recall, no clinical reasoning needed
- Tier2_Application: Requires applying knowledge to diagnose or reason
- Tier3_Integration: Multi-step reasoning, mechanisms, drug interactions

Return a JSON array of all parsed questions. Be thorough — extract every question you can find.`

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  // Extract JSON from response
  const jsonMatch = content.text.match(/\[[\s\S]*\]/m)
  if (!jsonMatch) {
    console.error('Raw response:', content.text.substring(0, 500))
    throw new Error('Could not find JSON array in response')
  }

  const parsed = JSON.parse(jsonMatch[0])
  console.log(`✅ Parsed ${parsed.length} questions from ${paper}`)
  return parsed
}

interface ParsedQuestion {
  question_type: string
  system: string
  topic: string
  subtopic?: string
  vignette?: string
  question_text: string
  options?: { id: string; text: string }[]
  correct_option?: string
  meq_model_answer?: string
  meq_total_marks?: number
  explanation: string
  explanation_mechanism?: string
  high_yield_pearl?: string
  difficulty: string
  tags: string[]
  pyp_frequency: number
  source_paper: string
  source_year: number
  has_image?: boolean
}

async function saveQuestions(questions: ParsedQuestion[], outputFile: string): Promise<void> {
  fs.writeFileSync(outputFile, JSON.stringify(questions, null, 2))
  console.log(`💾 Saved ${questions.length} questions to ${outputFile}`)
}

async function generateSupabaseInserts(questions: ParsedQuestion[]): Promise<string> {
  const inserts = questions.map(q => `
INSERT INTO questions (
  question_type, system, topic, subtopic, vignette, question_text,
  options, correct_option, meq_model_answer, meq_total_marks,
  explanation, explanation_mechanism, high_yield_pearl,
  difficulty, tags, pyp_frequency, source_paper, source_year, is_verified
) VALUES (
  '${q.question_type}',
  '${q.system}',
  '${(q.topic || '').replace(/'/g, "''")}',
  ${q.subtopic ? `'${q.subtopic.replace(/'/g, "''")}'` : 'NULL'},
  ${q.vignette ? `'${q.vignette.replace(/'/g, "''")}'` : 'NULL'},
  '${(q.question_text || '').replace(/'/g, "''")}',
  ${q.options ? `'${JSON.stringify(q.options)}'::jsonb` : 'NULL'},
  ${q.correct_option ? `'${q.correct_option}'` : 'NULL'},
  ${q.meq_model_answer ? `'${q.meq_model_answer.replace(/'/g, "''")}'` : 'NULL'},
  ${q.meq_total_marks || 'NULL'},
  '${(q.explanation || '').replace(/'/g, "''")}',
  ${q.explanation_mechanism ? `'${q.explanation_mechanism.replace(/'/g, "''")}'` : 'NULL'},
  ${q.high_yield_pearl ? `'${q.high_yield_pearl.replace(/'/g, "''")}'` : 'NULL'},
  '${q.difficulty || 'Tier2_Application'}',
  ARRAY[${(q.tags || []).map(t => `'${t}'`).join(',')}],
  ${q.pyp_frequency || 1},
  '${q.source_paper}',
  ${q.source_year},
  FALSE
);`).join('\n')
  return inserts
}

// MAIN
async function main() {
  const args = process.argv.slice(2)
  const fileKey = args[args.indexOf('--file') + 1] || 'renal'
  
  if (fileKey === 'all') {
    // Parse all files
    for (const [key, info] of Object.entries(DRIVE_FILES)) {
      await processFile(key, info)
    }
  } else if (DRIVE_FILES[fileKey]) {
    await processFile(fileKey, DRIVE_FILES[fileKey])
  } else {
    console.error(`Unknown file key: ${fileKey}. Available: ${Object.keys(DRIVE_FILES).join(', ')}`)
    process.exit(1)
  }
}

async function processFile(key: string, info: typeof DRIVE_FILES[string]) {
  const tmpDir = '/tmp/medquest-pdfs'
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
  
  const pdfPath = path.join(tmpDir, `${key}.pdf`)
  const outputDir = path.join(__dirname, '../data/parsed-questions')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
  
  try {
    // Download
    await downloadFromDrive(info.id, pdfPath)
    
    // Extract text
    const text = await extractTextFromPDF(pdfPath)
    console.log(`📝 Extracted ${text.length} characters`)
    
    // Parse with Claude
    const questions = await parseQuestionsWithClaude(text, info.system, info.paper, info.year)
    
    // Save JSON
    const jsonOutput = path.join(outputDir, `${key}.json`)
    await saveQuestions(questions, jsonOutput)
    
    // Generate SQL
    const sql = await generateSupabaseInserts(questions)
    const sqlOutput = path.join(outputDir, `${key}.sql`)
    fs.writeFileSync(sqlOutput, sql)
    console.log(`🗃️  SQL inserts saved to ${sqlOutput}`)
    
    console.log(`\n✅ ${key}: ${questions.length} questions parsed`)
    console.log(`   MCQ: ${questions.filter(q => q.question_type === 'MCQ').length}`)
    console.log(`   MEQ: ${questions.filter(q => q.question_type === 'MEQ').length}`)
    
  } finally {
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath)
  }
}

main().catch(console.error)
