-- ==============================================================================
-- SWPC Healthcare: Evidence Management System Upgrade (/evidence)
-- Google Drive Link Management, Hospital Isolation, and Pharmacist Review
-- ==============================================================================

-- 1. Add required columns to evidence_documents
ALTER TABLE evidence_documents 
  ADD COLUMN IF NOT EXISTS hospital_name TEXT,
  ADD COLUMN IF NOT EXISTS checklist_item_key TEXT,
  ADD COLUMN IF NOT EXISTS checklist_item_title TEXT,
  ADD COLUMN IF NOT EXISTS fiscal_year INTEGER DEFAULT 2568 NOT NULL,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS review_comment TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  ADD COLUMN IF NOT EXISTS last_updated_by UUID REFERENCES profiles(id);

-- Update status check constraint
ALTER TABLE evidence_documents DROP CONSTRAINT IF EXISTS evidence_documents_status_check;
ALTER TABLE evidence_documents ADD CONSTRAINT evidence_documents_status_check 
  CHECK (status IN ('draft', 'submitted', 'verified', 'needs_revision'));

-- 2. Add Unique constraint for (hospital_name, fiscal_year, checklist_item_key)
-- This enables reliable Upsert operations per hospital per item
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'evidence_documents_hospital_year_item_key'
  ) THEN
    ALTER TABLE evidence_documents 
      ADD CONSTRAINT evidence_documents_hospital_year_item_key 
      UNIQUE (hospital_name, fiscal_year, checklist_item_key);
  END IF;
END $$;

-- Grant table-level permissions to Supabase roles
GRANT ALL ON TABLE public.evidence_documents TO authenticated, anon, service_role;

-- 3. Enable RLS
ALTER TABLE evidence_documents ENABLE ROW LEVEL SECURITY;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Drop previous policies to avoid duplication
DROP POLICY IF EXISTS "Anyone logged in can view evidence documents" ON evidence_documents;
DROP POLICY IF EXISTS "Staff can insert evidence documents" ON evidence_documents;
DROP POLICY IF EXISTS "Staff can update own evidence documents" ON evidence_documents;
DROP POLICY IF EXISTS "Users and Pharmacists can insert evidence" ON evidence_documents;
DROP POLICY IF EXISTS "Users and Pharmacists can update evidence" ON evidence_documents;
DROP POLICY IF EXISTS "Users and Pharmacists can delete evidence" ON evidence_documents;

-- Select policy: All authenticated users can view evidence
CREATE POLICY "Anyone logged in can view evidence documents" 
ON evidence_documents FOR SELECT 
USING (auth.role() = 'authenticated');

-- Insert policy: Authenticated staff can insert evidence
CREATE POLICY "Users and Pharmacists can insert evidence" 
ON evidence_documents FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated'
);

-- Update policy: Creator, hospital staff or Pharmacists can update
CREATE POLICY "Users and Pharmacists can update evidence" 
ON evidence_documents FOR UPDATE 
USING (
  auth.uid() = staff_id OR
  auth.uid() = last_updated_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
      AND (
        profiles.role = 'pharmacist' OR 
        profiles.hospital_name = evidence_documents.hospital_name
      )
  )
)
WITH CHECK (
  auth.role() = 'authenticated'
);

-- Delete policy: Creator or Pharmacists can delete
CREATE POLICY "Users and Pharmacists can delete evidence" 
ON evidence_documents FOR DELETE 
USING (
  auth.uid() = staff_id OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
      AND profiles.role = 'pharmacist'
  )
);
