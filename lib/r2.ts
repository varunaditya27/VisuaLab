import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function r2PutObject(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string
) {
  await r2Client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType })
  )
}

export async function r2GetSignedUrl(bucket: string, key: string) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  return getSignedUrl(r2Client, command, { expiresIn: 3600 })
}

export function r2PublicUrl(key: string) {
  // If key is already a full URL or an absolute path, return as-is
  if (/^https?:\/\//i.test(key)) return key
  if (key.startsWith('/')) return key
  const base = process.env.R2_PUBLIC_BASE_URL
  const bucket = process.env.R2_BUCKET
  const account = process.env.R2_ACCOUNT_ID
  if (base) {
    // If using cloudflarestorage.com base, include bucket segment if missing
    if (base.includes('cloudflarestorage.com')) {
      const withBucket = base.endsWith(`/${bucket}`) || base.includes(`/${bucket}/`) ? base : `${base}/${bucket}`
      return `${withBucket}/${key}`
    }
    // Assume base already points to bucket root
    return `${base.replace(/\/$/, '')}/${key}`
  }
  if (bucket && account) {
    // Default to R2 dev public domain pattern
    return `https://${bucket}.${account}.r2.dev/${key}`
  }
  return null
}
