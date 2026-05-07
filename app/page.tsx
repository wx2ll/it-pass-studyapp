// FILE: app/page.tsx — Home
// Redesign: True claymorphism — tactile, toy-like, Pixar-warm

'use client'

import Link from 'next/link'

const NAV_ITEMS = [
  {
    href: '/pages',
    icon: '📑',
    iconClass: 'clay-icon-purple',
    title: 'ページ選択',
    sub: '勉強するページを選ぶ',
    cta: '始める',
    ctaColor: 'var(--purple)',
    accentBg: 'rgba(124,111,247,0.07)',
    accentBorder: 'rgba(124,111,247,0.12)',
  },
  {
    href: '/flashcards',
    icon: '🃏',
    iconClass: 'clay-icon-blue',
    title: 'フラッシュカード',
    sub: '学習した単語を復習',
    cta: '始める',
    ctaColor: 'var(--blue-deep)',
    accentBg: 'rgba(100,196,255,0.07)',
    accentBorder: 'rgba(100,196,255,0.14)',
  },
  {
    href: '/wordbank',
    icon: '📚',
    iconClass: 'clay-icon-pink',
    title: '単語帳',
    sub: '全単語を検索・確認',
    cta: '始める',
    ctaColor: 'var(--pink-deep)',
    accentBg: 'rgba(255,143,192,0.07)',
    accentBorder: 'rgba(255,143,192,0.14)',
  },
]

