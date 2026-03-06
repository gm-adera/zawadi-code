import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { parseMpesaCallback, MpesaCallbackBody } from '@/lib/mpesa'

/**
 * POST /api/mpesa/callback
 * Safaricom calls this URL after the customer completes (or cancels) M-Pesa payment.
 * This MUST be a public URL — no auth required.
 * Register this URL in your Safaricom Daraja app.
 */
export async function POST(req: NextRequest) {
  try {
    const body: MpesaCallbackBody = await req.json()
    console.log('[M-Pesa Callback]', JSON.stringify(body, null, 2))

    const result = parseMpesaCallback(body)
    const admin = createSupabaseAdmin()

    const { data: booking, error: findErr } = await admin
      .from('bookings')
      .select('*')
      .single()

    if (findErr || !booking) {
      console.error('[M-Pesa Callback] Booking not found for', result.checkoutRequestId)
      // Still return 200 to Safaricom — they retry on non-200
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    if (result.success) {
      // Payment confirmed — mark booking as payment_verified
      await admin
        .from('bookings')
        .update({
          payment_verified: true,
        })
        .eq('id', booking.id)

      // Log transaction
      await admin.from('transactions').insert({
        user_id: booking.client_id,
        booking_id: booking.id,
        type: 'escrow_lock',
        amount: result.amount || booking.transport_amount,
        currency: 'KES',
        description: `M-Pesa payment ${result.mpesaReceiptNumber} — escrow locked`,
      })

      console.log(`[M-Pesa Callback] ✅ Payment confirmed for booking ${booking.id} — ${result.mpesaReceiptNumber}`)
    } else {
      // Payment failed/cancelled — delete pending booking & escrow
      await admin.from('escrow_records').delete().eq('booking_id', booking.id)
      await admin.from('bookings').delete().eq('id', booking.id)
      console.log(`[M-Pesa Callback] ❌ Payment failed for booking ${booking.id} — ${result.resultDesc}`)
    }

    // Always return 200 with this structure to Safaricom
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (err: any) {
    console.error('[M-Pesa Callback error]', err)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}
