#!/usr/bin/env tsx
/**
 * AI Question Generator
 * Generates new YLL-style questions from the Anki knowledge base
 * following the exact YLL exam DNA (vignette → question → 5 options → mechanism explanation)
 * 
 * Usage: npx tsx scripts/generate-questions.ts --system Renal --count 20
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Load Anki deck knowledge base
function loadAnkiKnowledge(system?: string): string {
  const ankiPath = path.join(__dirname, '../data/anki/M1_Anki_Deck.txt')
  if (!fs.existsSync(ankiPath)) {
    console.warn('⚠️  Anki deck not found. Run: gog drive download 1OdRoO_XwlMYd5g3tnLt70n-XfLvZVct9 --out data/anki/M1_Anki_Deck.txt')
    return ''
  }
  const content = fs.readFileSync(ankiPath, 'utf-8')
  
  if (!system) return content.substring(0, 30000)
  
  // Filter to relevant cards
  const systemKeywords: Record<string, string[]> = {
    Renal: ['renal', 'kidney', 'nephro', 'glomerul', 'tubul', 'nephrotic', 'nephritic', 'GFR', 'AKI', 'CKD', 'dialysis', 'UTI', 'ureter', 'bladder'],
    Blood: ['anaemia', 'anemia', 'haematol', 'coagulation', 'platelet', 'lymphoma', 'leukemia', 'leukaemia', 'haemoglobin', 'MCV', 'ferritin'],
    Cardiovascular: ['cardiac', 'heart', 'coronary', 'myocardial', 'ECG', 'arrhythmia', 'hypertension', 'atherosclerosis', 'aorta', 'valve'],
    Respiratory: ['lung', 'pulmonary', 'respiratory', 'asthma', 'COPD', 'pneumonia', 'pleural', 'spirometry'],
    Gastrointestinal: ['gastrointestinal', 'hepatic', 'liver', 'bowel', 'intestinal', 'colon', 'gastric', 'pancreatic', 'biliary'],
    Metabolism: ['diabetes', 'thyroid', 'metabolic', 'glucose', 'insulin', 'adrenal', 'hormones'],
    Immunology: ['immune', 'antibody', 'antigen', 'complement', 'lymphocyte', 'cytokine', 'MHC', 'autoimmune'],
  }
  
  const keywords = systemKeywords[system] || []
  if (keywords.length === 0) return content.substring(0, 20000)
  
  const lines = content.split('\n')
  const relevant = lines.filter(line => 
    keywords.some(kw => line.toLowerCase().includes(kw.toLowerCase()))
  )
  
  return relevant.slice(0, 500).join('\n')
}

const YLL_QUESTION_RULES = `
YLL EXAM QUESTION RULES (follow exactly):

FORMAT:
- Vignette: 2-4 sentences. Always start with "A [age]-year-old [gender] presents with..."
- Always include: age, gender, presenting symptom, relevant history, ONE key vital sign or lab result
- Question: "What is the most likely [diagnosis/mechanism/drug/complication]?"
- Options: EXACTLY 5 options (A-E). One clearly correct. Others are plausible but wrong.
- Never make options obviously wrong — all 5 must require actual knowledge to differentiate

YLL TWISTS (use at least one):
1. "The Distractor Comorbidity": Patient has asthma + HTN → avoid beta-blockers → force diuretic/ACEi choice
2. "Mechanism over rote": Don't ask "drug for X?" — ask "which drug works via [mechanism]?"
3. "Time-based trap": Distinguishing acute vs. chronic presentations, or immediate vs delayed treatment
4. "The Look-alike": Two conditions with similar presentations (IgA nepho vs post-infectious GN)
5. "Lab + Symptom Integration": Combine clinical + lab → unique diagnosis

DIFFICULTY DISTRIBUTION (aim for):
- 20% Tier1_Recall (direct fact)
- 50% Tier2_Application (clinical reasoning)  
- 30% Tier3_Integration (multi-step: vignette → diagnosis → mechanism → drug effect)

EXPLANATION REQUIREMENTS:
- Why the correct answer is correct (1-2 sentences)
- Why each major wrong answer is wrong (address the top 2 distractors)
- The mechanism in plain language
- A ⚡ High-Yield Pearl: one-liner that encodes the key fact memorably
`

async function generateQuestions(
  system: string,
  count: number,
  ankiKnowledge: string,
  existingQuestions: string[]
): Promise<ParsedQuestion[]> {
  console.log(`🤖 Generating ${count} ${system} questions...`)
  
  const prompt = `You are a medical education expert creating exam questions for NUS Yong Loo Lin School of Medicine (YLL) Year 1 (M1) students.

${YLL_QUESTION_RULES}

KNOWLEDGE BASE (from YLL M1 Anki deck — use this content):
<anki_knowledge>
${ankiKnowledge.substring(0, 20000)}
</anki_knowledge>

SYSTEM FOCUS: ${system}

${existingQuestions.length > 0 ? `TOPICS ALREADY COVERED (don't repeat these exactly):
${existingQuestions.slice(0, 20).join(', ')}` : ''}

Generate exactly ${count} high-quality MCQ questions for the ${system} system.
Make them realistic YLL-style. Focus on HIGH-YIELD topics that are likely to appear in Phase I exams.

Return a JSON array where each object has:
{
  "question_type": "MCQ",
  "system": "${system}",
  "topic": "specific medical topic",
  "subtopic": "more specific subtopic",
  "vignette": "clinical scenario (2-4 sentences)",
  "question_text": "the question",
  "options": [
    {"id": "A", "text": "option A"},
    {"id": "B", "text": "option B"},
    {"id": "C", "text": "option C"},
    {"id": "D", "text": "option D"},
    {"id": "E", "text": "option E"}
  ],
  "correct_option": "B",
  "explanation": "comprehensive explanation including why wrong options are wrong",
  "explanation_mechanism": "the underlying pathophysiology/pharmacology",
  "high_yield_pearl": "⚡ memorable one-liner",
  "difficulty": "Tier2_Application",
  "tags": ["relevant", "tags"],
  "pyp_frequency": 2,
  "source_paper": "AI_Generated_${system}_${new Date().getFullYear()}",
  "source_year": ${new Date().getFullYear()}
}

IMPORTANT: Return ONLY the JSON array, no other text.`

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\[[\s\S]*\]/m)
  if (!jsonMatch) {
    console.error('Response preview:', content.text.substring(0, 300))
    throw new Error('No JSON array found in response')
  }

  const questions = JSON.parse(jsonMatch[0])
  console.log(`✅ Generated ${questions.length} questions`)
  return questions
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
  explanation: string
  explanation_mechanism?: string
  high_yield_pearl?: string
  difficulty: string
  tags: string[]
  pyp_frequency: number
  source_paper: string
  source_year: number
}

async function main() {
  const args = process.argv.slice(2)
  const systemArg = args[args.indexOf('--system') + 1] || 'Renal'
  const countArg = parseInt(args[args.indexOf('--count') + 1] || '20')
  const systems = systemArg === 'all' 
    ? ['Foundation', 'Blood', 'Cardiovascular', 'Renal', 'Respiratory', 'Gastrointestinal', 'Metabolism', 'Immunology']
    : [systemArg]

  const outputDir = path.join(__dirname, '../data/generated-questions')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  // Ensure anki data dir exists
  const ankiDir = path.join(__dirname, '../data/anki')
  if (!fs.existsSync(ankiDir)) fs.mkdirSync(ankiDir, { recursive: true })

  let allQuestions: ParsedQuestion[] = []

  for (const system of systems) {
    try {
      const ankiKnowledge = loadAnkiKnowledge(system)
      
      // Load existing questions to avoid duplication
      const existingTopics: string[] = []
      const existingFile = path.join(outputDir, `${system.toLowerCase()}.json`)
      if (fs.existsSync(existingFile)) {
        const existing = JSON.parse(fs.readFileSync(existingFile, 'utf-8'))
        existingTopics.push(...existing.map((q: ParsedQuestion) => q.topic))
      }
      
      const questions = await generateQuestions(system, countArg, ankiKnowledge, existingTopics)
      
      // Append to existing or create new
      let finalQuestions = questions
      if (fs.existsSync(existingFile)) {
        const existing = JSON.parse(fs.readFileSync(existingFile, 'utf-8'))
        finalQuestions = [...existing, ...questions]
      }
      
      const outputFile = path.join(outputDir, `${system.toLowerCase()}.json`)
      fs.writeFileSync(outputFile, JSON.stringify(finalQuestions, null, 2))
      
      allQuestions.push(...questions)
      console.log(`💾 Saved to ${outputFile} (total: ${finalQuestions.length} questions)`)
      
      // Rate limiting
      if (systems.length > 1) await new Promise(r => setTimeout(r, 2000))
      
    } catch (err) {
      console.error(`❌ Failed for ${system}:`, err)
    }
  }

  console.log(`\n🎉 Total generated: ${allQuestions.length} questions across ${systems.join(', ')}`)
  
  // Generate seed SQL for all
  const sqlOutput = path.join(outputDir, 'generated_seed.sql')
  const sql = allQuestions.map(q => `
INSERT INTO questions (question_type, system, topic, subtopic, vignette, question_text, options, correct_option, explanation, explanation_mechanism, high_yield_pearl, difficulty, tags, pyp_frequency, source_paper, source_year, source, is_verified) VALUES (
  '${q.question_type}', '${q.system}', '${(q.topic||'').replace(/'/g,"''")}',
  ${q.subtopic ? `'${q.subtopic.replace(/'/g,"''")}'` : 'NULL'},
  ${q.vignette ? `'${q.vignette.replace(/'/g,"''")}'` : 'NULL'},
  '${(q.question_text||'').replace(/'/g,"''")}',
  ${q.options ? `'${JSON.stringify(q.options)}'::jsonb` : 'NULL'},
  ${q.correct_option ? `'${q.correct_option}'` : 'NULL'},
  '${(q.explanation||'').replace(/'/g,"''")}',
  ${q.explanation_mechanism ? `'${q.explanation_mechanism.replace(/'/g,"''")}'` : 'NULL'},
  ${q.high_yield_pearl ? `'${q.high_yield_pearl.replace(/'/g,"''")}'` : 'NULL'},
  '${q.difficulty||'Tier2_Application'}',
  ARRAY[${(q.tags||[]).map(t=>`'${t}'`).join(',')}],
  ${q.pyp_frequency||1},
  '${q.source_paper}', ${q.source_year},
  'AI_Generated', FALSE
);`).join('\n')
  
  fs.writeFileSync(sqlOutput, sql)
  console.log(`🗃️  SQL seed saved to ${sqlOutput}`)
}

main().catch(console.error)
