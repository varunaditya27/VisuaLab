"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { RotateCw, FlipHorizontal, FlipVertical, Crop as CropIcon, SlidersHorizontal, Sparkles, Scissors, ArrowLeft, Wand2, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, LayoutGrid, SplitSquareHorizontal, BadgePlus } from 'lucide-react'

type ImageLite = { id: string; title?: string | null; thumbUrl?: string | null }

export default function AdminEditorPage() {
  const params = useSearchParams()
  const [images, setImages] = useState<ImageLite[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [basePreview, setBasePreview] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<{x:number;y:number}>({x:0,y:0})
  const [panMode, setPanMode] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [comparePos, setComparePos] = useState(0.5)
  const [drawCropMode, setDrawCropMode] = useState(false)
  const [drawing, setDrawing] = useState<{startX:number;startY:number;endX:number;endY:number}|null>(null)
  const [naturalSize, setNaturalSize] = useState<{w:number;h:number}>({w:0,h:0})
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{x:number;y:number}>({x:0,y:0})
  const [clientTransform, setClientTransform] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState('')
  const [hydrated, setHydrated] = useState(false)

  // Ops state
  const [rotate, setRotate] = useState<number>(0)
  const [flip, setFlip] = useState(false)
  const [flop, setFlop] = useState(false)
  const [smartRatio, setSmartRatio] = useState<'1:1' | '4:3' | '3:2' | '16:9' | ''>('')
  const [crop, setCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [resize, setResize] = useState<{ width?: number; height?: number; fit?: 'cover' | 'contain' | 'inside' | 'outside' }>({})
  const [enhance, setEnhance] = useState<{ normalize?: boolean; sharpen?: boolean; saturation?: number }>({})
  // undo/redo stacks
  type Ops = { rotate:number; flip:boolean; flop:boolean; smartRatio:OpsSmart; crop:OpsCrop; resize:OpsResize; enhance:OpsEnhance }
  type OpsSmart = '' | '1:1' | '4:3' | '3:2' | '16:9'
  type OpsCrop = { x: number; y: number; width: number; height: number } | null
  type OpsResize = { width?: number; height?: number; fit?: 'cover' | 'contain' | 'inside' | 'outside' }
  type OpsEnhance = { normalize?: boolean; sharpen?: boolean; saturation?: number }
  const [history, setHistory] = useState<Ops[]>([])
  const [histIndex, setHistIndex] = useState(-1)

  const [role, setRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('VIEWER')

  // Hydration guard + role detection
  useEffect(() => {
    setHydrated(true)
    const m = document.cookie.match(/(?:^|; )rbacRoleClient=([^;]+)/)
    const r = m ? decodeURIComponent(m[1]) : 'VIEWER'
    setRole(r === 'ADMIN' || r === 'EDITOR' ? (r as 'ADMIN' | 'EDITOR') : 'VIEWER')
  }, [])

  // Load initial images and preselect if query has imageId
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/images', { cache: 'no-store', credentials: 'include' })
        const data = await res.json()
        setImages(data.images || [])
        const initial = params.get('imageId')
        if (initial) setSelectedId(initial)
      } catch {}
    })()
  }, [params])

  // Update client-side transform instantly for low latency
  useEffect(() => {
    const transforms = []
    if (rotate % 360 !== 0) transforms.push(`rotate(${rotate}deg)`)
    if (flip) transforms.push('scaleY(-1)')
    if (flop) transforms.push('scaleX(-1)')
    transforms.push(`translate(${pan.x}px, ${pan.y}px)`)
    transforms.push(`scale(${zoom})`)
    setClientTransform(transforms.join(' '))
  }, [rotate, flip, flop, pan.x, pan.y, zoom])

  // Load base preview when selection changes
  useEffect(() => {
    if (!selectedId) { 
      setPreview(null)
      setBasePreview(null)
      return 
    }
    ;(async () => {
      try {
        const res = await fetch(`/api/images?imageId=${selectedId}`, { cache: 'no-store', credentials: 'include' })
        const data = await res.json()
        const url = data?.images?.[0]?.thumbUrl || null
        setPreview(url)
        setBasePreview(url)
        // reset view and ops when switching image
        setZoom(1)
        setPan({x:0,y:0})
        setComparePos(0.5)
        setShowCompare(false)
        resetPending()
        setHistory([])
        setHistIndex(-1)
      } catch { 
        setPreview(null)
        setBasePreview(null)
      }
    })()
  }, [selectedId])

  // moved guards below all hooks to keep hook order consistent across renders

  async function applyEdits() {
    if (!selectedId) return
    setBusy(true)
    try {
      const payload: any = { imageId: selectedId }
      if (rotate % 360 !== 0) payload.rotate = ((rotate % 360) + 360) % 360
      if (flip) payload.flip = true
      if (flop) payload.flop = true
      if (smartRatio) payload.smartCrop = { ratio: smartRatio }
      if (crop && crop.width > 0 && crop.height > 0) payload.crop = crop
      if (resize.width || resize.height || resize.fit) payload.resize = resize
      if (enhance.normalize || enhance.sharpen || typeof enhance.saturation === 'number') payload.enhance = enhance

      const res = await fetch('/api/images/transform', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' })
      if (res.ok) {
        // refresh preview
        try {
          const fresh = await fetch(`/api/images?imageId=${selectedId}`, { cache: 'no-store', credentials: 'include' }).then(r => r.json())
          const next = fresh?.images?.[0]?.thumbUrl as string | undefined
          setPreview(next || (preview ? `${preview.split('?')[0]}?t=${Date.now()}` : null))
        } catch {
          setPreview(preview ? `${preview.split('?')[0]}?t=${Date.now()}` : null)
        }
        // reset simple ops (keep selection)
        // optional: keep values; here we'll reset except rotate to 0
        setRotate(0); setFlip(false); setFlop(false); setSmartRatio(''); setCrop(null); setResize({}); setEnhance({})
      }
    } finally { setBusy(false) }
  }

  function resetPending() {
    setRotate(0); setFlip(false); setFlop(false); setSmartRatio(''); setCrop(null); setResize({}); setEnhance({})
  }

  // push current ops to history
  function snapshotOps() {
    const snap: Ops = {
      rotate, flip, flop,
      smartRatio,
      crop: crop ? { ...crop } : null,
      resize: { ...resize },
      enhance: { ...enhance },
    }
    setHistory(h => [...h.slice(0, histIndex+1), snap])
    setHistIndex(i => i + 1)
  }

  // call snapshot when any control changes (debounced with preview effect)
  useEffect(() => {
    if (!selectedId) return
    const timeout = setTimeout(() => {
      snapshotOps()
    }, 100) // Reduced debounce for faster response
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotate, flip, flop, smartRatio, JSON.stringify(crop), JSON.stringify(resize), JSON.stringify(enhance)])

  function undo() {
    setHistIndex(i => {
      const ni = Math.max(0, i - 1)
      const s = history[ni]
      if (s) { setRotate(s.rotate); setFlip(s.flip); setFlop(s.flop); setSmartRatio(s.smartRatio); setCrop(s.crop); setResize(s.resize); setEnhance(s.enhance) }
      return ni
    })
  }
  function redo() {
    setHistIndex(i => {
      const ni = Math.min(history.length - 1, i + 1)
      const s = history[ni]
      if (s) { setRotate(s.rotate); setFlip(s.flip); setFlop(s.flop); setSmartRatio(s.smartRatio); setCrop(s.crop); setResize(s.resize); setEnhance(s.enhance) }
      return ni
    })
  }

  const filtered = images.filter(i => !filter || (i.title || '').toLowerCase().includes(filter.toLowerCase()))

  // Server preview only for complex operations (crop, resize, enhance) - reduced frequency
  useEffect(() => {
    if (!selectedId) return
    // Only fetch server preview for operations that can't be done client-side
    const needsServerPreview = smartRatio || 
      (crop && crop.width && crop.height) || 
      resize.width || resize.height || resize.fit ||
      enhance.normalize || enhance.sharpen || (enhance.saturation && enhance.saturation !== 1)
    
    if (!needsServerPreview) return

    const controller = new AbortController()
    const t = setTimeout(async () => {
      try {
        const payload: any = { imageId: selectedId, preview: true, previewMaxWidth: 1200 }
        if (rotate % 360 !== 0) payload.rotate = ((rotate % 360) + 360) % 360
        if (flip) payload.flip = true
        if (flop) payload.flop = true
        if (smartRatio) payload.smartCrop = { ratio: smartRatio }
        if (crop && crop.width && crop.height) payload.crop = crop
        if (resize.width || resize.height || resize.fit) payload.resize = resize
        if (enhance.normalize || enhance.sharpen || typeof enhance.saturation === 'number') payload.enhance = enhance
        
        const res = await fetch('/api/images/transform', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(payload), 
          signal: controller.signal,
          credentials: 'include'
        })
        if (res.ok) {
          const data = await res.json()
          if (data.previewUrl) setPreview(data.previewUrl)
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.warn('Preview request failed:', err)
        }
      }
    }, 500) // Increased debounce for server requests
    return () => { clearTimeout(t); controller.abort() }
  }, [selectedId, smartRatio, crop, resize, enhance])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'r' || e.key === 'R') { 
        e.preventDefault()
        setRotate(v => v + (e.shiftKey ? -90 : 90)) 
      }
      if (e.key === 'f' || e.key === 'F') { 
        e.preventDefault()
        setFlip(v => !v) 
      }
      if (e.key === 'm' || e.key === 'M') { 
        e.preventDefault()
        setFlop(v => !v) 
      }
      if (e.key === '+' || e.key === '=') { 
        e.preventDefault()
        setZoom(z => Math.min(4, z + 0.1)) 
      }
      if (e.key === '-') { 
        e.preventDefault()
        setZoom(z => Math.max(0.2, z - 0.1)) 
      }
      if (e.key === 'Escape') { 
        e.preventDefault()
        resetPending() 
      }
      if (e.key === ' ') {
        e.preventDefault()
        setPanMode(v => !v)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [history.length, histIndex])

  // Mouse events for pan and crop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (drawCropMode) {
      setDrawing({startX: x, startY: y, endX: x, endY: y})
    } else if (panMode) {
      setIsDragging(true)
      setDragStart({x: e.clientX - pan.x, y: e.clientY - pan.y})
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!stageRef.current) return
    
    if (drawing) {
      const rect = stageRef.current.getBoundingClientRect()
      setDrawing(d => d ? ({...d, endX: e.clientX - rect.left, endY: e.clientY - rect.top}) : d)
    } else if (isDragging && panMode) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      setPan({x: newX, y: newY})
    }
  }

  const handleMouseUp = () => {
    if (drawing && imgRef.current && stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect()
      const imgRect = imgRef.current.getBoundingClientRect()
      
      // Map screen selection to image pixels
      const selX = Math.min(drawing.startX, drawing.endX)
      const selY = Math.min(drawing.startY, drawing.endY)
      const selW = Math.abs(drawing.endX - drawing.startX)
      const selH = Math.abs(drawing.endY - drawing.startY)
      
      // Skip tiny selections
      if (selW < 10 || selH < 10) {
        setDrawing(null)
        return
      }
      
      // relative to image box
      const relX = (selX - (imgRect.left - rect.left)) / imgRect.width
      const relY = (selY - (imgRect.top - rect.top)) / imgRect.height
      const relW = selW / imgRect.width
      const relH = selH / imgRect.height
      
      // convert to natural pixels
      const px = Math.max(0, Math.round(relX * naturalSize.w))
      const py = Math.max(0, Math.round(relY * naturalSize.h))
      const pw = Math.max(1, Math.round(relW * naturalSize.w))
      const ph = Math.max(1, Math.round(relH * naturalSize.h))
      
      setCrop({ x: px, y: py, width: pw, height: ph })
      setDrawing(null)
    }
    setIsDragging(false)
  }

  // Guard rendering after all hooks
  if (!hydrated) {
    return (
      <div className="container py-12">
        <div className="card-quantum max-w-md mx-auto p-8 text-center">
          <h2 className="font-heading text-2xl mb-2">Loading Image Editor…</h2>
          <p className="text-gray-600">Please wait.</p>
        </div>
      </div>
    )
  }

  if (!(role === 'ADMIN' || role === 'EDITOR')) {
    return (
      <div className="container py-12">
        <div className="card-quantum max-w-md mx-auto p-8 text-center">
          <Scissors className="mx-auto mb-3 text-electric-blue" />
          <h2 className="font-heading text-2xl mb-2">Editor Access Required</h2>
          <p className="text-gray-600">Sign in with an Admin or Editor account to use the image editor.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <a className="btn-holo ghost inline-flex items-center gap-2" href="/admin"><ArrowLeft size={16}/> Back</a>
          <h1 className="font-heading text-2xl">Image Editor</h1>
        </div>
        <div className="text-sm text-gray-500">Comprehensive adjustments: crop, resize, rotate, flip, enhance.</div>
      </div>

      <div className="grid md:grid-cols-12 gap-4">
        {/* Sidebar: image list + search */}
        <div className="md:col-span-4 card-quantum p-4">
          <div className="mb-3 flex items-center gap-2">
            <input className="input-neural w-full" placeholder="Search images by title" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="max-h-[70vh] overflow-y-auto grid grid-cols-3 md:grid-cols-2 gap-2 pr-1">
            {filtered.map(img => (
              <button key={img.id} className={`relative block text-left ${selectedId===img.id ? 'ring-2 ring-electric-blue rounded' : ''}`} onClick={() => setSelectedId(img.id)}>
                <img src={img.thumbUrl ?? ''} alt={img.title ?? ''} className="w-full h-24 object-cover rounded" />
                <div className="mt-1 truncate text-xs text-gray-600">{img.title ?? 'Untitled'}</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-sm text-gray-500 col-span-full">No images found.</div>
            )}
          </div>
        </div>

        {/* Main: preview + controls */}
        <div className="md:col-span-8 space-y-4">
          <div className="card-quantum p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-heading text-lg flex items-center gap-2"><Wand2 size={18}/> Preview</h3>
              <div className="flex items-center gap-2">
                <button className="btn-holo ghost" onClick={undo} disabled={histIndex<=0} title="Undo (Ctrl+Z)">
                  <Undo2 size={16}/>
                </button>
                <button className="btn-holo ghost" onClick={redo} disabled={histIndex>=history.length-1} title="Redo (Ctrl+Y)">
                  <Redo2 size={16}/>
                </button>
                <div className="w-px h-6 bg-gray-200"/>
                <button className="btn-holo ghost" onClick={() => setZoom(z => Math.max(0.2, z-0.1))} title="Zoom Out (-)">
                  <ZoomOut size={16}/>
                </button>
                <span className="text-xs text-gray-600 w-12 text-center font-mono">{Math.round(zoom*100)}%</span>
                <button className="btn-holo ghost" onClick={() => setZoom(z => Math.min(4, z+0.1))} title="Zoom In (+)">
                  <ZoomIn size={16}/>
                </button>
                <button className="btn-holo ghost" onClick={() => { setZoom(1); setPan({x:0,y:0}) }} title="Reset View">
                  <Maximize2 size={16}/>
                </button>
                <div className="w-px h-6 bg-gray-200"/>
                <button 
                  className={`btn-holo ${panMode?'secondary':'ghost'}`} 
                  onClick={() => setPanMode(v => !v)} 
                  title="Pan Mode (Space)"
                >
                  🖐️
                </button>
                <button 
                  className={`btn-holo ${showCompare?'secondary':'ghost'}`} 
                  onClick={() => setShowCompare(v => !v)} 
                  title="Before/After Compare"
                >
                  <SplitSquareHorizontal size={16}/>
                </button>
                <button 
                  className={`btn-holo ${drawCropMode?'secondary':'ghost'}`} 
                  onClick={() => setDrawCropMode(v => !v)} 
                  title="Draw Crop Area"
                >
                  <LayoutGrid size={16}/>
                </button>
              </div>
            </div>
            <div 
              ref={stageRef} 
              className={`relative glass-subtle rounded-2xl p-2 min-h-64 flex items-center justify-center overflow-hidden select-none ${
                panMode ? 'cursor-grab' : drawCropMode ? 'cursor-crosshair' : 'cursor-default'
              } ${isDragging ? 'cursor-grabbing' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {preview ? (
                <div className="relative max-h-[28rem] w-full flex items-center justify-center">
                  {/* Base image with instant client-side transforms */}
                  <img 
                    ref={imgRef} 
                    src={showCompare && basePreview ? basePreview : preview} 
                    alt="Preview" 
                    className="object-contain rounded select-none transition-transform duration-75 ease-out" 
                    draggable={false}
                    onLoad={(e) => { 
                      const t = e.currentTarget
                      setNaturalSize({w: t.naturalWidth, h: t.naturalHeight}) 
                    }}
                    style={{ 
                      transform: clientTransform,
                      maxHeight: '28rem', 
                      width: '100%',
                      filter: enhance.saturation ? `saturate(${enhance.saturation})` : undefined
                    }} 
                  />
                  
                  {/* Compare overlay */}
                  {showCompare && basePreview && preview !== basePreview && (
                    <div 
                      className="absolute inset-0 pointer-events-none" 
                      style={{ clipPath: `inset(0 ${Math.round((1-comparePos)*100)}% 0 0)` }}
                    >
                      <img 
                        src={preview} 
                        alt="After" 
                        className="object-contain rounded transition-transform duration-75 ease-out" 
                        style={{ 
                          transform: clientTransform,
                          maxHeight: '28rem', 
                          width: '100%',
                          filter: enhance.saturation ? `saturate(${enhance.saturation})` : undefined
                        }} 
                      />
                    </div>
                  )}
                  
                  {/* Compare slider */}
                  {showCompare && (
                    <div className="absolute inset-y-2 left-4 right-4 flex items-center pointer-events-auto">
                      <input 
                        type="range" 
                        min={0} 
                        max={1} 
                        step={0.01} 
                        value={comparePos} 
                        onChange={(e) => setComparePos(parseFloat(e.target.value))} 
                        className="w-full opacity-80 hover:opacity-100 transition-opacity" 
                      />
                    </div>
                  )}
                  
                  {/* Crop overlay */}
                  {drawCropMode && drawing && (
                    <div 
                      className="absolute border-2 border-electric-blue bg-electric-blue/10 pointer-events-none"
                      style={{ 
                        left: Math.min(drawing.startX, drawing.endX), 
                        top: Math.min(drawing.startY, drawing.endY), 
                        width: Math.abs(drawing.endX - drawing.startX), 
                        height: Math.abs(drawing.endY - drawing.startY) 
                      }}
                    />
                  )}
                  
                  {/* Crop indicator when crop is set */}
                  {crop && !drawCropMode && imgRef.current && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute border border-neon-pink/60 bg-neon-pink/5" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  {selectedId ? 'Loading preview…' : 'Select an image from the left'}
                </div>
              )}
            </div>
          </div>

          <div className="card-quantum p-4">
            <h3 className="font-heading text-lg mb-3 flex items-center gap-2"><SlidersHorizontal size={18}/> Controls</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Orientation */}
              <div className="glass-subtle rounded-2xl p-4">
                <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                  <RotateCw size={16}/> Orientation
                </h4>
                <div className="flex items-center gap-2 mb-2">
                  <button className="btn-holo ghost" onClick={() => setRotate(r => r + 90)} title="Rotate +90° (R)">
                    +90°
                  </button>
                  <button className="btn-holo ghost" onClick={() => setRotate(r => r - 90)} title="Rotate -90° (Shift+R)">
                    -90°
                  </button>
                  <input 
                    type="number" 
                    className="input-neural w-20" 
                    value={rotate} 
                    onChange={(e) => setRotate(parseInt(e.target.value||'0'))}
                    title="Exact rotation angle"
                  />
                  <span className="text-xs text-gray-500">°</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className={`btn-holo ${flip ? 'secondary' : 'ghost'}`} 
                    onClick={() => setFlip(v => !v)}
                    title="Flip Vertical (F)"
                  >
                    <FlipVertical size={16}/> Flip
                  </button>
                  <button 
                    className={`btn-holo ${flop ? 'secondary' : 'ghost'}`} 
                    onClick={() => setFlop(v => !v)}
                    title="Mirror Horizontal (M)"
                  >
                    <FlipHorizontal size={16}/> Mirror
                  </button>
                </div>
              </div>

              {/* Crop */}
              <div className="glass-subtle rounded-2xl p-4">
                <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                  <CropIcon size={16}/> Crop
                </h4>
                <div className="mb-2">
                  <label className="text-xs text-gray-600 mr-2">Smart ratio</label>
                  <select 
                    className="input-neural" 
                    value={smartRatio} 
                    onChange={(e) => setSmartRatio((e.target.value as any) || '')}
                  >
                    <option value="">None</option>
                    <option value="1:1">Square (1:1)</option>
                    <option value="4:3">Standard (4:3)</option>
                    <option value="3:2">Photo (3:2)</option>
                    <option value="16:9">Widescreen (16:9)</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <input 
                    className="input-neural" 
                    type="number" 
                    placeholder="x" 
                    value={crop?.x ?? ''} 
                    onChange={(e) => setCrop(c => ({ ...(c||{x:0,y:0,width:100,height:100}), x: parseInt(e.target.value||'0') }))} 
                  />
                  <input 
                    className="input-neural" 
                    type="number" 
                    placeholder="y" 
                    value={crop?.y ?? ''} 
                    onChange={(e) => setCrop(c => ({ ...(c||{x:0,y:0,width:100,height:100}), y: parseInt(e.target.value||'0') }))} 
                  />
                  <input 
                    className="input-neural" 
                    type="number" 
                    placeholder="width" 
                    value={crop?.width ?? ''} 
                    onChange={(e) => setCrop(c => ({ ...(c||{x:0,y:0,width:100,height:100}), width: parseInt(e.target.value||'0') }))} 
                  />
                  <input 
                    className="input-neural" 
                    type="number" 
                    placeholder="height" 
                    value={crop?.height ?? ''} 
                    onChange={(e) => setCrop(c => ({ ...(c||{x:0,y:0,width:100,height:100}), height: parseInt(e.target.value||'0') }))} 
                  />
                </div>
                {crop && (
                  <div className="text-xs text-gray-500">
                    Crop: {crop.width}×{crop.height}px at ({crop.x}, {crop.y})
                  </div>
                )}
              </div>

              {/* Resize */}
              <div className="glass-subtle rounded-2xl p-4">
                <h4 className="font-medium text-gray-800 mb-2">Resize</h4>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <input className="input-neural" type="number" placeholder="width" value={resize.width ?? ''} onChange={(e) => setResize(r => ({ ...r, width: e.target.value ? parseInt(e.target.value) : undefined }))} />
                  <input className="input-neural" type="number" placeholder="height" value={resize.height ?? ''} onChange={(e) => setResize(r => ({ ...r, height: e.target.value ? parseInt(e.target.value) : undefined }))} />
                  <select className="input-neural" value={resize.fit ?? ''} onChange={(e) => setResize(r => ({ ...r, fit: (e.target.value || undefined) as any }))}>
                    <option value="">fit: inside (default)</option>
                    <option value="cover">cover</option>
                    <option value="contain">contain</option>
                    <option value="inside">inside</option>
                    <option value="outside">outside</option>
                  </select>
                </div>
                <div className="text-xs text-gray-500">Leave width/height blank to auto-compute by aspect ratio.</div>
              </div>

              {/* Enhance */}
              <div className="glass-subtle rounded-2xl p-4">
                <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2"><Sparkles size={16}/> Enhance</h4>
                <div className="flex items-center gap-2 mb-2">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!enhance.normalize} onChange={(e) => setEnhance(v => ({ ...v, normalize: e.target.checked || undefined }))} /> Normalize</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!enhance.sharpen} onChange={(e) => setEnhance(v => ({ ...v, sharpen: e.target.checked || undefined }))} /> Sharpen</label>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Saturation</label>
                  <input type="range" min={0.1} max={3} step={0.1} value={enhance.saturation ?? 1} onChange={(e) => setEnhance(v => ({ ...v, saturation: parseFloat(e.target.value) }))} />
                  <input type="number" className="input-neural w-20" value={enhance.saturation ?? 1} step={0.1} min={0.1} max={3} onChange={(e) => setEnhance(v => ({ ...v, saturation: parseFloat(e.target.value||'1') }))} />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button 
                className="btn-holo primary inline-flex items-center gap-2" 
                onClick={applyEdits} 
                disabled={!selectedId || busy}
                title="Save all changes permanently"
              >
                {busy ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Applying…
                  </>
                ) : (
                  <>
                    <BadgePlus size={16} />
                    Apply Changes
                  </>
                )}
              </button>
              <button 
                className="btn-holo ghost" 
                onClick={resetPending} 
                disabled={busy}
                title="Reset all pending changes (Esc)"
              >
                Reset All
              </button>
              <div className="text-xs text-gray-500 ml-auto">
                {busy ? 'Processing...' : 'Changes are applied instantly • Press Apply to save permanently'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
