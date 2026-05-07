'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Word {
  id: number
  page_num: number
  word: string
  full_name: string
  overview_en: string
  overview_jp: string
  usage: string
  examples: string
  quick_memory_en: string
  quick_memory_jp: string
  studied: boolean
}

export default function PageStudyPage({ params }: { params: { page: string } }) {
  const pageNum = params.page
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Word | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [studying, setStudying] = useState<number | null>(null)

  useEffect(() => { fetchWords() }, [pageNum])

  async function fetchWords() {
    try {
      const res = await fetch(`/api/words?page=${pageNum}`)
      const data = await res.json()
      if (data.success) setWords(data.words)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function markStudied(word: Word) {
    if (word.studied) return
    setStudying(word.id)
    try {
      await fetch('/api/words/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word_id: word.id })
      })
      setWords(prev => prev.map(w => w.id === word.id ? { ...w, studied: true } : w))
    } catch (e) { console.error(e) }
    finally { setStudying(null) }
  }

  function openWord(word: Word) {
    setSelected(word)
    setFlipped(false)
    if (!word.studied) markStudied(word)
  }

  function closeWord() {
    setSelected(null)
    setFlipped(false)
  }

  const studiedCount = words.filter(w => w.studied).length
  const progress = words.length > 0 ? (studiedCount / words.length) * 100 : 0

  return (
    <div className="page-bg">

      {/* Header */}
      <header className="header">
        <Link href="/pages" className="back-btn">←</Link>
        <div className="header-center">
          <h1 className="header-title">Page {pageNum}</h1>
          <p className="header-sub">{studiedCount} / {words.length} 学習済み</p>
        </div>
        <div className="progress-ring">
          <svg width="36" height="36" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5"/>
            <circle cx="18" cy="18" r="14" fill="none" stroke="url(#pg)" strokeWidth="3.5"
              strokeDasharray={`${2 * Math.PI * 14}`}
              strokeDashoffset={`${2 * Math.PI * 14 * (1 - progress / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
            />
            <defs>
              <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#a855f7"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </header>

      {/* Word grid */}
      <main className="word-grid">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"/>
            <p>読み込み中...</p>
          </div>
        ) : words.map((word, i) => (
          <button
            key={word.id}
            className={`word-chip ${word.studied ? 'studied' : ''}`}
            onClick={() => openWord(word)}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <span className="word-chip-num">{i + 1}</span>
            <span className="word-chip-text">{word.word}</span>
            {word.studied && <span className="studied-dot"/>}
          </button>
        ))}
      </main>

      {/* Word detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={closeWord}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="modal-header">
              <div>
                <h2 className="modal-word">{selected.word}</h2>
                {selected.full_name && <p className="modal-fullname">{selected.full_name}</p>}
              </div>
              <button className="modal-close" onClick={closeWord}>✕</button>
            </div>

            {/* Flip card */}
            <div className="flip-card" onClick={() => setFlipped(!flipped)}>
              <div className={`flip-card-inner ${flipped ? 'flipped' : ''}`}>
                {/* Front */}
                <div className="flip-face flip-front">
                  <p className="flip-hint">tap to flip</p>
                  <p className="flip-main">{selected.word}</p>
                  {selected.full_name && <p className="flip-sub">({selected.full_name})</p>}
                </div>
                {/* Back */}
                <div className="flip-face flip-back">
                  <p className="flip-hint">tap to flip</p>
                  <p className="flip-back-text">{selected.overview_jp}</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="modal-details">
              <div className="detail-row">
                <span className="detail-label">EN</span>
                <p className="detail-text">{selected.overview_en}</p>
              </div>
              <div className="detail-row">
                <span className="detail-label">JP</span>
                <p className="detail-text">{selected.overview_jp}</p>
              </div>
              <div className="detail-row">
                <span className="detail-label">Use</span>
                <p className="detail-text">{selected.usage}</p>
              </div>
              {selected.examples && (
                <div className="detail-row">
                  <span className="detail-label">Ex</span>
                  <p className="detail-text">{selected.examples}</p>
                </div>
              )}
            </div>

            {/* Studied badge or mark button */}
            <div className="modal-footer">
              {selected.studied ? (
                <div className="studied-badge">
                  <span>✓</span> 学習済み
                </div>
              ) : (
                <button
                  className="g-btn g-btn-indigo"
                  onClick={() => markStudied(selected)}
                  disabled={studying === selected.id}
                >
                  {studying === selected.id ? '保存中...' : '✓ 学習済みにする'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      <style jsx global>{`
        .page-bg {
          min-height: 100vh;
          background: #0a0a14;
          padding-bottom: 60px;
        }

        /* Header */
        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: rgba(10, 10, 20, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .back-btn {
          font-size: 1.4rem;
          color: rgba(255,255,255,0.45);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .back-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .header-center { flex: 1; }
        .header-title { font-size: 1.15rem; font-weight: 700; color: #fff; }
        .header-sub { font-size: 0.72rem; color: rgba(255,255,255,0.4); margin-top: 2px; }

        /* Word grid */
        .word-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 20px 16px;
          max-width: 600px;
          margin: 0 auto;
        }
        .word-chip {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px 8px;
          border-radius: 16px;
          background: rgba(20, 20, 40, 0.7);
          border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer;
          transition: all 0.25s ease;
          animation: chipIn 0.4s ease both;
          text-align: center;
        }
        @keyframes chipIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .word-chip:hover {
          background: rgba(99,102,241,0.15);
          border-color: rgba(99,102,241,0.35);
          transform: translateY(-3px);
        }
        .word-chip.studied {
          background: rgba(16,185,129,0.08);
          border-color: rgba(16,185,129,0.25);
        }
        .word-chip.studied:hover {
          background: rgba(16,185,129,0.15);
          border-color: rgba(16,185,129,0.4);
        }
        .word-chip-num {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.25);
          font-weight: 600;
        }
        .word-chip-text {
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          word-break: break;
        }
        .studied-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px rgba(16,185,129,0.6);
        }

        /* Loading */
        .loading-state {
          grid-column: 1/-1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 60px;
          color: rgba(255,255,255,0.4);
          font-size: 0.85rem;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(99,102,241,0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0 0 0 0;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-card {
          width: 100%;
          max-width: 520px;
          max-height: 92vh;
          overflow-y: auto;
          border-radius: 28px 28px 0 0;
          background: #13132a;
          border: 1px solid rgba(255,255,255,0.1);
          border-bottom: none;
          animation: slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1);
          padding-bottom: env(safe-area-inset-bottom, 24px);
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        /* Modal header */
        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 24px 24px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky;
          top: 0;
          background: #13132a;
          z-index: 10;
        }
        .modal-word {
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.2;
        }
        .modal-fullname {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.35);
          margin-top: 4px;
        }
        .modal-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
          border: none;
          color: rgba(255,255,255,0.5);
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .modal-close:hover { background: rgba(255,255,255,0.12); color: #fff; }

        /* Flip card */
        .flip-card {
          margin: 20px 24px;
          height: 160px;
          cursor: pointer;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .flip-card-inner.flipped { transform: rotateY(180deg); }
        .flip-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .flip-front {
          background: linear-gradient(145deg, #1e1e40, #252550);
          border: 1px solid rgba(99,102,241,0.25);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .flip-back {
          background: linear-gradient(145deg, #1a2a1a, #1f3535);
          border: 1px solid rgba(16,185,129,0.25);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          transform: rotateY(180deg);
        }
        .flip-hint {
          font-size: 0.6rem;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.2);
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .flip-main {
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          text-align: center;
        }
        .flip-sub {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.4);
          margin-top: 6px;
        }
        .flip-back-text {
          font-size: 0.95rem;
          font-weight: 600;
          color: #86efac;
          text-align: center;
          line-height: 1.6;
        }

        /* Details */
        .modal-details {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 0 24px;
        }
        .detail-row {
          display: grid;
          grid-template-columns: 36px 1fr;
          gap: 10px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .detail-row:last-child { border-bottom: none; }
        .detail-label {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 1px;
          color: #a855f7;
          background: rgba(168,85,247,0.12);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 20px;
          align-self: flex-start;
          margin-top: 2px;
        }
        .detail-text {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.75);
          line-height: 1.65;
        }

        /* Footer */
        .modal-footer {
          padding: 20px 24px;
          display: flex;
          justify-content: center;
        }
        .studied-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 20px;
          border-radius: 9999px;
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.3);
          color: #10b981;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .g-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 28px;
          border-radius: 9999px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          border: none;
          outline: none;
        }
        .g-btn-indigo {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: #fff;
          box-shadow: 0 4px 20px rgba(99,102,241,0.35);
        }
        .g-btn-indigo:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 8px 30px rgba(99,102,241,0.5);
        }
        .g-btn-indigo:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  )
}