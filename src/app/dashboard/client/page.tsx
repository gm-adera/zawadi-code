'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LogOut, Wallet, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'
import { Booking, CURRENCY_SYMBOLS } from '@/types'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

type Tab = 'bookings' | 'escrow' | 'history'

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:   { label: '⏳ Pending',   cls: 'badge-pending' },
  accepted:  { label: '🔐 In Escrow', cls: 'badge-held' },
  completed: { label: '✅ Completed', cls: 'badge-released' },
  disputed:  { label: '⚠️ Disputed',  cls: 'badge-disputed' },
  declined:  { label: '❌ Declined',  cls: 'badge-disputed' },
  cancelled: { label: '↩️ Cancelled', cls: 'badge-disputed' },
}

// Demo bookings
const DEMO_BOOKINGS: Booking[] = [
  { id:'b1', client_id:'c1', companion_id:'cp1', status:'accepted', payment_mode:'escrow', pickup_location:'Nairobi CBD, Tom Mboya St', meeting_time: new Date(Date.now()+7200000).toISOString(), transport_amount:1200, currency:'KES', payment_verified:true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), companion:{ id:'cp1', role:'companion', full_name:'Amara Osei', city:'Nairobi', country:'KE', currency:'KES', is_verified:true, is_active:true, wallet_balance:0, escrow_balance:0, pending_balance:0, created_at:'', updated_at:'' } },
  { id:'b2', client_id:'c1', companion_id:'cp2', status:'pending', payment_mode:'escrow', pickup_location:'Lagos Island, Broad St', meeting_time: new Date(Date.now()+86400000).toISOString(), transport_amount:8500, currency:'NGN', payment_verified:true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), companion:{ id:'cp2', role:'companion', full_name:'Zuri Adaeze', city:'Lagos', country:'NG', currency:'NGN', is_verified:true, is_active:true, wallet_balance:0, escrow_balance:0, pending_balance:0, created_at:'', updated_at:'' } },
]

