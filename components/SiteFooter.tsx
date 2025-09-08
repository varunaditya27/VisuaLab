import { Heart, Sparkles, Github, Twitter, Globe } from 'lucide-react'

export default function SiteFooter() {
  return (
  <footer className="relative z-20 mt-auto glass-strong border-t border-white/20 text-sm text-gray-200 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-electric-blue/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-neon-pink/20 rounded-full blur-2xl"></div>
      </div>
      
      <div className="relative container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand Section */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-aurora-primary flex items-center justify-center animate-glow-pulse">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-holographic text-sm">
                VisuaLab
              </p>
              <p className="text-xs text-gray-500">
                Revolutionary Visual Experience
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a 
              href="#" 
              className="flex items-center gap-1 text-gray-500 hover:text-electric-blue transition-colors duration-300"
            >
              <Github size={16} />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <a 
              href="#" 
              className="flex items-center gap-1 text-gray-500 hover:text-neon-pink transition-colors duration-300"
            >
              <Twitter size={16} />
              <span className="hidden sm:inline">Twitter</span>
            </a>
            <a 
              href="#" 
              className="flex items-center gap-1 text-gray-500 hover:text-cyber-purple transition-colors duration-300"
            >
              <Globe size={16} />
              <span className="hidden sm:inline">Website</span>
            </a>
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-1 text-center md:text-right">
            <span>© {new Date().getFullYear()} VisuaLab. Crafted with</span>
            <Heart size={14} className="text-red-400" />
            <span>for visual storytellers</span>
          </div>
        </div>

        {/* Tagline */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-gray-300 italic">
            &ldquo;Where Every Pixel Tells a Story, and Every Interaction Sparks Wonder&rdquo;
          </p>
        </div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-electric-blue/30 rounded-full"
            style={{
              left: `${10 + i * 12}%`,
              bottom: `${10 + (i % 3) * 20}%`,
              // subtle float via CSS keyframes on container background already provides motion
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
    </footer>
  )
}
