'use client'

import { useState, useEffect } from 'react'

const PROGRESS_KEY = 'exam_progress_' + '71c4e962-a9da-4667-9741-b6d9dc6a4e15'
const SOURCE_ID = '71c4e962-a9da-4667-9741-b6d9dc6a4e15'

interface Question {
  id: string
  question_number: number
  question_text: string
  options: { ア: string; イ: string; ウ: string; エ: string }
  correct_answer: 'ア' | 'イ' | 'ウ' | 'エ'
}
interface Explanation {
  choices?: { ア?: { result: string; jp: string; en: string }; イ?: { result: string; jp: string; en: string }; ウ?: { result: string; jp: string; en: string }; エ?: { result: string; jp: string; en: string } }
  vocabulary?: { word: string; meaning_jp: string; meaning_en: string; example_jp?: string }[]
}

const MOCK_DICTIONARY: Record<string, { word: string; reading: string; meaning: string; example: string }> = {
  'コンピュータ': { word: 'コンピュータ', reading: 'computer', meaning: '電子計算機。コンピュータ。', example: 'このコンピュータは新しい。' },
  '情報': { word: '情報', reading: 'じょうほう', meaning: 'データや知識のこと。', example: '情報を收集する。' },
  '処理': { word: '処理', reading: 'しょり', meaning: 'ある作业を 进めること。', example: 'データ処理を行う。' },
  '開発': { word: '開発', reading: 'かいはつ', meaning: '新しいものを作ること。', example: 'ソフトウェアを開発する。' },
  '演算': { word: '演算', reading: 'えんざん', meaning: '计算すること。', example: '四則演算を行う。' },
  '記憶': { word: '記憶', reading: 'きおく', meaning: '数据和资料を保存すること。', example: '記憶装置に注意。' },
}

