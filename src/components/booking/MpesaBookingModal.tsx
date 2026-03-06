'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Phone, Lock, Zap, Shield, CheckCircle, Loader, AlertCircle } from 'lucide-react'
import { CompanionProfile } from '@/types'
import { formatMpesaPhone } from '@/lib/mpesa'
import toast from 'react-hot-toast'

interface Props {
  companion: CompanionProfile
  onClose: () => void
  onSuccess?: (bookingId: string) => void
}

type Step = 'details' | 'mpesa-push' | 'waiting' | 'success' | 'failed'

export default function MpesaBookingModal({ companion, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('details')
  const [mode, setMode] = useState<'escrow' | 'upfront'>(companion.preferred_payment_mode)
  const [form, setForm] = useState({
    phone: '',
    amount: '',
    pickup: '',
    time: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [checkoutId, setCheckoutId] = useState('')
  const [pollCount, setPollCount] = useState(0)
  const pollRef = useRef<NodeJS.Timeout>()

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // Poll payment status every 4s after STK push
  useEffect(() => {
    if (step !== 'waiting' || !bookingId) return

    const poll = async () => {
      if (pollCount > 20) { // ~80 seconds timeout
        setStep('failed')
        clearInterval(pollRef.current)
        return
      }
      try {
        const res = await fetch(`/api/mpesa/status?bookingId=${bookingId}&checkoutRequestId=${checkoutId}`)
        const data = await res.json()
        if (data.paid) {
          setStep('success')
          clearInterval(pollRef.current)
          onSuccess?.(bookingId)
        } else if (data.status === 'cancelled') {
          setStep('failed')
          clearInterval(pollRef.current)
        }
        setPollCount(c => c + 1)
      } catch { /* keep polling */ }
    }

    poll()
    pollRef.current = setInterval(poll, 4000)
    return () => clearInterval(pollRef.current)
  }, [step, bookingId])

  const handleSubmit = async () => {
    if (!form.phone || !form.amount || !form.pickup) {
      toast.error('Please fill in all required fields')
      return
    }
    if (parseFloat(form.amount) < 1) {
      toast.error('Minimum amount is KES 1')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formatMpesaPhone(form.phone),
          amount: Math.round(parseFloat(form.amount)),
          companion_id: companion.user_id,
          pickup_location: form.pickup,
          meeting_time: form.time,
          payment_mode: mode,
          message: form.message,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setBookingId(data.bookingId)
      setCheckoutId(data.checkoutRequestId)
      setStep('waiting')
      setPollCount(0)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-3xl p-8 relative overflow-y-auto max-h-[92vh]"
        style={{ background: 'var(--dark)', border: '1px solid var(--border)' }}>

        <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <X size={15}/>
        </button>

        {/* ── STEP: DETAILS ── */}
        {step === 'details' && (
          <>
            <h2 className="font-playfair text-2xl font-bold mb-1">Book {companion.display_name}</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Pay via M-Pesa · Funds locked in escrow</p>

            {/* Payment mode */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { key: 'escrow', icon: <Lock size={17}/>, label: 'Escrow Mode', sub: 'You release after meetup' },
                { key: 'upfront', icon: <Zap size={17}/>, label: 'Upfront Mode', sub: 'Instant pending wallet' },
              ].map(({ key, icon, label, sub }) => (
                <button key={key} onClick={() => setMode(key as any)}
                  className="p-4 rounded-xl text-left transition-all"
                  style={{
                    border: `1.5px solid ${mode === key ? 'var(--gold)' : 'var(--border)'}`,
                    background: mode === key ? 'rgba(201,168,76,0.08)' : 'transparent',
                  }}>
                  <div className="mb-1.5" style={{ color: mode === key ? 'var(--gold)' : 'var(--muted)' }}>{icon}</div>
                  <div className="font-semibold text-sm">{label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</div>
                </button>
              ))}
            </div>

            <div className="rounded-xl p-3.5 mb-5 text-sm leading-relaxed"
              style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.18)', color: 'var(--muted)' }}>
              {mode === 'escrow'
                ? <><strong style={{ color: 'var(--gold)' }}>Escrow (Recommended):</strong> M-Pesa is charged only after you confirm. Companion receives funds only when <em>you tap Release</em>.</>
                : <><strong style={{ color: 'var(--gold)' }}>Upfront:</strong> Transport goes to companion&apos;s pending wallet instantly — she can only withdraw after you confirm meetup.</>}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>
                  <Phone size={12} className="inline mr-1"/>Your M-Pesa Number *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--muted)' }}>+254</span>
                  <input className="zawadi-input pl-14" placeholder="712 345 678" value={form.phone}
                    onChange={e => update('phone', e.target.value)} type="tel" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>Transport Amount (KES) *</label>
                <input className="zawadi-input" type="number" placeholder="e.g. 1200" value={form.amount}
                  onChange={e => update('amount', e.target.value)} />
              </div>
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
                <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>Message (optional)</label>
                <input className="zawadi-input" placeholder="Any details for the companion..." value={form.message}
                  onChange={e => update('message', e.target.value)} />
              </div>
            </div>

            <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={handleSubmit} disabled={loading}
                className="btn-gold w-full py-4 text-base rounded-xl flex items-center justify-center gap-2">
                {loading
                  ? <><Loader size={16} className="animate-spin"/> Sending STK Push...</>
                  : <><Phone size={16}/> Pay KES {form.amount ? parseFloat(form.amount).toLocaleString() : '---'} via M-Pesa</>}
              </button>
              <p className="text-xs text-center mt-3 flex items-center justify-center gap-1" style={{ color: 'var(--muted)' }}>
                <Shield size={12}/>
                M-Pesa STK Push · You&apos;ll get a prompt on your phone
              </p>
            </div>
          </>
        )}

        {/* ── STEP: WAITING FOR PAYMENT ── */}
        {step === 'waiting' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative"
              style={{ background: 'rgba(0,164,81,0.1)', border: '2px solid rgba(0,164,81,0.3)' }}>
              <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(0,164,81,0.1)' }}/>
              <span className="text-3xl">📱</span>
            </div>

            <h2 className="font-playfair text-xl font-bold mb-2">Check Your Phone</h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--muted)' }}>
              An M-Pesa prompt has been sent to<br/>
              <strong style={{ color: 'var(--text)' }}>+254{form.phone.replace(/\D/g, '').replace(/^0/, '').replace(/^254/, '')}</strong><br/>
              Enter your M-Pesa PIN to complete payment.
            </p>

            {/* M-Pesa steps */}
            <div className="rounded-xl p-4 mb-6 text-left space-y-3"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              {[
                { num: '1', text: 'Open the M-Pesa prompt on your phone' },
                { num: '2', text: `Verify amount: KES ${parseFloat(form.amount || '0').toLocaleString()}` },
                { num: '3', text: 'Enter your M-Pesa PIN' },
                { num: '4', text: 'Funds go straight to escrow — not to the companion' },
              ].map(({ num, text }) => (
                <div key={num} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'var(--gold)', color: 'var(--deep)' }}>{num}</div>
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>{text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
              <Loader size={14} className="animate-spin"/>
              Waiting for payment confirmation... ({Math.round(pollCount * 4)}s)
            </div>

            <button onClick={() => setStep('details')} className="mt-4 text-sm underline" style={{ color: 'var(--muted)' }}>
              Cancel
            </button>
          </div>
        )}

        {/* ── STEP: SUCCESS ── */}
        {step === 'success' && (
          <div className="text-center py-6">
            <div className="text-6xl mb-5">🎉</div>
            <h2 className="font-playfair text-2xl font-bold mb-3">Payment Confirmed!</h2>
            <p className="mb-6 leading-relaxed" style={{ color: 'var(--muted)' }}>
              KES {parseFloat(form.amount || '0').toLocaleString()} received via M-Pesa and locked in Zawadi Escrow.
              {companion.display_name} has been notified.
            </p>

            <div className="rounded-2xl p-5 mb-6 text-left space-y-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              {[
                { dot: 'done', label: '✅ M-Pesa payment received', sub: 'Funds locked in Zawadi escrow vault' },
                { dot: 'active', label: '⏳ Awaiting companion acceptance', sub: `${companion.display_name} has been notified` },
                { dot: 'wait', label: '🤝 Meetup happens', sub: 'Pending' },
                { dot: 'wait', label: '💸 You release funds', sub: 'Companion gets paid via M-Pesa' },
              ].map(({ dot, label, sub }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0`}
                    style={{ background: dot === 'done' ? '#2ECC71' : dot === 'active' ? 'var(--gold)' : 'var(--muted)' }}/>
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

        {/* ── STEP: FAILED ── */}
        {step === 'failed' && (
          <div className="text-center py-8">
            <AlertCircle size={56} className="mx-auto mb-4" style={{ color: 'var(--accent)' }}/>
            <h2 className="font-playfair text-xl font-bold mb-3">Payment Not Completed</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              The M-Pesa payment was cancelled or timed out. No money was charged.
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setStep('details'); setPollCount(0) }}
                className="btn-gold flex-1 py-3 rounded-xl">Try Again</button>
              <button onClick={onClose} className="flex-1 py-3 rounded-xl"
                style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
