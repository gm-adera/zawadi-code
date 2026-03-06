-- ================================================================
-- ZAWADI Migration 002 — Photo Storage + M-Pesa Support
-- Run after 001_initial_schema.sql
-- ================================================================

-- Add private_photos column to companion_profiles
ALTER TABLE companion_profiles
  ADD COLUMN IF NOT EXISTS private_photos TEXT[] DEFAULT '{}';

-- Add M-Pesa receipt column to bookings (reuse existing field or add new)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS mpesa_receipt TEXT;

-- ================================================================
-- STORAGE BUCKETS
-- Create these in Supabase Dashboard → Storage, OR via SQL:
-- ================================================================

-- Public bucket for companion photos (viewable by all)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'companion-photos',
  'companion-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Private bucket for "one real" photos (access controlled)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'companion-photos-private',
  'companion-photos-private',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- STORAGE POLICIES
-- ================================================================

-- Public photos: anyone can view
CREATE POLICY "Public photos are viewable by all"
ON storage.objects FOR SELECT
USING (bucket_id = 'companion-photos');

-- Public photos: only companion can upload/delete their own
CREATE POLICY "Companions can upload own public photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'companion-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Companions can delete own public photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'companion-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Private photos: only the companion (owner) can upload
CREATE POLICY "Companions can upload own private photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'companion-photos-private'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Private photos: only service role can read (API generates signed URLs)
-- (no public read policy = only signed URLs work)

CREATE POLICY "Companions can delete own private photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'companion-photos-private'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
