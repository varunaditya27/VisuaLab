"use client"

import { useEffect, useRef, useState } from 'react'
import 'tui-image-editor/dist/tui-image-editor.css'
import 'tui-color-picker/dist/tui-color-picker.css'
// Ensure fabric is available on window for TUI Image Editor
import * as fabricNS from 'fabric'

type ProImageEditorProps = {
  src: string
  onSave: (blob: Blob) => Promise<void>
  theme?: any
}

export default function ProImageEditor({ src, onSave, theme }: ProImageEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    // Bind fabric to window if missing
    if (typeof window !== 'undefined' && !(window as any).fabric) {
      ;(window as any).fabric = (fabricNS as any)
    }
    setError(null)
    if (!containerRef.current || !src) return
    let cancelled = false
    ;(async () => {
      try {
        // Fetch image with cookies, convert to object URL to bypass CORS
        const res = await fetch(src, { credentials: 'include', cache: 'no-store' })
        if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`)
        const blob = await res.blob()
        const objUrl = URL.createObjectURL(blob)
        objectUrlRef.current = objUrl

        // Dynamically import editor only after fabric is available
        const mod = await import('tui-image-editor')
        const EditorCtor: any = (mod as any).default || (mod as any)
        if (cancelled) return
        const instance = new EditorCtor(containerRef.current!, {
          includeUI: {
            loadImage: { path: objUrl, name: 'image' },
            theme: theme ?? {
              'menu.backgroundColor': 'rgba(0,0,0,0.4)',
              'submenu.backgroundColor': 'rgba(0,0,0,0.5)',
              'submenu.partition.color': 'rgba(255,255,255,0.15)',
              'submenu.normalIcon.color': '#fff',
              'submenu.activeIcon.color': '#00d4ff',
            },
            menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'mask', 'filter'],
            uiSize: { width: '100%', height: '70vh' },
            menuBarPosition: 'bottom',
          },
          cssMaxWidth: 10000,
          cssMaxHeight: 10000,
          selectionStyle: { cornerSize: 12, rotatingPointOffset: 48 },
          usageStatistics: false,
        })
        editorRef.current = instance
  // Ensure default mode sets proper interaction so crop/zoom work
  try { (instance as any).ui.activeMenuEvent?.('crop') } catch {}
      } catch (e: any) {
        setError(e?.message || 'Invalid image loaded.')
      }
    })()

    return () => {
      cancelled = true
      try { editorRef.current?.destroy?.() } catch {}
      editorRef.current = null
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [src, theme])

  async function handleSave() {
    const inst = editorRef.current
    if (!inst) return
    const dataUrl = inst.toDataURL({ format: 'jpeg', quality: 0.9 })
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    await onSave(blob)
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
  <div ref={containerRef} className="w-full relative z-10 pointer-events-auto" />
      <div className="flex gap-2">
        <button className="btn-holo primary" onClick={handleSave}>Apply Changes</button>
      </div>
    </div>
  )
}
