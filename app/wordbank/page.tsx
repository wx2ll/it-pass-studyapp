// FILE: app/wordbank/page.tsx — Word Bank / Dictionary
// Redesign: Clay list items, infographic bottom sheet, search with clay styling

'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface Word {
  id: number
  word: string
  full_name: string
  overview_jp: string
  overview_en: string
  page_num: number
  studied: boolean
}

const PAGE_COLOR_MAP: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'rgba(124,111,247,0.12)', text: 'var(--purple-dark)', border: 'rgba(124,111,247,0.2)' },
  2: { bg: 'rgba(100,196,255,0.14)', text: 'var(--blue-deep)',   border: 'rgba(100,196,255,0.22)' },
  3: { bg: 'rgba(255,143,192,0.14)', text: 'var(--pink-deep)',   border: 'rgba(255,143,192,0.22)' },
  4: { bg: 'rgba(94,220,170,0.14)',  text: 'var(--mint-deep)',   border: 'rgba(94,220,170,0.22)'  },
  5: { bg: 'rgba(255,217,90,0.18)',  text: '#9a7200',            border: 'rgba(255,217,90,0.28)'  },
  6: { bg: 'rgba(255,160,80,0.14)',  text: '#a04800',            border: 'rgba(255,160,80,0.22)'  },
}

function getPageColor(pageNum: number) {
  return PAGE_COLOR_MAP[pageNum] || PAGE_COLOR_MAP[1]
}

