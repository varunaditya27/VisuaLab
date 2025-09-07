export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/60 bg-white/70 text-sm text-gray-600 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container py-6">
  <p className="text-center w-full">© {new Date().getFullYear()} VisuaLab. All rights reserved.</p>
      </div>
    </footer>
  )
}
