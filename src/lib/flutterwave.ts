import { CurrencyCode, FLUTTERWAVE_COUNTRY } from '@/types'

// Generate a unique transaction reference
export function generateTxRef(prefix = 'ZAWADI'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
}

// Flutterwave inline payment config for transport money
export function buildFlutterwaveConfig({
  txRef,
  amount,
  currency,
  email,
  phone,
  name,
  bookingId,
  onSuccess,
  onClose,
}: {
  txRef: string
  amount: number
  currency: CurrencyCode
  email: string
  phone: string
  name: string
  bookingId: string
  onSuccess: (data: FlutterwaveResponse) => void
  onClose: () => void
}) {
  return {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
    tx_ref: txRef,
    amount,
    currency,
    country: FLUTTERWAVE_COUNTRY[currency],
    payment_options: 'mobilemoneyghana,mobilemoneyrwanda,mobilemoneyuganda,mobilemoneyzambia,mpesa,card',
    customer: { email, phone_number: phone, name },
    customizations: {
      title: 'Zawadi Transport Escrow',
      description: `Transport fee locked in Zawadi escrow — booking ${bookingId}`,
      logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
    },
    meta: { booking_id: bookingId, type: 'transport_escrow' },
    callback: onSuccess,
    onclose: onClose,
  }
}

// Verify a Flutterwave transaction from the server
export async function verifyFlutterwaveTransaction(txId: string): Promise<{
  success: boolean
  data?: FlutterwaveVerifyData
  error?: string
}> {
  try {
    const res = await fetch(`https://api.flutterwave.com/v3/transactions/${txId}/verify`, {
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    const json = await res.json()
    if (json.status === 'success' && json.data.status === 'successful') {
      return { success: true, data: json.data }
    }
    return { success: false, error: json.message || 'Verification failed' }
  } catch (err) {
    return { success: false, error: 'Network error during verification' }
  }
}

// Initiate a Flutterwave transfer (payout to companion)
export async function initiateFlutterwaveTransfer({
  accountNumber,
  accountBank,
  amount,
  currency,
  narration,
  reference,
  meta,
}: {
  accountNumber: string
  accountBank: string
  amount: number
  currency: CurrencyCode
  narration: string
  reference: string
  meta?: Record<string, string>
}): Promise<{ success: boolean; transferId?: string; error?: string }> {
  try {
    const res = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_bank: accountBank,
        account_number: accountNumber,
        amount,
        narration,
        currency,
        reference,
        meta,
      }),
    })
    const json = await res.json()
    if (json.status === 'success') {
      return { success: true, transferId: json.data.id }
    }
    return { success: false, error: json.message }
  } catch (err) {
    return { success: false, error: 'Transfer initiation failed' }
  }
}

export interface FlutterwaveResponse {
  transaction_id: number
  tx_ref: string
  flw_ref: string
  status: string
  currency: string
  amount: number
}

export interface FlutterwaveVerifyData {
  id: number
  tx_ref: string
  flw_ref: string
  status: string
  amount: number
  currency: string
  customer: { email: string; phone_number: string; name: string }
}
