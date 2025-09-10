import { Camera, Github, Twitter } from 'lucide-react'

export default function SiteFooter() {
  return (
    <footer className="border-t relative overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute bottom-[-20rem] left-1/2 -translate-x-1/2 w-[80rem] h-[40rem] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,hsl(var(--primary)/0.05),transparent)]"
        />
      </div>
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Camera />
          <p className="text-center text-sm leading-loose md:text-left text-muted-foreground">
            Built by a team of one. Inspired by the web.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
            GitHub
          </a>
          <a href="#" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
            Twitter
          </a>
        </div>
      </div>
    </footer>
  )
}