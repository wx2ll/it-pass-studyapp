// FILE: app/pages/page.tsx — Page Selection
// Clay card grid with glow effect on hover + cute clay art illustration

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface PageItem {
  page_num: number
  count: number
}

const PAGE_COLORS = [
  { bg: 'linear-gradient(145deg, #b0a8ff, #8878f8)', shadow: '4px 4px 0px rgba(80,60,180,0.35)', glow: 'rgba(124,111,247,0.5)' },
  { bg: 'linear-gradient(145deg, #90d8ff, #50b8f8)', shadow: '4px 4px 0px rgba(40,100,180,0.28)', glow: 'rgba(100,196,255,0.5)' },
  { bg: 'linear-gradient(145deg, #ffb0d4, #ff80b8)', shadow: '4px 4px 0px rgba(180,60,100,0.25)', glow: 'rgba(255,143,192,0.5)' },
  { bg: 'linear-gradient(145deg, #90e8c8, #58d8a8)', shadow: '4px 4px 0px rgba(40,140,100,0.28)', glow: 'rgba(94,220,170,0.5)' },
  { bg: 'linear-gradient(145deg, #ffe878, #ffd040)', shadow: '4px 4px 0px rgba(160,120,0,0.22)', glow: 'rgba(255,217,90,0.5)' },
  { bg: 'linear-gradient(145deg, #ffb888, #ff9040)', shadow: '4px 4px 0px rgba(180,80,20,0.22)', glow: 'rgba(255,160,80,0.5)' },
]

// Cute clay art illustration replacing text
function ClayArtIllustration() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0,
      marginBottom: 32,
      userSelect: 'none',
    }}>
      {/* Top row: clay balls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: -5 }}>
        {[
          { bg: '#b0a8ff', shadow: '#7c6ff7', size: 28 },
          { bg: '#90d8ff', shadow: '#50b8f8', size: 22 },
          { bg: '#ffb0d4', shadow: '#ff80b8', size: 26 },
        ].map((b, i) => (
          <div key={i} style={{
            width: b.size, height: b.size,
            background: `linear-gradient(145deg, ${b.bg}, ${b.shadow})`,
            borderRadius: '50%',
            boxShadow: `3px 3px 0px ${b.shadow}88, inset 0 2px 4px rgba(255,255,255,0.4)`,
          }} />
        ))}
      </div>

      {/* Main book */}
      <div style={{ position: 'relative', width: 90, height: 72 }}>
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: 90, height: 58,
          background: 'linear-gradient(145deg, #b0a8ff, #8878f8)',
          borderRadius: '12px 12px 8px 8px',
          boxShadow: '5px 5px 0px rgba(80,60,180,0.4), inset 0 2px 5px rgba(255,255,255,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {[32, 38, 28].map((h, i) => (
            <div key={i} style={{
              width: 8, height: h,
              background: 'linear-gradient(180deg, #fff 0%, #e0d8ff 100%)',
              borderRadius: 4,
              boxShadow: '1px 1px 0px rgba(80,60,180,0.3)',
            }} />
          ))}
          <div style={{
            position: 'absolute', left: 0, top: 8, bottom: 8, width: 10,
            background: 'linear-gradient(90deg, #9080f0, #b0a8ff)',
            borderRadius: '4px 0 0 4px',
          }} />
        </div>
        <div style={{
          position: 'absolute', top: 0, left: 8, width: 75, height: 20,
          background: 'linear-gradient(180deg, #fff, #f0edff)',
          borderRadius: '6px 6px 0 0',
          boxShadow: '0 -2px 8px rgba(124,111,247,0.15)',
          transform: 'rotateX(20deg)',
          transformOrigin: 'bottom',
        }} />
      </div>

      {/* Bottom row: star + pencil + clay ball */}
      <div style={{ display: 'flex', gap: 10, marginTop: -2 }}>
        <div style={{
          width: 18, height: 18,
          background: 'linear-gradient(145deg, #ffd95a, #ffc040)',
          borderRadius: '50%',
          boxShadow: '2px 2px 0px rgba(180,120,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem',
        }}>⭐</div>
        <div style={{ position: 'relative', width: 8, height: 28, background: 'linear-gradient(145deg, #ffe878, #ffd040)', borderRadius: '2px 2px 1px 1px', boxShadow: '2px 2px 0px rgba(180,120,0,0.3)', transform: 'rotate(15deg)' }}>
          <div style={{ position: 'absolute', top: -5, left: -1, width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '8px solid #f08040' }} />
        </div>
        <div style={{ width: 20, height: 20, background: 'linear-gradient(145deg, #90e8c8, #58d8a8)', borderRadius: '50%', boxShadow: '2px 2px 0px rgba(40,140,100,0.3)' }} />
      </div>
    </div>
  )
}

