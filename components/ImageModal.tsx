'use client'

import { useEffect } from 'react'

export default function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/70">
      <button className="absolute right-4 top-4 rounded bg-white/10 p-2 text-white" onClick={onClose}>
        Close
      </button>
      <div className="flex h-full items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Preview" className="max-h-full max-w-full rounded" />
      </div>
    </div>
  )
}
