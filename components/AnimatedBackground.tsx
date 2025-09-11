"use client"

import { useEffect, useMemo, useState, useCallback } from 'react'
import Particles from 'react-tsparticles'
import { loadSlim } from 'tsparticles-slim'
import type { ISourceOptions, Engine } from 'tsparticles-engine'

// Minimal dark blue animated background with subtle gradient shift + particle network.
// Retains primary color linkage to theme editor (listens for palette-changed) but
// background itself is fixed to a neutral dark blue gradient for consistency.

const DARK_GRADIENT_CLASSES = 'bg-[#050b16]'; // base fallback color (static) for no-JS

const AnimatedBackground = () => {
  const [primary, setPrimary] = useState('#3b82f6') // fallback blue

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  // Track primary color from CSS variables; ignore background to keep minimal scheme
  useEffect(() => {
    if (typeof window === 'undefined') return
    const readPrimary = () => {
      const cs = getComputedStyle(document.documentElement)
      const primaryHsl = cs.getPropertyValue('--primary').trim()
      if (primaryHsl) {
        const [h, s, l] = primaryHsl.split(' ')
        setPrimary(`hsl(${h}, ${s}, ${l})`)
      }
    }
    readPrimary()
    window.addEventListener('palette-changed', readPrimary)
    return () => window.removeEventListener('palette-changed', readPrimary)
  }, [])

  const particleOptions: ISourceOptions = useMemo(() => ({
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    interactivity: {
      events: { onHover: { enable: true, mode: 'repulse' } },
      modes: { repulse: { distance: 80, duration: 0.4 } },
    },
    particles: {
      color: { value: primary },
      links: { color: primary, distance: 140, enable: true, opacity: 0.18, width: 1 },
      collisions: { enable: false },
      move: { direction: 'none', enable: true, outModes: { default: 'out' }, speed: 0.4, random: false, straight: false },
      number: { density: { enable: true }, value: 55 },
      opacity: { value: { min: 0.08, max: 0.4 } },
      shape: { type: 'circle' },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  }), [primary])

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
      <div className={`absolute inset-0 ${DARK_GRADIENT_CLASSES}`}/>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,#0d223d_0%,#081627_45%,#050b16_80%)] animate-vl-bg-float opacity-90" />
      <div
        className="absolute inset-0 mix-blend-overlay opacity-[0.07]"
        style={{
          backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" fill=\"none\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/></filter><rect width=\"200\" height=\"200\" filter=\"url(%23n)\" opacity=\"0.35\"/></svg>')"
        }}
      />
      <Particles id="tsparticles" init={particlesInit} options={particleOptions} className="absolute inset-0" canvasClassName="!pointer-events-none" />
      <style jsx global>{`
        @keyframes vl-bg-float { 0% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(2%, -2%,0) scale(1.02); } 100% { transform: translate3d(0,0,0) scale(1); } }
        .animate-vl-bg-float { animation: vl-bg-float 18s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

export default AnimatedBackground