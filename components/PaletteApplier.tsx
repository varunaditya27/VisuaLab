"use client"

import { useEffect } from 'react'

export default function PaletteApplier() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem('visuaPalette')
      if (!raw) return
      const data = JSON.parse(raw) as { values?: Record<string, string> }
      const vars = data?.values || {}
      const root = document.documentElement
      for (const k of Object.keys(vars)) root.style.setProperty(k, vars[k])
    } catch {}
  }, [])
  return null
}
