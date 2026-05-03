import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { questionId, sourceId, selectedAnswer: _selectedAnswer, isCorrect: _isCorrect } = await request.json()

    // Upsert answer log
    await supabaseAdmin
      .from('answered_question_log')
      .upsert({
        source_id: sourceId,
        question_id: questionId,
        answered_count: 1,
        last_answered: new Date().toISOString()
      }, {
        onConflict: 'source_id,question_id'
      })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
