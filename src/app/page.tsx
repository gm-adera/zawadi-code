import Link from 'next/link'
import { Shield, Star, Users, Clock } from 'lucide-react'

export default function HomePage() {
  return (
    <main>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-4"
        style={{ background: 'rgba(13,10,6,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="font-playfair text-2xl font-bold" style={{ color: 'var(--gold)' }}>
          Zawadi<span style={{ color: 'var(--accent)' }}>.</span>
        </div>
        <div className="flex gap-2">
          <Link href="/browse" className="btn-outline text-sm">Browse</Link>
          <Link href="/login" className="btn-gold text-sm">Sign In</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-36 pb-20">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-8"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid var(--border)', color: 'var(--gold)' }}>
          🌍 Africa&apos;s Premier Companion Platform
        </div>

        <h1 className="font-playfair text-6xl md:text-7xl font-black leading-tight mb-6">
          Connect.{' '}
          <span className="gold-shimmer">Trust.</span>
          <br />
          <span style={{ color: 'var(--accent)' }}>Explore.</span>
        </h1>

        <p className="text-lg max-w-xl mb-10" style={{ color: 'var(--muted)', lineHeight: '1.7' }}>
          A safe, discreet marketplace for companionship — with built-in escrow protection.
          Your money is held securely until <em>you</em> confirm satisfaction.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/browse" className="btn-gold text-base px-8 py-3.5">Find a Companion</Link>
          <Link href="/register?role=companion" className="btn-outline text-base px-8 py-3.5">Become a Companion</Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <h2 className="font-playfair text-3xl font-bold mb-2">How Zawadi Works</h2>
          <p style={{ color: 'var(--muted)' }}>Transparent, safe, and protected — every time</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            { num: '1', icon: '🔍', title: 'Browse Companions', desc: 'Explore verified profiles across Nairobi, Lagos, Accra, Kampala and more.' },
            { num: '2', icon: '💬', title: 'Send Transport Money', desc: 'Funds go instantly into Zawadi\'s secure escrow vault — not to the companion.' },
            { num: '3', icon: '🔐', title: 'Escrow Holds Funds', desc: 'Companion accepts booking. Money stays locked safely until meetup.' },
            { num: '4', icon: '✅', title: 'You Release Payment', desc: 'After your meetup, tap Release — funds transfer to companion\'s M-Pesa instantly.' },
          ].map((step) => (
            <div key={step.num} className="zawadi-card p-6 relative overflow-hidden hover:-translate-y-1 transition-transform">
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: 'linear-gradient(90deg, var(--gold), var(--accent))'
              }} />
              <div className="font-playfair text-5xl font-black absolute top-3 right-4 opacity-10"
                style={{ color: 'var(--gold)' }}>{step.num}</div>
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST STATS */}
      <section className="max-w-4xl mx-auto px-4 pb-24">
        <div className="zawadi-card p-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield size={20} style={{ color: 'var(--gold)' }} />
            <h2 className="font-playfair text-2xl font-bold">Zawadi Escrow Promise</h2>
          </div>
          <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
            Money is held in a neutral vault — never by anyone. Released only when both parties are happy.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { value: '12K+', label: 'Active Companions' },
              { value: '98%', label: 'Dispute Resolution' },
              { value: 'KES/NGN', label: 'Local Currencies' },
              { value: '24/7', label: 'Support' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4" style={{ background: 'var(--card2)' }}>
                <div className="font-playfair text-2xl font-bold" style={{ color: 'var(--gold)' }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <Link href="/register" className="btn-gold inline-block px-10 py-3.5 text-base">Get Started →</Link>
        </div>
      </section>
    </main>
  )
}
