import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk, Orbitron, JetBrains_Mono } from 'next/font/google'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'], 
  variable: '--font-heading',
  display: 'swap',
})

const orbitron = Orbitron({ 
  subsets: ['latin'], 
  weight: ['400', '700', '900'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'], 
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'VisuaLab - Revolutionary Visual Experience',
  description: 'Where Every Pixel Tells a Story, and Every Interaction Sparks Wonder',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#00d4ff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${orbitron.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh aurora-bg text-ink antialiased flex flex-col relative overflow-x-hidden">
        {/* Particle Background Layer */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 particles opacity-20"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-electric-blue/5 rounded-full blur-3xl animate-particle-float"></div>
          <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-cyber-purple/5 rounded-full blur-3xl animate-particle-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-3/4 w-32 h-32 bg-neon-pink/5 rounded-full blur-3xl animate-particle-float" style={{ animationDelay: '4s' }}></div>
        </div>
        
        {/* Main Content Layer */}
        <div className="relative z-10 flex flex-col min-h-dvh">
          <SiteHeader />
          <main className="flex-1 relative">
            <div className="container pb-12 animate-cosmic-entrance">
              {children}
            </div>
          </main>
          <SiteFooter />
        </div>
        
        {/* Holographic Overlay */}
        <div className="fixed inset-0 pointer-events-none z-5 opacity-30">
          <div className="absolute inset-0 bg-holographic animate-hologram-flicker"></div>
        </div>
      </body>
    </html>
  )
}
