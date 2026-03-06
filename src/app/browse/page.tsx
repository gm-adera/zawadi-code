'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Star, Wifi, WifiOff, Search } from 'lucide-react'
import { CompanionProfile, CURRENCY_SYMBOLS } from '@/types'
import MpesaBookingModal from '@/components/booking/MpesaBookingModal'
import PhotoGallery from '@/components/companion/PhotoGallery'

const DEMO_COMPANIONS: CompanionProfile[] = [
  { id:'1', user_id:'u1', display_name:'Amara Osei', tagline:'Refined, elegant companionship', services:['Dinner Dates','Travel','Events'], hourly_rate:3000, preferred_payment_mode:'escrow', is_online:true, total_bookings:48, rating:4.9, rating_count:32, languages:['English','Swahili'], photos:[], created_at:'', updated_at:'', profile:{ id:'u1', role:'companion', full_name:'Amara Osei', city:'Nairobi', country:'KE', currency:'KES', is_verified:true, is_active:true, wallet_balance:0, escrow_balance:0, pending_balance:0, created_at:'', updated_at:'' } },
  { id:'2', user_id:'u2', display_name:'Zuri Adaeze', tagline:'Lagos finest, unforgettable vibes', services:['City Tours','Nightlife','Upscale'], hourly_rate:25000, preferred_payment_mode:'escrow', is_online:true, total_bookings:61, rating:4.8, rating_count:41, languages:['English','Yoruba'], photos:[], created_at:'', updated_at:'', profile:{ id:'u2', role:'companion', full_name:'Zuri Adaeze', city:'Lagos', country:'NG', currency:'NGN', is_verified:true, is_active:true, wallet_balance:0, escrow_balance:0, pending_balance:0, created_at:'', updated_at:'' } },
  { id:'3', user_id:'u3', display_name:'Fatima Diallo', tagline:'Bilingual luxury companion', services:['Luxury','Private','Business'], hourly_rate:400, preferred_payment_mode:'upfront', is_online:false, total_bookings:29, rating:4.7, rating_count:19, languages:['English','French','Twi'], photos:[], created_at:'', updated_at:'', profile:{ id:'u3', role:'companion', full_name:'Fatima Diallo', city:'Accra', country:'GH', currency:'GHS', is_verified:true, is_active:true, wallet_balance:0, escrow_balance:0, pending_balance:0, created_at:'', updated_at:'' } },
  { id:'4', user_id:'u4', display_name:'Nia Kamau', tagline:'Adventure awaits with me', services:['Outdoor','Sports','Cultural'], hourly_rate:80000, preferred_payment_mode:'escrow', is_online:true, total_bookings:33, rating:4.9, rating_count:28, languages:['English','Luganda'], photos:[], created_at:'', updated_at:'', profile:{ id:'u4', role:'companion', full_name:'Nia Kamau', city:'Kampala', country:'UG', currency:'UGX', is_verified:false, is_active:true, wallet_balance:0, escrow_balance:0, pending_balance:0, created_at:'', updated_at:'' } },
  { id:'5', user_id:'u5', display_name:'Imani Okonkwo', tagline:'Corporate events & formal occasions', services:['Business','Formal','Bilingual'], hourly_rate:4500, preferred_payment_mode:'escrow', is_online:true, total_bookings:55, rating:5.0, rating_count:22, languages:['English','Swahili','French'], photos:[], created_at:'', updated_at:'', profile:{ id:'u5', role:'companion', full_name:'Imani Okonkwo', city:'Nairobi', country:'KE', currency:'KES', is_verified:true, is_active:true, wallet_balance:0, escrow_balance:0, pending_balance:0, created_at:'', updated_at:'' } },
  { id:'6', user_id:'u6', display_name:'Yetunde Balogun', tagline:'Exclusive & private experiences', services:['Luxury','Private','VIP'], hourly_rate:45000, preferred_payment_mode:'upfront', is_online:false, total_bookings:18, rating:4.8, rating_count:14, languages:['English','Hausa'], photos:[], created_at:'', updated_at:'', profile:{ id:'u6', role:'companion', full_name:'Yetunde Balogun', city:'Abuja', country:'NG', currency:'NGN', is_verified:true, is_active:true, wallet_balance:0, escrow_balance:0, pending_balance:0, created_at:'', updated_at:'' } },
  { id:'7', user_id:'u7', display_name:'Aisha Mensah', tagline:'Your Kumasi cultural guide', services:['Cultural','Local Guide','Dinner'], hourly_rate:300, preferred_payment_mode:'escrow', is_online:true, total_bookings:24, rating:4.6, rating_count:17, languages:['English','Twi','Fante'], photos:[], created_at:'', updated_at:'', profile:{ id:'u7', role:'companion', full_name:'Aisha Mensah', city:'Kumasi', country:'GH', currency:'GHS', is_verified:false, is_active:true, wallet_balance:0, escrow_balance:0, pending_balance:0, created_at:'', updated_at:'' } },
  { id:'8', user_id:'u8', display_name:'Thandiwe Dube', tagline:'Joburg sophistication at its finest', services:['Upscale','Events','Sophisticated'], hourly_rate:1200, preferred_payment_mode:'escrow', is_online:true, total_bookings:39, rating:4.9, rating_count:30, languages:['English','Zulu','Xhosa'], photos:[], created_at:'', updated_at:'', profile:{ id:'u8', role:'companion', full_name:'Thandiwe Dube', city:'Johannesburg', country:'ZA', currency:'ZAR', is_verified:true, is_active:true, wallet_balance:0, escrow_balance:0, pending_balance:0, created_at:'', updated_at:'' } },
]

