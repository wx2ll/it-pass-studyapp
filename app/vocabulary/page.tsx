'use client'

import { useState, useEffect } from 'react'

interface Word {
  id: string
  word: string
  reading?: string
  meaning_jp: string
  meaning_en?: string
  example_jp?: string
  question_id?: string
  source_text?: string
  used: boolean
  created_at: string
}

type FormatMode = 'cards' | 'format1' | 'format2'

export default function VocabularyPage() {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [format, setFormat] = useState<FormatMode>('cards')
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [dictResult, setDictResult] = useState<string | null>(null)
  const [dictLoading, setDictLoading] = useState(false)

  useEffect(() => {
    fetchWords()
  }, [])

  async function fetchWords() {
    try {
      const res = await fetch('/api/word-bank?_=' + Date.now(), { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setWords(data.words)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(wordId: string) {
    if (!confirm('この単語を削除しますか?')) return
    try {
      const res = await fetch(`/api/word-bank?wordId=${wordId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setWords(prev => prev.filter(w => w.id !== wordId))
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function handleLookup(word: string) {
    setSelectedWord(word)
    setDictResult(null)
    setDictLoading(true)
    try {
      const res = await fetch('/api/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, format: format === 'format2' ? 'format2' : 'format1' })
      })
      const data = await res.json()
      setDictResult(data.result || 'エラー: ' + (data.error || 'Unknown'))
    } catch (e) {
      setDictResult('接続に失敗しました')
    } finally {
      setDictLoading(false)
    }
  }

  async function handleClearAll() {
    if (!confirm('全ての単語を削除しますか? この操作は取り消せません。')) return
    try {
      const res = await fetch('/api/word-bank?action=clearall', { method: 'DELETE' })
      if (res.ok) setWords([])
    } catch (e) {
      console.error(e)
    }
  }

  const filtered = words.filter(w => {
    const q = search.toLowerCase()
    return w.word.toLowerCase().includes(q) ||
      w.meaning_jp.toLowerCase().includes(q) ||
      (w.meaning_en || '').toLowerCase().includes(q) ||
      (w.reading || '').toLowerCase().includes(q)
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4 emoji-3d">📚</div>
          <p className="text-white/70 animate-pulse">単語読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card-light p-4 mb-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <h1 className="text-xl font-bold text-white">単語帳</h1>
              <span className="glass-badge">{filtered.length} 語</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Format toggle */}
              <div className="flex gap-1">
                <button
                  onClick={() => setFormat('cards')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    format === 'cards'
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-400/40'
                      : 'bg-white/5 text-white/40 border border-transparent hover:bg-white/10'
                  }`}
                >
                  カード
                </button>
                <button
                  onClick={() => setFormat('format1')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    format === 'format1'
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-400/40'
                      : 'bg-white/5 text-white/40 border border-transparent hover:bg-white/10'
                  }`}
                >
                  深度
                </button>
                <button
                  onClick={() => setFormat('format2')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    format === 'format2'
                      ? 'bg-blue-500/30 text-blue-300 border border-blue-400/40'
                      : 'bg-white/5 text-white/40 border border-transparent hover:bg-white/10'
                  }`}
                >
                  サク懂
                </button>
              </div>
              {words.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-white/30 hover:text-red-400 text-xs ml-2"
                  title="全て削除"
                >
                  🗑️ 全て削除
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="単語を検索..."
              className="glass-input flex-1 text-sm"
            />
            <button onClick={() => setSearch('')} className="glass-btn glass-btn-sm px-3 text-xs">
              ✕
            </button>
          </div>
        </div>

        {/* Dictionary lookup result */}
        {selectedWord && (
          <div className="glass-card-light p-4 mb-4 animate-scale-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white/70">📖 {selectedWord} の検索結果</span>
              <button
                onClick={() => { setSelectedWord(null); setDictResult(null) }}
                className="text-white/30 hover:text-white/60 text-xs"
              >
                ✕ 閉じる
              </button>
            </div>
            {dictLoading && (
              <div className="text-center py-4">
                <span className="text-white/40 text-sm animate-pulse">🤖 取得中...</span>
              </div>
            )}
            {dictResult && !dictLoading && (
              <pre className="text-sm text-white/80 whitespace-pre-wrap font-mono leading-relaxed bg-white/5 rounded-xl p-4 border border-white/10 max-h-80 overflow-y-auto">
                {dictResult}
              </pre>
            )}
          </div>
        )}

        {/* Word list */}
        {filtered.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-white mb-2">
              {search ? '検索結果なし' : 'まだ単語がない'}
            </h2>
            <p className="text-white/50 text-sm">
              {search ? '別の言葉で試してください' : '試験を受けると自動的に単語が保存されます'}
            </p>
            {!search && (
              <a href="/exam" className="glass-btn glass-btn-primary inline-flex mt-4">
                📝 試験を受ける
              </a>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(w => (
              <div key={w.id} className="glass-card-light p-4 animate-fade-in hover:bg-white/5 transition-all">
                {format === 'cards' ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-purple-300 text-lg">{w.word}</span>
                        {w.reading && (
                          <span className="text-white/40 text-xs">({w.reading})</span>
                        )}
                        {w.used && (
                          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">生成済</span>
                        )}
                      </div>
                      <p className="text-white/70 text-sm mb-1">{w.meaning_jp}</p>
                      {w.meaning_en && (
                        <p className="text-white/40 text-xs mb-1">{w.meaning_en}</p>
                      )}
                      {w.example_jp && (
                        <p className="text-white/30 text-xs italic mt-1">• {w.example_jp}</p>
                      )}
                      {w.source_text && (
                        <p className="text-white/20 text-xs mt-1 truncate">📌 {w.source_text.slice(0, 60)}...</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleLookup(w.word)}
                        className="glass-btn glass-btn-sm px-3 text-xs"
                        title="辞書で調べる"
                      >
                        📖
                      </button>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="text-white/30 hover:text-red-400 text-xs px-2 py-1"
                        title="削除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/90 text-sm font-mono leading-relaxed whitespace-pre-wrap">
                        {w.word} — {w.meaning_jp}
                        {w.meaning_en ? ` / ${w.meaning_en}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleLookup(w.word)}
                        className="glass-btn glass-btn-sm px-3 text-xs"
                      >
                        📖
                      </button>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="text-white/30 hover:text-red-400 text-xs px-2 py-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats footer */}
        {words.length > 0 && (
          <div className="text-center mt-4 text-white/30 text-xs">
            {words.filter(w => w.used).length} 語 生成済み / {words.filter(w => !w.used).length} 語 未生成
          </div>
        )}
      </div>
    </div>
  )
}