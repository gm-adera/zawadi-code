import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'

/**
 * GET /api/photos/private?companionId=xxx
 * Returns signed URLs for a companion's private photos.
 * Only accessible to clients who have an accepted booking with this companion.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const companionId = searchParams.get('companionId')
    if (!companionId) return NextResponse.json({ error: 'companionId required' }, { status: 400 })

    const admin = createSupabaseAdmin()

    // Check if client has an active or completed booking with this companion
    const { data: booking } = await admin
      .from('bookings')
      .select('id, status')
      .eq('client_id', user.id)
      .eq('companion_id', companionId)
      .in('status', ['accepted', 'completed', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!booking) {
      return NextResponse.json({
        error: 'You need an active booking to view private photos',
        requiresBooking: true,
      }, { status: 403 })
    }

    // Get private photo paths
    const { data: companion } = await admin
      .from('companion_profiles')
      .select('private_photos')
      .eq('user_id', companionId)
      .single()

    if (!companion?.private_photos?.length) {
      return NextResponse.json({ urls: [] })
    }

    // Generate signed URLs (valid for 1 hour)
    const signedUrls: string[] = []
    for (const path of companion.private_photos) {
      const { data } = await admin.storage
        .from('companion-photos-private')
        .createSignedUrl(path, 3600)
      if (data?.signedUrl) signedUrls.push(data.signedUrl)
    }

    return NextResponse.json({ urls: signedUrls })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
