import { NextRequest, NextResponse } from 'next/server'

const WEBHOOK_URL = 'http://localhost:3001/dictionary'
const WEBHOOK_SECRET = 'fe6bb274f1e8e296e595e3cad1f0a0138dba68eca8d85b3e'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word, format = 'format1' } = body

    if (!word) {
      return NextResponse.json({ error: 'word is required' }, { status: 400 })
    }

    const webhookRes = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': WEBHOOK_SECRET
      },
      body: JSON.stringify({ word, format })
    })

    const data = await webhookRes.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}