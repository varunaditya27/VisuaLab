'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { fadeIn, staggerContainer, staggerItem } from '@/lib/animations'

export default function UploadForm({ onUploaded }: { onUploaded?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [albumId, setAlbumId] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [albums, setAlbums] = useState<Array<{ id: string; name: string }>>([])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    fetch('/api/albums').then(r => r.json()).then(d => setAlbums(d.albums || [])).catch(() => {})
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setBusy(true)
    setStatus('Uploading...')
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (albumId) formData.append('albumId', albumId)
      if (title) formData.append('title', title)
      if (caption) formData.append('caption', caption)
      if (tags) formData.append('tags', tags)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        setStatus('Uploaded!')
        setFile(null)
        setAlbumId('')
        setTitle('')
        setCaption('')
        setTags('')
        onUploaded?.()
      } else {
        const text = await res.text().catch(() => '')
        setStatus(`Failed${text ? `: ${text}` : ''}`)
      }
    } catch (e: any) {
      setStatus(`Failed: ${e?.message ?? 'Unknown error'}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.form
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      onSubmit={onSubmit}
      className="space-y-3"
    >
      <motion.div variants={staggerItem} className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Button type="button" className="!bg-transparent !border-purple-500/50" onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
          <span className="text-sm text-gray-600 truncate max-w-[12rem]">
            {file?.name ?? 'No file selected'}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </motion.div>
      <motion.input variants={staggerItem} whileFocus={{ scale: 1.02 }} className="input-neural w-full" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <motion.input variants={staggerItem} whileFocus={{ scale: 1.02 }} className="input-neural w-full" placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
      <motion.input variants={staggerItem} whileFocus={{ scale: 1.02 }} className="input-neural w-full" placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
      <motion.select variants={staggerItem} whileFocus={{ scale: 1.02 }} className="input-neural w-full" value={albumId} onChange={(e) => setAlbumId(e.target.value)}>
        <option value="">No album</option>
        {albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </motion.select>
      <motion.div variants={staggerItem}>
        <Button type="submit" className="disabled:opacity-50 w-full" disabled={!file || busy}>
          {busy ? 'Uploading…' : 'Upload'}
        </Button>
      </motion.div>
      {status && <motion.p variants={fadeIn('up', 0.5)} className="text-sm text-gray-600">{status}</motion.p>}
    </motion.form>
  )
}