export default function PagesPage() {
  const router = useRouter()
  const [pages, setPages] = useState<PageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PageItem | null>(null)

  useEffect(() => {
    fetch(`/api/pages`)
      .then(r => r.json())
      .then(d => { if (d.success) setPages(d.pages) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-wrap">
      <div className="blob-field">
        <div className="blob blob-1" /><div className="blob blob-2" />
        <div className="blob blob-3" /><div className="blob blob-4" />
        <div className="blob blob-5" />
      </div>

      {/* Floating back button */}
      <a href="/" className="clay-btn" style={{ position: 'fixed', top: 16, left: 16, zIndex: 300, padding: '9px 16px', fontSize: '0.82rem' }}>
        ← 戻る
      </a>

      <div className="page-content">
        <ClayArtIllustration />

        {loading ? (
          <div className="loading-text">🔄 読み込み中...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
            {pages.map((page, idx) => {
              const color = PAGE_COLORS[idx % PAGE_COLORS.length]
              return (
                <button
                  key={page.page_num}
                  onClick={() => setSelected(page)}
                  className="clay-btn"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    padding: '22px 16px 18px',
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px solid rgba(255,255,255,0.85)',
                    boxShadow: 'var(--shadow-clay)',
                    cursor: 'pointer',
                    fontFamily: 'Nunito, sans-serif',
                    transition: 'all 0.28s var(--ease-bounce)',
                    position: 'relative',
                    overflow: 'visible',
                  }}
                >
                  <div
                    style={{
                      width: 60, height: 60,
                      borderRadius: '50%',
                      background: color.bg,
                      border: '2.5px solid rgba(255,255,255,0.55)',
                      boxShadow: `${color.shadow}, 8px 8px 18px ${color.glow}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', overflow: 'hidden',
                      transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = `${color.shadow}, 0 0 32px ${color.glow}, 0 0 12px ${color.glow}`
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = `${color.shadow}, 8px 8px 18px ${color.glow}`
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, transparent 100%)',
                    }} />
                    <span style={{
                      fontSize: '1.5rem', fontWeight: 900, color: '#fff',
                      textShadow: '0 1px 3px rgba(0,0,0,0.2)', letterSpacing: '-0.02em',
                    }}>
                      {page.page_num}
                    </span>
                  </div>

                  <span style={{
                    fontSize: '0.76rem', color: 'var(--text-soft)', fontWeight: 700,
                    background: 'rgba(124,111,247,0.07)', padding: '3px 10px',
                    borderRadius: 'var(--radius-full)', border: '1px solid rgba(124,111,247,0.1)',
                  }}>
                    {page.count}語
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{
              width: 80, height: 80, margin: '0 auto 20px',
              background: PAGE_COLORS[(selected.page_num - 1) % PAGE_COLORS.length].bg,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.4rem', border: '2.5px solid rgba(255,255,255,0.5)',
              boxShadow: `${PAGE_COLORS[(selected.page_num - 1) % PAGE_COLORS.length].shadow}, 10px 10px 24px ${PAGE_COLORS[(selected.page_num - 1) % PAGE_COLORS.length].glow}`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, transparent 100%)',
              }} />
              <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.8rem', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                {selected.page_num}
              </span>
            </div>

            <h2 className="modal-title">P.{selected.page_num} を学習</h2>
            <p className="modal-sub">
              <span style={{ fontWeight: 800, color: 'var(--purple)' }}>{selected.count}個</span>の単語を収録
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="clay-btn clay-btn-primary" style={{ width: '100%', fontSize: '0.95rem' }}
                onClick={() => { router.push(`/study?page=${selected.page_num}`); setSelected(null) }}>
                📖 学習する
              </button>
              <button className="clay-btn" style={{ width: '100%', fontSize: '0.92rem', color: 'var(--blue-deep)' }}
                onClick={() => { router.push(`/flashcards?page=${selected.page_num}`); setSelected(null) }}>
                🃏 フラッシュカード
              </button>
              <button className="clay-btn" style={{ width: '100%', color: 'var(--text-soft)', fontSize: '0.88rem' }}
                onClick={() => setSelected(null)}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}