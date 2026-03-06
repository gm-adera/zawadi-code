'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LogOut, Wallet, TrendingUp, Settings, Download, Camera } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'
import { Booking, CURRENCY_SYMBOLS } from '@/types'
import PhotoUploader from '@/components/companion/PhotoUploader'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

type Tab = 'requests' | 'earnings' | 'photos' | 'withdraw' | 'settings'

const DEMO_REQUESTS: Booking[] = [
  { id:'r1', client_id:'cl1', companion_id:'cp1', status:'pending', payment_mode:'escrow', pickup_location:'Nairobi CBD, Tom Mboya St', meeting_time: new Date(Date.now()+7200000).toISOString(), transport_amount:1200, currency:'KES', payment_verified:true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), client:{ id:'cl1', role:'client', full_name:'Kwame M.', city:'Nairobi', country:'KE', currency:'KES', is_verified:false, is_active:true, wallet_balance:0, escrow_balance:0, pending_balance:0, created_at:'', updated_at:'' } },
  { id:'r2', client_id:'cl2', companion_id:'cp1', status:'pending', payment_mode:'escrow', pickup_location:'Westlands, ABC Place', meeting_time: new Date(Date.now()+172800000).toISOString(), transport_amount:600, currency:'KES', payment_verified:true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), client:{ id:'cl2', role:'client', full_name:'Chidi A.', city:'Nairobi', country:'KE', currency:'KES', is_verified:false, is_active:true, wallet_balance:0, escrow_balance:0, pending_balance:0, created_at:'', updated_at:'' } },
]

