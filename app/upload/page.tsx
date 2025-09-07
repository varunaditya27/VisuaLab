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
      <h2 className="mb-4 font-display text-2xl">Upload</h2>
      <form onSubmit={onSubmit} className="card space-y-4 p-6">
        <input className="block w-full rounded-lg border-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-white hover:file:bg-brand-700" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button type="submit" className="btn-primary" disabled={!file}>
          Upload
        </button>
        {status && <p className="text-sm text-gray-600">{status}</p>}
      </form>
    </div>
  )
}
