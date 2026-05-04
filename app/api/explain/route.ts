import { NextRequest, NextResponse } from 'next/server'
import { CohereClient } from 'cohere-ai'

const COHERE_API_KEY = process.env.COHERE_API_KEY!

interface VocabItem {
  term: string
  reading?: string
  meaning_jp: string
  meaning_en?: string
  example_jp?: string
  example_en?: string
}

function sanitizeJapanese(text: string): string {
  if (!text) return text
  const replacements: Record<string, string> = {
    '生产': '生産', '资料': '資料', '编码': '符号', '网络': 'ネットワーク',
    '计算机': 'コンピュータ', '软件': 'ソフトウェア', '硬件': 'ハードウェア',
    '数据': 'データ', '数据库': 'データベース', '用户': 'ユーザー',
    '管理': '管理', '系统': 'システム', '技术': '技術', '实现': '実現',
    '过程': '過程', '信息': '情報', '应用': '応用', '业务': '業務',
    '服务': 'サービス', '平台': 'プラットフォーム', '安全': '安全',
    '威胁': '脅威', '攻击': '攻撃', '访问': 'アクセス', '认证': '認証',
    '授权': '認可', '密码': 'パスワード', '加密': '暗号化', '密钥': '鍵',
    '存储': '格納', '处理': '処理', '分析': '分析', '予測': '予測',
    '优化': '最適化', '模拟': 'シミュレーション', '虚拟': '仮想',
    '连接': '接続', '设备': 'デバイス', '终端': '端末', '云端': 'クラウド',
    '服务器': 'サーバー', '客户端': 'クライアント', '架构': 'アーキテクチャ',
    '协议': 'プロトコル', '标准': '標準', '规范': '仕様',
    '开发': '開発', '维护': '維持', '测试': 'テスト', '部署': 'デプロイ',
    '接口': 'インターフェース', '模块': 'モジュール', '功能': '機能',
    '性能': '性能', '可用性': '可用性', '可靠性': '信頼性', '扩展性': '拡張性',
    '监控': '監視', '日志': 'ログ', '备份': 'バックアップ', '恢复': '回復',
    '故障': '障害', '负载': '負荷', '缓存': 'キャッシュ', '队列': 'キュー',
    '线程': 'スレッド', '进程': 'プロセス', '内存': 'メモリ', '磁盘': 'ディスク',
    '文件': 'ファイル', '流': 'フロー', '包': 'パケット',
  }
  let result = text
  for (const [cn, jp] of Object.entries(replacements)) {
    result = result.split(cn).join(jp)
  }
  return result
}

function cleanJSON(raw: string): string {
  let s = raw.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim()
  let open = (s.match(/\{/g) || []).length
  let close = (s.match(/\}/g) || []).length
  while (open > close && open > 0) {
    const lp = s.lastIndexOf('}')
    if (lp > 0) s = s.slice(0, lp + 1)
    open--
  }
  return s
}

const EXPLAIN_PROMPT = `You are a Japanese IT exam tutor. Answer ONLY with valid JSON, no markdown.

Question: {question}
Choices:
ア: {a}
イ: {b}
ウ: {c}
エ: {d}

Correct answer (multiple may be correct): {correct}
User's answer: {user}

For EACH choice (ア, イ, ウ, エ), you must:
1. State whether this choice is correct or incorrect
2. Give a CLEAR, SPECIFIC reason why it is correct OR why it is NOT correct
3. For incorrect choices: explain exactly what detail makes them wrong — do not just say "incorrect", explain WHY
4. For correct choices: explain exactly what detail makes them right
5. Be precise and consistent — never contradict yourself between choices

Return valid JSON with this exact structure (no markdown, no extra text):
{
  "choices": {
    "ア": {"result": "correct" or "incorrect", "jp": "Japanese explanation in 1-2 sentences: why this is correct OR exactly what detail makes it incorrect", "en": "English explanation"},
    "イ": {"result": "correct" or "incorrect", "jp": "Japanese explanation", "en": "English explanation"},
    "ウ": {"result": "correct" or "incorrect", "jp": "Japanese explanation", "en": "English explanation"},
    "エ": {"result": "correct" or "incorrect", "jp": "Japanese explanation", "en": "English explanation"}
  },
  "vocabulary": [
    {"word": "technical term", "meaning_jp": "Japanese meaning", "meaning_en": "English meaning", "example_jp": "example sentence in Japanese"}
  ]
}`

export async function POST(request: NextRequest) {
  try {
    const cohere = new CohereClient({ token: COHERE_API_KEY })
    const body = await request.json()

    const prompt = EXPLAIN_PROMPT
      .replace('{question}', body.questionText || '')
      .replace('{a}', body.options?.['ア'] || '')
      .replace('{b}', body.options?.['イ'] || '')
      .replace('{c}', body.options?.['ウ'] || '')
      .replace('{d}', body.options?.['エ'] || '')
      .replace('{correct}', body.correctAnswer || '')
      .replace('{user}', body.userAnswer || '')

    const response = await cohere.chat({
      model: 'command-r7b-12-2024',
      message: prompt,
      maxTokens: 1200,
      temperature: 0.2,
    })

    const raw = response.text || ''
    const cleaned = cleanJSON(raw)
    let data = JSON.parse(cleaned)

    if (data.choices) {
      for (const key of ['ア', 'イ', 'ウ', 'エ']) {
        if (data.choices[key]) {
          if (data.choices[key].jp) {
            data.choices[key].jp = sanitizeJapanese(data.choices[key].jp)
          }
        }
      }
    }

    if (data.vocabulary) {
      data.vocabulary = (data.vocabulary as VocabItem[]).map((v: VocabItem) => ({
        ...v,
        meaning_jp: sanitizeJapanese(v.meaning_jp || ''),
        example_jp: sanitizeJapanese(v.example_jp || '')
      }))
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}