import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Client-side Supabase client (use in components)
export const createSupabaseClient = () => createClientComponentClient()

// Server-side Supabase client (use in Server Components & API routes)
export const createSupabaseServer = () =>
  createServerComponentClient({ cookies })

// Admin client with service role (use in API routes only — never expose to client)
export const createSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
