import sharp from 'sharp'
import exifReader from 'exif-reader'

export type ProcessedImage = {
  original: { buffer: Buffer; info: sharp.OutputInfo }
  thumb: { jpeg: Buffer; webp: Buffer; avif: Buffer }
  responsive: Array<{ width: number; jpeg: Buffer; webp: Buffer; avif: Buffer }>
  meta: { width: number; height: number; format?: string; exif?: Record<string, unknown>; iptc?: Record<string, unknown> }
}

export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const pipeline = sharp(input, { failOn: 'none' })
  const meta = await pipeline.metadata()
  const { width = 0, height = 0, format } = meta
  // Extract EXIF if available
  let exif: Record<string, unknown> | undefined = undefined
  let iptc: Record<string, unknown> | undefined = undefined
  try {
    if (meta.exif) {
      exif = exifReader(meta.exif)
    }
    if ((meta as any).iptc) {
      // @ts-ignore sharp types may not include iptc in metadata
      const iptcBuf: Buffer = (meta as any).iptc
      // iptc-reader expects a Buffer
      // Dynamically import to avoid issues if missing in some builds
      const { default: iptcReader } = await import('iptc-reader') as any
      iptc = iptcReader(iptcBuf)
    }
  } catch {
    exif = exif
  }

  const original = await pipeline.jpeg({ quality: 90 }).toBuffer({ resolveWithObject: true })
  const thumbJpeg = await sharp(input).resize(400).jpeg({ quality: 80 }).toBuffer()
  const thumbWebp = await sharp(input).resize(400).webp({ quality: 80 }).toBuffer()
  const thumbAvif = await sharp(input).resize(400).avif({ quality: 60 }).toBuffer()

  const responsiveWidths = [640, 1024, 1600]
  const responsive = await Promise.all(
    responsiveWidths.map(async (w) => {
      const base = sharp(input).resize(w)
      const jpeg = await base.clone().jpeg({ quality: 85 }).toBuffer()
      const webp = await base.clone().webp({ quality: 80 }).toBuffer()
      const avif = await base.clone().avif({ quality: 60 }).toBuffer()
      return { width: w, jpeg, webp, avif }
    })
  )

  return {
    original: { buffer: original.data, info: original.info },
    thumb: { jpeg: thumbJpeg, webp: thumbWebp, avif: thumbAvif },
    responsive,
    meta: { width, height, format, exif, iptc },
  }
}
