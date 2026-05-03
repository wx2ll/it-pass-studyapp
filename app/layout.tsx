import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ITパスポート 学習アプリ',
  description: 'AI-powered IT Passport study app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen">
        <div className="relative z-0">
          {children}
        </div>
        {/* Magnetic text effect — words dodge cursor on hover */}
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              var magnets = document.querySelectorAll('.magnetic-word');
              var active = null;
              
              function moveWords(e) {
                if (!active) return;
                var rect = active.getBoundingClientRect();
                var cx = rect.left + rect.width / 2;
                var cy = rect.top + rect.height / 2;
                var dx = (e.clientX - cx) / rect.width;
                var dy = (e.clientY - cy) / rect.height;
                var dist = Math.sqrt(dx*dx + dy*dy);
                var maxDist = 0.8;
                var repel = Math.max(0, (maxDist - dist) / maxDist) * 30;
                var x = -dx * repel;
                var y = -dy * repel;
                active.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(0.97)';
                active.style.opacity = '' + (1 - repel / 60);
              }
              
              magnets.forEach(function(el) {
                el.addEventListener('mouseenter', function() {
                  active = el;
                  document.addEventListener('mousemove', moveWords);
                });
                el.addEventListener('mouseleave', function() {
                  active = null;
                  el.style.transform = '';
                  el.style.opacity = '';
                  document.removeEventListener('mousemove', moveWords);
                });
              });
            });
          `
        }} />
      </body>
    </html>
  )
}
