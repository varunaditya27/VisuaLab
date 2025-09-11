import { Camera, Github } from 'lucide-react'

export default function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="relative border-t border-border/60 backdrop-blur-sm overflow-hidden">
      {/* Subtle top glow line */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      {/* Soft radial tint for depth */}
      <div className="absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(circle_at_50%_30%,black,transparent)] bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.08),transparent_70%)]" />
      <div className="container py-8 flex flex-col md:flex-row items-center gap-4 md:gap-6 text-xs md:text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Camera className="w-4 h-4 opacity-80" />
          <span className="font-medium tracking-tight text-foreground/90">VisuaLab</span>
          <span className="hidden md:inline select-none text-foreground/30">•</span>
          <span className="text-foreground/60">{year} · Open-source media lab</span>
        </div>
        <nav aria-label="Footer" className="flex items-center gap-5 md:ml-auto">
          <a
            href="https://github.com/varunaditya27/VisuaLab"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1 text-foreground/60 hover:text-foreground transition-colors"
          >
            <Github className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="underline decoration-transparent group-hover:decoration-primary/50 underline-offset-4">GitHub</span>
          </a>
          <a
            href="/gallery"
            className="text-foreground/60 hover:text-primary transition-colors"
          >Explore</a>
          <a
            href="/upload"
            className="text-foreground/60 hover:text-primary transition-colors"
          >Upload</a>
        </nav>
      </div>
    </footer>
  )
}