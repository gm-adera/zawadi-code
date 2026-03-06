'use client'
import { useState } from 'react'
import { X, Lock, Zap, Shield } from 'lucide-react'
import { CompanionProfile, CURRENCY_SYMBOLS, CurrencyCode } from '@/types'
import { generateTxRef } from '@/lib/flutterwave'
import toast from 'react-hot-toast'

interface Props {
  companion: CompanionProfile
  onClose: () => void
}

type Step = 'details' | 'pay' | 'success'

export default function BookingModal({ companion, onClose }: Props) {
  const [step, setStep] = useState<Step>('details')
  const [mode, setMode] = useState<'escrow' | 'upfront'>(companion.preferred_payment_mode)
  const [form, setForm] = useState({
    pickup: '',
    time: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    amount: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const currency = companion.profile?.currency || 'KES'
  const sym = CURRENCY_SYMBOLS[currency]

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handlePayment = async () => {
    if (!form.pickup || !form.amount || !form.time) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    const txRef = generateTxRef()

    try {
      // Dynamically load Flutterwave inline script
      if (!(window as any).FlutterwaveCheckout) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.flutterwave.com/v3.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load Flutterwave'))
          document.head.appendChild(script)
        })
      }

      ;(window as any).FlutterwaveCheckout({
        public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-DEMO',
        tx_ref: txRef,
        amount: parseFloat(form.amount),
        currency,
        payment_options: 'mpesa,mobilemoney,card',
        customer: {
          email: 'client@zawadi.app', // replace with real user email
          phone_number: '',
          name: 'Zawadi Client',
        },
        customizations: {
          title: 'Zawadi Transport Escrow',
          description: `Transport fee for ${companion.display_name} — locked in escrow`,
          logo: '/logo.png',
        },
        callback: async (response: any) => {
          if (response.status === 'successful') {
            // Verify + create booking via API
            const res = await fetch('/api/bookings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                companion_id: companion.user_id,
                pickup_location: form.pickup,
                meeting_time: form.time,
                transport_amount: parseFloat(form.amount),
                currency,
                message: form.message,
                payment_mode: mode,
                flutterwave_tx_id: response.transaction_id,
                flutterwave_tx_ref: txRef,
              }),
            })
            const data = await res.json()
            if (data.success) {
              setStep('success')
            } else {
              toast.error(data.error || 'Booking failed')
            }
          } else {
            toast.error('Payment was not completed')
          }
          setLoading(false)
        },
        onclose: () => setLoading(false),
      })
    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-3xl p-8 relative overflow-y-auto max-h-[90vh]"
        style={{ background: 'var(--dark)', border: '1px solid var(--border)' }}>
        <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <X size={16} />
        </button>

        {step === 'details' && (
          <>
            <h2 className="font-playfair text-2xl font-bold mb-1">Book {companion.display_name}</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Send transport money securely via Zawadi Escrow</p>

            {/* Payment mode toggle */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { key: 'escrow', icon: <Lock size={18}/>, label: 'Escrow Mode', sub: 'You release after meetup' },
                { key: 'upfront', icon: <Zap size={18}/>, label: 'Upfront Mode', sub: 'Instant pending wallet' },
              ].map(({ key, icon, label, sub }) => (
                <button key={key} onClick={() => setMode(key as any)}
                  className="p-4 rounded-xl text-left transition-all"
                  style={{
                    border: `1.5px solid ${mode === key ? 'var(--gold)' : 'var(--border)'}`,
                    background: mode === key ? 'rgba(201,168,76,0.08)' : 'transparent',
                  }}>
                  <div style={{ color: mode === key ? 'var(--gold)' : 'var(--muted)' }} className="mb-1">{icon}</div>
                  <div className="font-semibold text-sm">{label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</div>
                </button>
              ))}
            </div>

            {/* Mode info */}
            <div className="rounded-xl p-4 mb-5 text-sm leading-relaxed"
              style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)', color: 'var(--muted)' }}>
              {mode === 'escrow'
                ? <><strong style={{ color: 'var(--gold)' }}>Escrow Mode (Recommended):</strong> Your money is locked safely in Zawadi vault. Companion gets paid only after <em>you</em> confirm satisfaction.</>
                : <><strong style={{ color: 'var(--gold)' }}>Upfront Mode:</strong> Transport goes to companion&apos;s pending wallet instantly. She can only withdraw after you release it — still protected.</>
              }
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>Pickup Location *</label>
                <input className="zawadi-input" placeholder="e.g. Nairobi CBD, Tom Mboya St" value={form.pickup}
                  onChange={e => update('pickup', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>Meeting Date & Time *</label>
                <input className="zawadi-input" type="datetime-local" value={form.time}
                  onChange={e => update('time', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>Transport Amount ({sym}) *</label>
                <input className="zawadi-input" type="number" placeholder={`e.g. 1200`} value={form.amount}
                  onChange={e => update('amount', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>Message (optional)</label>
                <input className="zawadi-input" placeholder="Any details for the companion..." value={form.message}
                  onChange={e => update('message', e.target.value)} />
              </div>
            </div>

            <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={handlePayment} disabled={loading}
                className="btn-gold w-full py-4 text-base rounded-xl flex items-center justify-center gap-2">
                <Lock size={16}/>
                {loading ? 'Opening payment...' : `Pay ${form.amount ? `${sym}${parseFloat(form.amount).toLocaleString()}` : ''} & Lock in Escrow`}
              </button>
              <p className="text-xs text-center mt-3" style={{ color: 'var(--muted)' }}>
                <Shield size={12} className="inline mr-1"/>
                Powered by Flutterwave · M-Pesa, Card & Mobile Money accepted
              </p>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-6">
            <div className="text-6xl mb-5">🎉</div>
            <h2 className="font-playfair text-2xl font-bold mb-3">Booking Sent!</h2>
            <p className="mb-6 leading-relaxed" style={{ color: 'var(--muted)' }}>
              Your transport money is safely locked in Zawadi Escrow. {companion.display_name} has been notified.
            </p>

            {/* Tracker */}
            <div className="rounded-2xl p-5 mb-6 text-left space-y-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              {[
                { dot: 'done', label: 'Funds locked in escrow', sub: 'Zawadi holds payment safely' },
                { dot: 'active', label: 'Awaiting companion acceptance', sub: `${companion.display_name} has been notified` },
                { dot: 'wait', label: 'Meetup confirmed', sub: 'Pending' },
                { dot: 'wait', label: 'You release payment', sub: 'One tap → funds to companion' },
              ].map(({ dot, label, sub }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                    dot === 'done' ? 'bg-green-500' :
                    dot === 'active' ? 'bg-gold ring-2 ring-gold/30' : 'bg-muted'
                  }`} style={dot === 'active' ? { background: 'var(--gold)' } : dot === 'wait' ? { background: 'var(--muted)' } : {}} />
                  <div>
                    <div className="text-sm font-semibold">{label}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={onClose} className="btn-gold w-full py-3.5 text-base rounded-xl">
              View My Bookings →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
