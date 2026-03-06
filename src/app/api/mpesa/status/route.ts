import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServer } from '@/lib/supabase'
import { queryMpesaStkStatus } from '@/lib/mpesa'

/**
 * GET /api/mpesa/status?bookingId=xxx
 * Client polls this every 3s after initiating STK push to know if payment succeeded
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const bookingId = searchParams.get('bookingId')
    const checkoutRequestId = searchParams.get('checkoutRequestId')

    if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 })

    const admin = createSupabaseAdmin()

    // Check if booking is already verified via callback
    const { data: booking } = await admin
      .from('bookings')
      .select('payment_verified, status, flutterwave_tx_id')
      .eq('id', bookingId)
      .eq('client_id', user.id)
      .single()

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (booking.payment_verified) {
      return NextResponse.json({
        status: 'completed',
        paid: true,
        receipt: booking.flutterwave_tx_id,
      })
    }

    // Optionally query Safaricom directly
    if (checkoutRequestId) {
      const queryResult = await queryMpesaStkStatus(checkoutRequestId)
      if (queryResult.success) {
        // Payment succeeded but callback hasn't fired yet — mark it
        await admin
          .from('bookings')
          .update({ payment_verified: true })
          .eq('id', bookingId)
        return NextResponse.json({ status: 'completed', paid: true })
      }
      if (queryResult.resultCode === 1032) {
        // User cancelled
        return NextResponse.json({ status: 'cancelled', paid: false })
      }
    }

    return NextResponse.json({ status: 'pending', paid: false })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
