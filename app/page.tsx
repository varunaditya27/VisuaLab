import dynamic from 'next/dynamic'
import { Sparkles, Zap, Palette, Camera } from 'lucide-react'

const GalleryGrid = dynamic(() => import('@/components/GalleryGrid').then(m => m.GalleryGrid))

async function fetchImages() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/images`, { cache: 'no-store' })
    if (!res.ok) return { images: [] }
    return res.json()
  } catch {
    return { images: [] }
  }
}

export default async function HomePage() {
  const { images } = await fetchImages()
  
  return (
    <div className="relative">
      {/* Revolutionary Hero Section */}
      <div className="relative py-16 mb-12 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-electric-blue/10 rounded-full blur-3xl animate-particle-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-pink/10 rounded-full blur-3xl animate-particle-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative text-center">
          {/* Floating Badge */}
          <div className="inline-flex items-center gap-2 mb-8 card-quantum px-6 py-3 animate-float">
            <div className="w-8 h-8 rounded-full bg-aurora-primary flex items-center justify-center animate-glow-pulse">
              <Camera size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              Revolutionary Visual Experience
            </span>
            <Sparkles size={16} className="text-electric-blue animate-pulse" />
          </div>
          
          {/* Hero Title */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-holographic">VisuaLab</span>
            <br />
            <span className="text-gray-700">Digital Canvas</span>
          </h1>
          
          {/* Hero Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Where Every Pixel Tells a Story, and Every Interaction Sparks Wonder.
            <br />
            <span className="text-electric-blue font-medium">Transform ordinary images into extraordinary experiences.</span>
          </p>
          
          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="glass-subtle rounded-2xl px-4 py-2 flex items-center gap-2">
              <Zap size={16} className="text-electric-blue" />
              <span className="text-sm text-gray-700">Lightning Fast</span>
            </div>
            <div className="glass-subtle rounded-2xl px-4 py-2 flex items-center gap-2">
              <Palette size={16} className="text-neon-pink" />
              <span className="text-sm text-gray-700">Aurora Spectrum</span>
            </div>
            <div className="glass-subtle rounded-2xl px-4 py-2 flex items-center gap-2">
              <Sparkles size={16} className="text-cyber-purple" />
              <span className="text-sm text-gray-700">AI Enhanced</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gallery Section */}
      <div className="relative">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-holographic mb-2">
              Explore the Gallery
            </h2>
            <p className="text-gray-600">
              Discover a collection of extraordinary visual experiences
            </p>
          </div>
          
          {/* Gallery Stats */}
          {images.length > 0 && (
            <div className="glass-subtle rounded-2xl px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-electric-blue rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-700">
                  {images.length} {images.length === 1 ? 'Creation' : 'Creations'}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Gallery Grid */}
        <GalleryGrid images={images} />
      </div>
      
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
