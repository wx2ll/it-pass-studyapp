import { NextRequest, NextResponse } from 'next/server'
import { CohereClient } from 'cohere-ai'

const COHERE_API_KEY = process.env.COHERE_API_KEY!

function cleanJSON(raw: string): string {
  let s = raw.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim()
  let open = (s.match(/\{/g) || []).length
  let close = (s.match(/\}/g) || []).length
  while (open > close && open > 0) {
    const lp = s.lastIndexOf('}')
    if (lp > 0) s = s.slice(0, lp + 1)
    open--
  }
  return s
}

const FORMAT1_PROMPT = `You are a Japanese vocabulary study assistant. When given a word, respond using this EXACT structure. Do NOT use emojis.

1. Word (Reading) - Brief meaning

2. Meaning (Yomikata):
Short, clear English explanation + include reading.

3. Explanation in Japanese (with yomikata):
* One short sentence
* Include readings for ALL words

4. Kanji breakdown (for each kanji):
For EACH kanji include:
* On'yomi (音読み)
* Kun'yomi (訓読み)
* Meaning
* Short intuitive image if helpful

5. Example Sentences (2-3 sentences):
Rules:
* Reuse ONLY previously studied words
* Do NOT introduce new difficult words
* Format exactly like this:
Sentence (kanji)
（ひらがなのみ）
English translation

6. One English word

7. One Japanese synonym

Style:
- Explain like a "simple physics teacher"
- Clear cause -> effect logic
- Real-world analogies: water flow, crowds, containers
- Short but precise
- No emojis
- If scientific: add Simple Idea + Analogy at end

Word: {word}`

const FORMAT2_PROMPT = `You are a Japanese vocabulary quick study assistant. Keep it minimal. Do NOT use emojis.

1. Meaning (English)
2. One English word
3. One Japanese synonym
4. Short example:
Sentence (kanji)
（ひらがなのみ）
English translation
5. Words that use [the word]:
* compounds/idioms

Word: {word}`

export async function POST(request: NextRequest) {
  try {
    const cohere = new CohereClient({ token: COHERE_API_KEY })
    const body = await request.json()
    const { word, format = 'format1' } = body

    if (!word) {
      return NextResponse.json({ error: 'word is required' }, { status: 400 })
    }

    const prompt = (format === 'format2')
      ? FORMAT2_PROMPT.replace('{word}', word)
      : FORMAT1_PROMPT.replace('{word}', word)

    const response = await cohere.chat({
      model: 'command-r7b-12-2024',
      message: prompt,
      maxTokens: 800,
      temperature: 0.2,
    })

    return NextResponse.json({ result: response.text || '' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}