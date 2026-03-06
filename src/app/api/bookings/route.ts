import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'

// POST /api/bookings - create a new booking after mpesa payment
export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      companion_id,
      pickup_location,
      meeting_time,
      transport_amount,
      currency = 'KES',
      message,
      payment_mode,
      mpesa_checkout_request_id,
    } = body

    const admin = createSupabaseAdmin()

    const { data: booking, error: bookingErr } = await admin
      .from('bookings')
      .insert({
        client_id: user.id,
        companion_id,
        status: 'pending',
        payment_mode: payment_mode || 'escrow',
        pickup_location,
        meeting_time,
        transport_amount,
        currency,
        message,
        mpesa_checkout_request_id,
      })
      .select()
      .single()

    if (bookingErr) {
      console.error('[Booking insert error]', bookingErr)
      return NextResponse.json({ error: bookingErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, booking })
  } catch (err: any) {
    console.error('[Booking POST error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
