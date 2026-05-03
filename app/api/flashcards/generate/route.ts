import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const WEBHOOK_URL = 'http://localhost:3001/flashcard'
const WEBHOOK_SECRET = 'fe6bb274f1e8e296e595e3cad1f0a0138dba68eca8d85b3e'

interface Word {
  id: string
  word: string
  reading?: string
  meaning_jp: string
  meaning_en?: string
  example_jp?: string
  question_id?: string
  source_text?: string
  created_at: string
  used: boolean
}

async function getUnusedWords(): Promise<Word[]> {
  const { data, error } = await supabaseAdmin
    .from('word_bank')
    .select('*')
    .eq('used', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function POST(request: NextRequest) {
  try {
    const { source, questions } = await request.json()

    let wordsToGenerate: Array<{ word: string; meaning_jp: string; meaning_en?: string; example_jp?: string; id?: string }> = []

    if (source === 'word-bank') {
      const wordBankWords = await getUnusedWords()
      if (wordBankWords.length === 0) {
        return NextResponse.json({ success: false, error: 'No new words to generate from' }, { status: 400 })
      }
      wordsToGenerate = wordBankWords.map((w: Word) => ({
        id: w.id,
        word: w.word,
        meaning_jp: w.meaning_jp,
        meaning_en: w.meaning_en,
        example_jp: w.example_jp
      }))
    } else if (questions && Array.isArray(questions)) {
      wordsToGenerate = questions.map((q: any) => ({
        word: q.word || '',
        meaning_jp: q.meaning_jp || '',
        meaning_en: q.meaning_en || '',
        example_jp: q.example_jp || ''
      }))
    } else {
      return NextResponse.json({ success: false, error: 'Invalid source' }, { status: 400 })
    }

    const results = { success: 0, failed: 0, cards: [] as any[] }
    const usedWordIds: string[] = []

    for (const w of wordsToGenerate) {
      if (!w.word || !w.meaning_jp) {
        results.failed++
        continue
      }

      try {
        const res = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': WEBHOOK_SECRET
          },
          body: JSON.stringify({
            task: 'generate_flashcard',
            question_text: `「${w.word}」の意味を教えてください。`,
            correct_answer: w.meaning_jp,
            explanation_jp: w.example_jp || ''
          })
        })

        const data = await res.json()

        if (data.front && data.back) {
          // Check for duplicate front_text
          const { data: existing } = await supabaseAdmin
            .from('flashcards')
            .select('id')
            .eq('front_text', data.front)
            .limit(1)

          if (existing && existing.length > 0) {
            results.failed++
            continue
          }

          const { error } = await supabaseAdmin.from('flashcards').insert({
            front_text: data.front,
            back_text: data.back,
            next_review: new Date().toISOString(),
            difficulty: 1,
            review_count: 0
          })

          if (!error) {
            results.success++
            results.cards.push({ front: data.front, back: data.back })

            // Mark word bank entry as used
            if (w.id) usedWordIds.push(w.id)
          } else {
            results.failed++
          }
        } else {
          results.failed++
        }
      } catch (e) {
        results.failed++
      }

      // Small delay between calls to avoid rate limiting
      await new Promise(r => setTimeout(r, 300))
    }

    // Mark used words in word_bank
    if (usedWordIds.length > 0) {
      await supabaseAdmin
        .from('word_bank')
        .update({ used: true })
        .in('id', usedWordIds)
    }

    return NextResponse.json(results)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}