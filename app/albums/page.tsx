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

export default async function AlbumsPage() {
  const { albums } = await fetchAlbums()
  const role = await getRoleServer()
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-holographic">Albums</h2>
          <p className="text-gray-600">Group images into curated collections</p>
        </div>
        {role === 'ADMIN' && (
          <form className="flex items-center gap-2">
            <input name="name" placeholder="New album name" className="input-neural" required />
            <button className="btn-holo primary" formAction={async (formData) => {
              'use server'
              const name = String(formData.get('name') || '')
              if (!name) return
              await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/albums`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
              })
              revalidatePath('/albums')
            }}>Create</button>
          </form>
        )}
      </div>

      {albums.length === 0 ? (
        <div className="card-quantum p-8 text-center text-gray-600">No albums yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((a: any) => (
            <div key={a.id} className="card-quantum p-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{a.name}</h3>
                <span className="text-xs text-gray-500">{a._count?.images ?? 0} items</span>
              </div>
              {a.description && <p className="text-sm text-gray-600 mb-3">{a.description}</p>}
              <a href={`/?album=${a.id}`} className="btn-holo ghost">Open</a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
