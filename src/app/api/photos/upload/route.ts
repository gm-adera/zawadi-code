import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_PHOTOS = 8

/**
 * POST /api/photos/upload
 * Companion uploads a photo. Stored in Supabase Storage bucket "companion-photos"
 * Returns the public URL.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check user is a companion
    const admin = createSupabaseAdmin()
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'companion') {
      return NextResponse.json({ error: 'Only companions can upload photos' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('photo') as File
    const isPrivate = formData.get('is_private') === 'true' // "one real" unlockable photo

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Only JPG, PNG, WebP allowed' }, { status: 400 })

    // Check current photo count
    const { data: companion } = await admin
      .from('companion_profiles')
      .select('photos, private_photos')
      .eq('user_id', user.id)
      .single()

    const existingPublic = companion?.photos || []
    const existingPrivate = companion?.private_photos || []

    if (!isPrivate && existingPublic.length >= MAX_PHOTOS) {
      return NextResponse.json({ error: `Max ${MAX_PHOTOS} public photos allowed` }, { status: 400 })
    }
    if (isPrivate && existingPrivate.length >= 3) {
      return NextResponse.json({ error: 'Max 3 private photos allowed' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop() || 'jpg'
    const bucket = isPrivate ? 'companion-photos-private' : 'companion-photos'
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadErr } = await admin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadErr) throw uploadErr

    // Get public URL (private photos use signed URLs at request time)
    let url: string
    if (isPrivate) {
      // Store just the path — generate signed URLs on demand
      url = path
    } else {
      const { data: urlData } = admin.storage.from(bucket).getPublicUrl(path)
      url = urlData.publicUrl
    }

    // Update companion_profiles photos array
    const field = isPrivate ? 'private_photos' : 'photos'
    const existing = isPrivate ? existingPrivate : existingPublic
    await admin
      .from('companion_profiles')
      .update({ [field]: [...existing, url] })
      .eq('user_id', user.id)

    return NextResponse.json({ success: true, url, is_private: isPrivate })
  } catch (err: any) {
    console.error('[POST /api/photos/upload]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/photos/upload
 * Remove a photo
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { url, is_private } = await req.json()
    const admin = createSupabaseAdmin()
    const bucket = is_private ? 'companion-photos-private' : 'companion-photos'

    // Remove from storage
    const path = is_private ? url : url.split(`${bucket}/`)[1]
    if (path) await admin.storage.from(bucket).remove([path])

    // Remove from array
    const { data: companion } = await admin
      .from('companion_profiles')
      .select('photos, private_photos')
      .eq('user_id', user.id)
      .single()

    const field = is_private ? 'private_photos' : 'photos'
    const arr: string[] = (is_private ? companion?.private_photos : companion?.photos) || []
    await admin
      .from('companion_profiles')
      .update({ [field]: arr.filter(u => u !== url) })
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
