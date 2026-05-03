import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const q1 = await supabaseAdmin.from('flashcards').select('id')
    const q2 = await supabaseAdmin.from('flashcards').select('*').order('next_review', { ascending: true })
    const q3 = await supabaseAdmin.from('flashcards').select('*').order('next_review', { ascending: true }).limit(100)
    
    return NextResponse.json({
      q1_count: q1.data?.length,
      q2_count: q2.data?.length,
      q3_count: q3.data?.length,
      q3_ids: q3.data?.map((c: any) => c.id.slice(0, 8)),
      error: q3.error?.message
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}