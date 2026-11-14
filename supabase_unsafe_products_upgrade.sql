-- ==============================================================================
-- SWPC Healthcare: Unsafe Products Surveillance System Upgrade (G-RDU / RDU Community)
-- Phase 1 & Phase 2: Schema Enhancements, Storage Bucket & Lifecycle Archiving
-- ==============================================================================

-- 1. Ensure columns exist on unsafe_products table
ALTER TABLE unsafe_products 
  ADD COLUMN IF NOT EXISTS product_category TEXT DEFAULT 'drug_set',
  ADD COLUMN IF NOT EXISTS risk_type TEXT,
  ADD COLUMN IF NOT EXISTS distribution_channel TEXT DEFAULT 'grocery_store',
  ADD COLUMN IF NOT EXISTS store_name TEXT,
  ADD COLUMN IF NOT EXISTS village_moo TEXT,
  ADD COLUMN IF NOT EXISTS subdistrict TEXT,
  ADD COLUMN IF NOT EXISTS test_kit_result TEXT DEFAULT 'not_tested',
  ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'moderate',
  ADD COLUMN IF NOT EXISTS action_details TEXT,
  ADD COLUMN IF NOT EXISTS action_taken_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS action_taken_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_safety_alert BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS alert_notes TEXT,
  ADD COLUMN IF NOT EXISTS additional_images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS archive_drive_link TEXT;

-- 2. Upgrade status CHECK constraint to support 4-stage Risk Management lifecycle
ALTER TABLE unsafe_products DROP CONSTRAINT IF EXISTS unsafe_products_status_check;
ALTER TABLE unsafe_products ADD CONSTRAINT unsafe_products_status_check 
  CHECK (status IN ('pending', 'investigating', 'action_taken', 'resolved'));

-- 3. Ensure Row Level Security (RLS) is active
ALTER TABLE unsafe_products ENABLE ROW LEVEL SECURITY;

-- Drop previous policies to avoid duplication
DROP POLICY IF EXISTS "Anyone logged in can view unsafe products" ON unsafe_products;
DROP POLICY IF EXISTS "Staff can report unsafe products" ON unsafe_products;
DROP POLICY IF EXISTS "Pharmacists can update status" ON unsafe_products;
DROP POLICY IF EXISTS "Users and Pharmacists can update unsafe products" ON unsafe_products;
DROP POLICY IF EXISTS "Users and Pharmacists can delete unsafe products" ON unsafe_products;

-- Select policy: All authenticated users can view surveillance reports
CREATE POLICY "Anyone logged in can view unsafe products" 
ON unsafe_products FOR SELECT 
USING (auth.role() = 'authenticated');

-- Insert policy: Any authenticated user can submit a report
CREATE POLICY "Staff can report unsafe products" 
ON unsafe_products FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

-- Update policy: Reporter can update before triage, or Pharmacists can triage and take action
CREATE POLICY "Users and Pharmacists can update unsafe products" 
ON unsafe_products FOR UPDATE 
USING (
  auth.uid() = reporter_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
      AND profiles.role = 'pharmacist' 
      AND profiles.status = 'approved'
  )
);

-- Delete policy: Pharmacists or the original reporter can delete if pending
CREATE POLICY "Users and Pharmacists can delete unsafe products" 
ON unsafe_products FOR DELETE 
USING (
  auth.uid() = reporter_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
      AND profiles.role = 'pharmacist' 
      AND profiles.status = 'approved'
  )
);

-- ==============================================================================
-- 4. Supabase Storage Setup for Unsafe Products Images
-- ==============================================================================

-- Create public bucket 'unsafe-products' if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'unsafe-products', 
  'unsafe-products', 
  true, 
  10485760, -- 10MB limit per image (after client-side compression it will be ~200KB)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage Policies
DROP POLICY IF EXISTS "Public can view unsafe product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload unsafe product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete unsafe product images" ON storage.objects;

CREATE POLICY "Public can view unsafe product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'unsafe-products');

CREATE POLICY "Authenticated users can upload unsafe product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'unsafe-products' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete unsafe product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'unsafe-products' AND auth.role() = 'authenticated');
