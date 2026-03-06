import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: 'rgba(13,10,6,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="font-playfair text-2xl font-bold" style={{ color: 'var(--gold)' }}>
          Zawadi<span style={{ color: 'var(--accent)' }}>.</span>
        </Link>
        <Link href="/" className="text-sm" style={{ color: 'var(--muted)' }}>← Back to Home</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="text-xs font-semibold mb-3 px-3 py-1 rounded-full inline-block"
            style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--gold)', border: '1px solid var(--border)' }}>
            Legal
          </div>
          <h1 className="font-playfair text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Last updated: March 2026 · Zawadi Platform</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>1. Information We Collect</h2>
            <ul className="space-y-2 ml-4">
              <li>• <strong style={{ color: 'var(--text)' }}>Account data:</strong> Name, email address, phone number, city, and role (client or companion)</li>
              <li>• <strong style={{ color: 'var(--text)' }}>Payment data:</strong> M-Pesa transaction references and receipts (we never store M-Pesa PINs or card numbers)</li>
              <li>• <strong style={{ color: 'var(--text)' }}>Booking data:</strong> Pickup locations, meeting times, transport amounts, and booking history</li>
              <li>• <strong style={{ color: 'var(--text)' }}>Photos:</strong> Public and private photos uploaded by companions, stored in encrypted cloud storage</li>
              <li>• <strong style={{ color: 'var(--text)' }}>Usage data:</strong> Browser type, IP address, pages visited (for security and analytics only)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>2. How We Use Your Information</h2>
            <ul className="space-y-2 ml-4">
              <li>• To operate the escrow payment system and process M-Pesa transactions</li>
              <li>• To match clients with companions and manage bookings</li>
              <li>• To verify user identity and enforce our 18+ age requirement</li>
              <li>• To send booking notifications and payment confirmations via SMS/email</li>
              <li>• To investigate disputes and enforce our Terms of Service</li>
              <li>• To improve platform security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>3. Private Photos</h2>
            <div className="rounded-xl p-4 mb-3" style={{ background: 'rgba(232,93,38,0.06)', border: '1px solid rgba(232,93,38,0.2)' }}>
              <p><strong style={{ color: 'var(--accent)' }}>Private "one real" photos are stored with restricted access.</strong> They are never publicly accessible. Signed access URLs are generated on-demand and expire after 1 hour. Access is logged and limited to clients with confirmed bookings only.</p>
            </div>
            <p>We do not use companion photos for advertising, AI training, or any purpose beyond their intended display on the platform.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>4. Data Sharing</h2>
            <p className="mb-3">We do not sell your personal data. We share data only with:</p>
            <ul className="space-y-2 ml-4">
              <li>• <strong style={{ color: 'var(--text)' }}>Safaricom (M-Pesa):</strong> Phone numbers and amounts for payment processing</li>
              <li>• <strong style={{ color: 'var(--text)' }}>Flutterwave:</strong> Account details for withdrawal processing</li>
              <li>• <strong style={{ color: 'var(--text)' }}>Supabase:</strong> Our database and storage provider (data hosted in EU/US data centres)</li>
              <li>• <strong style={{ color: 'var(--text)' }}>Law enforcement:</strong> Only when required by a valid Kenyan court order or legal process</li>
            </ul>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>5. Data Retention</h2>
            <p>Account data is retained for as long as your account is active. Transaction records are retained for 7 years as required by Kenyan financial regulations. You may request deletion of your account and personal data at any time (subject to legal retention requirements).</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>6. Your Rights</h2>
            <p className="mb-3">Under the Kenya Data Protection Act 2019, you have the right to:</p>
            <ul className="space-y-2 ml-4">
              <li>• Access the personal data we hold about you</li>
              <li>• Correct inaccurate data</li>
              <li>• Request deletion of your data ("right to be forgotten")</li>
              <li>• Object to processing of your data for marketing purposes</li>
              <li>• Data portability — receive your data in a machine-readable format</li>
            </ul>
            <p className="mt-3">To exercise these rights, email <strong style={{ color: 'var(--gold)' }}>privacy@zawadi.co.ke</strong></p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>7. Security</h2>
            <p>We use industry-standard security measures including HTTPS encryption, Row Level Security on our database, encrypted storage for private photos, and regular security audits. However, no system is 100% secure. Please use a strong password and keep your M-Pesa PIN private.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>8. Contact</h2>
            <p>Data Controller: Zawadi Platform, Nairobi, Kenya<br/>
            Email: <strong style={{ color: 'var(--gold)' }}>privacy@zawadi.co.ke</strong></p>
          </section>

        </div>
      </div>
    </main>
  )
}
