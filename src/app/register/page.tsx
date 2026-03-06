'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

const CITIES = ['Nairobi', 'Lagos', 'Accra', 'Kampala', 'Dar es Salaam', 'Johannesburg', 'Abuja', 'Kumasi', 'Mombasa', 'Other']
const CURRENCIES = [
  { code: 'KES', label: 'KES — Kenyan Shilling' },
  { code: 'NGN', label: 'NGN — Nigerian Naira' },
  { code: 'GHS', label: 'GHS — Ghanaian Cedi' },
  { code: 'UGX', label: 'UGX — Ugandan Shilling' },
  { code: 'TZS', label: 'TZS — Tanzanian Shilling' },
  { code: 'ZAR', label: 'ZAR — South African Rand' },
]

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()

  const [role, setRole] = useState<'client' | 'companion'>(
    (searchParams.get('role') as 'client' | 'companion') || 'client'
  )
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '', city: 'Nairobi', currency: 'KES'
  })
  const [loading, setLoading] = useState(false)
  const [ageConfirmed, setAgeConfirmed] = useState(false)

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ageConfirmed) {
      toast.error('You must confirm you are 18 or older to register')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name, role, phone: form.phone, city: form.city, currency: form.currency }
        }
      })
      if (error) throw error

      // Update profile with extra fields
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: form.full_name,
          role,
          phone: form.phone,
          city: form.city,
          currency: form.currency,
        })
      }

      toast.success('Account created! Check your email to confirm.')
      router.push(role === 'companion' ? '/dashboard/companion' : '/dashboard/client')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-playfair text-3xl font-bold" style={{ color: 'var(--gold)' }}>
            Zawadi<span style={{ color: 'var(--accent)' }}>.</span>
          </Link>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Create your account</p>
        </div>

        {/* Role toggle */}
        <div className="flex rounded-full p-1 mb-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {(['client', 'companion'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                role === r ? 'bg-gold text-deep' : 'text-muted-foreground'
              }`}
              style={role !== r ? { color: 'var(--muted)' } : {}}
            >
              {r === 'client' ? '👤 I\'m a Client' : '🌹 I\'m a Companion'}
            </button>
          ))}
        </div>

        <div className="zawadi-card p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>Full Name</label>
              <input className="zawadi-input" placeholder="Your name" value={form.full_name}
                onChange={e => update('full_name', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>Email Address</label>
              <input className="zawadi-input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => update('email', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>Phone Number</label>
              <input className="zawadi-input" placeholder="+254 7XX XXX XXX" value={form.phone}
                onChange={e => update('phone', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>City</label>
                <select className="zawadi-input" value={form.city} onChange={e => update('city', e.target.value)}>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>Currency</label>
                <select className="zawadi-input" value={form.currency} onChange={e => update('currency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--muted)' }}>Password</label>
              <input className="zawadi-input" type="password" placeholder="Min 8 characters" value={form.password}
                onChange={e => update('password', e.target.value)} minLength={8} required />
            </div>
            {/* Age confirmation */}
            <div
              onClick={() => setAgeConfirmed(a => !a)}
              className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all select-none"
              style={{
                background: ageConfirmed ? 'rgba(201,168,76,0.08)' : 'var(--card2)',
                border: `1.5px solid ${ageConfirmed ? 'var(--gold)' : 'var(--border)'}`,
              }}>
              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                style={{ background: ageConfirmed ? 'var(--gold)' : 'transparent', border: `2px solid ${ageConfirmed ? 'var(--gold)' : 'var(--muted)'}` }}>
                {ageConfirmed && <span style={{ color: 'var(--deep)', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                I confirm that I am <strong style={{ color: 'var(--text)' }}>18 years of age or older</strong> and agree to the{' '}
                <a href="/terms" style={{ color: 'var(--gold)' }} onClick={e => e.stopPropagation()} target="_blank">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" style={{ color: 'var(--gold)' }} onClick={e => e.stopPropagation()} target="_blank">Privacy Policy</a>.
              </p>
            </div>

            <button type="submit" className="btn-gold w-full py-3 text-base mt-2"
              disabled={loading || !ageConfirmed}
              style={{ opacity: ageConfirmed ? 1 : 0.5, cursor: ageConfirmed ? 'pointer' : 'not-allowed' }}>
              {loading ? 'Creating account...' : `Create ${role === 'companion' ? 'Companion' : 'Client'} Account`}
            </button>
          </form>

          <div className="mt-5 text-center text-sm" style={{ color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--gold)' }} className="font-semibold hover:underline">Sign In</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
