import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('flashcards')
    .select('id', { count: 'exact' })
    .limit(1000)
  
  return NextResponse.json({ 
    count: data?.length || 0, 
    error: error?.message,
    full: data?.length
  })
}