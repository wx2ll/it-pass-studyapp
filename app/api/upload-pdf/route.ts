import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, unlinkSync, mkdirSync, readdirSync, rmSync } from 'fs'
import { supabaseAdmin } from '@/lib/supabase'

const execAsync = promisify(exec)

function md5(buffer: Buffer): string {
  return createHash('md5').update(buffer).digest('hex')
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const workDir = `/tmp/pdf_ocr_${Date.now()}`
  mkdirSync(workDir, { recursive: true })
  const pdfPath = `${workDir}/input.pdf`
  const imgDir = `${workDir}/img`

  writeFileSync(pdfPath, buffer)
  mkdirSync(imgDir, { recursive: true })

  try {
    // Step 1: Convert PDF pages to PNG at 300 DPI
    await execAsync(`pdftoppm -png -r 300 "${pdfPath}" "${imgDir}/page"`, { timeout: 60000 })

    const images = readdirSync(imgDir).filter(f => f.endsWith('.png')).sort()

    if (images.length === 0) {
      // Fallback: try plain text extraction
      const { stdout } = await execAsync(`pdftotext -layout "${pdfPath}" -`, { timeout: 30000 })
      return stdout
    }

    // Step 2: OCR each page with Tesseract
    const pageTexts: string[] = []
    for (const img of images) {
      const imgPath = `${imgDir}/${img}`
      try {
        const { stdout } = await execAsync(
          `tesseract "${imgPath}" stdout -l jpn --psm 6`,
          { timeout: 60000 }
        )
        if (stdout.trim().length > 10) {
          pageTexts.push(stdout)
        }
      } catch {
        // Skip failed pages
      }
    }

    return pageTexts.join('\n\n')

  } finally {
    try { rmSync(workDir, { recursive: true, force: true }) } catch {}
  }
}

function parseQuestions(text: string) {
  const questions: any[] = []
  const lines = text.split('\n')
  let currentQuestion: string | null = null
  let questionNum = 0
  let options: any = { ア: '', イ: '', ウ: '', エ: '' }
  let optionKey = ''
  let collectingOptions = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (currentQuestion && questionNum > 0) {
        questions.push({
          question_number: questionNum,
          question_text: currentQuestion.trim(),
          options: { ...options }
        })
      }
      currentQuestion = null
      questionNum = 0
      options = { ア: '', イ: '', ウ: '', エ: '' }
      collectingOptions = false
      continue
    }

    const numMatch = trimmed.match(/^(?:Q\.?|問題|(\d+))\s*[-．.、]\s*(.*)/)

    if (numMatch) {
      if (currentQuestion && questionNum > 0) {
        questions.push({
          question_number: questionNum,
          question_text: currentQuestion.trim(),
          options: { ...options }
        })
      }
      const num = numMatch[1] ? parseInt(numMatch[1]) : 0
      if (num > 0 && num <= 100) {
        questionNum = num
        currentQuestion = numMatch[2] || ''
        options = { ア: '', イ: '', ウ: '', エ: '' }
        collectingOptions = false
      }
      continue
    }

    if (['ア', 'イ', 'ウ', 'エ'].includes(trimmed[0]) && /[．.、]/.test(trimmed.slice(1, 3))) {
      optionKey = trimmed[0]
      const optText = trimmed.slice(2).trim()
      options[optionKey] = optText
      collectingOptions = true
    } else if (collectingOptions && optionKey && trimmed.length > 0) {
      if (['ア', 'イ', 'ウ', 'エ'].some(k => trimmed.startsWith(k + '．') || trimmed.startsWith(k + '.'))) {
        optionKey = trimmed[0]
        options[optionKey] = trimmed.slice(2).trim()
      } else {
        options[optionKey] += ' ' + trimmed
      }
    } else if (questionNum > 0 && !collectingOptions && trimmed.length > 5) {
      if (currentQuestion !== null) {
        currentQuestion += ' ' + trimmed
      }
    }
  }

  if (currentQuestion && questionNum > 0) {
    questions.push({
      question_number: questionNum,
      question_text: currentQuestion.trim(),
      options: { ...options }
    })
  }

  return questions
}

function parseAnswers(text: string) {
  const answers: Record<number, string> = {}
  const lines = text.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    const match = trimmed.match(/^(\d+)\s*[-．.、]\s*([アイウエオ])$/i)
    if (match) {
      const qNum = parseInt(match[1])
      let answer = match[2].toUpperCase()
      if (answer === 'オ') answer = 'エ'
      answers[qNum] = answer
    }
  }

  return answers
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const questionFile = formData.get('questionFile') as File | null
    const answerFile = formData.get('answerFile') as File | null
    const examYear = (formData.get('examYear') as string) || '2024'
    const examSeason = (formData.get('examSeason') as string) || '春'

    if (!questionFile || !answerFile) {
      return NextResponse.json({ success: false, error: 'Both files required' }, { status: 400 })
    }

    const questionBuffer = Buffer.from(await questionFile.arrayBuffer())
    const answerBuffer = Buffer.from(await answerFile.arrayBuffer())

    const questionHash = md5(questionBuffer)

    // Check duplicate
    const { data: existing } = await supabaseAdmin
      .from('pdf_sources')
      .select('*')
      .eq('file_hash_question', questionHash)
      .single()

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'duplicate',
        data: { sourceId: existing.id, filename: existing.filename_question }
      })
    }

    // Extract text from PDFs with OCR
    const questionText = await extractTextFromPDF(questionBuffer)
    const answerText = await extractTextFromPDF(answerBuffer)

    // Parse questions and answers
    const questions = parseQuestions(questionText)
    const answers = parseAnswers(answerText)

    if (questions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'no_questions',
        data: { message: 'Could not extract questions from PDF. Is it a scanned PDF?' }
      })
    }

    // Save source
    const { data: source, error: sourceError } = await supabaseAdmin
      .from('pdf_sources')
      .insert({
        filename_question: questionFile.name,
        filename_answer: answerFile.name,
        file_hash_question: questionHash,
        file_hash_answer: md5(answerBuffer),
        exam_year: examYear,
        exam_season: examSeason,
        total_questions: questions.length
      })
      .select()
      .single()

    if (sourceError) throw sourceError

    // Save questions
    const questionsWithSource = questions.map(q => ({
      source_id: source.id,
      question_number: q.question_number,
      question_text: q.question_text,
      options: q.options,
      correct_answer: answers[q.question_number] || '',
    }))

    const { error: questionsError } = await supabaseAdmin
      .from('questions')
      .insert(questionsWithSource)

    if (questionsError) console.error('Questions insert error:', questionsError)

    return NextResponse.json({
      success: true,
      data: {
        sourceId: source.id,
        totalQuestions: questions.length,
        filename: questionFile.name
      }
    })

  } catch (error: any) {
    console.error('[upload-pdf]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
