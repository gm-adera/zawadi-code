import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServer } from '@/lib/supabase'
import { verifyFlutterwaveTransaction } from '@/lib/flutterwave'
import { CurrencyCode } from '@/types'

// POST /api/bookings — create a new booking after payment
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
      currency,
      message,
      payment_mode,
      flutterwave_tx_id,
      flutterwave_tx_ref,
    } = body

    // Verify the Flutterwave payment
    const verification = await verifyFlutterwaveTransaction(flutterwave_tx_id)
    if (!verification.success) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    // Verify amount matches
    if (verification.data!.amount < transport_amount) {
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 })
    }

    const admin = createSupabaseAdmin()

    // Create the booking
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
        flutterwave_tx_ref,
        flutterwave_tx_id: String(flutterwave_tx_id),
        payment_verified: true,
      })
      .select()
      .single()

    if (bookingErr) throw bookingErr

    // Create escrow record
    const { error: escrowErr } = await admin
      .from('escrow_records')
      .insert({
        booking_id: booking.id,
        client_id: user.id,
        companion_id,
        amount: transport_amount,
        currency,
        status: 'held',
        payment_mode: payment_mode || 'escrow',
      })

    if (escrowErr) throw escrowErr

    // Log transaction for client
    await admin.from('transactions').insert({
      user_id: user.id,
      booking_id: booking.id,
      type: 'escrow_lock',
      amount: transport_amount,
      currency,
      description: `Transport escrow locked for booking`,
      flutterwave_ref: flutterwave_tx_ref,
    })

    // Update companion's escrow_balance if upfront mode
    if (payment_mode === 'upfront') {
      await admin.rpc('update_companion_pending', {
        p_companion_id: companion_id,
        p_amount: transport_amount,
      })
    }

    return NextResponse.json({ success: true, booking_id: booking.id })
  } catch (err: any) {
    console.error('[POST /api/bookings]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET /api/bookings — list bookings for current user
export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') // 'client' | 'companion'

    const admin = createSupabaseAdmin()
    const field = role === 'companion' ? 'companion_id' : 'client_id'

    const { data, error } = await admin
      .from('bookings')
      .select(`
        *,
        client:profiles!bookings_client_id_fkey(id, full_name, avatar_url, city),
        companion:profiles!bookings_companion_id_fkey(id, full_name, avatar_url, city),
        escrow:escrow_records(*)
      `)
      .eq(field, user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ bookings: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
