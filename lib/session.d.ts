declare module '@/lib/session' {
  export function getSessionInfo(): Promise<{ userId: string | null; role: 'ADMIN' | 'VIEWER' }>
}
