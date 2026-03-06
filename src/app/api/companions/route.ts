import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')
    const country = searchParams.get('country')
    const online = searchParams.get('online')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const admin = createSupabaseAdmin()

    let query = admin
      .from('companion_profiles')
      .select(`
        *,
        profile:profiles!companion_profiles_user_id_fkey(
          id, full_name, avatar_url, city, country, currency, is_verified
        )
      `)
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1)

    if (online === 'true') query = query.eq('is_online', true)

    const { data, error } = await query
    if (error) throw error

    // Filter by city/country if provided
    let companions = data || []
    if (city) companions = companions.filter(c => c.profile?.city?.toLowerCase().includes(city.toLowerCase()))
    if (country) companions = companions.filter(c => c.profile?.country === country)

    return NextResponse.json({ companions })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
