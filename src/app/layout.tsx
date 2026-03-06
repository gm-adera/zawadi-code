import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import AgeGate from '@/components/ui/AgeGate'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: 'Zawadi — Africa\'s Companion Platform',
  description: 'Safe, discreet companion marketplace with built-in escrow protection across Africa. Adults 18+ only.',
  keywords: 'companion, escort, Africa, Nairobi, Lagos, Accra, escrow, safe',
  openGraph: {
    title: 'Zawadi',
    description: 'Secure companion platform with escrow payments',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="bg-deep text-zawadi-text min-h-screen">
        <AgeGate>
          {children}
        </AgeGate>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#231E16',
              color: '#F5EDD8',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  )
}