export default function ClientDashboard() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [tab, setTab] = useState<Tab>('bookings')
  const [bookings, setBookings] = useState<Booking[]>(DEMO_BOOKINGS)
  const [profile, setProfile] = useState<any>(null)
  const [releasing, setReleasing] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').select('*').eq('id', data.user.id).single()
          .then(({ data: p }) => { if (p) setProfile(p) })
        fetch('/api/bookings?role=client').then(r => r.json())
          .then(d => { if (d.bookings?.length > 0) setBookings(d.bookings) })
      }
    })
  }, [])

  const releaseEscrow = async (bookingId: string) => {
    setReleasing(bookingId)
    try {
      const res = await fetch('/api/escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'release', booking_id: bookingId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'completed' } : b))
      } else {
        toast.error(data.error)
      }
    } catch (err) {
      toast.error('Failed to release escrow')
    } finally {
      setReleasing(null)
    }
  }

  const disputeEscrow = async (bookingId: string) => {
    const reason = prompt('Please describe your dispute:')
    if (!reason) return
    const res = await fetch('/api/escrow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dispute', booking_id: bookingId, dispute_reason: reason }),
    })
    const data = await res.json()
    toast[data.success ? 'success' : 'error'](data.message || data.error)
    if (data.success) setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'disputed' } : b))
  }

  const active = bookings.filter(b => ['pending','accepted'].includes(b.status))
  const history = bookings.filter(b => ['completed','cancelled','declined','refunded'].includes(b.status))

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-8 py-5 flex-wrap gap-4"
        style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))' }}>
            {profile?.full_name?.[0] || '👤'}
          </div>
          <div>
            <div className="font-semibold">{profile?.full_name || 'Client'}</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Client · {profile?.city || 'Africa'}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid var(--border)' }}>
            <Wallet size={16} style={{ color: 'var(--gold)' }}/>
            <div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Wallet</div>
              <div className="font-bold" style={{ color: 'var(--gold)' }}>
                {CURRENCY_SYMBOLS[profile?.currency || 'KES']} {(profile?.wallet_balance || 0).toLocaleString()}
              </div>
            </div>
          </div>
          <Link href="/browse" className="btn-gold text-sm px-4 py-2 rounded-full">+ New Booking</Link>
          <button onClick={() => { supabase.auth.signOut(); router.push('/') }}
            className="p-2 rounded-full transition-colors" style={{ color: 'var(--muted)' }}>
            <LogOut size={18}/>
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-1 mb-6" style={{ background: 'var(--card)' }}>
          {([['bookings','📋 Active'], ['escrow','🔐 Escrow'], ['history','📖 History']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab===t ? 'bg-gold text-deep' : ''}`}
              style={tab !== t ? { color: 'var(--muted)', background: 'transparent' } : {}}>
              {label}
            </button>
          ))}
        </div>

        {/* Active Bookings */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            {active.length === 0 && (
              <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
                <div className="text-5xl mb-4">🔍</div>
                <p>No active bookings. <Link href="/browse" style={{ color: 'var(--gold)' }}>Browse companions</Link></p>
              </div>
            )}
            {active.map(b => {
              const badge = STATUS_BADGE[b.status] || { label: b.status, cls: 'badge-pending' }
              return (
                <div key={b.id} className="zawadi-card p-5">
                  <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                    <div>
                      <div className="font-semibold">🌹 {b.companion?.full_name}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>📍 {b.pickup_location}</div>
                    </div>
                    <span className={badge.cls}>{badge.label}</span>
                  </div>
                  <div className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--muted)' }}>
                    You sent <strong style={{ color: 'var(--gold)' }}>{CURRENCY_SYMBOLS[b.currency]} {b.transport_amount.toLocaleString()}</strong> transport fee.
                    {b.status === 'accepted' && ' Funds are locked in escrow — release after meetup.'}
                    {b.status === 'pending' && ' Waiting for companion to accept.'}
                  </div>
                  {b.status === 'accepted' && (
                    <div className="flex gap-3">
                      <button onClick={() => releaseEscrow(b.id)} disabled={releasing === b.id}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
                        style={{ background: 'var(--zawadi-green, #2ECC71)' }}>
                        <CheckCircle size={15}/>
                        {releasing === b.id ? 'Releasing...' : '✅ Release Funds'}
                      </button>
                      <button onClick={() => disputeEscrow(b.id)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                        style={{ background: 'rgba(231,76,60,0.12)', color: '#E74C3C', border: '1px solid rgba(231,76,60,0.3)' }}>
                        <AlertTriangle size={14} className="inline mr-1"/>⚠️ Dispute
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Escrow Summary */}
        {tab === 'escrow' && (
          <div className="zawadi-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><span>🔐</span> Escrow Summary</h3>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="rounded-xl p-4 text-center" style={{ background: 'var(--card2)' }}>
                <div className="font-playfair text-2xl font-bold" style={{ color: 'var(--gold)' }}>
                  {active.filter(b => b.status === 'accepted').reduce((s, b) => s + b.transport_amount, 0).toLocaleString()}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>KES Held in Escrow</div>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: 'var(--card2)' }}>
                <div className="font-playfair text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                  {active.filter(b => b.status === 'pending').length}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Pending Acceptance</div>
              </div>
            </div>
            <div className="rounded-xl p-4 text-sm leading-relaxed"
              style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)', color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--gold)' }}>Your money is always safe.</strong><br/>
              Funds are held in a neutral Zawadi escrow vault and only released when <em>you</em> confirm satisfaction. Open a dispute anytime.
            </div>
          </div>
        )}

        {/* History */}
        {tab === 'history' && (
          <div className="zawadi-card p-5">
            <h3 className="font-semibold mb-4">📖 Transaction History</h3>
            {history.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No completed bookings yet.</p>
            )}
            {history.map(b => (
              <div key={b.id} className="flex justify-between items-center py-3"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                    style={{ background: b.status === 'completed' ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)' }}>
                    {b.status === 'completed' ? '✅' : '↩️'}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{b.status === 'completed' ? 'Released to' : 'Refunded from'} {b.companion?.full_name}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{new Date(b.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="font-semibold text-sm" style={{ color: b.status === 'completed' ? '#E74C3C' : '#2ECC71' }}>
                  {b.status === 'completed' ? '–' : '+'}{CURRENCY_SYMBOLS[b.currency]} {b.transport_amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
