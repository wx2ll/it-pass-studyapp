import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { words } = await request.json()

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ success: false, error: 'No words provided' }, { status: 400 })
    }

    const results = { saved: 0, duplicates: 0 }

    for (const w of words) {
      if (!w.word || !w.meaning_jp) continue

      // Check for duplicate (same word + meaning combo)
      const { data: existing } = await supabaseAdmin
        .from('word_bank')
        .select('id')
        .eq('word', w.word)
        .eq('meaning_jp', w.meaning_jp)
        .limit(1)
        .single()

      if (existing) {
        results.duplicates++
        continue
      }

      const { error } = await supabaseAdmin.from('word_bank').insert({
        word: w.word,
        reading: w.reading || null,
        meaning_jp: w.meaning_jp,
        meaning_en: w.meaning_en || null,
        example_jp: w.example_jp || null,
        question_id: w.question_id || null,
        source_text: w.source_text || null
      })

      if (!error) results.saved++
    }

    return NextResponse.json(results)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('word_bank')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(
      { success: true, words: data || [] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ success: false, error: 'No ids provided' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('word_bank')
      .update({ used: true })
      .in('id', ids)
      .select('id')

    if (error) throw error

    return NextResponse.json({ success: true, marked: data?.length || 0 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wordId = searchParams.get('wordId')
    const action = searchParams.get('action')

    if (action === 'clearall') {
      const { error } = await supabaseAdmin
        .from('word_bank')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (wordId) {
      const { error } = await supabaseAdmin
        .from('word_bank')
        .delete()
        .eq('id', wordId)
        .select('id')

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}