import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('flashcards')
      .select('id, front_text, back_text, difficulty, review_count, next_review, created_at')
      .order('next_review', { ascending: true })
      .limit(100)

    if (error) throw error

    return NextResponse.json(
      { success: true, data: data || [] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get('cardId')

    if (cardId) {
      // Delete single card by ID
      const { data, error } = await supabaseAdmin
        .from('flashcards')
        .delete()
        .eq('id', cardId)
        .select('id')

      if (error) throw error
      return NextResponse.json({ success: true, deleted: data?.length || 0 })
    } else {
      // Bulk delete all
      const { data, error } = await supabaseAdmin
        .from('flashcards')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select('id')

      if (error) throw error
      return NextResponse.json({ success: true, deleted: data?.length || 0 })
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
