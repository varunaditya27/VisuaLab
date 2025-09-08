"use client"

import { useEffect, useState } from 'react'
import { RotateCw, FlipVertical, FlipHorizontal, Crop as CropIcon, Sparkles } from 'lucide-react'

type Props = {
  imageId: string
  className?: string
  onChanged?: () => void
}

export default function ImageEditorPanel({ imageId, className, onChanged }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [ops, setOps] = useState<{
    rotate?: number
    flip?: boolean
    flop?: boolean
    smartCrop?: { ratio: '1:1' | '4:3' | '3:2' | '16:9' }
    saturation?: number
    normalize?: boolean
    sharpen?: boolean
  } | null>(null)

  // Load preview from API
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/images?imageId=${imageId}`, { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled) setPreview(data?.images?.[0]?.thumbUrl || null)
      } catch {
        if (!cancelled) setPreview(null)
      }
    }
    load()
    return () => { cancelled = true }
  }, [imageId])

  async function applyEdits() {
    if (!ops) return
    setBusy(true)
    try {
      const payload: any = { imageId }
      if (typeof ops.rotate === 'number') payload.rotate = ops.rotate
      if (ops.flip) payload.flip = true
      if (ops.flop) payload.flop = true
      if (ops.smartCrop) payload.smartCrop = ops.smartCrop
      if (typeof ops.saturation === 'number' || ops.normalize || ops.sharpen) {
        payload.enhance = {}
        if (typeof ops.saturation === 'number') payload.enhance.saturation = ops.saturation
        if (ops.normalize) payload.enhance.normalize = true
        if (ops.sharpen) payload.enhance.sharpen = true
      }
      const res = await fetch('/api/images/transform', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        try {
          const fresh = await fetch(`/api/images?imageId=${imageId}`, { cache: 'no-store' }).then(r => r.json())
          const next = fresh?.images?.[0]?.thumbUrl as string | undefined
          setPreview(next || (preview ? `${preview.split('?')[0]}?t=${Date.now()}` : null))
        } catch {
          setPreview(preview ? `${preview.split('?')[0]}?t=${Date.now()}` : null)
        }
        setOps(null)
        onChanged?.()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={className}>
      {/* Preview */}
      <div className="glass-subtle rounded-2xl p-4 mb-3">
        {preview ? (
          <img src={preview} alt="Preview" className="w-full max-h-72 object-contain rounded" />
        ) : (
          <div className="text-sm text-gray-500">Loading preview…</div>
        )}
      </div>

      {/* Quick edit controls */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <button className="btn-holo ghost inline-flex items-center gap-2" onClick={() => setOps(o => ({ ...(o||{}), rotate: ((o?.rotate||0)+90)%360 }))}>
          <RotateCw size={16}/> Rotate 90°
        </button>
        <button className="btn-holo ghost inline-flex items-center gap-2" onClick={() => setOps(o => ({ ...(o||{}), flip: !(o?.flip) }))}>
          <FlipVertical size={16}/> Flip
        </button>
        <button className="btn-holo ghost inline-flex items-center gap-2" onClick={() => setOps(o => ({ ...(o||{}), flop: !(o?.flop) }))}>
          <FlipHorizontal size={16}/> Mirror
        </button>
        <button className="btn-holo ghost inline-flex items-center gap-2" onClick={() => setOps(o => ({ ...(o||{}), smartCrop: { ratio: '1:1' } }))}>
          <CropIcon size={16}/> 1:1
        </button>
        <button className="btn-holo ghost inline-flex items-center gap-2" onClick={() => setOps(o => ({ ...(o||{}), smartCrop: { ratio: '16:9' } }))}>
          <CropIcon size={16}/> 16:9
        </button>
        <button className="btn-holo ghost inline-flex items-center gap-2" onClick={() => setOps(o => ({ ...(o||{}), saturation: Math.min(3, (o?.saturation||1)+0.2) }))}>
          <Sparkles size={16}/> Saturate +
        </button>
        <button className="btn-holo ghost inline-flex items-center gap-2" onClick={() => setOps(o => ({ ...(o||{}), saturation: Math.max(0.1, (o?.saturation||1)-0.2) }))}>
          <Sparkles size={16}/> Saturate -
        </button>
        <div className="ml-auto" />
      </div>

      <div className="flex items-center justify-end">
        <button
          disabled={busy || !ops}
          className="btn-holo primary inline-flex items-center gap-2 disabled:opacity-50"
          onClick={applyEdits}
        >
          {busy ? 'Applying…' : 'Apply edits'}
        </button>
      </div>
    </div>
  )
}
