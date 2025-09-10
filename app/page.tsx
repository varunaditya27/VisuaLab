import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default async function HomePage() {
  return (
    <div>
      <section className="text-center py-20">
        <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight mb-4">
          VisuaLab
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          An artistic and modern image gallery, reimagined.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/gallery" className="btn btn-primary">
            Explore Gallery
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <Link href="/albums" className="btn btn-secondary">
            View Albums
          </Link>
        </div>
      </section>

      <section id="features" className="my-16">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold">Features</h2>
          <p className="text-muted-foreground">All the power, none of the clutter.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 border rounded-lg">
            <h3 className="font-heading text-xl mb-2">Easy to Install</h3>
            <p className="text-muted-foreground">One-command start, clear docs, DB migrations, and seed data for fast bootstrapping.</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-heading text-xl mb-2">Responsive & Accessible</h3>
            <p className="text-muted-foreground">Modern UI, keyboard-friendly, WCAG-aware, and mobile-first.</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-heading text-xl mb-2">Universal Upload</h3>
            <p className="text-muted-foreground">JPEG/PNG/WEBP/AVIF, batch upload, thumbnails, responsive sizes, and EXIF/IPTC.</p>
          </div>
        </div>
      </section>
    </div>
  )
}