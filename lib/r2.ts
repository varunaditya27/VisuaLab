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
  // If bucket is public and base URL provided, construct URL
  const base = process.env.R2_PUBLIC_BASE_URL
  if (!base) return null
  return `${base}/${key}`
}
