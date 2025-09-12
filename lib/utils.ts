export function deriveFormatVariants(baseKey: string, width: number, local: boolean) {
  const prefix = local ? '/' : ''
  const base = `${prefix}${baseKey}`
  return {
    jpg: `${base}/w${width}.jpg`,
    webp: `${base}/w${width}.webp`,
    avif: `${base}/w${width}.avif`,
  }
}
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}