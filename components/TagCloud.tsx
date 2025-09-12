"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Tag = { id: string; name: string; count: number }

export default function TagCloud({ limit = 40 }: { limit?: number }) {
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    let active = true
    fetch('/api/tags')
      .then(r => r.json())
      .then(d => { if (active) setTags((d?.tags || []).slice(0, limit)) })
      .catch(() => {})
    return () => { active = false }
  }, [limit])

  const [min, max] = useMemo(() => {
    if (!tags.length) return [0, 0]
    const counts = tags.map(t => t.count)
    return [Math.min(...counts), Math.max(...counts)]
  }, [tags])

  const scale = (c: number) => {
    if (max === min) return 1
    const n = (c - min) / (max - min)
    return 0.8 + n * 1.4 // scale 0.8x to 2.2x
  }

  const hue = (c: number) => {
    if (max === min) return 260
    const n = (c - min) / (max - min)
    return Math.round(260 - n * 160) // purple to teal
  }

  return (
    <div className="w-full rounded-xl border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        {tags.map(t => (
          <Link
            key={t.id}
            href={{ pathname: '/gallery', query: { tags: t.name } }}
            className="inline-flex items-center rounded-full px-3 py-1 transition-transform hover:scale-105"
            style={{
              fontSize: `${scale(t.count)}rem`,
              background: `hsla(${hue(t.count)}, 80%, 20%, 0.2)`,
              color: `hsl(${hue(t.count)}, 90%, 70%)`,
              border: `1px solid hsla(${hue(t.count)}, 90%, 60%, 0.5)`
            }}
          >
            #{t.name}
            <span className="ml-2 text-xs opacity-70">{t.count}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
