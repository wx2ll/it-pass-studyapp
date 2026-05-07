import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = searchParams.get('page')
  const all = searchParams.get('all')

  try {
    if (all === 'true') {
      // Word bank - all words
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .order('page_num', { ascending: true })
        .order('id', { ascending: true })

      if (error) throw error
      return NextResponse.json({ success: true, words: data })
    } else if (page) {
      // Page study - words for specific page
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('page_num', parseInt(page))
        .order('id', { ascending: true })

      if (error) throw error

      // Filter studied if requested
      if (searchParams.get('studied') === 'true') {
        const studied = data.filter(w => w.studied === true)
        return NextResponse.json({ success: true, words: studied })
      }

      return NextResponse.json({ success: true, words: data })
    }

    return NextResponse.json({ success: false, error: 'Missing parameter' })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message })
  }
}