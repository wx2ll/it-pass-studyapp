const http = require('http')
const { spawn } = require('child_process')

const PORT = 3001
const AUTH_SECRET = process.env.AUTH_SECRET || 'fe6bb274f1e8e296e595e3cad1f0a0138dba68eca8d85b3e'
const COHERE_API_KEY = process.env.COHERE_API_KEY

function callCohere(prompt, maxTokens) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'command-r7b-12-2024',
      message: prompt,
      max_tokens: maxTokens || 1200,
      temperature: 0.2,
      prompt_truncation: 'OFF'
    })
    const curl = spawn('curl', ['-s', '--max-time', '25', '-X', 'POST',
      'https://api.cohere.com/v1/chat',
      '-H', 'Content-Type: application/json',
      '-H', `Authorization: Bearer ${COHERE_API_KEY}`,
      '-d', data])
    let out = '', err = ''
    curl.stdout.on('data', c => out += c)
    curl.stderr.on('data', c => err += c)
    curl.on('close', (code) => {
      if (err) { reject(new Error(err)); return }
      try {
        const parsed = JSON.parse(out)
        resolve(parsed.text || '')
      } catch(e) {
        reject(new Error('Parse error: ' + out.slice(0, 200)))
      }
    })
    curl.on('error', reject)
  })
}

function cleanJSON(raw) {
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

// Per-choice explanation prompt
const EXPLAIN_PROMPT = `You are a Japanese IT exam tutor. Answer ONLY with valid JSON, no markdown.

Question: {question}
Choices:
ア: {a}
イ: {b}
ウ: {c}
エ: {d}

Correct answer: {correct}
Your answer: {user}

Return valid JSON with this exact structure (no markdown, no extra text):
{
  "choices": {
    "ア": {"jp": "Japanese explanation for why this is right or wrong", "en": "English explanation"},
    "イ": {"jp": "Japanese explanation", "en": "English explanation"},
    "ウ": {"jp": "Japanese explanation", "en": "English explanation"},
    "エ": {"jp": "Japanese explanation", "en": "English explanation"}
  },
  "vocabulary": [
    {"word": "technical term", "meaning_jp": "Japanese meaning", "meaning_en": "English meaning", "example_jp": "example sentence in Japanese"}
  ]
}`

const FLASHCARD_PROMPT = `You are a flashcard generator. Answer ONLY with valid JSON, no markdown.
Question: {question} | Correct: {correct} | Explanation: {explanation}
Return JSON: {"front":"question in Japanese","back":"answer + brief explanation in Japanese"}`

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

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }

  const url = req.url.split('?')[0]

  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok' }))
    return
  }

  if (!authenticate(req)) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Unauthorized' }))
    return
  }

  if (url === '/webhook' && req.method === 'POST') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', async () => {
      try {
        const { task, question_text, choices, correct_answer, user_answer } = JSON.parse(body)
        if (task !== 'explain') {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Use task="explain"' }))
          return
        }
        const prompt = EXPLAIN_PROMPT
          .replace('{question}', question_text || '')
          .replace('{a}', choices?.['ア'] || '')
          .replace('{b}', choices?.['イ'] || '')
          .replace('{c}', choices?.['ウ'] || '')
          .replace('{d}', choices?.['エ'] || '')
          .replace('{correct}', correct_answer || '')
          .replace('{user}', user_answer || '')

        const raw = await callCohere(prompt, 1200)
        const cleaned = cleanJSON(raw)
        let parsed
        try { parsed = JSON.parse(cleaned) }
        catch {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'JSON parse failed: ' + cleaned.slice(0, 100) }))
          return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(parsed))
      } catch (err) {
        console.error('[/webhook]', err.message)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      }
    })
    return
  }

  if (url === '/flashcard' && req.method === 'POST') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', async () => {
      try {
        const { task, question_text, correct_answer, explanation_jp } = JSON.parse(body)
        if (task !== 'generate_flashcard') {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Use task="generate_flashcard"' }))
          return
        }
        const prompt = FLASHCARD_PROMPT
          .replace('{question}', question_text || '')
          .replace('{correct}', correct_answer || '')
          .replace('{explanation}', explanation_jp || '')

        const raw = await callCohere(prompt, 500)
        const cleaned = cleanJSON(raw)
        let parsed
        try { parsed = JSON.parse(cleaned) }
        catch { parsed = { front: cleaned.slice(0, 200), back: cleaned.slice(200, 400) } }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(parsed))
      } catch (err) {
        console.error('[/flashcard]', err.message)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      }
    })
    return
  }

  if (url === '/dictionary' && req.method === 'POST') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', async () => {
      try {
        const { word, format } = JSON.parse(body)
        if (!word) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'word is required' }))
          return
        }
        const prompt = (format === 'format2')
          ? FORMAT2_PROMPT.replace('{word}', word)
          : FORMAT1_PROMPT.replace('{word}', word)

        const raw = await callCohere(prompt, 800)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ result: raw }))
      } catch (err) {
        console.error('[/dictionary]', err.message)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Webhook server running on port ${PORT}`)
})

function authenticate(req) {
  const auth = req.headers.authorization || ''
  const token = auth.replace('Bearer ', '')
  if (token === AUTH_SECRET) return true
  // Also check x-auth-token header
  const tokenHeader = req.headers['x-auth-token'] || ''
  return tokenHeader === AUTH_SECRET
}
