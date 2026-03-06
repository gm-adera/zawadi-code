'use client'
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'zawadi_age_verified'

export default function AgeGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(null)
  const [declined, setDeclined] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if already verified this session
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored === 'true') {
      setVerified(true)
    } else {
      setVerified(false)
    }
    setChecking(false)
  }, [])

  const handleAccept = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    setVerified(true)
  }

  const handleDecline = () => {
    setDeclined(true)
  }

  // Still checking storage
  if (checking) return null

  // Already verified — show the app
  if (verified) return <>{children}</>

  // Declined — show blocked screen
  if (declined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'var(--deep)' }}>
        <div className="text-5xl mb-6">🔒</div>
        <h1 className="font-playfair text-2xl font-bold mb-3" style={{ color: 'var(--text)' }}>
          Access Restricted
        </h1>
        <p className="text-sm max-w-xs" style={{ color: 'var(--muted)' }}>
          This platform is for adults aged 18 and over only. You have indicated you do not meet this requirement.
        </p>
      </div>
    )
  }

  // Age gate modal
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: 'var(--deep)',
        backgroundImage: 'radial-gradient(ellipse at 20% 30%, rgba(201,168,76,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(232,93,38,0.05) 0%, transparent 60%)',
      }}>

      {/* Logo */}
      <div className="font-playfair text-4xl font-black mb-8" style={{ color: 'var(--gold)' }}>
        Zawadi<span style={{ color: 'var(--accent)' }}>.</span>
      </div>

      {/* Gate card */}
      <div className="w-full max-w-sm rounded-3xl p-8 text-center"
        style={{
          background: 'var(--dark)',
          border: '1px solid var(--border)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
        }}>

        {/* 18+ badge */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
            boxShadow: '0 8px 30px rgba(201,168,76,0.35)',
          }}>
          <span className="font-playfair text-2xl font-black" style={{ color: 'var(--deep)' }}>18+</span>
        </div>

        <h2 className="font-playfair text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          Adults Only
        </h2>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--muted)' }}>
          Zawadi is an adult platform containing content and services intended for people aged <strong style={{ color: 'var(--text)' }}>18 years and older</strong>.
          By entering, you confirm that you are of legal age in your country or jurisdiction.
        </p>

        {/* Legal text */}
        <div className="rounded-xl p-3 mb-6 text-left"
          style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            By clicking <strong style={{ color: 'var(--gold)' }}>"I Am 18 or Older"</strong> you agree that:
          </p>
          <ul className="text-xs mt-2 space-y-1" style={{ color: 'var(--muted)' }}>
            <li>• You are at least 18 years of age</li>
            <li>• Access to adult content is legal in your jurisdiction</li>
            <li>• You have read and agree to our <a href="/terms" style={{ color: 'var(--gold)' }} target="_blank">Terms of Service</a> and <a href="/privacy" style={{ color: 'var(--gold)' }} target="_blank">Privacy Policy</a></li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAccept}
            className="w-full py-4 rounded-xl font-bold text-base transition-all"
            style={{
              background: 'var(--gold)',
              color: 'var(--deep)',
              boxShadow: '0 8px 24px rgba(201,168,76,0.3)',
            }}>
            ✅ I Am 18 or Older — Enter
          </button>
          <button
            onClick={handleDecline}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
            }}>
            I Am Under 18 — Exit
          </button>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs mt-8 text-center max-w-xs" style={{ color: 'var(--muted)', opacity: 0.6 }}>
        Zawadi complies with all applicable laws regarding adult content platforms.
        This age verification is required by law.
      </p>
    </div>
  )
}
