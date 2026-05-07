// FILE: app/flashcards/page.tsx — Flashcard Review
// Cards show studied words; filter panel (right) only shows studied words per page

'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface Card {
  id: number
  word: string
  full_name: string
  overview_jp: string
  overview_en: string
  page_num: number
}

function FlashcardsInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pageFilter = searchParams.get('page')

  const [cards, setCards] = useState<Card[]>([])
  const [displayCards, setDisplayCards] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [shuffled, setShuffled] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const current = displayCards[currentIndex]

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flashcards`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const list = d.cards || []
          setCards(list)
          if (pageFilter) {
            setDisplayCards(list.filter((c: Card) => c.page_num === parseInt(pageFilter)))
          } else {
            setDisplayCards(list)
          }
          setCurrentIndex(0)
          setFlipped(false)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [pageFilter])

  useEffect(() => {
    if (!cards.length) return
    if (pageFilter) {
      setDisplayCards(cards.filter((c: Card) => c.page_num === parseInt(pageFilter)))
    } else {
      setDisplayCards(cards)
    }
    setCurrentIndex(0)
    setFlipped(false)
  }, [pageFilter, cards])

  const setPage = useCallback((p: string | null) => {
    const params = new URLSearchParams()
    if (p) params.set('page', p)
    router.push(`/flashcards${params.toString() ? '?' + params.toString() : ''}`)
  }, [router])

  const flip = useCallback(() => setFlipped(f => !f), [])

  const next = useCallback(() => {
    if (currentIndex < displayCards.length - 1) {
      setCurrentIndex(i => i + 1)
      setFlipped(false)
    }
  }, [currentIndex, displayCards.length])

  const prev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
      setFlipped(false)
    }
  }, [currentIndex])

  const shuffle = useCallback(() => {
    const s = [...displayCards].sort(() => Math.random() - 0.5)
    setDisplayCards(s)
    setCurrentIndex(0)
    setFlipped(false)
    setShuffled(true)
    setTimeout(() => setShuffled(false), 1500)
  }, [displayCards])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev, flip])

  if (loading) {
    return (
      <div className="page-wrap flex-center" style={{ minHeight: '100vh' }}>
        <div className="blob-field">
          <div className="blob blob-1" /><div className="blob blob-2" />
          <div className="blob blob-3" /><div className="blob blob-4" />
        </div>
        <div className="loading-text">🃏 読み込み中...</div>
      </div>
    )
  }

  if (displayCards.length === 0) {
    return (
      <div className="page-wrap flex-center" style={{ minHeight: '100vh' }}>
        <div className="blob-field">
          <div className="blob blob-1" /><div className="blob blob-2" />
          <div className="blob blob-3" /><div className="blob blob-4" />
        </div>
        <div className="empty-state">
          <div className="empty-icon">🃏</div>
          <h2 className="empty-title">学習済みの単語がありません</h2>
          <p className="empty-sub">まずページ学習から始めよう！</p>
          <button className="clay-btn clay-btn-primary" onClick={() => router.push('/pages')}>
            ページ選択に戻る
          </button>
        </div>
      </div>
    )
  }

  // Back button stays fixed regardless of filter panel
  const backLeft = 16

  return (
    <div className="page-wrap" style={{ minHeight: '100vh' }}>
      <div className="blob-field">
        <div className="blob blob-1" /><div className="blob blob-2" />
        <div className="blob blob-3" /><div className="blob blob-4" />
        <div className="blob blob-5" />
      </div>

      {/* ── Floating Back Button (top-left, fixed — never moves) ── */}
      <a
        href="/"
        className="clay-btn"
        style={{
          position: 'fixed',
          top: 16,
          left: backLeft,
          zIndex: 300,
          padding: '9px 16px',
          fontSize: '0.82rem',
        }}
      >
        ← 戻る
      </a>

      {/* ── Header Controls (top-right) ── */}
      <div style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 290,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          padding: '7px 14px',
          background: 'rgba(255,255,255,0.92)',
          border: '2px solid rgba(255,255,255,0.9)',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-clay-sm)',
          fontSize: '0.78rem',
          fontWeight: 900,
          color: 'var(--purple)',
          fontFamily: "'Nunito', sans-serif",
        }}>
          {currentIndex + 1} / {displayCards.length}
        </div>

        <button
          onClick={shuffle}
          className="clay-btn"
          style={{ width: 36, height: 36, padding: 0, fontSize: '0.9rem' }}
          title="シャッフル"
        >
          {shuffled ? '✅' : '🔀'}
        </button>

        <button
          onClick={() => setFilterOpen(o => !o)}
          className="clay-btn"
          style={{
            width: 36, height: 36, padding: 0, fontSize: '0.9rem',
            background: filterOpen
              ? 'linear-gradient(135deg, var(--purple), var(--purple-dark))'
              : undefined,
            color: filterOpen ? '#fff' : undefined,
          }}
          title="ページフィルター"
        >
          📑
        </button>
      </div>

      {/* ── Page Filter Panel (right, below top bar) ── */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: filterOpen ? 200 : 0,
        overflow: 'hidden',
        transition: 'width 0.38s cubic-bezier(0.34,1.56,0.64,1)',
        zIndex: 250,
      }}>
        <div style={{
          width: 200,
          height: '100%',
          background: 'rgba(240,237,255,0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '2px solid rgba(255,255,255,0.65)',
          padding: filterOpen ? '72px 14px 16px' : '0',
          transition: 'padding 0.38s var(--ease-smooth)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          overflowY: 'auto',
          scrollbarWidth: 'none',
        }}>
          <div style={{
            fontSize: '0.68rem', fontWeight: 900,
            color: 'var(--purple-dark)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            paddingBottom: 8,
            borderBottom: '1.5px solid rgba(124,111,247,0.1)',
            marginBottom: 4,
          }}>
            🌐 ページフィルター
          </div>
          <button
            onClick={() => setPage(null)}
            className="clay-btn"
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif",
              fontSize: '0.82rem', fontWeight: 800,
              background: !pageFilter
                ? 'linear-gradient(135deg, var(--purple), var(--purple-dark))'
                : 'rgba(255,255,255,0.7)',
              color: !pageFilter ? '#fff' : 'var(--text)',
              textAlign: 'left',
              boxShadow: !pageFilter ? 'var(--shadow-clay-sm)' : 'none',
            }}
          >
            🌐 すべて
          </button>
          {[1,2,3,4,5,6,7,8].map(p => (
            <button
              key={p}
              onClick={() => setPage(String(p))}
              className="clay-btn"
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
                fontSize: '0.82rem', fontWeight: 800,
                background: pageFilter === String(p)
                  ? 'linear-gradient(135deg, var(--purple), var(--purple-dark))'
                  : 'rgba(255,255,255,0.7)',
                color: pageFilter === String(p) ? '#fff' : 'var(--text)',
                textAlign: 'left',
                boxShadow: pageFilter === String(p) ? 'var(--shadow-clay-sm)' : 'none',
              }}
            >
              P.{p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0,
        right: filterOpen ? 200 : 0,
        height: 5,
        background: 'rgba(124,111,247,0.10)',
        zIndex: 160,
        transition: 'right 0.38s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{
          height: '100%',
          width: `${displayCards.length > 1 ? (currentIndex / (displayCards.length - 1)) * 100 : 100}%`,
          background: 'linear-gradient(90deg, var(--purple), var(--pink))',
          transition: 'width 0.3s var(--ease-smooth)',
          borderRadius: '0 3px 3px 0',
        }} />
      </div>

      {/* ── Flip Card ── */}
      <div
        className="flex-center"
        style={{
          minHeight: '100vh',
          paddingTop: 72,
          paddingBottom: 80,
          paddingLeft: 20,
          paddingRight: 20,
          cursor: 'pointer',
          transition: 'padding-right 0.38s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={flip}
      >
        <div style={{ width: '100%', maxWidth: 580 }}>

          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <span style={{
              display: 'inline-block',
              fontSize: '0.72rem', fontWeight: 700,
              color: 'var(--text-dim)',
              padding: '4px 14px',
              background: 'rgba(124,111,247,0.07)',
              border: '1.5px solid rgba(124,111,247,0.12)',
              borderRadius: 'var(--radius-full)',
              letterSpacing: '0.03em',
            }}>
              {flipped ? '👆 もう一度タップで元に戻す' : '👆 タップしてめくる'}
            </span>
          </div>

          <div style={{ perspective: 1400 }}>
            <div style={{
              position: 'relative',
              width: '100%',
              height: 300,
              transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}>

              <div style={{
                position: 'absolute', inset: 0,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                borderRadius: 'var(--radius-xl)',
                background: 'rgba(255,255,255,0.95)',
                border: '2.5px solid rgba(255,255,255,0.9)',
                boxShadow: 'var(--shadow-clay-lg)',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 32,
                textAlign: 'center',
                gap: 12,
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 5,
                  background: 'linear-gradient(90deg, var(--purple), var(--blue), var(--mint))',
                  borderRadius: '44px 44px 0 0',
                }} />
                <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                  P.{current?.page_num}
                </span>
                <span style={{
                  fontSize: '2.8rem',
                  fontWeight: 900,
                  color: 'var(--text)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.15,
                }}>
                  {current?.word?.replace(/^\d+\.\s*/, '')}
                </span>
                <span style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-soft)',
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}>
                  {current?.full_name?.replace(/^\d+\.\s*/, '')}
                </span>
              </div>

              <div style={{
                position: 'absolute', inset: 0,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(145deg, rgba(180,168,255,0.14), rgba(255,184,216,0.10))',
                border: '2.5px solid rgba(124,111,247,0.18)',
                boxShadow: 'var(--shadow-clay-lg)',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 28,
                textAlign: 'center',
                gap: 12,
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 5,
                  background: 'linear-gradient(90deg, var(--pink), var(--purple))',
                  borderRadius: '44px 44px 0 0',
                }} />
                <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                  P.{current?.page_num}
                </span>
                <div style={{
                  background: 'rgba(255,255,255,0.75)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 22px',
                  border: '1.5px solid rgba(124,111,247,0.14)',
                  width: '100%',
                }}>
                  <div style={{
                    fontSize: '0.62rem', fontWeight: 900, color: 'var(--purple)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
                  }}>🇯🇵 意味</div>
                  <p style={{
                    fontSize: '1.05rem', fontWeight: 700,
                    color: 'var(--text)', lineHeight: 1.65,
                  }}>
                    {current?.overview_jp}
                  </p>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.6)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 22px',
                  border: '1.5px solid rgba(100,196,255,0.14)',
                  width: '100%',
                }}>
                  <div style={{
                    fontSize: '0.62rem', fontWeight: 900, color: 'var(--blue-deep)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
                  }}>🇬🇧 English</div>
                  <p style={{
                    fontSize: '0.88rem', color: 'var(--text-soft)',
                    lineHeight: 1.55, fontWeight: 600,
                  }}>
                    {current?.overview_en}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Compact Nav Bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '10px 20px 18px',
        background: 'rgba(240,237,255,0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '2px solid rgba(255,255,255,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        zIndex: 120,
      }}>
        <button
          onClick={prev}
          className="clay-btn"
          disabled={currentIndex === 0}
          style={{
            opacity: currentIndex === 0 ? 0.38 : 1,
            minWidth: 80,
            fontSize: '0.85rem',
            padding: '10px 16px',
          }}
        >
          ← 前へ
        </button>

        <div style={{
          display: 'flex',
          gap: 5,
          alignItems: 'center',
          flexWrap: 'nowrap',
          overflow: 'hidden',
          maxWidth: 'calc(100vw - 220px)',
        }}>
          {displayCards.slice(0, 20).map((_, i) => (
            <div
              key={i}
              onClick={() => { setCurrentIndex(i); setFlipped(false) }}
              style={{
                width: i === currentIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === currentIndex
                  ? 'linear-gradient(90deg, var(--purple), var(--pink))'
                  : 'rgba(124,111,247,0.2)',
                transition: 'all 0.25s var(--ease-bounce)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />
          ))}
          {displayCards.length > 20 && (
            <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontWeight: 800, marginLeft: 4 }}>
              +{displayCards.length - 20}
            </span>
          )}
        </div>

        <button
          onClick={next}
          className="clay-btn"
          disabled={currentIndex === displayCards.length - 1}
          style={{
            opacity: currentIndex === displayCards.length - 1 ? 0.38 : 1,
            minWidth: 80,
            fontSize: '0.85rem',
            padding: '10px 16px',
          }}
        >
          次へ →
        </button>
      </div>
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
      <div className="loading-text">🃏 読み込み中...</div>
    </div>
  )
}

export default function FlashcardsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FlashcardsInner />
    </Suspense>
  )
}