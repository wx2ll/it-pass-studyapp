import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('words')
      .select('page_num')
      .order('page_num', { ascending: true })

    if (error) throw error

    // Count words per page
    const pageMap = new Map<number, number>()
    for (const row of data) {
      pageMap.set(row.page_num, (pageMap.get(row.page_num) || 0) + 1)
    }

    const pages = Array.from(pageMap.entries()).map(([page_num, count]) => ({
      page_num,
      count,
    }))

    return NextResponse.json({ success: true, pages })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message })
  }
}
