"use client"

import { useEffect, useMemo, useState, useCallback } from 'react'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { Button } from '@/components/ui/Button'
import { presetPalettes } from '@/lib/palettes'
import { toast } from '@/lib/toast'
import Loader from '@/components/ui/Loader'

type Palette = { id: string; name: string; json: Record<string, string> }

// Grouped keys for a cleaner, less overwhelming UI
const GROUPS: Array<{ title: string; keys: Array<{ key: string; label: string; pairWith?: string }> }> = [
  { title: 'Base', keys: [
    { key: '--background', label: 'Background', pairWith: '--foreground' },
    { key: '--foreground', label: 'Foreground', pairWith: '--background' },
  ]},
  { title: 'Surfaces', keys: [
    { key: '--card', label: 'Card', pairWith: '--card-foreground' },
    { key: '--card-foreground', label: 'Card Foreground', pairWith: '--card' },
    { key: '--popover', label: 'Popover', pairWith: '--popover-foreground' },
    { key: '--popover-foreground', label: 'Popover Foreground', pairWith: '--popover' },
  ]},
  { title: 'Primary & Secondary', keys: [
    { key: '--primary', label: 'Primary', pairWith: '--primary-foreground' },
    { key: '--primary-foreground', label: 'Primary Foreground', pairWith: '--primary' },
    { key: '--secondary', label: 'Secondary', pairWith: '--secondary-foreground' },
    { key: '--secondary-foreground', label: 'Secondary Foreground', pairWith: '--secondary' },
  ]},
  { title: 'Accent & Muted', keys: [
    { key: '--accent', label: 'Accent', pairWith: '--accent-foreground' },
    { key: '--accent-foreground', label: 'Accent Foreground', pairWith: '--accent' },
    { key: '--muted', label: 'Muted', pairWith: '--muted-foreground' },
    { key: '--muted-foreground', label: 'Muted Foreground', pairWith: '--muted' },
  ]},
  { title: 'Feedback & Utility', keys: [
    { key: '--destructive', label: 'Destructive', pairWith: '--destructive-foreground' },
    { key: '--destructive-foreground', label: 'Destructive Foreground', pairWith: '--destructive' },
    { key: '--border', label: 'Border' },
    { key: '--input', label: 'Input' },
    { key: '--ring', label: 'Ring' },
  ]},
]

