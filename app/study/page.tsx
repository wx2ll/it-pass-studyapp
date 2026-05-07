// FILE: app/study/page.tsx — Word Learning (Study) Section
// Layout: Side panel (RIGHT) + Floating controls
// Explanation format: Overview / Usage / Examples / Quick Memory

'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface Word {
  id: number
  word: string
  full_name: string
  overview_en: string
  overview_jp: string
  usage: string
  examples: string
  quick_memory_en: string
  quick_memory_jp: string
  page_num: number
  studied: boolean
}

function StudyInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const page = searchParams.get('page') || '1'

  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [marking, setMarking] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)

  const selectedWord = words[selectedIndex]

  useEffect(() => {
    fetch(`/api/words?page=${page}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setWords(d.words)
          const first = d.words.findIndex((w: Word) => !w.studied)
          setSelectedIndex(first >= 0 ? first : 0)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const selectWord = useCallback((i: number) => {
    setSelectedIndex(i)
  }, [])

  const markStudied = useCallback(async () => {
    if (!selectedWord || marking) return
    setMarking(true)
    try {
      await fetch(`/api/words/study`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word_id: selectedWord.id }),
      })
      setWords(prev => prev.map(w => w.id === selectedWord.id ? { ...w, studied: true } : w))
    } catch {}
    setMarking(false)
  }, [selectedWord, marking])

  // ── Render explanation in user's format ──
  const renderExplanation = (w: Word) => {
    const examples = w.examples ? w.examples.split(',').map((e: string) => e.trim()).filter(Boolean) : []

    return (
      <div style={{
        fontFamily: "'Nunito', sans-serif",
        color: 'var(--text)',
        padding: '0 4px',
        maxWidth: 640,
        margin: '0 auto',
      }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            marginBottom: 6,
          }}>
            {w.word}
          </h1>
          {w.full_name && w.full_name !== w.word && (
            <p style={{ fontSize: '0.92rem', color: 'var(--text-soft)', fontWeight: 600 }}>
              {w.full_name}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{
              fontSize: '0.68rem', fontWeight: 900,
              color: 'var(--purple-dark)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              background: 'rgba(124,111,247,0.1)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1.5px solid rgba(124,111,247,0.15)',
            }}>
              Overview
            </span>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.88)',
            border: '2px solid rgba(255,255,255,0.9)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 22px',
            boxShadow: 'var(--shadow-clay-sm)',
          }}>
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--blue-deep)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>EN</span>
              <p style={{ fontSize: '1.05rem', color: 'var(--text)', lineHeight: 1.65, fontWeight: 600, marginTop: 6 }}>
                {w.overview_en}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--purple-dark)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>JP</span>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-soft)', lineHeight: 1.65, fontWeight: 600, marginTop: 6 }}>
                {w.overview_jp}
              </p>
            </div>
          </div>
        </div>

        {w.usage && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 10 }}>
              <span style={{
                fontSize: '0.68rem', fontWeight: 900,
                color: 'var(--mint-deep)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                background: 'rgba(94,220,170,0.1)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1.5px solid rgba(94,220,170,0.18)',
              }}>
                Usage
              </span>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.88)',
              border: '2px solid rgba(255,255,255,0.9)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 22px',
              boxShadow: 'var(--shadow-clay-sm)',
            }}>
              <p style={{ fontSize: '1.05rem', color: 'var(--text)', lineHeight: 1.65, fontWeight: 600 }}>
                {w.usage}
              </p>
            </div>
          </div>
        )}

        {examples.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 10 }}>
              <span style={{
                fontSize: '0.68rem', fontWeight: 900,
                color: '#9a7200',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                background: 'rgba(255,217,90,0.1)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1.5px solid rgba(255,217,90,0.2)',
              }}>
                Examples
              </span>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.88)',
              border: '2px solid rgba(255,255,255,0.9)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 22px',
              boxShadow: 'var(--shadow-clay-sm)',
            }}>
              <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {examples.map((ex: string, i: number) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{
                      width: 22, height: 22, flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(255,217,90,0.35), rgba(255,180,60,0.22))',
                      border: '1.5px solid rgba(255,217,90,0.35)',
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 900, color: '#9a7200',
                      marginTop: 2,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '1rem', color: 'var(--text)', lineHeight: 1.6, fontWeight: 600 }}>
                      {ex}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{
              fontSize: '0.68rem', fontWeight: 900,
              color: 'var(--pink-deep)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              background: 'rgba(255,143,192,0.1)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1.5px solid rgba(255,143,192,0.18)',
            }}>
              Quick Memory
            </span>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.88)',
            border: '2px solid rgba(255,255,255,0.9)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 22px',
            boxShadow: 'var(--shadow-clay-sm)',
          }}>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 900, color: 'var(--blue-deep)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>EN</span>
              <p style={{ fontSize: '0.98rem', color: 'var(--text)', lineHeight: 1.55, fontWeight: 700, marginTop: 5 }}>
                {w.quick_memory_en}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.62rem', fontWeight: 900, color: 'var(--purple-dark)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>JP</span>
              <p style={{ fontSize: '0.98rem', color: 'var(--text-soft)', lineHeight: 1.55, fontWeight: 600, marginTop: 5 }}>
                {w.quick_memory_jp}
              </p>
            </div>
          </div>
        </div>

      </div>
    )
  }

  if (loading) {
    return (
      <div className="page-wrap flex-center" style={{ minHeight: '100vh' }}>
        <div className="blob-field">
          <div className="blob blob-1" /><div className="blob blob-2" />
          <div className="blob blob-3" /><div className="blob blob-4" />
        </div>
        <div className="loading-text">📚 読み込み中...</div>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="page-wrap flex-center" style={{ minHeight: '100vh' }}>
        <div className="blob-field">
          <div className="blob blob-1" /><div className="blob blob-2" />
          <div className="blob blob-3" /><div className="blob blob-4" />
        </div>
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2 className="empty-title">このページの単語がありません</h2>
          <button className="clay-btn clay-btn-primary" onClick={() => router.push('/pages')}>
            ページ選択に戻る
          </button>
        </div>
      </div>
    )
  }

  // Floating button positions (don't depend on panel)
  const floatLeft = 16
  const floatRight = 16

  return (
    <div className="page-wrap" style={{ minHeight: '100vh' }}>
      <div className="blob-field">
        <div className="blob blob-1" /><div className="blob blob-2" />
        <div className="blob blob-3" /><div className="blob blob-4" />
        <div className="blob blob-5" />
      </div>

      {/* ── Floating Back Button (top-left, fixed — no panel dependency) ── */}
      <a
        href="/pages"
        className="clay-btn"
        style={{
          position: 'fixed',
          top: 16,
          left: floatLeft,
          zIndex: 300,
          padding: '9px 16px',
          fontSize: '0.82rem',
        }}
      >
        ← 戻る
      </a>

      {/* ── Floating Mark Studied Button (bottom-left) ── */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        left: floatLeft,
        zIndex: 200,
      }}>
        {selectedWord?.studied ? (
          <div className="clay-btn" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 20px',
            fontSize: '0.85rem',
            color: 'var(--mint-deep)',
          }}>
            ✅ 学習済み
          </div>
        ) : (
          <button
            className="clay-btn clay-btn-primary"
            onClick={markStudied}
            disabled={marking}
            style={{
              padding: '11px 22px',
              fontSize: '0.85rem',
              opacity: marking ? 0.7 : 1,
            }}
          >
            {marking ? '⏳...' : '✓ 学習完了'}
          </button>
        )}
      </div>

      {/* ── Floating Panel Toggle (top-right) ── */}
      <button
        onClick={() => setPanelOpen(o => !o)}
        className="clay-btn"
        style={{
          position: 'fixed',
          top: 16,
          right: floatRight,
          zIndex: 290,
          width: 36,
          height: 36,
          padding: 0,
          fontSize: '0.9rem',
          background: panelOpen
            ? 'linear-gradient(135deg, var(--purple), var(--purple-dark))'
            : undefined,
          color: panelOpen ? '#fff' : undefined,
          transform: panelOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1), background 0.3s, color 0.3s',
        }}
        title={panelOpen ? 'パネルを閉じる' : 'パネルを開く'}
      >
        ☰
      </button>

      {/* ── Side Panel (RIGHT) ── */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: panelOpen ? 240 : 0,
        overflow: 'hidden',
        transition: 'width 0.42s cubic-bezier(0.34,1.56,0.64,1)',
        zIndex: 250,
      }}>
        <div style={{
          width: 240,
          height: '100%',
          background: 'rgba(240,237,255,0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '2px solid rgba(255,255,255,0.65)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 16px 12px',
            borderBottom: '1.5px solid rgba(255,255,255,0.6)',
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: '0.68rem', fontWeight: 900,
              color: 'var(--purple-dark)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              P.{page} — {words.length}語
            </span>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 10px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}>
            {words.map((w, i) => (
              <button
                key={w.id}
                onClick={() => selectWord(i)}
                className="clay-btn"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  marginBottom: 3,
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                  textAlign: 'left',
                  background: i === selectedIndex
                    ? 'rgba(124,111,247,0.14)'
                    : 'rgba(255,255,255,0.7)',
                  boxShadow: i === selectedIndex ? 'var(--shadow-clay-sm)' : 'none',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: i === selectedIndex ? 'var(--purple-dark)' : 'var(--text)',
                }}
              >
                <span style={{
                  width: 22, height: 22, flexShrink: 0,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 900,
                  background: w.studied
                    ? 'linear-gradient(135deg, var(--mint), var(--mint-deep))'
                    : 'rgba(124,111,247,0.1)',
                  color: w.studied ? '#fff' : 'var(--purple-dark)',
                  border: w.studied ? 'none' : '1.5px solid rgba(124,111,247,0.2)',
                  transition: 'all 0.22s',
                }}>
                  {i + 1}
                </span>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: i === selectedIndex ? 'var(--purple-dark)' : 'var(--text)',
                  letterSpacing: '-0.01em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}>
                  {w.word.replace(/^\d+\.\s*/, '')}
                </span>
                {w.studied && (
                  <span style={{ fontSize: '0.62rem', color: 'var(--mint-deep)', fontWeight: 900, flexShrink: 0 }}>
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{
        marginRight: panelOpen ? 240 : 0,
        transition: 'margin-right 0.42s cubic-bezier(0.34,1.56,0.64,1)',
        paddingTop: 0,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          flex: 1,
          padding: '72px 24px 90px',
          overflowY: 'auto',
        }}>
          {selectedWord && renderExplanation(selectedWord)}
        </div>
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
      <div className="loading-text">📚 読み込み中...</div>
    </div>
  )
}

export default function StudyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StudyInner />
    </Suspense>
  )
}