import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    // Only return words that have been marked as studied
    const { data, error } = await supabase
      .from('words')
      .select('id, word, full_name, page_num, overview_jp, overview_en')
      .eq('studied', true)
      .order('page_num', { ascending: true })
      .order('id', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, cards: data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message })
  }
}