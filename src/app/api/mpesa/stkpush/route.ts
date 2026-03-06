import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServer } from '@/lib/supabase'
import { initiateMpesaStkPush, formatMpesaPhone } from '@/lib/mpesa'

/**
 * POST /api/mpesa/stkpush
 * Initiates M-Pesa STK Push for transport escrow payment
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      phone,
      amount,
      companion_id,
      pickup_location,
      meeting_time,
      payment_mode,
      message,
    } = await req.json()

    if (!phone || !amount || !companion_id) {
      return NextResponse.json({ error: 'phone, amount and companion_id are required' }, { status: 400 })
    }
    if (amount < 1) {
      return NextResponse.json({ error: 'Minimum transport amount is KES 1' }, { status: 400 })
    }

    const admin = createSupabaseAdmin()

    // Generate a pending booking first (status: 'pending', payment_verified: false)
    const { data: booking, error: bookingErr } = await admin
      .from('bookings')
      .insert({
        client_id: user.id,
        companion_id,
        status: 'pending',
        payment_mode: payment_mode || 'escrow',
        pickup_location,
        meeting_time,
        transport_amount: amount,
        currency: 'KES',
        message,
        payment_verified: false,
      })
      .select()
      .single()

    if (bookingErr) throw bookingErr

    // Initiate STK Push
    const stkResult = await initiateMpesaStkPush({
      phone: formatMpesaPhone(phone),
      amount,
      accountRef: `ZWD${booking.id.slice(0, 8).toUpperCase()}`,
      description: 'Transport Escrow',
    })

    if (!stkResult.success) {
      // Clean up the pending booking
      await admin.from('bookings').delete().eq('id', booking.id)
      return NextResponse.json({ error: stkResult.error }, { status: 400 })
    }

    // Store checkout request ID on the booking for callback matching
    await admin
      .from('bookings')
      .update({ flutterwave_tx_ref: stkResult.checkoutRequestId }) // reusing field for mpesa
      .eq('id', booking.id)

    // Store pending escrow
    await admin.from('escrow_records').insert({
      booking_id: booking.id,
      client_id: user.id,
      companion_id,
      amount,
      currency: 'KES',
      status: 'held',
      payment_mode: payment_mode || 'escrow',
    })

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      checkoutRequestId: stkResult.checkoutRequestId,
      customerMessage: stkResult.customerMessage || 'Check your phone for the M-Pesa prompt',
    })
  } catch (err: any) {
    console.error('[POST /api/mpesa/stkpush]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