export default function PaletteEditorPage() {
  const [palettes, setPalettes] = useState<Palette[]>([])
  const [name, setName] = useState('My Theme')
  const [values, setValues] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(GROUPS.map(g => g.title)))
  const [initialSnapshot, setInitialSnapshot] = useState<Record<string, string>>({})

  const loggedIn = useMemo(() => {
    if (typeof document === 'undefined') return false
    const u = document.cookie.match(/(?:^|; )rbacUsernameClient=([^;]+)/)
    return !!u
  }, [])

  useEffect(() => {
    fetch('/api/palettes').then(r => r.json()).then(d => setPalettes(d.palettes || [])).catch(() => {})
    // capture initial computed values so user can reset individual tokens
    if (typeof document !== 'undefined') {
      const root = getComputedStyle(document.documentElement)
      const snap: Record<string, string> = {}
      GROUPS.flatMap(g => g.keys).forEach(k => {
        const raw = root.getPropertyValue(k.key).trim()
        if (raw) snap[k.key] = raw
      })
      setInitialSnapshot(snap)
    }
  }, [])

  // live preview by applying variables to :root
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    for (const k of Object.keys(values)) {
      const v = values[k]
      // allow rgb triplets like "255 255 255" for Tailwind rgb(var(--bg)) usage
      root.style.setProperty(k, v)
    }
  }, [values])

  function setValue(key: string, val: string) {
    setValues(v => ({ ...v, [key]: val }))
  }

  const resetValue = useCallback((key: string) => {
    setValues(v => {
      const next = { ...v }
      if (initialSnapshot[key]) next[key] = initialSnapshot[key]
      else delete next[key]
      return next
    })
  }, [initialSnapshot])

  const resetAll = useCallback(() => {
    setValues(initialSnapshot)
  }, [initialSnapshot])

  const toggleGroup = (title: string) => {
    setExpanded(prev => {
      const n = new Set(prev)
      if (n.has(title)) n.delete(title); else n.add(title)
      return n
    })
  }

  function applyPalette(p: Palette) {
    setSelected(p.id)
    const json = p.json || {}
    setValues(json)
    setName(p.name)
  }

  async function savePalette() {
    setIsSaving(true)
    try {
      const res = await fetch('/api/palettes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selected || undefined, name, json: values }) })
      if (!res.ok) {
        throw new Error('Failed to save palette')
      }
      const d = await res.json()
      const p = d.palette as Palette
      setSelected(p.id)
      setPalettes(prev => {
        const others = prev.filter(x => x.id !== p.id)
        return [p, ...others]
      })
      toast({ variant: 'success', title: 'Palette Saved!', description: 'Your new color scheme has been applied.' })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save the palette.' })
    } finally {
      setIsSaving(false)
    }
  }

  function applyForUser() {
    if (typeof localStorage === 'undefined') return
    const payload = { name, values }
    localStorage.setItem('visuaPalette', JSON.stringify(payload))
  }

  function resetPalette() {
    if (typeof localStorage !== 'undefined') localStorage.removeItem('visuaPalette')
    setValues({})
  }

  function exportPalette() {
    const data = JSON.stringify({ name, values }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.replace(/\s+/g, '-')}.palette.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importPalette(file: File) {
    const text = await file.text()
    try {
      const j = JSON.parse(text)
      if (j?.values && typeof j.values === 'object') {
        setValues(j.values)
        if (j.name) setName(j.name)
      }
    } catch {}
  }

  if (!loggedIn) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto p-8 text-center rounded-2xl bg-card shadow-lg">
          <h2 className="font-heading text-2xl mb-2">Sign in required</h2>
          <p className="text-muted-foreground mb-6">You must be signed in to edit themes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold">Theme & Palette Editor</h1>
            <p className="text-muted-foreground text-sm">Refine your visual system. Search or expand groups to edit tokens.</p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Preset Name</label>
                <input className="input w-48" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Load</label>
                <select className="input w-48" value={selected} onChange={(e) => { const p = palettes.find(x => x.id === e.target.value); if (p) applyPalette(p) }}>
                  <option value="">— Select —</option>
                  {palettes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="input w-56"
                  placeholder="Search tokens (e.g. primary)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={savePalette} disabled={isSaving}>{isSaving ? <><Loader size={16} className="mr-2" /> Saving...</> : 'Save'}</Button>
            <Button onClick={exportPalette} className="!bg-transparent !text-foreground !border-foreground/30 hover:!text-white">Export</Button>
            <label className="btn btn-outline cursor-pointer text-xs">
              Import
              <input type="file" accept="application/json" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) importPalette(f) }} />
            </label>
            <Button onClick={applyForUser} className="!bg-secondary text-secondary-foreground">Apply (User)</Button>
            <Button onClick={resetAll} className="!bg-transparent !border-none text-muted-foreground hover:text-white">Reset All</Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        {/* Color Controls (grouped + collapsible) */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          {GROUPS.map(group => {
            const visibleKeys = group.keys.filter(k => !search || k.label.toLowerCase().includes(search.toLowerCase()) || k.key.toLowerCase().includes(search.toLowerCase()))
            if (visibleKeys.length === 0) return null
            const isOpen = expanded.has(group.title)
            return (
              <div key={group.title} className="rounded-2xl bg-card shadow border border-border/40 overflow-hidden">
                <button type="button" onClick={() => toggleGroup(group.title)} className="w-full flex items-center justify-between px-4 py-3 text-left group">
                  <span className="font-heading text-sm tracking-wide flex items-center gap-2">
                    <span className={`inline-block transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>{group.title}
                  </span>
                  <span className="text-xs text-muted-foreground">{isOpen ? 'Collapse' : 'Expand'}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                      {visibleKeys.map(k => {
                        const val = values[k.key] ?? ''
                        const pairVal = k.pairWith ? (values[k.pairWith] ?? '') : ''
                        const showContrast = !!(k.pairWith && val && pairVal)
                        return (
                          <div key={k.key} className="space-y-1.5 group/token">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-muted-foreground tracking-wide">{k.label}</label>
                              <div className="flex items-center gap-1">
                                {showContrast && <MiniContrast a={val} b={pairVal} />}
                                <button type="button" onClick={() => resetValue(k.key)} className="text-[10px] px-1 py-0.5 rounded bg-background/60 border border-border/60 hover:border-primary/60 text-muted-foreground hover:text-foreground transition-colors">↺</button>
                              </div>
                            </div>
                            <ColorPicker color={val} onChange={(c) => setValue(k.key, c)} />
                            <input
                              className="input w-full mt-1 h-8 text-xs"
                              placeholder="H S% L%"
                              value={val}
                              onChange={(e) => setValue(k.key, e.target.value)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <div className="text-xs text-muted-foreground px-1">HSL format: e.g. <code>240 10% 3.9%</code>. Foreground + surface pairs show contrast badge.</div>
        </div>

    {/* Presets & Preview Meta */}
    <div className="md:col-span-4 lg:col-span-3 space-y-6">
          <div className="p-4 rounded-2xl bg-card shadow">
            <div className="space-y-3">
      <h3 className="font-heading text-sm mb-1">Accessibility</h3>
              <ContrastChecker fg={values['--foreground'] || '0 0% 98%'} bg={values['--background'] || '240 10% 3.9%'} />
      <p className="text-xs text-muted-foreground leading-relaxed">Aim for contrast ≥ 4.5. Adjust background / foreground first, then refine accents.</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-card shadow">
            <h3 className="font-heading text-lg mb-3">Bundled Themes</h3>
            <div className="space-y-2">
              {presetPalettes.map(p => (
                <div key={p.name} className="p-3 rounded-lg bg-background/50 cursor-pointer hover:ring-2 hover:ring-primary transition-all" onClick={() => { setValues(p.values); setName(p.name); setSelected(''); }}>
                  <div className="font-bold text-sm mb-2">{p.name}</div>
                  <div className="flex gap-2">
                    {Object.values(p.values).slice(0, 5).map(c => (
                      <div key={c} className="w-5 h-5 rounded-full border border-border" style={{ background: `hsl(${c})` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
  <h2 className="font-heading text-2xl mb-4 text-center">Live Preview</h2>
        <div className="border-2 border-dashed border-border rounded-2xl p-6 space-y-6 bg-background/80">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Column 1: Buttons and Badges */}
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-card">
                <h4 className="font-heading mb-3">Buttons</h4>
                <div className="flex flex-wrap gap-3">
                  <Button>Primary</Button>
                  <Button className="!bg-secondary text-secondary-foreground">Secondary</Button>
                  <Button className="!bg-transparent !border-none text-muted-foreground hover:text-white">Ghost</Button>
                  <Button className="!bg-destructive text-destructive-foreground border-destructive/50">Destructive</Button>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-card">
                <h4 className="font-heading mb-3">Badges</h4>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>Primary</span>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}>Secondary</span>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ background: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>Accent</span>
                </div>
              </div>
            </div>

            {/* Column 2: Typography and Inputs */}
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-card">
                <h4 className="font-heading mb-3">Typography</h4>
                <div className="space-y-2">
                  <h1 className="font-heading text-2xl">Heading 1</h1>
                  <p className="text-foreground">This is a paragraph of text. It demonstrates the body copy color and style.</p>
                  <a href="#" className="text-primary hover:underline">This is a link</a>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-card">
                <h4 className="font-heading mb-3">Inputs</h4>
                <div className="space-y-3">
                  <input className="input w-full" placeholder="Text input..." />
                  <select className="input w-full">
                    <option>Dropdown select</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Column 3: Cards */}
            <div className="p-4 rounded-xl bg-card">
              <h4 className="font-heading mb-3">Cards</h4>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-background">Card on Card</div>
                <div className="p-4 rounded-lg bg-muted">Muted Card</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function parseRGB(v: string): [number, number, number] | null {
  v = (v || '').trim()
  if (!v) return null
  if (v.startsWith('#')) {
    const hex = v.slice(1)
    const n = parseInt(hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex, 16)
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
    return [r, g, b]
  }
  const parts = v.split(/[ ,]+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n))
  if (parts.length >= 3) return [parts[0], parts[1], parts[2]]
  return null
}

function contrastRatio(fg: [number, number, number], bg: [number, number, number]) {
  const L = (c: number) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  const lum = (rgb: [number, number, number]) => 0.2126 * L(rgb[0]) + 0.7152 * L(rgb[1]) + 0.0722 * L(rgb[2])
  const L1 = lum(fg), L2 = lum(bg)
  const bright = Math.max(L1, L2), dark = Math.min(L1, L2)
  return (bright + 0.05) / (dark + 0.05)
}

function ContrastChecker({ fg, bg }: { fg: string; bg: string }) {
  const frgb = parseRGB(fg)
  const brgb = parseRGB(bg)
  if (!frgb || !brgb) return <div className="text-xs text-gray-600">Enter valid colors to compute contrast.</div>
  const ratio = contrastRatio(frgb, brgb)
  const pass = ratio >= 4.5
  return (
    <div className="text-xs text-gray-700">
      Contrast ratio: {ratio.toFixed(2)} {pass ? '✓ Passes WCAG AA' : '⚠ Fails AA (target ≥ 4.5)'}
    </div>
  )
}

// Tiny inline contrast badge for token pairings
function MiniContrast({ a, b }: { a: string; b: string }) {
  const ar = parseRGB(a)
  const br = parseRGB(b)
  if (!ar || !br) return null
  const ratio = contrastRatio(ar, br)
  const pass = ratio >= 4.5
  return (
    <span
      title={`Contrast ${ratio.toFixed(2)}${pass ? ' (passes AA)' : ' (fails AA)'}`}
      className={`inline-flex items-center justify-center rounded px-1 h-4 text-[9px] font-mono tracking-tight border ${pass ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/40' : 'bg-amber-600/30 text-amber-200 border-amber-500/40'}`}
    >
      {ratio.toFixed(2)}
    </span>
  )
}