import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { word_id } = await req.json()

    const { error } = await supabase
      .from('words')
      .update({ studied: true })
      .eq('id', word_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message })
  }
}