const EMOJIS = ['🌹','💫','🌺','🦋','✨','🌸','💎','🌟']
const FLAG: Record<string,string> = { KE:'🇰🇪', NG:'🇳🇬', GH:'🇬🇭', UG:'🇺🇬', TZ:'🇹🇿', ZA:'🇿🇦' }

type ViewMode = 'grid' | 'profile'

export default function BrowsePage() {
  const [companions, setCompanions] = useState<CompanionProfile[]>(DEMO_COMPANIONS)
  const [selected, setSelected] = useState<CompanionProfile | null>(null)
  const [viewing, setViewing] = useState<CompanionProfile | null>(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/companions').then(r => r.json()).then(d => {
      if (d.companions?.length > 0) setCompanions(d.companions)
    }).catch(() => {})
  }, [])

  const filtered = companions
    .filter(c => filter === 'online' ? c.is_online : true)
    .filter(c => search === '' || c.display_name.toLowerCase().includes(search.toLowerCase()) ||
      c.profile?.city?.toLowerCase().includes(search.toLowerCase()))

  // PROFILE VIEW
  if (viewing) {
    const idx = companions.indexOf(viewing)
    return (
      <main className="min-h-screen">
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-6 py-4"
          style={{ background: 'rgba(13,10,6,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setViewing(null)} className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
            ← Back
          </button>
          <div className="font-playfair text-xl font-bold" style={{ color: 'var(--gold)' }}>Zawadi<span style={{ color: 'var(--accent)' }}>.</span></div>
        </nav>
        <div className="max-w-2xl mx-auto px-4 pt-24 pb-20">
          <div className="zawadi-card overflow-hidden">
            {/* Photo gallery */}
            <div className="p-5">
              <PhotoGallery
                publicPhotos={viewing.photos}
                privatePhotoCount={(viewing as any).private_photos?.length || 1}
                companionId={viewing.user_id}
                companionName={viewing.display_name}
                hasBooking={false}
              />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3 flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-playfair text-2xl font-bold">{viewing.display_name}</h1>
                    {viewing.profile?.is_verified && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--gold)', color: 'var(--deep)' }}>✓</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm mt-1" style={{ color: 'var(--muted)' }}>
                    <MapPin size={13}/> {viewing.profile?.city} {FLAG[viewing.profile?.country || '']}
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${viewing.is_online ? 'text-green-400' : 'text-gray-500'}`}
                  style={{ background: viewing.is_online ? 'rgba(46,204,113,0.12)' : 'rgba(100,100,100,0.12)' }}>
                  {viewing.is_online ? <Wifi size={12}/> : <WifiOff size={12}/>}
                  {viewing.is_online ? 'Online Now' : 'Offline'}
                </div>
              </div>

              {viewing.tagline && <p className="mb-4 italic" style={{ color: 'var(--muted)' }}>"{viewing.tagline}"</p>}

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--card2)' }}>
                  <div className="font-bold" style={{ color: 'var(--gold)' }}>{viewing.rating.toFixed(1)} ⭐</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{viewing.rating_count} reviews</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--card2)' }}>
                  <div className="font-bold" style={{ color: 'var(--gold)' }}>{viewing.total_bookings}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Bookings</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--card2)' }}>
                  <div className="font-bold" style={{ color: 'var(--gold)' }}>
                    {CURRENCY_SYMBOLS[viewing.profile?.currency || 'KES']} {viewing.hourly_rate?.toLocaleString()}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Per hour</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-semibold mb-2">Services</div>
                <div className="flex flex-wrap gap-2">
                  {viewing.services.map(s => (
                    <span key={s} className="text-sm px-3 py-1 rounded-full"
                      style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.2)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm font-semibold mb-2">Languages</div>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{viewing.languages.join(' · ')}</p>
              </div>

              <button onClick={() => setSelected(viewing)} className="btn-gold w-full py-4 text-base rounded-xl">
                📱 Book via M-Pesa · KES {viewing.hourly_rate?.toLocaleString()}/hr
              </button>
            </div>
          </div>
        </div>
        {selected && <MpesaBookingModal companion={selected} onClose={() => setSelected(null)} />}
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: 'rgba(13,10,6,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="font-playfair text-2xl font-bold" style={{ color: 'var(--gold)' }}>
          Zawadi<span style={{ color: 'var(--accent)' }}>.</span>
        </Link>
        <div className="flex gap-3">
          <Link href="/login" className="btn-outline text-sm px-5 py-2">Sign In</Link>
          <Link href="/register" className="btn-gold text-sm px-5 py-2">Register</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 pt-28 pb-20">
        {/* Search + filters */}
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}/>
            <input className="zawadi-input pl-10 py-2.5" placeholder="Search by name or city..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {['all', 'online'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-2.5 rounded-full text-sm font-semibold transition-all"
                style={filter === f
                  ? { background: 'var(--gold)', color: 'var(--deep)' }
                  : { border: '1px solid var(--border)', color: 'var(--muted)', background: 'transparent' }}>
                {f === 'all' ? 'All' : '🟢 Online'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((c, i) => (
            <div key={c.id} className="zawadi-card overflow-hidden cursor-pointer group hover:-translate-y-1.5 transition-all duration-200">
              {/* Photo or emoji avatar */}
              <div className="relative" onClick={() => setViewing(c)}>
                {c.photos && c.photos.length > 0 ? (
                  <div className="h-56 overflow-hidden">
                    <img src={c.photos[0]} alt={c.display_name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>
                  </div>
                ) : (
                  <div className="h-56 flex items-center justify-center text-7xl relative"
                    style={{ background: 'var(--card2)' }}>
                    {EMOJIS[i % EMOJIS.length]}
                  </div>
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(transparent 55%, var(--card))' }}/>
                <div className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${c.is_online ? 'bg-green-500' : 'bg-gray-600'} text-white`}>
                  {c.is_online ? <Wifi size={9}/> : <WifiOff size={9}/>}
                  {c.is_online ? 'Online' : 'Offline'}
                </div>
                {c.profile?.is_verified && (
                  <div className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full text-deep" style={{ background: 'var(--gold)' }}>✓ Verified</div>
                )}
                {/* Private photo indicator */}
                {((c as any).private_photos?.length > 0 || true) && (
                  <div className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                    style={{ background: 'rgba(232,93,38,0.85)', color: 'white' }}>
                    🔒 +1 private
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-playfair text-lg font-semibold">{c.display_name}</div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--gold)' }}>
                    <Star size={11} fill="currentColor"/>
                    {c.rating.toFixed(1)}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs mb-2" style={{ color: 'var(--muted)' }}>
                  <MapPin size={11}/> {c.profile?.city} {FLAG[c.profile?.country || '']}
                </div>
                <div className="text-sm font-semibold mb-3" style={{ color: 'var(--gold)' }}>
                  {CURRENCY_SYMBOLS[c.profile?.currency || 'KES']} {c.hourly_rate?.toLocaleString()}/hr
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {c.services.slice(0, 2).map(s => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.2)' }}>
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setViewing(c)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ border: '1px solid var(--border)', color: 'var(--muted)', background: 'transparent' }}>
                    View Profile
                  </button>
                  <button onClick={() => setSelected(c)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold text-deep"
                    style={{ background: 'var(--gold)' }}>
                    📱 Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && <MpesaBookingModal companion={selected} onClose={() => setSelected(null)} />}
    </main>
  )
}
