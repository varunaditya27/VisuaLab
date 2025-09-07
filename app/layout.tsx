import './globals.css'
import type { Metadata } from 'next'

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
    <html lang="en">
      <body className="min-h-dvh bg-white text-gray-900 antialiased">
        <div className="mx-auto max-w-6xl px-4">
          <header className="flex items-center justify-between py-6">
            <h1 className="text-xl font-semibold">VisuaLab</h1>
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-black">Gallery</a>
              <span className="mx-3">·</span>
              <a href="/upload" className="hover:text-black">Upload</a>
              <span className="mx-3">·</span>
              <a href="/albums" className="hover:text-black">Albums</a>
            </nav>
          </header>
          <main className="pb-12">{children}</main>
          <footer className="border-t py-6 text-xs text-gray-500">© {new Date().getFullYear()} VisuaLab</footer>
        </div>
      </body>
    </html>
  )
}
