# 🌹 Zawadi — Africa's Companion Marketplace

> Safe, discreet companion platform with built-in escrow payment protection across Africa.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com)
[![Flutterwave](https://img.shields.io/badge/Flutterwave-Payments-orange)](https://flutterwave.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)

---

## ✨ Features

- **🔐 Escrow System** — Transport money is locked in a neutral vault, released only when the client confirms satisfaction
- **⚡ Upfront Mode** — Companion gets funds in pending wallet immediately, withdrawn after client releases  
- **💸 Flutterwave Payments** — M-Pesa, MTN Mobile Money, Card payments across KE, NG, GH, UG, TZ, ZA
- **📲 Instant Withdrawals** — Companions withdraw to M-Pesa or bank via Flutterwave Transfers API
- **🌍 Multi-Currency** — KES, NGN, GHS, UGX, TZS, ZAR
- **⚠️ Dispute Resolution** — Clients can open disputes; escrow held until resolved
- **👤 Dual Dashboards** — Separate client and companion dashboards
- **🔒 Row-Level Security** — Supabase RLS ensures users only see their own data

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth |
| Payments | Flutterwave (collections + transfers) |
| Hosting | Vercel (recommended) |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/gm-adera/zawadi-code.git
cd zawadi-code
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → New Project
2. Go to **SQL Editor** → paste contents of `supabase/migrations/001_initial_schema.sql` → Run
3. Copy your project URL and anon key from **Settings → API**

### 3. Set Up Flutterwave

1. Sign up at [dashboard.flutterwave.com](https://dashboard.flutterwave.com)
2. Go to **Settings → APIs** → copy your test keys
3. Enable **M-Pesa** and **Mobile Money** in your payment methods

### 4. Configure Environment

```bash
cp .env.example .env.local
# Fill in your Supabase and Flutterwave keys
```

### 5. Run Development Server

```bash
npm run dev
# Open http://localhost:3000
```

---

## 📁 Project Structure

```
zawadi/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── browse/page.tsx             # Browse companions
│   │   ├── login/page.tsx              # Auth
│   │   ├── register/page.tsx           # Register (client or companion)
│   │   ├── dashboard/
│   │   │   ├── client/page.tsx         # Client dashboard + escrow release
│   │   │   └── companion/page.tsx      # Companion dashboard + withdrawal
│   │   └── api/
│   │       ├── bookings/route.ts       # Create booking + verify payment
│   │       ├── escrow/route.ts         # Release / dispute / accept
│   │       ├── companions/route.ts     # List companions
│   │       └── withdraw/route.ts       # Payout via Flutterwave
│   ├── components/
│   │   └── booking/BookingModal.tsx    # Flutterwave payment modal
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase client (client + server + admin)
│   │   └── flutterwave.ts              # FLW helpers (verify, transfer, config)
│   └── types/index.ts                  # TypeScript interfaces
├── supabase/
│   └── migrations/001_initial_schema.sql
└── README.md
```

---

## 💳 Escrow Payment Flow

```
Client pays transport fee via Flutterwave (M-Pesa/Card)
          ↓
Flutterwave charges client → Zawadi verifies transaction
          ↓
Booking created + EscrowRecord created (status: 'held')
          ↓
Companion receives notification → Accepts booking
          ↓
Companion's escrow_balance increases (locked)
          ↓
Meetup happens
          ↓
Client taps "Release Funds" → release_escrow() DB function runs
          ↓
Companion's wallet_balance increases ✅
Companion withdraws via M-Pesa / Bank
```

---

## 🌍 Supported Countries & Currencies

| Country | Currency | Payment Methods |
|---|---|---|
| 🇰🇪 Kenya | KES | M-Pesa, Card |
| 🇳🇬 Nigeria | NGN | Card, Bank Transfer |
| 🇬🇭 Ghana | GHS | MTN Mobile Money, Card |
| 🇺🇬 Uganda | UGX | Airtel Money, MTN |
| 🇹🇿 Tanzania | TZS | Vodacom M-Pesa |
| 🇿🇦 South Africa | ZAR | Card, EFT |

---

## 🚢 Deployment (Vercel — recommended)

```bash
npm install -g vercel
vercel
# Add environment variables in Vercel dashboard
```

Then:
1. Go to [vercel.com](https://vercel.com) → Import your GitHub repo
2. Add all `.env.example` variables in **Settings → Environment Variables**
3. Deploy → live in 2 minutes

---

## ⚠️ Legal Note

This platform handles adult services. Ensure compliance with local laws in your operating country. Implement proper **age verification** (18+) before going live. Consider consulting a legal professional in each market.

---

## 📞 Support

Built with ❤️ for Africa. Questions? Open a GitHub issue.