export default function ExamPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, string>>({})
  const [score, setScore] = useState(0)
  const [examDone, setExamDone] = useState(false)
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [explanationLoading, setExplanationLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  // Dictionary state
  const [dictQuery, setDictQuery] = useState('')
  const [dictResult, setDictResult] = useState<string | null>(null)
  const [dictLoading, setDictLoading] = useState(false)
  const [dictFormat, setDictFormat] = useState<'format1' | 'format2'>('format1')
  const [shakingFormat, setShakingFormat] = useState<'format1' | 'format2' | null>(null)

  useEffect(() => {
    const triggerShake = () => {
      const formats: Array<'format1' | 'format2'> = ['format1', 'format2']
      const randomFormat = formats[Math.floor(Math.random() * 2)]
      setShakingFormat(randomFormat)
      setTimeout(() => setShakingFormat(null), 600)
    }

    const interval = setInterval(triggerShake, 5000 + Math.random() * 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem(PROGRESS_KEY)
    if (saved) {
      const { currentIndex: savedIndex, answers: savedAnswers } = JSON.parse(saved)
      if (savedAnswers) setSessionAnswers(savedAnswers)
    }
    fetchQuestions()
  }, [])

  async function fetchQuestions() {
    try {
      const res = await fetch(`/api/questions?sourceId=${SOURCE_ID}`)
      const data = await res.json()
      if (data.data) {
        setQuestions(data.data)
        const saved = localStorage.getItem(PROGRESS_KEY)
        if (saved) {
          const { currentIndex: savedIndex } = JSON.parse(saved)
          if (savedIndex < data.questions.length) setCurrentIndex(savedIndex)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({
        currentIndex,
        answers: sessionAnswers
      }))
    }
  }, [currentIndex, sessionAnswers, questions.length])

  async function handleAnswer(key: 'ア' | 'イ' | 'ウ' | 'エ') {
    setSelectedAnswer(key)
    setSessionAnswers(prev => ({ ...prev, [questions[currentIndex].id]: key }))
    setShowResult(true)

    const currentQ = questions[currentIndex]
    if (key === currentQ.correct_answer) {
      setScore(prev => prev + 1)
    }

    // Fetch explanation
    setExplanationLoading(true)
    setExplanation(null)
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ.id,
          questionText: currentQ.question_text,
          options: currentQ.options,
          correctAnswer: currentQ.correct_answer,
          userAnswer: key
        })
      })
      const data = await res.json()
      if (data.choices) {
        setExplanation(data)
        // Save vocabulary to word bank
        if (data.vocabulary?.length > 0) {
          fetch('/api/word-bank', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words: data.vocabulary.map((v: { word?: string; meaning_jp?: string; meaning_en?: string; example_jp?: string }) => ({
              word: v.word || '',
              meaning_jp: v.meaning_jp || '',
              meaning_en: v.meaning_en || '',
              example_jp: v.example_jp || '',
              question_id: currentQ.id,
              source_text: currentQ.question_text
            })) })
          })
        }
      }
    } catch (e) {
      console.error('Explanation error:', e)
    } finally {
      setExplanationLoading(false)
    }
  }

  function handleCheck() {
    if (!selectedAnswer) return
    setShowResult(true)
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      const next = currentIndex + 1
      setCurrentIndex(next)
      setSelectedAnswer(sessionAnswers[questions[next]?.id] || '')
      setShowResult(false)
      setExplanation(null)
    } else {
      setExamDone(true)
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      const prev = currentIndex - 1
      setCurrentIndex(prev)
      setSelectedAnswer(sessionAnswers[questions[prev]?.id] || '')
      setShowResult(false)
      setExplanation(null)
    }
  }

  function handleRestart() {
    setCurrentIndex(0)
    setScore(0)
    setSelectedAnswer('')
    setShowResult(false)
    setExplanation(null)
    setSessionAnswers({})
    setExamDone(false)
    localStorage.removeItem(PROGRESS_KEY)
  }

  // Dictionary search
  async function handleDictSearch() {
    if (!dictQuery.trim()) {
      setDictResult(null)
      return
    }
    setDictLoading(true)
    try {
      const res = await fetch('/api/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: dictQuery.trim(), format: dictFormat })
      })
      const data = await res.json()
      if (data.result) {
        setDictResult(data.result)
      } else {
        setDictResult('エラー: ' + (data.error || 'Unknown error'))
      }
    } catch (e) {
      setDictResult('エラー: 接続に失敗しました')
    } finally {
      setDictLoading(false)
    }
  }

  function handleDictKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleDictSearch()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4 emoji-3d">⏳</div>
          <p className="text-white/70 font-medium animate-pulse">問題読み込み中...</p>
        </div>
      </div>
    )
  }

  if (examDone) {
    const percentage = Math.round((score / questions.length) * 100)
    const scoreOffset = 377 - (377 * percentage) / 100

    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className="glass-card p-8 text-center max-w-sm w-full animate-scale-in">
          <div className="text-6xl mb-4 emoji-3d">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">試験完了!</h2>

          <div className="flex justify-center my-6">
            <div className="score-ring">
              <svg width="140" height="140" className="absolute inset-0">
                <circle cx="70" cy="70" r="60" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                <circle
                  className="score-ring-circle"
                  cx="70" cy="70" r="60"
                  stroke={percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444'}
                  style={{ '--score-offset': `${scoreOffset}px` } as React.CSSProperties}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white">{percentage}%</span>
              </div>
            </div>
          </div>

          <p className="text-white/60 mb-1">{score} / {questions.length} 正解</p>
          <p className="text-white/40 text-sm mb-8">
            {percentage >= 80 ? '🏆 Excellent!' : percentage >= 60 ? '👍 Good job!' : '📚 Keep studying!'}
          </p>

          <div className="flex flex-col gap-3">
            <button onClick={handleRestart} className="glass-btn glass-btn-primary w-full">
              🔄 最初から
            </button>
            <button
              onClick={() => { setExamDone(false); setCurrentIndex(0) }}
              className="glass-btn w-full"
            >
              📖 復習する
            </button>
            <FlashcardGenButton questions={questions} sessionAnswers={sessionAnswers} />
          </div>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  if (!currentQ) return null

  const isCorrect = selectedAnswer === currentQ.correct_answer

  return (
    <div className="min-h-screen p-4 relative z-10">
      {/* Two-column layout: exam left, dictionary right */}
      <div className="max-w-5xl mx-auto flex gap-6">
        {/* Left: Exam section */}
        <div className="flex-1 max-w-xl">
          {/* Header */}
          <div className="glass-card-light p-4 mb-4 animate-fade-in">
            <div className="flex justify-between items-center mb-3">
              <div className="glass-badge">
                <span>📝</span> Q{currentIndex + 1} / {questions.length}
              </div>
              <div className="glass-badge">
                <span>✅</span> {score} correct
              </div>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
            <p className="text-white/30 text-xs mt-2 text-center">自動保存</p>
          </div>

          {/* Question card */}
          <div className="glass-card p-5 mb-4 animate-fade-in-up border border-purple-400/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎯</span>
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Question</span>
            </div>
            <p className="text-white/95 text-base leading-relaxed whitespace-pre-wrap magnetic-word">
              {currentQ.question_text}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-6 mb-4">
            {(['ア', 'イ', 'ウ', 'エ'] as const).map(key => {
              const isSelected = selectedAnswer === key
              const isRight = key === currentQ.correct_answer

              let optionClass = 'glass-option'
              if (showResult) {
                if (isRight) optionClass += ' correct'
                else if (isSelected) optionClass += ' wrong'
              } else if (isSelected) {
                optionClass += ' selected'
              }

              return (
                <button
                  key={key}
                  onClick={() => handleAnswer(key)}
                  disabled={showResult}
                  className={optionClass}
                >
                  <span className="font-bold mr-2 text-lg">
                    {isRight && showResult ? '✅' : isSelected && showResult ? '❌' : isSelected ? '👉' : '○'}
                  </span>
                  <span className="text-sm leading-snug flex-1 text-left">{currentQ.options[key]}</span>
                </button>
              )
            })}
          </div>

          {explanationLoading && (
            <div className="explanation-card mb-4 animate-scale-in">
              <div className="p-8 text-center">
                <div className="text-3xl mb-3 animate-bounce">🤖</div>
                <p className="text-white/60 text-sm animate-pulse">AI解説を取得中...</p>
              </div>
            </div>
          )}

          {/* Explanation popup */}
          {showResult && explanation && (
            <div className="explanation-card mb-4 animate-scale-in">
              <div className="px-5 py-3 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-b border-white/10">
                <span className="font-bold text-white text-lg">📖 解説</span>
                {isCorrect && <span className="ml-2 glass-badge bg-green-500/20 text-green-300 border-green-400/30">✅ 正解!</span>}
                {!isCorrect && <span className="ml-2 glass-badge bg-red-500/20 text-red-300 border-red-400/30">❌ 不正解</span>}
              </div>

              <div className="p-4 space-y-3">
                {(['ア', 'イ', 'ウ', 'エ'] as const).map(key => {
                  const choice = explanation.choices?.[key]
                  const isRight = key === currentQ.correct_answer
                  const wasSelected = selectedAnswer === key

                  let cardClass = 'explanation-choice'
                  if (isRight) cardClass += ' correct-choice'
                  else if (wasSelected) cardClass += ' wrong-choice'
                  else cardClass += ' neutral-choice'

                  return (
                    <div key={key} className={cardClass}>
                      <div className="flex items-start gap-2 mb-1">
                        <span className="text-lg">
                          {isRight ? '✅' : wasSelected ? '❌' : '○'}
                        </span>
                        <span className="text-sm font-bold text-white/80">{key}.</span>
                        <span className="text-sm text-white/60 flex-1">{currentQ.options[key]}</span>
                      </div>
                      {choice && (
                        <>
                          <p className="text-sm text-white/80 ml-7 mb-1 magnetic-word">{choice.jp}</p>
                          <p className="text-xs text-white/40 ml-7 italic">{choice.en}</p>
                        </>
                      )}
                    </div>
                  )
                })}

                {explanation.vocabulary && explanation.vocabulary.length > 0 && (
                  <div className="border-t border-white/10 pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">📚</span>
                      <span className="text-sm font-bold text-white/70">Key Vocabulary</span>
                    </div>
                    <div className="grid gap-2">
                      {explanation.vocabulary.map((v, i) => (
                        <div key={i} className="vocab-card">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-blue-300 text-sm">{v.word}</span>
                            <span className="text-white/50 text-xs">→</span>
                            <span className="text-white/70 text-xs">{v.meaning_jp}</span>
                          </div>
                          <p className="text-white/40 text-xs ml-0">{v.meaning_en}</p>
                          {v.example_jp && (
                            <p className="text-white/30 text-xs mt-1 italic">• {v.example_jp}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom nav buttons */}
          <div className="glass-card p-3 flex gap-3">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="glass-btn glass-btn-sm flex-1"
            >
              ← 戻る
            </button>

            {!showResult ? (
              <button
                onClick={handleCheck}
                disabled={!selectedAnswer}
                className="glass-btn glass-btn-blue flex-1"
              >
                ✨ 判定
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="glass-btn glass-btn-primary flex-1"
              >
                {currentIndex < questions.length - 1 ? '次の問題 →' : '🏁 終了'}
              </button>
            )}
          </div>
        </div>

        {/* Right: Dictionary panel */}
        <div className="w-80 flex-shrink-0">
          <div className="glass-card-light p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📖</span>
              <span className="text-sm font-bold text-white/70">辞書</span>
            </div>

            {/* Format toggle */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setDictFormat('format1')}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all duration-300 ${
                  dictFormat === 'format1'
                    ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white shadow-lg shadow-purple-500/30 border border-purple-400/50'
                    : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/60'
                } ${shakingFormat === 'format1' ? 'shake-animation' : ''}`}
              >
                <span className="block text-2xl">📘</span>
                <span className="block mt-1 text-xs">深度 (F1)</span>
              </button>
              <button
                onClick={() => setDictFormat('format2')}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all duration-300 ${
                  dictFormat === 'format2'
                    ? 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white shadow-lg shadow-blue-500/30 border border-blue-400/50'
                    : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/60'
                } ${shakingFormat === 'format2' ? 'shake-animation' : ''}`}
              >
                <span className="block text-2xl">⚡</span>
                <span className="block mt-1 text-xs">サク懂 (F2)</span>
              </button>
            </div>

            {/* Search input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={dictQuery}
                onChange={e => setDictQuery(e.target.value)}
                onKeyDown={handleDictKeyDown}
                placeholder="単語を検索..."
                className="glass-input flex-1 text-sm"
              />
              <button
                onClick={handleDictSearch}
                disabled={dictLoading || !dictQuery.trim()}
                className="glass-btn glass-btn-sm px-3 text-xl disabled:opacity-40"
              >
                {dictLoading ? <span className="animate-spin text-xl">↻</span> : <span className="text-xl">🔍</span>}
              </button>
            </div>

            {/* Result */}
            {dictLoading && (
              <div className="text-center py-4 text-white/40 text-xs">
                <span className="animate-pulse">取得中...</span>
              </div>
            )}
            {dictResult && !dictLoading && (
              <pre className="dictionary-result animate-scale-in text-sm text-white/80 whitespace-pre-wrap font-mono leading-relaxed bg-white/5 rounded-xl p-4 border border-white/10 max-h-96 overflow-y-auto">
                {dictResult}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FlashcardGenButton({ questions, sessionAnswers }: { questions: Question[], sessionAnswers: Record<string, string> }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)

  async function handleGenerate() {
    setLoading(true)
    try {
      const wrongQuestions = questions.filter(q => {
        const answered = sessionAnswers[q.id]
        return answered && answered !== q.correct_answer
      })

      if (wrongQuestions.length === 0) {
        setResult({ success: 0, failed: 0 })
        setDone(true)
        setLoading(false)
        return
      }

      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': 'fe6bb274f1e8e296e595e3cad1f0a0138dba68eca8d85b3e'
        },
        body: JSON.stringify({ questions: wrongQuestions.map(q => ({ ...q, sourceId: '71c4e962-a9da-4667-9741-b6d9dc6a4e15' })) })
      })
      const data = await res.json()
      setResult(data)
      setDone(true)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (done && result) {
    if (result.success === 0 && result.failed === 0) {
      return (
        <div className="glass-card p-4 text-center animate-scale-in">
          <div className="text-2xl mb-2">📝</div>
          <p className="text-white/60 text-sm">全問正解 — 復習カードなし</p>
        </div>
      )
    }
    return (
      <div className="glass-card p-4 text-center animate-scale-in border border-purple-400/20">
        <div className="text-3xl mb-2">🃏</div>
        <p className="text-white font-bold text-base mb-1">
          {result.success > 0 ? `${result.success}枚のカードを作成!` : '作成失敗'}
        </p>
        {result.failed > 0 && (
          <p className="text-white/40 text-xs mb-2">({result.failed}枚失敗)</p>
        )}
        <div className="flex flex-col gap-2 mt-3">
          <a href="/flashcards" className="glass-btn glass-btn-primary w-full py-3 text-base font-bold">
            🃏 復習する ({result.success}枚)
          </a>
          <button
            onClick={() => { setDone(false); setResult(null) }}
            className="text-white/30 text-xs hover:text-white/60"
          >
            戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <button onClick={handleGenerate} disabled={loading} className="glass-btn w-full">
      {loading ? (
        <span className="animate-pulse">🃏 生成中...</span>
      ) : (
        <>🃏 復習カードを作成</>
      )}
    </button>
  )
}
