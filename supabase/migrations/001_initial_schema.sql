-- ================================================================
-- ZAWADI PLATFORM - Complete Database Schema
-- Run this in Supabase SQL Editor
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- ENUMS
-- ================================================================
CREATE TYPE user_role AS ENUM ('client', 'companion', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'accepted', 'declined', 'completed', 'disputed', 'cancelled', 'refunded');
CREATE TYPE payment_mode AS ENUM ('escrow', 'upfront');
CREATE TYPE escrow_status AS ENUM ('held', 'released', 'refunded', 'disputed');
CREATE TYPE withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE withdrawal_method AS ENUM ('mpesa', 'bank', 'chipper', 'flutterwave');
CREATE TYPE currency_code AS ENUM ('KES', 'NGN', 'GHS', 'UGX', 'TZS', 'ZAR');

-- ================================================================
-- PROFILES (extends Supabase auth.users)
-- ================================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'client',
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  phone TEXT,
  city TEXT,
  country TEXT DEFAULT 'KE',
  currency currency_code DEFAULT 'KES',
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  wallet_balance DECIMAL(12,2) DEFAULT 0.00,
  escrow_balance DECIMAL(12,2) DEFAULT 0.00,  -- funds locked (companion side)
  pending_balance DECIMAL(12,2) DEFAULT 0.00, -- upfront mode, awaiting release
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- COMPANION PROFILES
-- ================================================================
CREATE TABLE companion_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT NOT NULL,
  tagline TEXT,
  services TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10,2),
  preferred_payment_mode payment_mode DEFAULT 'escrow',
  is_online BOOLEAN DEFAULT false,
  total_bookings INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  age INTEGER,
  height TEXT,
  languages TEXT[] DEFAULT '{"English"}',
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- BOOKINGS / TRANSPORT REQUESTS
-- ================================================================
CREATE TABLE bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id) NOT NULL,
  companion_id UUID REFERENCES profiles(id) NOT NULL,
  status booking_status DEFAULT 'pending',
  payment_mode payment_mode DEFAULT 'escrow',
  
  -- Transport details
  pickup_location TEXT NOT NULL,
  meeting_time TIMESTAMPTZ NOT NULL,
  transport_amount DECIMAL(10,2) NOT NULL,
  currency currency_code NOT NULL DEFAULT 'KES',
  message TEXT,
  
  -- Payment tracking
  flutterwave_tx_ref TEXT UNIQUE,        -- FLW transaction reference
  flutterwave_tx_id TEXT,                -- FLW transaction ID
  payment_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ESCROW RECORDS
