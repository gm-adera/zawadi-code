import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'
import { initiateMpesaStkPush } from '@/lib/mpesa'
import { CurrencyCode } from '@/types'

// M-Pesa bank codes for Flutterwave
const MPESA_BANK_CODES: Record<string, string> = {
  KE: 'MPS', // M-Pesa Kenya
  GH: 'MTN', // MTN Ghana
  UG: 'AIRTELMONEY', // Airtel Uganda
  TZ: 'VODAFONE', // Vodacom Tanzania
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount, method, account_number, account_name, bank_code, currency } = await req.json()
    const admin = createSupabaseAdmin()

    // Check available balance
    const { data: profile } = await admin
      .from('profiles')
      .select('wallet_balance, currency, country')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    if (profile.wallet_balance < amount) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 })
    }
    if (amount < 100) {
      return NextResponse.json({ error: 'Minimum withdrawal is 100' }, { status: 400 })
    }

    const reference = generateTxRef('ZAWADI-WD')

    // Create withdrawal record
    const { data: withdrawal, error: wdErr } = await admin
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount,
        currency: currency || profile.currency,
        method,
        status: 'processing',
        account_number,
        account_name,
        bank_code: method === 'mpesa' ? MPESA_BANK_CODES[profile.country] || 'MPS' : bank_code,
        flutterwave_ref: reference,
      })
      .select()
      .single()

    if (wdErr) throw wdErr

    // Deduct from wallet immediately
    await admin
      .from('profiles')
      .update({ wallet_balance: profile.wallet_balance - amount })
      .eq('id', user.id)

    // Initiate Flutterwave transfer
    const transfer = await initiateFlutterwaveTransfer({
      accountNumber: account_number,
      accountBank: withdrawal.bank_code!,
      amount,
      currency: currency || profile.currency,
      narration: `Zawadi earnings withdrawal`,
      reference,
      meta: { user_id: user.id, withdrawal_id: withdrawal.id },
    })

    if (!transfer.success) {
      // Reverse wallet deduction on failure
      await admin
        .from('profiles')
        .update({ wallet_balance: profile.wallet_balance })
        .eq('id', user.id)

      await admin
        .from('withdrawals')
        .update({ status: 'failed', failure_reason: transfer.error })
        .eq('id', withdrawal.id)

      return NextResponse.json({ error: transfer.error }, { status: 500 })
    }

    // Update with transfer ID
    await admin
      .from('withdrawals')
      .update({
        flutterwave_transfer_id: transfer.transferId,
        status: 'processing',
      })
      .eq('id', withdrawal.id)

    // Log transaction
    await admin.from('transactions').insert({
      user_id: user.id,
      type: 'withdrawal',
      amount: -amount,
      currency: currency || profile.currency,
      description: `Withdrawal via ${method} to ${account_number}`,
      flutterwave_ref: reference,
    })

    return NextResponse.json({
      success: true,
      message: `Withdrawal of ${amount} initiated. You'll receive funds shortly.`,
      reference,
    })
  } catch (err: any) {
    console.error('[POST /api/withdraw]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
