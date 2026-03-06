/**
 * ZAWADI — M-Pesa Daraja API Integration
 * Safaricom M-Pesa STK Push (Lipa Na M-Pesa Online)
 * Docs: https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
 */

export interface MpesaStkPushParams {
  phone: string          // 254XXXXXXXXX format
  amount: number         // KES amount (integer)
  accountRef: string     // e.g. "ZAWADI-BK001"
  description: string    // e.g. "Transport escrow for Amara"
  callbackUrl?: string   // override default callback
}

export interface MpesaStkResponse {
  success: boolean
  checkoutRequestId?: string
  merchantRequestId?: string
  responseCode?: string
  responseDescription?: string
  customerMessage?: string
  error?: string
}

export interface MpesaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number      // 0 = success
      ResultDesc: string
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>
      }
    }
  }
}

/** Format phone to 254XXXXXXXXX */
export function formatMpesaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return '254' + digits.slice(1)
  if (digits.startsWith('+254')) return digits.slice(1)
  if (digits.startsWith('254')) return digits
  return '254' + digits
}

/** Get M-Pesa OAuth access token */
async function getMpesaToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY!
  const secret = process.env.MPESA_CONSUMER_SECRET!
  const credentials = Buffer.from(`${key}:${secret}`).toString('base64')

  const isSandbox = process.env.MPESA_ENV !== 'production'
  const url = isSandbox
    ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'

  const res = await fetch(url, {
    headers: { Authorization: `Basic ${credentials}` },
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Failed to get M-Pesa token: ' + JSON.stringify(data))
  return data.access_token
}

/** Generate M-Pesa password (Base64 of shortcode+passkey+timestamp) */
function getMpesaPassword(timestamp: string): string {
  const shortcode = process.env.MPESA_SHORTCODE!
  const passkey = process.env.MPESA_PASSKEY!
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')
}

/** Get current timestamp in YYYYMMDDHHmmss format */
function getMpesaTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14)
}

/** Initiate M-Pesa STK Push payment */
export async function initiateMpesaStkPush(params: MpesaStkPushParams): Promise<MpesaStkResponse> {
  try {
    const token = await getMpesaToken()
    const timestamp = getMpesaTimestamp()
    const password = getMpesaPassword(timestamp)
    const isSandbox = process.env.MPESA_ENV !== 'production'
    const shortcode = process.env.MPESA_SHORTCODE!

    const callbackUrl = params.callbackUrl ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`

    const body = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(params.amount),
      PartyA: formatMpesaPhone(params.phone),
      PartyB: shortcode,
      PhoneNumber: formatMpesaPhone(params.phone),
      CallBackURL: callbackUrl,
      AccountReference: params.accountRef.slice(0, 12), // max 12 chars
      TransactionDesc: params.description.slice(0, 13), // max 13 chars
    }

    const url = isSandbox
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (data.ResponseCode === '0') {
      return {
        success: true,
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
        responseCode: data.ResponseCode,
        responseDescription: data.ResponseDescription,
        customerMessage: data.CustomerMessage,
      }
    }

    return {
      success: false,
      error: data.errorMessage || data.ResponseDescription || 'STK Push failed',
    }
  } catch (err: any) {
    console.error('[M-Pesa STK Push error]', err)
    return { success: false, error: err.message }
  }
}

/** Query STK Push transaction status */
export async function queryMpesaStkStatus(checkoutRequestId: string): Promise<{
  success: boolean
  resultCode?: number
  resultDesc?: string
  error?: string
}> {
  try {
    const token = await getMpesaToken()
    const timestamp = getMpesaTimestamp()
    const password = getMpesaPassword(timestamp)
    const isSandbox = process.env.MPESA_ENV !== 'production'
    const shortcode = process.env.MPESA_SHORTCODE!

    const url = isSandbox
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
      : 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    })

    const data = await res.json()
    return {
      success: data.ResultCode === 0 || data.ResultCode === '0',
      resultCode: parseInt(data.ResultCode),
      resultDesc: data.ResultDesc,
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/** Parse M-Pesa callback metadata into a usable object */
export function parseMpesaCallback(body: MpesaCallbackBody): {
  success: boolean
  resultCode: number
  resultDesc: string
  amount?: number
  mpesaReceiptNumber?: string
  transactionDate?: string
  phoneNumber?: string
  checkoutRequestId: string
  merchantRequestId: string
} {
  const cb = body.Body.stkCallback
  const meta = cb.CallbackMetadata?.Item || []

  const get = (name: string) => meta.find(i => i.Name === name)?.Value

  return {
    success: cb.ResultCode === 0,
    resultCode: cb.ResultCode,
    resultDesc: cb.ResultDesc,
    checkoutRequestId: cb.CheckoutRequestID,
    merchantRequestId: cb.MerchantRequestID,
    amount: get('Amount') as number | undefined,
    mpesaReceiptNumber: get('MpesaReceiptNumber') as string | undefined,
    transactionDate: get('TransactionDate') as string | undefined,
    phoneNumber: get('PhoneNumber') as string | undefined,
  }
}