-- ================================================================
CREATE TABLE escrow_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  client_id UUID REFERENCES profiles(id) NOT NULL,
  companion_id UUID REFERENCES profiles(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency currency_code NOT NULL,
  status escrow_status DEFAULT 'held',
  payment_mode payment_mode DEFAULT 'escrow',
  
  -- Release tracking
  released_by UUID REFERENCES profiles(id),
  released_at TIMESTAMPTZ,
  release_note TEXT,
  
  -- Dispute tracking  
  disputed_by UUID REFERENCES profiles(id),
  disputed_at TIMESTAMPTZ,
  dispute_reason TEXT,
  dispute_resolved_at TIMESTAMPTZ,
  dispute_resolution TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TRANSACTIONS LEDGER
-- ================================================================
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  escrow_id UUID REFERENCES escrow_records(id),
  type TEXT NOT NULL, -- 'escrow_lock','escrow_release','escrow_refund','withdrawal','deposit','upfront_lock'
  amount DECIMAL(10,2) NOT NULL,
  currency currency_code NOT NULL,
  balance_after DECIMAL(12,2),
  description TEXT,
  flutterwave_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- WITHDRAWALS
-- ================================================================
CREATE TABLE withdrawals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency currency_code NOT NULL,
  method withdrawal_method NOT NULL,
  status withdrawal_status DEFAULT 'pending',
  
  -- Destination details
  account_number TEXT,  -- phone for mpesa, account for bank
  account_name TEXT,
  bank_code TEXT,
  
  -- FLW transfer details
  flutterwave_transfer_id TEXT,
  flutterwave_ref TEXT,
  
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ================================================================
-- REVIEWS
-- ================================================================
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  reviewed_id UUID REFERENCES profiles(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own, companions visible to all
CREATE POLICY "Public companions visible" ON profiles FOR SELECT USING (role = 'companion' OR id = auth.uid());
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Companion profiles: public read, own write
CREATE POLICY "Companion profiles public read" ON companion_profiles FOR SELECT USING (true);
CREATE POLICY "Companion update own profile" ON companion_profiles FOR ALL USING (user_id = auth.uid());

-- Bookings: client and companion see their own
CREATE POLICY "Bookings own access" ON bookings FOR ALL USING (client_id = auth.uid() OR companion_id = auth.uid());

-- Escrow: parties see their own
CREATE POLICY "Escrow own access" ON escrow_records FOR ALL USING (client_id = auth.uid() OR companion_id = auth.uid());

-- Transactions: own only
CREATE POLICY "Transactions own" ON transactions FOR SELECT USING (user_id = auth.uid());

-- Withdrawals: own only
CREATE POLICY "Withdrawals own" ON withdrawals FOR ALL USING (user_id = auth.uid());

-- Reviews: public read
CREATE POLICY "Reviews public read" ON reviews FOR SELECT USING (true);
CREATE POLICY "Reviews own write" ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- ================================================================
-- FUNCTIONS & TRIGGERS
-- ================================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER escrow_updated_at BEFORE UPDATE ON escrow_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Release escrow: moves money from escrow to companion wallet
CREATE OR REPLACE FUNCTION release_escrow(p_booking_id UUID, p_released_by UUID)
RETURNS JSON AS $$
DECLARE
  v_escrow escrow_records%ROWTYPE;
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_escrow FROM escrow_records WHERE booking_id = p_booking_id AND status = 'held';
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  
  IF v_escrow.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Escrow not found or already released');
  END IF;
  
  IF v_booking.client_id != p_released_by THEN
    RETURN json_build_object('success', false, 'error', 'Only the client can release escrow');
  END IF;

  -- Update escrow status
  UPDATE escrow_records SET status = 'released', released_by = p_released_by, released_at = NOW() WHERE id = v_escrow.id;
  
  -- Credit companion wallet
  UPDATE profiles SET 
    wallet_balance = wallet_balance + v_escrow.amount,
    escrow_balance = GREATEST(0, escrow_balance - v_escrow.amount)
  WHERE id = v_escrow.companion_id;

  -- Mark booking complete
  UPDATE bookings SET status = 'completed', completed_at = NOW() WHERE id = p_booking_id;
  
  -- Log transaction
  INSERT INTO transactions (user_id, booking_id, escrow_id, type, amount, currency, description)
  VALUES (v_escrow.companion_id, p_booking_id, v_escrow.id, 'escrow_release', v_escrow.amount, v_escrow.currency, 'Escrow released by client');

  RETURN json_build_object('success', true, 'amount', v_escrow.amount, 'currency', v_escrow.currency);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update companion rating
CREATE OR REPLACE FUNCTION update_companion_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE companion_profiles SET
    rating = (SELECT AVG(rating) FROM reviews WHERE reviewed_id = NEW.reviewed_id),
    rating_count = (SELECT COUNT(*) FROM reviews WHERE reviewed_id = NEW.reviewed_id)
  WHERE user_id = NEW.reviewed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_insert AFTER INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION update_companion_rating();

-- ================================================================
-- INDEXES for performance
-- ================================================================
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_companion ON bookings(companion_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_escrow_booking ON escrow_records(booking_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_companion_profiles_user ON companion_profiles(user_id);
CREATE INDEX idx_withdrawals_user ON withdrawals(user_id);