export default function CompanionDashboard() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [tab, setTab] = useState<Tab>('requests')
  const [requests, setRequests] = useState<Booking[]>(DEMO_REQUESTS)
  const [profile, setProfile] = useState<any>(null)
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', phone: '', method: 'mpesa' })
  const [withdrawing, setWithdrawing] = useState(false)
  const [payMode, setPayMode] = useState<'escrow' | 'upfront'>('escrow')
  const [publicPhotos, setPublicPhotos] = useState<string[]>([])
  const [privatePhotoCount, setPrivatePhotoCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').select('*').eq('id', data.user.id).single()
          .then(({ data: p }) => { if (p) setProfile(p) })
        fetch('/api/bookings?role=companion').then(r => r.json())
          .then(d => { if (d.bookings?.length > 0) setRequests(d.bookings.filter((b: Booking) => b.status === 'pending')) })
      }
    })
  }, [])

  const respondToBooking = async (bookingId: string, action: 'accept_booking' | 'decline_booking') => {
    const res = await fetch('/api/escrow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, booking_id: bookingId }),
    })
    const data = await res.json()
    toast[data.success ? 'success' : 'error'](data.message || data.error)
    if (data.success) setRequests(prev => prev.filter(r => r.id !== bookingId))
  }

  const handleWithdraw = async () => {
    if (!withdrawForm.amount || !withdrawForm.phone) {
      toast.error('Please fill in all fields')
      return
    }
    setWithdrawing(true)
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(withdrawForm.amount),
          method: withdrawForm.method,
          account_number: withdrawForm.phone,
          account_name: profile?.full_name,
          currency: profile?.currency || 'KES',
        }),
      })
      const data = await res.json()
      toast[data.success ? 'success' : 'error'](data.message || data.error)
      if (data.success && profile) {
        setProfile((p: any) => ({ ...p, wallet_balance: p.wallet_balance - parseFloat(withdrawForm.amount) }))
        setWithdrawForm(f => ({ ...f, amount: '' }))
      }
    } catch {
      toast.error('Withdrawal failed')
    } finally {
      setWithdrawing(false)
    }
  }

  const sym = CURRENCY_SYMBOLS[profile?.currency || 'KES']

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-8 py-5 flex-wrap gap-3"
        style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))' }}>🌹</div>
          <div>
            <div className="font-semibold">{profile?.full_name || 'Companion'}</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Companion · {profile?.city || 'Africa'} ⭐ 4.9</div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid var(--border)' }}>
            <Wallet size={15} style={{ color: 'var(--gold)' }}/>
            <div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Available</div>
              <div className="font-bold text-sm" style={{ color: 'var(--gold)' }}>{sym} {(profile?.wallet_balance || 18400).toLocaleString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(232,93,38,0.08)', border: '1px solid rgba(232,93,38,0.2)' }}>
            <div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>In Escrow</div>
              <div className="font-bold text-sm" style={{ color: 'var(--accent)' }}>{sym} {(profile?.escrow_balance || 1200).toLocaleString()}</div>
            </div>
          </div>
          <button onClick={() => { supabase.auth.signOut(); router.push('/') }}
            className="p-2 rounded-full" style={{ color: 'var(--muted)' }}>
            <LogOut size={18}/>
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="grid grid-cols-5 gap-1 rounded-xl p-1 mb-6" style={{ background: 'var(--card)' }}>
          {([['requests','📥'], ['earnings','💰'], ['photos','📸'], ['withdraw','📲'], ['settings','⚙️']] as const).map(([t, icon]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${tab===t ? 'bg-gold text-deep' : ''}`}
              style={tab !== t ? { color: 'var(--muted)', background: 'transparent' } : {}}>
              {icon}
            </button>
          ))}
        </div>

        {/* Requests */}
        {tab === 'requests' && (
          <div className="space-y-4">
            {requests.length === 0 && (
              <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
                <div className="text-5xl mb-4">💤</div>
                <p>No pending requests right now.</p>
              </div>
            )}
            {requests.map(r => (
              <div key={r.id} className="zawadi-card p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold">👤 {r.client?.full_name} — Transport Request</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      📍 {r.pickup_location} · {new Date(r.meeting_time).toLocaleString()}
                    </div>
                  </div>
                  <div className="font-bold" style={{ color: 'var(--gold)' }}>
                    {CURRENCY_SYMBOLS[r.currency]} {r.transport_amount.toLocaleString()}
                  </div>
                </div>
                <div className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Client sent <strong style={{ color: 'var(--gold)' }}>{CURRENCY_SYMBOLS[r.currency]} {r.transport_amount.toLocaleString()}</strong> transport money.
                  Funds are in escrow — held until you complete the meetup and client releases.
                  {r.payment_mode === 'upfront' && ' (Upfront mode — goes to your pending wallet on accept.)'}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => respondToBooking(r.id, 'accept_booking')}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#2ECC71' }}>
                    ✅ Accept
                  </button>
                  <button onClick={() => respondToBooking(r.id, 'decline_booking')}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(231,76,60,0.12)', color: '#E74C3C', border: '1px solid rgba(231,76,60,0.3)' }}>
                    ❌ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Earnings */}
        {tab === 'earnings' && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { value: `${sym} ${(profile?.wallet_balance || 18400).toLocaleString()}`, label: 'Total Earned' },
                { value: '24', label: 'Bookings' },
                { value: '4.9 ⭐', label: 'Rating' },
              ].map(s => (
                <div key={s.label} className="zawadi-card p-5 text-center">
                  <div className="font-playfair text-xl font-bold" style={{ color: 'var(--gold)' }}>{s.value}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className="zawadi-card p-5">
              <h3 className="font-semibold mb-4">💰 Recent Earnings</h3>
              {[
                { label: 'Released by Kwame M.', date: 'Today', amt: `+${sym} 1,200`, color: '#2ECC71' },
                { label: 'In Escrow — Chidi A.', date: 'Pending', amt: `${sym} 600`, color: 'var(--gold)' },
                { label: 'Released by Ola B.', date: '3 days ago', amt: `+${sym} 900`, color: '#2ECC71' },
              ].map(tx => (
                <div key={tx.label} className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="text-sm font-medium">{tx.label}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{tx.date}</div>
                  </div>
                  <div className="font-semibold text-sm" style={{ color: tx.color }}>{tx.amt}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Photos */}
        {tab === 'photos' && (
          <div className="zawadi-card p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Camera size={16}/> Manage Photos</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              Public photos are visible to everyone. Private &quot;one real&quot; photos are only shown to clients who book you.
            </p>
            <PhotoUploader
              publicPhotos={publicPhotos}
              privatePhotos={[]}
              privatePhotoCount={privatePhotoCount}
              onUpdate={(pub, privCount) => {
                setPublicPhotos(pub)
                setPrivatePhotoCount(privCount)
              }}
            />
          </div>
        )}

        {/* Withdraw */}
        {tab === 'withdraw' && (
          <div className="zawadi-card p-6">
            <h3 className="font-semibold mb-5 flex items-center gap-2"><Download size={16}/> Withdraw Earnings</h3>
            <div className="flex gap-3 mb-5">
              {[['mpesa','📱 M-Pesa'], ['bank','🏦 Bank'], ['chipper','💛 Chipper']].map(([m, label]) => (
                <button key={m} onClick={() => setWithdrawForm(f => ({ ...f, method: m }))}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    border: `1.5px solid ${withdrawForm.method === m ? 'var(--gold)' : 'var(--border)'}`,
                    background: withdrawForm.method === m ? 'rgba(201,168,76,0.08)' : 'transparent',
                    color: withdrawForm.method === m ? 'var(--gold)' : 'var(--muted)',
                  }}>
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>
                  {withdrawForm.method === 'mpesa' ? 'M-Pesa Number' : 'Account Number'}
                </label>
                <input className="zawadi-input" placeholder={withdrawForm.method === 'mpesa' ? '0712 345 678' : 'Account number'}
                  value={withdrawForm.phone} onChange={e => setWithdrawForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>Amount ({sym})</label>
                <input className="zawadi-input" type="number" placeholder="e.g. 5000"
                  value={withdrawForm.amount} onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
            <div className="rounded-xl p-4 my-4 text-sm" style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)', color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--gold)' }}>Available:</strong> {sym} {(profile?.wallet_balance || 18400).toLocaleString()} &nbsp;·&nbsp;
              <strong style={{ color: 'var(--accent)' }}>In Escrow:</strong> {sym} {(profile?.escrow_balance || 1200).toLocaleString()} (client must release)
            </div>
            <button onClick={handleWithdraw} disabled={withdrawing}
              className="btn-gold w-full py-3.5 text-base rounded-xl">
              {withdrawing ? 'Processing...' : 'Withdraw Now →'}
            </button>
          </div>
        )}

        {/* Settings */}
        {tab === 'settings' && (
          <div className="zawadi-card p-6">
            <h3 className="font-semibold mb-5">⚙️ Payment Preferences</h3>
            <div className="mb-4">
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Choose your preferred default payment mode for incoming bookings.</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'escrow', icon: '🔐', label: 'Escrow Mode', sub: 'Client releases after meetup. Builds trust.' },
                  { key: 'upfront', icon: '⚡', label: 'Upfront Mode', sub: 'Goes to pending wallet. Client still releases.' },
                ].map(({ key, icon, label, sub }) => (
                  <button key={key} onClick={() => setPayMode(key as any)}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      border: `1.5px solid ${payMode === key ? 'var(--gold)' : 'var(--border)'}`,
                      background: payMode === key ? 'rgba(201,168,76,0.08)' : 'transparent',
                    }}>
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => toast.success('Payment preferences saved!')} className="btn-gold w-full py-3 rounded-xl">
              Save Preferences
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
