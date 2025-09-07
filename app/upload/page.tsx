'use client'

import { useState } from 'react'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string>('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setStatus('Uploading...')
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (res.ok) setStatus('Uploaded!')
    else setStatus('Failed')
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-medium">Upload</h2>
      <form onSubmit={onSubmit} className="space-y-4 rounded-md border p-6">
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" disabled={!file}>
          Upload
        </button>
        {status && <p className="text-sm text-gray-600">{status}</p>}
      </form>
    </div>
  )
}
