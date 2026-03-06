import Link from 'next/link'

export default function TermsPage() {
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
          <h1 className="font-playfair text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Last updated: March 2026 · Zawadi Platform</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>1. Age Requirement</h2>
            <div className="rounded-xl p-4" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <p><strong style={{ color: 'var(--gold)' }}>You must be 18 years of age or older to use Zawadi.</strong> By accessing or using this platform, you represent and warrant that you are at least 18 years old. Access by minors is strictly prohibited. We reserve the right to terminate accounts where age falsification is suspected and to report such incidents to relevant authorities.</p>
            </div>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>2. Platform Description</h2>
            <p>Zawadi is an adult companionship marketplace that connects clients with companions for social, entertainment, and companionship services. Zawadi operates as a neutral technology platform only. We do not employ companions, facilitate or condone illegal activities, or guarantee the conduct of any user.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>3. Escrow Payment Terms</h2>
            <p className="mb-3">Transport money sent through Zawadi is held in escrow under the following conditions:</p>
            <ul className="space-y-2 ml-4">
              <li>• Funds are locked upon verified payment and released only when the client explicitly confirms satisfaction</li>
              <li>• Companions receive funds only after client release — not automatically</li>
              <li>• Upfront mode sends funds to a companion's pending wallet, still subject to client release</li>
              <li>• Disputed funds are frozen until resolved by Zawadi support (within 48 hours)</li>
              <li>• Zawadi charges a platform fee of 5–10% on each completed transaction</li>
              <li>• Refunds for declined or cancelled bookings are processed within 3–5 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>4. User Conduct</h2>
            <p className="mb-3">All users agree not to:</p>
            <ul className="space-y-2 ml-4">
              <li>• Use the platform for any illegal purposes or to solicit illegal services</li>
              <li>• Harass, threaten, or abuse other users</li>
              <li>• Share, distribute, or misuse private photos obtained through the platform</li>
              <li>• Create fake profiles, misrepresent identity or age</li>
              <li>• Attempt to bypass the escrow system or process payments outside the platform</li>
              <li>• Screenshot or record private photo sessions</li>
            </ul>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>5. Photo Policy</h2>
            <p>Public photos are visible to all platform users. Private "one real" photos are accessible only to clients with a confirmed, paid booking. Redistribution, screenshotting, or sharing of any companion photos outside the platform is a serious violation of these terms and may result in permanent account termination and legal action.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>6. Companion Responsibilities</h2>
            <ul className="space-y-2 ml-4">
              <li>• Companions must be 18+ and provide accurate profile information</li>
              <li>• Companions are independent contractors, not employees of Zawadi</li>
              <li>• Companions are responsible for their own safety and arrangements</li>
              <li>• Companions must honour accepted bookings or face account penalties</li>
            </ul>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>7. Limitation of Liability</h2>
            <p>Zawadi provides the platform "as is" without warranty. We are not liable for the actions of any user, the outcome of any booking, or any loss arising from use of the platform. Users engage with each other at their own risk. Zawadi's total liability shall not exceed the transaction fees paid in the 30 days prior to any claim.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>8. Governing Law</h2>
            <p>These terms are governed by the laws of the Republic of Kenya. Disputes shall be resolved through arbitration in Nairobi, Kenya, in accordance with the Arbitration Act (Cap. 49).</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>9. Contact</h2>
            <p>For questions about these terms, contact us at <strong style={{ color: 'var(--gold)' }}>legal@zawadi.co.ke</strong></p>
          </section>
        </div>
      </div>
    </main>
  )
}
