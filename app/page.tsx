import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">

      {/* Floating emojis — behind everything, no pointer events */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-[12%] left-[8%] text-5xl float-emoji" style={{ animationDelay: '0s' }}>📚</span>
        <span className="absolute top-[20%] right-[12%] text-4xl float-emoji" style={{ animationDelay: '1s' }}>🧠</span>
        <span className="absolute bottom-[25%] left-[10%] text-4xl float-emoji" style={{ animationDelay: '2s' }}>💻</span>
        <span className="absolute bottom-[15%] right-[8%] text-5xl float-emoji" style={{ animationDelay: '0.5s' }}>⚡</span>
        <span className="absolute top-[60%] left-[5%] text-3xl float-emoji" style={{ animationDelay: '1.5s' }}>🎯</span>
        <span className="absolute top-[40%] right-[5%] text-3xl float-emoji" style={{ animationDelay: '3s' }}>🔒</span>
      </div>

      {/* Hero text */}
      <div className="text-center mb-10 animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight leading-tight">
          <span className="magnetic-word bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            ITパスポート
          </span>
          <br />
          <span className="magnetic-word text-white/90">学習アプリ</span>
        </h1>
        <p className="magnetic-word text-white/50 text-sm mt-3 font-medium">
          AI-powered study platform
        </p>
      </div>

      {/* Nav cards */}
      <div className="flex flex-col gap-5 w-full max-w-md">

        <Link href="/exam" className="nav-card block">
          <div className="glass-card p-7 text-center">
            <div className="text-6xl mb-4 emoji-3d">📝</div>
            <div className="text-xl font-bold text-white mb-1">試験を受ける</div>
            <div className="text-sm text-white/50">令和7年度 — 100問</div>
            <div className="mt-4 glass-badge mx-auto w-fit">
              <span>▶</span> 始める
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/flashcards" className="nav-card block">
            <div className="glass-card p-5 text-center h-full">
              <div className="text-5xl mb-3 emoji-3d">🃏</div>
              <div className="text-lg font-bold text-white mb-1">復習</div>
              <div className="text-xs text-white/50">フラッシュカード</div>
            </div>
          </Link>

          <Link href="/vocabulary" className="nav-card block">
            <div className="glass-card p-5 text-center h-full">
              <div className="text-5xl mb-3 emoji-3d">📚</div>
              <div className="text-lg font-bold text-white mb-1">単語帳</div>
              <div className="text-xs text-white/50">保存した単語</div>
            </div>
          </Link>
        </div>

      </div>

      {/* Bottom tagline */}
      <p className="text-white/30 text-xs mt-10 animate-fade-in" style={{ animationDelay: '0.5s' }}>
        Keep pushing — consistency beats intensity 💪
      </p>
    </div>
  )
}
