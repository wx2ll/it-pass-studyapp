import { NextRequest, NextResponse } from 'next/server'

const WEBHOOK_URL = 'http://localhost:3001/webhook'
const WEBHOOK_SECRET = 'fe6bb274f1e8e296e595e3cad1f0a0138dba68eca8d85b3e'

interface VocabItem {
  term: string
  reading?: string
  meaning_jp: string
  meaning_en?: string
  example_jp?: string
  example_en?: string
}

// Fix Chinese chars that AI sometimes outputs in Japanese text
function sanitizeJapanese(text: string): string {
  if (!text) return text
  // Most common Chinese→Japanese conversions for IT context
  const replacements: Record<string, string> = {
    '生产': '生産', '资料': '資料', '编码': '符号', '网络': 'ネットワーク',
    '计算机': 'コンピュータ', '软件': 'ソフトウェア', '硬件': 'ハードウェア',
    '数据': 'データ', '数据库': 'データベース', '用户': 'ユーザー',
    '管理': '管理', '系统': 'システム', '技术': '技術', '实现': '実現',
    '过程': '過程', '信息': '情報', '应用': '応用', '业务': '業務',
    '服务': 'サービス', '平台': 'プラットフォーム', '安全': '安全',
    '威胁': '脅威', '攻击': '攻撃', '访问': 'アクセス', '认证': '認証',
    '授权': '認可', '密码': 'パスワード', '加密': '暗号化', '密钥': '鍵',
    '存储': '格納', '处理': '処理', '分析': '分析', '预测': '予測',
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Transform keys for webhook
    const webhookBody = {
      task: 'explain',
      question_text: body.questionText,
      choices: body.options,
      correct_answer: body.correctAnswer,
      user_answer: body.userAnswer
    }

    const webhookRes = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': WEBHOOK_SECRET
      },
      body: JSON.stringify(webhookBody)
    })

    const data = await webhookRes.json()

    // Sanitize per-choice explanations
    if (data.choices) {
      for (const key of ['ア', 'イ', 'ウ', 'エ']) {
        if (data.choices[key]) {
          if (data.choices[key].jp) {
            data.choices[key].jp = sanitizeJapanese(data.choices[key].jp)
          }
        }
      }
    }

    // Sanitize vocabulary
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
