import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'
import { initiateMpesaStkPush } from '@/lib/mpesa'

// POST /api/escrow — release or dispute escrow
export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action, booking_id, dispute_reason } = await req.json()
    const admin = createSupabaseAdmin()

    if (action === 'release') {
      // Call the DB function to release escrow atomically
      const { data, error } = await admin.rpc('release_escrow', {
        p_booking_id: booking_id,
        p_released_by: user.id,
      })

      if (error) throw error
      if (!data.success) return NextResponse.json({ error: data.error }, { status: 400 })

      // Fetch companion's payout details for auto-transfer
      const { data: escrow } = await admin
        .from('escrow_records')
        .select('*, companion:profiles!escrow_records_companion_id_fkey(phone, currency)')
        .eq('booking_id', booking_id)
        .single()

      // Optionally auto-initiate payout (or companion can manually withdraw)
      // For MVP, companions withdraw manually — safer & gives them control

      return NextResponse.json({
        success: true,
        message: `Released ${data.amount} ${data.currency} to companion`,
      })
    }

    if (action === 'dispute') {
      const { error } = await admin
        .from('escrow_records')
        .update({
          status: 'disputed',
          disputed_by: user.id,
          disputed_at: new Date().toISOString(),
          dispute_reason,
        })
        .eq('booking_id', booking_id)

      if (error) throw error

      await admin
        .from('bookings')
        .update({ status: 'disputed' })
        .eq('id', booking_id)

      return NextResponse.json({ success: true, message: 'Dispute raised. Support will review within 2 hours.' })
    }

    if (action === 'accept_booking') {
      // Companion accepts the booking
      const { data: booking, error: bookingErr } = await admin
        .from('bookings')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', booking_id)
        .eq('companion_id', user.id)
        .select()
        .single()

      if (bookingErr) throw bookingErr

      // Move amount to companion's escrow_balance
      await admin
        .from('profiles')
        .update({
          escrow_balance: admin.rpc('increment_escrow', {
            p_user_id: user.id,
            p_amount: booking.transport_amount,
          })
        })
        .eq('id', user.id)

      return NextResponse.json({ success: true, booking })
    }

    if (action === 'decline_booking') {
      await admin
        .from('bookings')
        .update({ status: 'declined', cancelled_at: new Date().toISOString() })
        .eq('id', booking_id)
        .eq('companion_id', user.id)

      // Mark escrow for refund
      await admin
        .from('escrow_records')
        .update({ status: 'refunded' })
        .eq('booking_id', booking_id)

      return NextResponse.json({ success: true, message: 'Booking declined, client will be refunded.' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    console.error('[POST /api/escrow]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
