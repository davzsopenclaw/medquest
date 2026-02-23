# MedQuest — YLL Gamified Revision Platform

Gamified medical revision platform for NUS Yong Loo Lin School of Medicine M1 students.

## Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS → Vercel (free)
- **Database:** Supabase (PostgreSQL + Auth + Storage) → free tier
- **AI:** Claude API for question generation and PDF parsing
- **Auth:** Supabase magic link, restricted to @u.nus.edu + admin whitelist

## Setup

### 1. Create Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your `Project URL` and `anon key`
3. Run `supabase-schema.sql` in the Supabase SQL Editor

### 2. Set environment variables
```bash
cp .env.example .env.local
# Fill in your Supabase URL, anon key, and Anthropic API key
```

### 3. Run dev server
```bash
npm run dev
# http://localhost:3000
```

## Content Pipeline

### Parse PDFs from Google Drive
```bash
# Parse a specific system's past year papers
npm run parse-pyp -- --file renal
npm run parse-pyp -- --file cvs
npm run parse-pyp -- --file blood

# Parse all files at once
npm run parse-all
```

Available file keys: `foundation`, `blood`, `cvs`, `renal`, `respiratory`, `git`, `metabolism`, `mcq1`, `mcq2`, `debrief`

### Generate AI questions from Anki knowledge base
```bash
# First: download Anki deck
gog drive download 1OdRoO_XwlMYd5g3tnLt70n-XfLvZVct9 --out data/anki/M1_Anki_Deck.txt

# Generate 20 questions for a system
npm run generate -- --system Renal --count 20

# Generate for all systems
npm run generate-all
```

### Import questions to Supabase
After parsing, import the generated SQL files in Supabase SQL Editor:
```sql
-- Run the generated SQL files from data/parsed-questions/ or data/generated-questions/
```

## Features
- 📝 MCQ + MEQ question bank (real YLL past year papers)
- 🎮 XP, levels, streaks, badges, leaderboard
- 🧠 Topic mastery tracking with spaced repetition
- 🏥 Daily Grand Rounds — 10 personalized questions
- 🎯 High-yield weighting by PYP frequency
- 🔒 NUS email auth + admin whitelist
- 📱 Fully mobile responsive

## Deployment (Vercel)
```bash
npx vercel --prod
# Add env vars in Vercel dashboard
```

## Question Sources
1. YLL Phase I past year papers (parsed via Claude)
2. AI-generated questions in YLL style (from Anki knowledge base)
3. Student recalls (CA2 2025/26)

## Gamification
- **XP:** 10 (Recall) / 20 (Application) / 35 (Integration) per correct answer
- **Levels:** 1-25+ with titles from Med Student → Consultant
- **Badges:** 10+ achievements (First Blood, Week Warrior, Renal God, The Consultant...)
- **Leaderboard:** Batch-wide XP ranking with system specialist crowns
