'use client'

import { useState } from 'react'

export default function UploadPage() {
  const [questionFile, setQuestionFile] = useState<File | null>(null)
  const [answerFile, setAnswerFile] = useState<File | null>(null)
  const [examYear, setExamYear] = useState('2024')
  const [examSeason, setExamSeason] = useState('春')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUpload() {
    if (!questionFile || !answerFile) {
      setStatus('⚠️ Both files are required')
      return
    }

    setLoading(true)
    setStatus('⏳ Uploading and processing...')

    const formData = new FormData()
    formData.append('questionFile', questionFile)
    formData.append('answerFile', answerFile)
    formData.append('examYear', examYear)
    formData.append('examSeason', examSeason)

    try {
      const res = await fetch('/api/upload-pdf', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.success) {
        setStatus(`✅ Success! ${data.data.totalQuestions} questions saved.`)
      } else if (data.error === 'duplicate') {
        setStatus(`⚠️ Already uploaded: "${data.data.filename}"`)
      } else {
        setStatus(`❌ Error: ${data.error}`)
      }
    } catch (e: any) {
      setStatus(`❌ Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📤 PDF Upload</h1>

      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <div>
          <label className="block font-medium mb-2">問題PDF (Question)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={e => setQuestionFile(e.target.files?.[0] || null)}
            className="w-full border rounded-lg p-2"
          />
          {questionFile && <p className="text-sm text-gray-500 mt-1">{questionFile.name}</p>}
        </div>

        <div>
          <label className="block font-medium mb-2">解答PDF (Answer)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={e => setAnswerFile(e.target.files?.[0] || null)}
            className="w-full border rounded-lg p-2"
          />
          {answerFile && <p className="text-sm text-gray-500 mt-1">{answerFile.name}</p>}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-medium mb-2">年度</label>
            <select
              value={examYear}
              onChange={e => setExamYear(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              {[2020,2021,2022,2023,2024,2025].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block font-medium mb-2">季節</label>
            <select
              value={examSeason}
              onChange={e => setExamSeason(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="春">春 (Spring)</option>
              <option value="秋">秋 (Autumn)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {loading ? '処理中...' : 'アップロード'}
        </button>

        {status && (
          <div className="p-4 bg-gray-100 rounded-lg text-sm">{status}</div>
        )}
      </div>
    </div>
  )
}
