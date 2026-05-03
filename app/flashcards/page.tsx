'use client'

import { useState, useEffect } from 'react'

interface Word {
  id: string
  word: string
  reading?: string
  meaning_jp: string
  meaning_en?: string
  example_jp?: string
  used: boolean
}

interface Flashcard {
  id: string
  front_text: string
  back_text: string
  difficulty: number
  review_count: number
}

export default function FlashcardsPage() {
  const [words, setWords] = useState<Word[]>([])
  const [cards, setCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generationDone, setGenerationDone] = useState(false)
  const [newWordCount, setNewWordCount] = useState(0)

  useEffect(() => {
    fetchWords()
    fetchCards()
  }, [])

  async function fetchWords() {
    try {
      const res = await fetch('/api/word-bank?_=' + Date.now(), { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setWords(data.words)
        const unused = data.words.filter((w: Word) => !w.used)
        setNewWordCount(unused.length)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCards() {
    try {
      const res = await fetch('/api/flashcards?_=' + Date.now(), { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        const shuffled = [...data.data].sort(() => Math.random() - 0.5)
        setCards(shuffled)
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function refreshAll() {
    setGenerationDone(false)
    await Promise.all([fetchWords(), fetchCards()])
  }

  async function handleGenerateFlashcards() {
    if (newWordCount === 0 || generating) return
    setGenerating(true)
    try {
      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'word-bank' })
      })
      const result = await res.json()
      if (result.success) {
        const unusedIds = words.filter((w: Word) => !w.used).map((w: Word) => w.id)
        if (unusedIds.length > 0) {
          await fetch('/api/word-bank', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: unusedIds })
          })
        }
        setNewWordCount(0)
        setGenerationDone(true)
        await Promise.all([fetchWords(), fetchCards()])
        setCurrentIndex(0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!confirm('このカードを削除しますか?')) return
    try {
      const res = await fetch(`/api/flashcards?cardId=${cardId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setCards(prev => prev.filter(c => c.id !== cardId))
        if (currentIndex >= cards.length - 1 && currentIndex > 0) {
          setCurrentIndex(prev => prev - 1)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4 emoji-3d">🃏</div>
          <p className="text-white/70 animate-pulse">カード読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 max-w-xl mx-auto flex flex-col relative z-10">

      {/* Generation done message */}
      {generationDone && (
        <div className="glass-card p-4 mb-3 text-center animate-scale-in border border-green-400/30">
          <span className="text-green-300 text-sm">✅ {cards.length}枚のフラッシュカードを作成しました!</span>
          <span className="text-white/40 text-xs block mt-1">下のカードから復習できます</span>
        </div>
      )}

      {/* Word Bank Status - near top */}
      <div className="glass-card-light p-4 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">📚 単語帳</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refreshAll} className="text-white/30 hover:text-white/60 text-xs" title="Refresh">
              🔄
            </button>
            <span className="glass-badge">{words.length} 語</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">
            {newWordCount > 0 ? `${newWordCount}個の新しい単語` : '新しい単語なし'}
          </span>
          <button
            onClick={handleGenerateFlashcards}
            disabled={newWordCount === 0 || generating}
            className={`glass-btn text-sm px-4 py-2 ${
              newWordCount === 0
                ? 'opacity-50 cursor-not-allowed bg-white/5'
                : 'glass-btn-blue'
            }`}
          >
            {generating ? (
              <span className="animate-pulse">生成中...</span>
            ) : newWordCount > 0 ? (
              `🃏 フラッシュカード作成 (${newWordCount})`
            ) : (
              '✓ すべて生成済み'
            )}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {cards.length === 0 ? (
        <div className="glass-card p-8 text-center flex-1 flex items-center justify-center mt-4">
          <div>
            <div className="text-6xl mb-4 emoji-3d">📭</div>
            <h2 className="text-xl font-bold text-white mb-2">まだカードがない</h2>
            <p className="text-white/50 text-sm mb-4">
              試験を受けて単語を保存しましょう
            </p>
            <a href="/exam" className="glass-btn glass-btn-primary inline-flex">
              📝 試験を受ける
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Card progress - near top */}
          <div className="glass-card-light p-3 mt-3 flex items-center justify-center gap-4 animate-fade-in">
            <span className="glass-badge">🃏 {currentIndex + 1} / {cards.length}</span>
            <div className="progress-bar w-24">
              <div
                className="progress-fill"
                style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Card - centered with flex-1 */}
          <div className="flip-card-container flex-1 flex items-center justify-center mt-4 mb-4">
            <div
              onClick={() => setFlipped(!flipped)}
              className={`flip-card-inner ${flipped ? 'flipped' : ''} w-full`}
            >
              {/* Front */}
              <div className="flip-card-front glass-card cursor-pointer flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="text-5xl mb-4 emoji-3d">❓</div>
                  <p className="text-white text-lg leading-relaxed">
                    {cards[currentIndex].front_text}
                  </p>
                </div>
              </div>

              {/* Back */}
              <div className="flip-card-back glass-card cursor-pointer flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="text-5xl mb-4 emoji-3d">💡</div>
                  <p className="text-white text-lg leading-relaxed">
                    {cards[currentIndex].back_text}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation + Delete buttons - near bottom */}
          <div className="flex items-center justify-center gap-3 pb-2">
            <button
              onClick={() => { setCurrentIndex(prev => prev > 0 ? prev - 1 : cards.length - 1); setFlipped(false); }}
              className="glass-btn flex-1 text-center py-3"
              title="前のカード"
            >
              ◀️ 前のカード
            </button>

            <button
              onClick={() => handleDeleteCard(cards[currentIndex].id)}
              className="glass-btn-danger flex-1 text-center py-3"
              title="このカードを削除"
            >
              🗑️ 削除
            </button>

            <button
              onClick={() => { setCurrentIndex(prev => (prev + 1) % cards.length); setFlipped(false); }}
              className="glass-btn flex-1 text-center py-3"
              title="次のカード"
            >
              次のカード ▶️
            </button>
          </div>
        </>
      )}
    </div>
  )
}
