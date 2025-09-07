'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createSupabaseBrowser } from '@/lib/supabase'

export default function LoginPage() {
  const supabase = createSupabaseBrowser()
  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-4 text-lg font-medium">Sign in</h2>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google', 'github']}
        redirectTo="/"
      />
    </div>
  )
}