function WordBankInner() {
  const searchParams = useSearchParams()
  const pageFilter = searchParams.get('page')

  const [allWords, setAllWords] = useState<Word[]>([])
  const [displayWords, setDisplayWords] = useState<Word[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Word | null>(null)
  const [markingId, setMarkingId] = useState<number | null>(null)

  useEffect(() => {
    const url = pageFilter
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/words?page=${pageFilter}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/words?all=true`
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setAllWords(d.words || [])
          setDisplayWords(d.words || [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [pageFilter])

  useEffect(() => {
    const q = search.trim().toLowerCase()
    if (!q) {
      setDisplayWords(allWords)
    } else {
      setDisplayWords(allWords.filter(w =>
        w.word.toLowerCase().includes(q) ||
        w.full_name.toLowerCase().includes(q) ||
        w.overview_jp.toLowerCase().includes(q)
      ))
    }
  }, [search, allWords])

  const openWord  = useCallback((w: Word) => setSelected(w), [])
  const closeSheet = useCallback(() => setSelected(null), [])

  const markStudied = useCallback(async (word: Word) => {
    if (markingId) return
    setMarkingId(word.id)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/words/study`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word_id: word.id }),
      })
      const updater = (list: Word[]) =>
        list.map(w => w.id === word.id ? { ...w, studied: true } : w)
      setAllWords(prev => updater(prev))
      setDisplayWords(prev => updater(prev))
      if (selected?.id === word.id) setSelected({ ...word, studied: true })
    } catch {}
    setMarkingId(null)
  }, [markingId, selected])

  const studiedCount = allWords.filter(w => w.studied).length

  return (
    <div className="page-wrap">
      <div className="blob-field">
        <div className="blob blob-1" /><div className="blob blob-2" />
        <div className="blob blob-3" /><div className="blob blob-4" />
        <div className="blob blob-5" />
      </div>

      {/* Floating Back Button */}
      <a
        href="/"
        className="clay-btn"
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 300,
          padding: '9px 16px',
          fontSize: '0.82rem',
        }}
      >
        ← 戻る
      </a>

      {/* ── Search bar ── */}
      <div style={{
        position: 'fixed', top: 58, left: 0, right: 0,
        padding: '10px 16px',
        background: 'rgba(240,237,255,0.9)',
        backdropFilter: 'blur(18px)',
        zIndex: 90,
        borderBottom: '1.5px solid rgba(255,255,255,0.65)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.88)',
          border: '2px solid rgba(255,255,255,0.95)',
          borderRadius: 'var(--radius-full)',
          padding: '10px 18px',
          boxShadow: 'var(--shadow-clay-sm)',
        }}>
          <span style={{ fontSize: '0.95rem', opacity: 0.5 }}>🔍</span>
          <input
            type="text"
            placeholder="単語を検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontFamily: 'Nunito, sans-serif',
              fontSize: '0.92rem',
              fontWeight: 600,
              color: 'var(--text)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'rgba(124,111,247,0.1)',
                border: '1.5px solid rgba(124,111,247,0.15)',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                color: 'var(--purple)',
                width: 24, height: 24,
                fontSize: '0.72rem',
                fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0,
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Word list ── */}
      <div style={{
        padding: '132px 16px 40px',
        maxWidth: 680,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        {loading ? (
          <div className="loading-text">📖 読み込み中...</div>
        ) : displayWords.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h2 className="empty-title">
              {search ? '該当する単語がありません' : '単語がありません'}
            </h2>
            {search && (
              <button className="clay-btn" onClick={() => setSearch('')} style={{ marginTop: 8 }}>
                検索をクリア
              </button>
            )}
          </div>
        ) : (
          displayWords.map((w, i) => {
            const pageColor = getPageColor(w.page_num)
            return (
              <button
                key={w.id}
                className="word-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '15px 18px',
                }}
                onClick={() => openWord(w)}
              >
                {/* Index number */}
                <span style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-dim)',
                  width: 24,
                  textAlign: 'right',
                  flexShrink: 0,
                  fontWeight: 800,
                }}>
                  {i + 1}
                </span>

                {/* Word info */}
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.98rem',
                      fontWeight: 900,
                      color: 'var(--text)',
                      letterSpacing: '-0.01em',
                    }}>
                      {w.word}
                    </span>
                    {w.studied && (
                      <span style={{
                        fontSize: '0.66rem',
                        color: 'var(--mint-deep)',
                        background: 'rgba(94,220,170,0.16)',
                        border: '1.5px solid rgba(94,220,170,0.28)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}>
                        ✓ 済
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '0.76rem',
                    color: 'var(--text-soft)',
                    display: 'block',
                    marginTop: 3,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {w.full_name}
                  </span>
                </div>

                {/* Page badge */}
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  color: pageColor.text,
                  background: pageColor.bg,
                  border: `1.5px solid ${pageColor.border}`,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  flexShrink: 0,
                }}>
                  P.{w.page_num}
                </span>
              </button>
            )
          })
        )}
      </div>

      {/* ── Bottom Sheet ── */}
      {selected && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(160,140,220,0.22)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 300,
          }}
          onClick={closeSheet}
        >
          <div
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: 'rgba(255,255,255,0.96)',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              border: '2px solid rgba(255,255,255,0.88)',
              borderBottom: 'none',
              boxShadow: '0 -10px 60px rgba(140,120,220,0.22)',
              maxHeight: '84vh',
              display: 'flex',
              flexDirection: 'column',
              animation: 'sheet-up 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{
              width: 40, height: 5,
              background: 'rgba(160,140,220,0.28)',
              borderRadius: 'var(--radius-full)',
              margin: '14px auto 0',
              flexShrink: 0,
            }} />

            {/* Colorful top accent */}
            <div style={{
              height: 4,
              margin: '14px 24px 0',
              background: 'linear-gradient(90deg, var(--purple), var(--pink), var(--blue))',
              borderRadius: 'var(--radius-full)',
              flexShrink: 0,
            }} />

            {/* Sheet header */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              padding: '18px 24px 14px',
              borderBottom: '1.5px solid rgba(124,111,247,0.08)',
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: 'var(--text)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  marginBottom: 4,
                }}>
                  {selected.word}
                </h2>
                <p style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-soft)',
                  fontWeight: 600,
                }}>
                  {selected.full_name}
                </p>
              </div>
              <button
                onClick={closeSheet}
                style={{
                  width: 32, height: 32,
                  background: 'rgba(124,111,247,0.08)',
                  border: '1.5px solid rgba(124,111,247,0.12)',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem',
                  color: 'var(--text-soft)',
                  flexShrink: 0,
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                ✕
              </button>
            </div>

            {/* Sheet body */}
            <div style={{
              padding: '18px 24px',
              overflowY: 'auto',
              flex: 1,
            }}>
              {/* JP meaning box */}
              <div style={{
                background: 'rgba(124,111,247,0.06)',
                border: '1.5px solid rgba(124,111,247,0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
                marginBottom: 12,
              }}>
                <div style={{
                  fontSize: '0.65rem', fontWeight: 900,
                  color: 'var(--purple-dark)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  🇯🇵 意味（日本語）
                </div>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--text)',
                  lineHeight: 1.7,
                  fontWeight: 700,
                }}>
                  {selected.overview_jp}
                </p>
              </div>

              {/* EN meaning box */}
              <div style={{
                background: 'rgba(100,196,255,0.07)',
                border: '1.5px solid rgba(100,196,255,0.16)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
              }}>
                <div style={{
                  fontSize: '0.65rem', fontWeight: 900,
                  color: 'var(--blue-deep)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  🇬🇧 English
                </div>
                <p style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-soft)',
                  lineHeight: 1.65,
                  fontWeight: 600,
                }}>
                  {selected.overview_en}
                </p>
              </div>
            </div>

            {/* Sheet footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 24px 28px',
              borderTop: '1.5px solid rgba(124,111,247,0.08)',
              flexShrink: 0,
            }}>
              {/* Page badge */}
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 900,
                color: getPageColor(selected.page_num).text,
                background: getPageColor(selected.page_num).bg,
                border: `1.5px solid ${getPageColor(selected.page_num).border}`,
                padding: '5px 14px',
                borderRadius: 'var(--radius-full)',
              }}>
                P.{selected.page_num}
              </span>

              {selected.studied ? (
                <span style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(94,220,170,0.15)',
                  border: '2px solid rgba(94,220,170,0.28)',
                  color: 'var(--mint-deep)',
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  ✅ 学習済み
                </span>
              ) : (
                <button
                  className="clay-btn clay-btn-primary"
                  style={{
                    padding: '10px 20px',
                    fontSize: '0.85rem',
                    opacity: markingId === selected.id ? 0.7 : 1,
                  }}
                  disabled={markingId === selected.id}
                  onClick={() => markStudied(selected)}
                >
                  {markingId === selected.id ? '⏳...' : '✓ 学習完了'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes sheet-up {
          from { transform: translateY(100%); opacity: 0.6; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="page-wrap flex-center" style={{ minHeight: '100vh' }}>
      <div className="blob-field">
        <div className="blob blob-1" /><div className="blob blob-2" />
        <div className="blob blob-3" /><div className="blob blob-4" />
      </div>
      <div className="loading-text">📖 読み込み中...</div>
    </div>
  )
}

export default function WordBankPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WordBankInner />
    </Suspense>
  )
}