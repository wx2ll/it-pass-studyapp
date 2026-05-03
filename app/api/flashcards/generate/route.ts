import { NextRequest, NextResponse } from 'next/server'
import { CohereClient } from 'cohere-ai'
import { getSupabaseAdmin } from '@/lib/supabase'

const COHERE_API_KEY = process.env.COHERE_API_KEY!

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
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('word_bank')
    .select('*')
    .eq('used', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

function cleanJSON(raw: string): string {
  let s = raw.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim()
  let open = (s.match(/\{/g) || []).length
  let close = (s.match(/\}/g) || []).length
  while (open > close && open > 0) {
    const lp = s.lastIndexOf('}')
    if (lp > 0) s = s.slice(0, lp + 1)
    open--
  }
  return s
}

const FLASHCARD_PROMPT = `You are a flashcard generator. Answer ONLY with valid JSON, no markdown.
Question: {question} | Correct: {correct} | Explanation: {explanation}
Return JSON: {"front":"question in Japanese","back":"answer + brief explanation in Japanese"}`

export async function POST(request: NextRequest) {
  try {
    const cohere = new CohereClient({ token: COHERE_API_KEY })
    const supabaseAdmin = getSupabaseAdmin()
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
        const prompt = FLASHCARD_PROMPT
          .replace('{question}', `「${w.word}」の意味を教えてください。`)
          .replace('{correct}', w.meaning_jp)
          .replace('{explanation}', w.example_jp || '')

        const response = await cohere.chat({
          model: 'command-r7b-12-2024',
          message: prompt,
          maxTokens: 500,
          temperature: 0.2,
        })

        const raw = response.text || ''
        const cleaned = cleanJSON(raw)
        let data
        try { data = JSON.parse(cleaned) }
        catch { data = { front: cleaned.slice(0, 200), back: cleaned.slice(200, 400) } }

        if (data.front && data.back) {
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

      await new Promise(r => setTimeout(r, 300))
    }

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