export default function Home() {
  return (
    <div className="page-wrap">

      {/* Background blobs — enhanced clay art 3D style */}
      <div className="blob-field">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
        <div className="blob blob-5" />
      </div>

      {/* Extra clay art bubbles decoration */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none', overflow: 'hidden'
      }}>
        {/* Top-left large clay ball */}
        <div style={{
          position: 'absolute', top: -20, left: -40,
          width: 160, height: 160,
          background: 'linear-gradient(145deg, #d0c8ff, #a8a0f8)',
          borderRadius: '50% 55% 52% 58%',
          opacity: 0.35,
          boxShadow: '10px 10px 0px rgba(100,80,180,0.2), 20px 20px 40px rgba(124,111,247,0.25)',
          animation: 'blob-drift 11s ease-in-out infinite 0.5s',
        }} />
        {/* Top-right mint clay ball */}
        <div style={{
          position: 'absolute', top: 60, right: -30,
          width: 110, height: 110,
          background: 'linear-gradient(145deg, #90e8c8, #58d8a8)',
          borderRadius: '58% 52% 55% 48%',
          opacity: 0.4,
          boxShadow: '8px 8px 0px rgba(40,140,100,0.18), 16px 16px 32px rgba(94,220,170,0.25)',
          animation: 'blob-drift 13s ease-in-out infinite 1.5s',
        }} />
        {/* Bottom-left small pink clay ball */}
        <div style={{
          position: 'absolute', bottom: 100, left: -20,
          width: 80, height: 80,
          background: 'linear-gradient(145deg, #ffcce8, #ff80b8)',
          borderRadius: '50% 55% 48% 55%',
          opacity: 0.38,
          boxShadow: '6px 6px 0px rgba(180,60,100,0.18), 12px 12px 28px rgba(255,143,192,0.25)',
          animation: 'blob-drift 10s ease-in-out infinite 0.8s',
        }} />
        {/* Bottom-right large yellow clay ball */}
        <div style={{
          position: 'absolute', bottom: -30, right: 40,
          width: 140, height: 140,
          background: 'linear-gradient(145deg, #ffe878, #ffd040)',
          borderRadius: '52% 58% 55% 50%',
          opacity: 0.35,
          boxShadow: '9px 9px 0px rgba(160,120,0,0.2), 18px 18px 36px rgba(255,217,90,0.25)',
          animation: 'blob-drift 12s ease-in-out infinite reverse',
        }} />
        {/* Small purple floating dot */}
        <div style={{
          position: 'absolute', top: 200, left: '15%',
          width: 20, height: 20,
          background: 'var(--purple)',
          borderRadius: '50%',
          opacity: 0.6,
          boxShadow: '3px 3px 0px rgba(80,60,180,0.25)',
          animation: 'blob-drift 8s ease-in-out infinite 2s',
        }} />
        {/* Small mint dot */}
        <div style={{
          position: 'absolute', top: 280, right: '20%',
          width: 14, height: 14,
          background: 'var(--mint)',
          borderRadius: '50%',
          opacity: 0.65,
          animation: 'blob-drift 7s ease-in-out infinite 1s',
        }} />
        {/* Small pink dot */}
        <div style={{
          position: 'absolute', bottom: 180, right: '15%',
          width: 16, height: 16,
          background: 'var(--pink)',
          borderRadius: '50%',
          opacity: 0.6,
          animation: 'blob-drift 9s ease-in-out infinite 3s',
        }} />
        {/* Small blue dot */}
        <div style={{
          position: 'absolute', top: 380, left: '8%',
          width: 12, height: 12,
          background: 'var(--blue)',
          borderRadius: '50%',
          opacity: 0.55,
          animation: 'blob-drift 8.5s ease-in-out infinite 0.3s',
        }} />
        {/* Center-left yellow star */}
        <div style={{
          position: 'absolute', top: 160, left: '8%',
          width: 28, height: 28,
          background: 'linear-gradient(145deg, #ffd95a, #ffc040)',
          borderRadius: '50%',
          opacity: 0.7,
          boxShadow: '3px 3px 0px rgba(160,120,0,0.25)',
          animation: 'blob-drift 11s ease-in-out infinite 2.5s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem',
        }}>⭐</div>
        {/* Bottom-center small orange clay ball */}
        <div style={{
          position: 'absolute', bottom: 60, left: '50%',
          width: 50, height: 50,
          background: 'linear-gradient(145deg, #ffb888, #ff9040)',
          borderRadius: '55% 50% 52% 48%',
          opacity: 0.4,
          boxShadow: '5px 5px 0px rgba(180,80,20,0.18), 10px 10px 24px rgba(255,160,80,0.22)',
          animation: 'blob-drift 10s ease-in-out infinite reverse 1s',
        }} />
      </div>

      {/* Content */}
      <div className="page-content" style={{
        paddingTop: 80,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        justifyContent: 'center',
        gap: 0,
      }}>

        {/* Hero Card */}
        <div className="clay-card" style={{
          textAlign: 'center',
          marginBottom: 28,
          width: '100%',
          maxWidth: 540,
          padding: '36px 32px 32px',
          background: 'rgba(255,255,255,0.92)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 4,
            background: 'linear-gradient(90deg, var(--purple), var(--pink), var(--blue), var(--mint))',
            borderRadius: '32px 32px 0 0',
          }} />

          <div style={{ marginBottom: 18 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 16px',
              background: 'linear-gradient(135deg, rgba(124,111,247,0.12), rgba(100,196,255,0.10))',
              border: '1.5px solid rgba(124,111,247,0.18)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.08em',
              color: 'var(--purple-dark)', textTransform: 'uppercase',
            }}>
              🎯 ITパスポート
            </span>
          </div>

          <div style={{
            width: 88, height: 88, margin: '0 auto 20px',
            background: 'linear-gradient(145deg, #b0a8ff, #7c6ff7)',
            borderRadius: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.6rem',
            border: '2.5px solid rgba(255,255,255,0.5)',
            boxShadow: '6px 6px 0px rgba(80,60,180,0.38), 12px 12px 28px rgba(124,111,247,0.35), -4px -4px 12px rgba(255,255,255,0.8), inset 0 2px 6px rgba(255,255,255,0.4)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
              borderRadius: 'inherit',
            }} />
            🧠
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text)', lineHeight: 1.15, marginBottom: 10, letterSpacing: '-0.03em' }}>
            単語学習アプリ
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-soft)', lineHeight: 1.65, fontWeight: 600 }}>
            ページ選択 → 学習 → フラッシュカードで復習 🚀
          </p>
        </div>

        {/* Nav Cards */}
        <div style={{ width: '100%', maxWidth: 540, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div className="clay-btn" style={{
                display: 'flex', alignItems: 'center', gap: 18,
                cursor: 'pointer',
                padding: '20px 22px',
                background: item.accentBg,
                borderColor: item.accentBorder,
                textAlign: 'left',
                width: '100%',
                fontFamily: 'Nunito, sans-serif',
                borderRadius: 'var(--radius-lg)',
              }}>
                <div className={`clay-icon-box ${item.iconClass}`}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text)', marginBottom: 3, letterSpacing: '-0.01em' }}>
                    {item.title}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', fontWeight: 600 }}>
                    {item.sub}
                  </p>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.85)',
                  border: '2px solid rgba(255,255,255,0.9)',
                  borderRadius: 'var(--radius-full)',
                  padding: '7px 16px',
                  fontSize: '0.75rem', fontWeight: 900,
                  color: item.ctaColor,
                  boxShadow: 'var(--shadow-clay-sm)',
                  whiteSpace: 'nowrap', letterSpacing: '0.01em',
                }}>
                  {item.cta} →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Tagline */}
        <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(124,111,247,0.35))',
            borderRadius: 2,
          }} />
          <p style={{
            fontSize: '0.78rem', color: 'var(--text-dim)', letterSpacing: '0.03em', fontWeight: 700,
          }}>
            Consistency beats intensity 💪
          </p>
          <div style={{
            width: 32, height: 2,
            background: 'linear-gradient(90deg, rgba(124,111,247,0.35), transparent)',
            borderRadius: 2,
          }} />
        </div>

      </div>
    </div>
  )
}