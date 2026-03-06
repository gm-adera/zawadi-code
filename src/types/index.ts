export type UserRole = 'client' | 'companion' | 'admin'
export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'disputed' | 'cancelled' | 'refunded'
export type PaymentMode = 'escrow' | 'upfront'
export type EscrowStatus = 'held' | 'released' | 'refunded' | 'disputed'
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type WithdrawalMethod = 'mpesa' | 'bank'
export type CurrencyCode = 'KES' | 'NGN' | 'GHS' | 'UGX' | 'TZS' | 'ZAR'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  username?: string
  avatar_url?: string
  phone?: string
  city?: string
  country: string
  currency: CurrencyCode
  bio?: string
  is_verified: boolean
  is_active: boolean
  wallet_balance: number
  escrow_balance: number
  pending_balance: number
  created_at: string
  updated_at: string
}

export interface CompanionProfile {
  id: string
  user_id: string
  display_name: string
  tagline?: string
  services: string[]
  hourly_rate?: number
  preferred_payment_mode: PaymentMode
  is_online: boolean
  total_bookings: number
  rating: number
  rating_count: number
  age?: number
  height?: string
  languages: string[]
  photos: string[]
  created_at: string
  updated_at: string
  // joined
  profile?: Profile
}

export interface Booking {
  id: string
  client_id: string
  companion_id: string
  status: BookingStatus
  payment_mode: PaymentMode
  pickup_location: string
  meeting_time: string
  transport_amount: number
  currency: CurrencyCode
  message?: string
  flutterwave_tx_ref?: string
  flutterwave_tx_id?: string
  payment_verified: boolean
  created_at: string
  accepted_at?: string
  completed_at?: string
  cancelled_at?: string
  updated_at: string
  // joined
  client?: Profile
  companion?: Profile
  escrow?: EscrowRecord
}

export interface EscrowRecord {
  id: string
  booking_id: string
  client_id: string
  companion_id: string
  amount: number
  currency: CurrencyCode
  status: EscrowStatus
  payment_mode: PaymentMode
  released_by?: string
  released_at?: string
  release_note?: string
  disputed_by?: string
  disputed_at?: string
  dispute_reason?: string
  dispute_resolution?: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  booking_id?: string
  escrow_id?: string
  type: string
  amount: number
  currency: CurrencyCode
  balance_after?: number
  description?: string
  flutterwave_ref?: string
  created_at: string
}

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  currency: CurrencyCode
  method: WithdrawalMethod
  status: WithdrawalStatus
  account_number?: string
  account_name?: string
  bank_code?: string
  flutterwave_transfer_id?: string
  failure_reason?: string
  created_at: string
  processed_at?: string
}

// Currency display helpers
export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  KES: 'KES', NGN: '₦', GHS: 'GHS', UGX: 'UGX', TZS: 'TZS', ZAR: 'R'
}

export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  KES: 'Kenyan Shilling',
  NGN: 'Nigerian Naira',
  GHS: 'Ghanaian Cedi',
  UGX: 'Ugandan Shilling',
  TZS: 'Tanzanian Shilling',
  ZAR: 'South African Rand',
}

export const FLUTTERWAVE_COUNTRY: Record<CurrencyCode, string> = {
  KES: 'KE', NGN: 'NG', GHS: 'GH', UGX: 'UG', TZS: 'TZ', ZAR: 'ZA'
}
