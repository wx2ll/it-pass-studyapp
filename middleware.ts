import { NextRequest, NextResponse } from 'next/server'

// Simple password protection — change APP_PASSWORD to something strong
const APP_PASSWORD = 'itpass2026'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip password check for static files, favicon, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/api/health' ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check password cookie or Authorization header
  const cookie = request.cookies.get('app_auth')
  const authHeader = request.headers.get('authorization')

  if (cookie?.value === APP_PASSWORD) {
    return NextResponse.next()
  }

  // Check Basic Auth header
  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64 = authHeader.slice(6)
    const decoded = Buffer.from(base64, 'base64').toString()
    if (decoded === `user:${APP_PASSWORD}`) {
      const response = NextResponse.next()
      response.cookies.set('app_auth', APP_PASSWORD, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      })
      return response
    }
  }

  // Return login page
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>ITパスポート 学習アプリ 🔒</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            font-family: 'Inter', sans-serif;
          }
          .card {
            background: rgba(255,255,255,0.08);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.18);
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            color: white;
            max-width: 360px;
            width: 90%;
          }
          h1 { font-size: 1.4rem; margin-bottom: 8px; }
          p { color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-bottom: 24px; }
          input {
            width: 100%;
            padding: 14px 18px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 1rem;
            outline: none;
            margin-bottom: 16px;
            text-align: center;
          }
          input:focus { border-color: #667eea; }
          button {
            width: 100%;
            padding: 14px;
            border-radius: 12px;
            border: none;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
          }
          button:hover { opacity: 0.9; }
          .error { color: #f87171; font-size: 0.8rem; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🔒 ITパスポート 学習アプリ</h1>
          <p>Enter password to access</p>
          <form method="POST" action="?__auth=1">
            <input type="password" name="password" placeholder="Password" autofocus required />
            <button type="submit">入る →</button>
          </form>
        </div>
      </body>
      </html>`,
      {
        status: 401,
        headers: { 'Content-Type': 'text/html', 'WWW-Authenticate': 'Basic realm="IT Passport App"' }
      }
    )
  }

  return new NextResponse('Unauthorized', { status: 401 })
}

export const config = {
  matcher: ['/((?!_next/static|favicon.ico).*)']
}
