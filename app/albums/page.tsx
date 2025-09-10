import { getRoleServer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

async function fetchAlbums() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/albums`, { cache: 'no-store' })
    if (!res.ok) return { albums: [] }
    return res.json()
  } catch {
    return { albums: [] }
  }
}

import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/components/ui/LinkButton'
import { Plus } from 'lucide-react'

// ... (fetchAlbums)

export default async function AlbumsPage() {
  const { albums } = await fetchAlbums()
  const role = await getRoleServer()
  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">Albums</h1>
          <p className="text-muted-foreground">Browse and manage your curated collections.</p>
        </div>
        {role === 'ADMIN' && (
          <form className="flex items-center gap-2 w-full md:w-auto">
            <input name="name" placeholder="New album name" className="input flex-1" required />
            <Button className="inline-flex items-center gap-2" formAction={async (formData) => {
              'use server'
              const name = String(formData.get('name') || '')
              if (!name) return
              await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/albums`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
              })
              revalidatePath('/albums')
            }}><Plus size={16} /> Create</Button>
          </form>
        )}
      </div>

      {albums.length === 0 ? (
        <div className="rounded-2xl p-8 text-center border-2 border-dashed border-border">
          <p className="text-muted-foreground">No albums yet. Create your first collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((a: any) => (
            <div key={a.id} className="p-6 rounded-2xl bg-card shadow card-interactive">
              <div className="mb-4 flex items-start justify-between">
                <h2 className="font-heading text-xl font-bold">{a.name}</h2>
                <span className="text-sm font-medium text-muted-foreground bg-background px-2 py-1 rounded-md">{a._count?.images ?? 0} items</span>
              </div>
              {a.description && <p className="text-sm text-muted-foreground mb-4">{a.description}</p>}
              <LinkButton href={`/gallery?album=${a.id}`} className="w-full">Open Album</LinkButton>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
