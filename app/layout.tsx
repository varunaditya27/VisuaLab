import './globals.css'
import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const geist = Poppins({ subsets: ['latin'], weight: ['600','700'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'VisuaLab',
  description: 'Modern image/media management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${geist.variable}`}>
      <body className="min-h-dvh bg-gradient-to-b from-white to-sky-50 text-ink antialiased flex flex-col">
        <SiteHeader />
        <main className="flex-1">
          <div className="container pb-12 animate-fadeInUp">{children}</div>
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
