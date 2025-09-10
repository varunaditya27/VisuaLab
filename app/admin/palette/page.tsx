"use client"

import { useEffect, useMemo, useState } from 'react'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { Button } from '@/components/ui/Button'
import { presetPalettes } from '@/lib/palettes'

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
          <Button onClick={savePalette}>Save</Button>
          <Button className="!bg-transparent !border-purple-500/50" onClick={exportPalette}>Export</Button>
          <label className="relative inline-flex items-center justify-center px-6 py-2.5 overflow-hidden font-semibold text-white transition duration-300 ease-out border-2 border-purple-500/50 rounded-lg shadow-lg group backdrop-blur-sm cursor-pointer">
            <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-600/70 via-blue-500/70 to-indigo-700/70 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="absolute top-0 left-0 w-full h-full transition-all duration-300 ease-in-out transform -translate-x-full bg-white opacity-20 group-hover:translate-x-full group-hover:skew-x-12"></span>
            <span className="relative">Import</span>
            <input type="file" accept="application/json" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) importPalette(f) }} />
          </label>
          <Button className="!bg-transparent !border-purple-500/50" onClick={applyForUser}>Apply</Button>
          <Button className="!bg-transparent !border-none" onClick={resetPalette}>Reset</Button>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-quantum p-4 md:col-span-2">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {KEYS.map(k => (
              <div key={k.key} className="space-y-2">
                <div className="text-xs text-gray-400">{k.label}</div>
                <ColorPicker color={values[k.key] ?? '#ffffff'} onChange={(c) => setValue(k.key, c)} />
                <input className="input-neural w-full" value={values[k.key] ?? ''} onChange={(e) => setValue(k.key, e.target.value)} placeholder="e.g. #101018 or 255 255 255" />
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-600">
            Tip: For variables used as rgb(var(--bg)), enter space-separated RGB like &quot;255 255 255&quot;.
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
        <h3 className="font-heading text-lg mb-2">Preset Themes</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {presetPalettes.map(p => (
            <div key={p.name} className="card-quantum p-4 cursor-pointer hover:ring-2 ring-electric-blue" onClick={() => { setValues(p.values); setName(p.name); setSelected(''); }}>
              <div className="font-bold mb-2">{p.name}</div>
              <div className="flex gap-1">
                {Object.values(p.values).slice(2, 7).map(c => (
                  <div key={c} className="w-4 h-4 rounded-full" style={{ background: c.includes(' ') ? `rgb(${c})` : c }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-heading text-2xl mb-4 text-center">Live Preview</h3>
        <div className="border-2 border-dashed border-white/20 rounded-2xl p-6 space-y-6 bg-background/50">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Column 1: Buttons and Badges */}
            <div className="space-y-6">
              <div className="card-quantum p-4">
                <h4 className="font-heading mb-3">Buttons</h4>
                <div className="flex flex-wrap gap-3">
                  <Button>Primary</Button>
                  <Button className="!bg-transparent !border-purple-500/50">Secondary</Button>
                  <Button className="!bg-transparent !border-none">Ghost</Button>
                </div>
              </div>
              <div className="card-quantum p-4">
                <h4 className="font-heading mb-3">Badges</h4>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--electric-blue)', color: 'var(--void-black)' }}>Info</span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--plasma-green)', color: 'var(--void-black)' }}>Success</span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--solar-orange)', color: 'var(--void-black)' }}>Warning</span>
                </div>
              </div>
            </div>

            {/* Column 2: Typography and Inputs */}
            <div className="space-y-6">
              <div className="card-quantum p-4">
                <h4 className="font-heading mb-3">Typography</h4>
                <div className="space-y-2">
                  <h1 className="font-heading text-2xl">Heading 1</h1>
                  <p className="text-foreground">This is a paragraph of text. It demonstrates the body copy color and style.</p>
                  <a href="#" className="text-electric-blue hover:underline">This is a link</a>
                </div>
              </div>
              <div className="card-quantum p-4">
                <h4 className="font-heading mb-3">Inputs</h4>
                <div className="space-y-3">
                  <input className="input-neural w-full" placeholder="Text input..." />
                  <select className="input-neural w-full">
                    <option>Dropdown select</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Column 3: Cards */}
            <div className="card-quantum p-4">
              <h4 className="font-heading mb-3">Cards</h4>
              <div className="space-y-3">
                <div className="card-quantum p-4">Quantum Card</div>
                <div className="glass-subtle p-4 rounded-lg">Glass Card</div>
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