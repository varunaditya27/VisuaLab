import sharp from 'sharp'

export type ProcessedImage = {
  original: { buffer: Buffer; info: sharp.OutputInfo }
  thumb: { buffer: Buffer; info: sharp.OutputInfo }
  responsive: Array<{ width: number; buffer: Buffer; info: sharp.OutputInfo }>
  meta: { width: number; height: number; format?: string; exif?: Record<string, unknown> }
}

export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const pipeline = sharp(input, { failOn: 'none' })
  const { width = 0, height = 0, format } = await pipeline.metadata()
  // Extract EXIF if available
  const exif = (await pipeline.metadata()).exif ? {} : undefined

  const original = await pipeline.jpeg({ quality: 90 }).toBuffer({ resolveWithObject: true })
  const thumb = await sharp(input).resize(400).jpeg({ quality: 80 }).toBuffer({ resolveWithObject: true })

  const responsiveWidths = [640, 1024, 1600]
  const responsive = await Promise.all(
    responsiveWidths.map(async (w) => {
      const res = await sharp(input).resize(w).jpeg({ quality: 85 }).toBuffer({ resolveWithObject: true })
      return { width: w, buffer: res.data, info: res.info }
    })
  )

  return {
    original: { buffer: original.data, info: original.info },
    thumb: { buffer: thumb.data, info: thumb.info },
    responsive,
    meta: { width, height, format, exif },
  }
}
