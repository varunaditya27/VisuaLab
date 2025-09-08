import Link from 'next/link'
import { Sparkles, Zap, Palette, Camera, CheckCircle2, FolderOpen, MessageSquareHeart, Shield, Search, Cpu, Rocket } from 'lucide-react'

export default async function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section (standout) */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* Animated aurora backdrop */}
          <div className="absolute inset-0 opacity-70 blur-3xl"
               style={{
                 background:
                   'radial-gradient(60% 60% at 20% 20%, rgba(0,212,255,0.20) 0%, rgba(0,212,255,0.00) 60%),\
                    radial-gradient(60% 60% at 80% 30%, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.00) 60%),\
                    radial-gradient(70% 70% at 50% 80%, rgba(244,113,181,0.16) 0%, rgba(244,113,181,0.00) 60%)'
               }}
          />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6 card-quantum px-5 py-2.5 animate-float">
              <div className="w-7 h-7 rounded-full bg-aurora-primary flex items-center justify-center animate-glow-pulse">
                <Camera size={14} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Modern, Extensible Media Platform</span>
              <Sparkles size={14} className="text-electric-blue animate-pulse" />
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5">
              <span className="text-holographic">VisuaLab</span>
              <span className="block text-gray-700">Reimagined Gallery</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-lg text-gray-600 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
              From a classic PHP gallery to a responsive, accessible, and pluggable platform.
              Build albums, moderate comments, theme it, and extend with AI and vector search.
            </p>

            {/* CTAs */}
            <div className="flex items-center justify-center gap-3 md:gap-4">
              <Link href="/gallery" className="btn-holo primary inline-flex items-center gap-2">
                Explore Gallery
              </Link>
              <Link href="/albums" className="btn-holo secondary inline-flex items-center gap-2">
                View Albums
              </Link>
              <a href="#features" className="btn-holo ghost">Learn more</a>
            </div>

            {/* Feature chips */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <div className="glass-subtle rounded-2xl px-3.5 py-1.5 text-sm flex items-center gap-2"><Zap size={14} className="text-electric-blue"/> Fast</div>
              <div className="glass-subtle rounded-2xl px-3.5 py-1.5 text-sm flex items-center gap-2"><Palette size={14} className="text-neon-pink"/> Themed</div>
              <div className="glass-subtle rounded-2xl px-3.5 py-1.5 text-sm flex items-center gap-2"><Sparkles size={14} className="text-cyber-purple"/> AI-ready</div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="relative -mt-10" aria-hidden>
          <svg className="w-full h-12 text-white/70" viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path fill="currentColor" d="M0,80L60,64C120,48,240,16,360,10.7C480,5,600,27,720,37.3C840,48,960,48,1080,42.7C1200,37,1320,27,1380,21.3L1440,16L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"></path>
          </svg>
        </div>
      </section>
      
  {/* Core Pillars Section */}
  <section id="features" className="relative my-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card-quantum p-6">
            <h3 className="font-heading text-xl mb-2 flex items-center gap-2"><Shield size={18} className="text-electric-blue"/> Easy to Install</h3>
            <p className="text-gray-600">One-command start, clear docs, DB migrations, and seed data for fast bootstrapping.</p>
          </div>
          <div className="card-quantum p-6">
            <h3 className="font-heading text-xl mb-2 flex items-center gap-2"><Palette size={18} className="text-neon-pink"/> Responsive & Accessible</h3>
            <p className="text-gray-600">Modern UI with Tailwind, keyboard-friendly, WCAG-aware, and mobile-first.</p>
          </div>
          <div className="card-quantum p-6">
            <h3 className="font-heading text-xl mb-2 flex items-center gap-2"><FolderOpen size={18} className="text-cyber-purple"/> Universal Upload</h3>
            <p className="text-gray-600">JPEG/PNG/WEBP/AVIF, batch upload, thumbnails, responsive sizes, and EXIF/IPTC.</p>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="relative my-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-quantum p-6">
            <h3 className="font-heading text-xl mb-2 flex items-center gap-2"><MessageSquareHeart size={18} className="text-electric-blue"/> Content Management</h3>
            <ul className="text-gray-600 space-y-1 text-sm">
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> Albums, collections, and galleries</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> Titles, captions, alt text, license</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> Per-image privacy controls</li>
            </ul>
          </div>
          <div className="card-quantum p-6">
            <h3 className="font-heading text-xl mb-2 flex items-center gap-2"><Shield size={18} className="text-neon-pink"/> Users & Rights</h3>
            <p className="text-gray-600 mb-2">Roles: Admin, Editor, Visitor. Permissions to upload, edit, delete, publish, and moderate.</p>
          </div>
          <div className="card-quantum p-6">
            <h3 className="font-heading text-xl mb-2 flex items-center gap-2"><Search size={18} className="text-electric-blue"/> Search & Filters</h3>
            <p className="text-gray-600">Keywords, tags, metadata, album/date/camera/license filters — fast and intuitive.</p>
          </div>
          <div className="card-quantum p-6">
            <h3 className="font-heading text-xl mb-2 flex items-center gap-2"><Cpu size={18} className="text-cyber-purple"/> Modular Extensibility</h3>
            <p className="text-gray-600">Plug-in architecture for AI generation, palettes, vector search, and more.</p>
          </div>
        </div>
      </section>

      {/* CTA to Gallery */}
      <section className="my-16 text-center">
        <Link href="/gallery" className="btn-holo primary inline-flex items-center gap-2">
          <Rocket size={18}/>
          Explore the Gallery
        </Link>
      </section>
      
      {/* Interactive Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Floating Geometric Shapes */}
        <div className="absolute top-1/3 left-1/6 w-4 h-4 border border-electric-blue/20 rotate-45 animate-particle-float"></div>
        <div className="absolute top-2/3 right-1/6 w-6 h-6 border border-neon-pink/20 rounded-full animate-particle-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-cyber-purple/20 animate-particle-float" style={{ animationDelay: '3s' }}></div>
        
        {/* Constellation Dots */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-electric-blue/30 rounded-full animate-glow-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
