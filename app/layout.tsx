import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Lato } from 'next/font/google'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import PageTransition from '@/components/PageTransition'
import AnimatedBackground from '@/components/AnimatedBackground'
import AuthModal from '@/components/AuthModal'

const fontSans = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
})

const fontHeading = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-heading',
})

export const metadata: Metadata = {
  title: 'VisuaLab',
  description: 'An artistic and modern image gallery.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${fontSans.variable} ${fontHeading.variable}`}>
      <body className="min-h-dvh bg-transparent text-foreground antialiased flex flex-col">
        <AnimatedBackground />
        <div className="flex flex-col min-h-dvh">
          <SiteHeader />
          <AuthModal />
          <main className="flex-1">
            <div className="container py-8 md:py-12">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  )
}