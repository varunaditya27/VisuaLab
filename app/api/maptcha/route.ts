import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET() {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  const issued = Date.now()
  const secret = process.env.MAPTCHA_SECRET || 'dev-secret'
  const sig = crypto.createHmac('sha256', secret).update(`${a}|${b}|${issued}`).digest('hex')
  return NextResponse.json({ a, b, issued, sig })
}
