"use client"

import { useEffect, useMemo, useState } from 'react'

type Palette = { id: string; name: string; json: Record<string, string> }

const KEYS: Array<{ key: string; label: string }> = [
  { key: '--bg', label: 'Background (R G B or hex)' },
  { key: '--fg', label: 'Foreground (R G B or hex)' },
  { key: '--electric-blue', label: 'Primary / Electric Blue' },
  { key: '--cyber-purple', label: 'Accent / Cyber Purple' },
  { key: '--neon-pink', label: 'Accent / Neon Pink' },
  { key: '--plasma-green', label: 'Success / Plasma Green' },
  { key: '--solar-orange', label: 'Warning / Solar Orange' },
  { key: '--cosmic-violet', label: 'Info / Cosmic Violet' },
  { key: '--void-black', label: 'Base / Void Black' },
  { key: '--space-gray', label: 'Base / Space Gray' },
]

export default function PaletteEditorPage() {
  const [palettes, setPalettes] = useState<Palette[]>([])
  const [name, setName] = useState('My Theme')
  const [values, setValues] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string>('')

  const loggedIn = useMemo(() => {
    if (typeof document === 'undefined') return false
    const u = document.cookie.match(/(?:^|; )rbacUsernameClient=([^;]+)/)
    return !!u
  }, [])

  useEffect(() => {
    fetch('/api/palettes').then(r => r.json()).then(d => setPalettes(d.palettes || [])).catch(() => {})
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

  function applyPalette(p: Palette) {
    setSelected(p.id)
    const json = p.json || {}
    setValues(json)
    setName(p.name)
  }

  async function savePalette() {
    const res = await fetch('/api/palettes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selected || undefined, name, json: values }) })
    if (!res.ok) return
    const d = await res.json()
    const p = d.palette as Palette
    setSelected(p.id)
    setPalettes(prev => {
      const others = prev.filter(x => x.id !== p.id)
      return [p, ...others]
    })
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
        <div className="card-quantum max-w-md mx-auto p-8 text-center">
          <h2 className="font-heading text-2xl mb-2">Sign in required</h2>
          <p className="text-gray-600 mb-6">You must be signed in to edit themes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-holographic">Theme & Palette Editor</h1>
          <p className="text-gray-600">Tune your site colors with live preview and WCAG guidance.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-holo primary" onClick={savePalette}>Save</button>
          <button className="btn-holo ghost" onClick={exportPalette}>Export</button>
          <label className="btn-holo ghost cursor-pointer">
            Import
            <input type="file" accept="application/json" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) importPalette(f) }} />
          </label>
          <button className="btn-holo secondary" onClick={applyForUser}>Apply</button>
          <button className="btn-holo ghost" onClick={resetPalette}>Reset</button>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-quantum p-4 md:col-span-2">
          <div className="grid sm:grid-cols-2 gap-3">
            {KEYS.map(k => (
              <div key={k.key} className="space-y-1">
                <div className="text-xs text-gray-600">{k.label}</div>
                <input className="input-neural" value={values[k.key] ?? ''} onChange={(e) => setValue(k.key, e.target.value)} placeholder="e.g. #101018 or 255 255 255" />
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-600">
            Tip: For variables used as rgb(var(--bg)), enter space-separated RGB like "255 255 255".
          </div>
        </div>
        <div className="card-quantum p-4">
          <div className="mb-2">
            <label className="block text-xs text-gray-600">Preset name</label>
            <input className="input-neural" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="mb-2">
            <label className="block text-xs text-gray-600">Load preset</label>
            <select className="input-neural" value={selected} onChange={(e) => { const p = palettes.find(x => x.id === e.target.value); if (p) applyPalette(p) }}>
              <option value="">-- Select palette --</option>
              {palettes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <ContrastChecker fg={values['--fg'] || '11 16 32'} bg={values['--bg'] || '255 255 255'} />
        </div>
      </div>
      <div className="mt-6">
        <h3 className="font-heading text-lg mb-2">Live Preview</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card-quantum p-6">
            <h4 className="font-heading mb-2">Buttons</h4>
            <div className="flex flex-wrap gap-2">
              <button className="btn-holo primary">Primary</button>
              <button className="btn-holo secondary">Secondary</button>
              <button className="btn-holo ghost">Ghost</button>
            </div>
          </div>
          <div className="card-quantum p-6">
            <h4 className="font-heading mb-2">Cards</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="card-quantum p-4">Card A</div>
              <div className="card-quantum p-4">Card B</div>
            </div>
          </div>
          <div className="card-quantum p-6">
            <h4 className="font-heading mb-2">Badges</h4>
            <div className="flex gap-2">
              <span className="px-2 py-1 rounded-full text-xs" style={{ background: 'var(--electric-blue)', color: '#000' }}>Info</span>
              <span className="px-2 py-1 rounded-full text-xs" style={{ background: 'var(--plasma-green)', color: '#000' }}>Success</span>
              <span className="px-2 py-1 rounded-full text-xs" style={{ background: 'var(--solar-orange)', color: '#000' }}>Warn</span>
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
