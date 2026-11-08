-- ==============================================================================
-- Migration: Hospitals / PCU / PCC Management, Pharmacist Assignment & Admin RPC
-- รันโค้ดชุดนี้ใน Supabase SQL Editor
-- ==============================================================================

-- 1. Table: hospitals
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  unit_type TEXT DEFAULT 'pcu' CHECK (unit_type IN ('hospital', 'pcc', 'pcu', 'sso', 'other')) NOT NULL,
  responsible_pharmacist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- เพิ่ม column unit_type หากมีตารางเดิมอยู่แล้ว
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'hospitals' AND column_name = 'unit_type'
  ) THEN
    ALTER TABLE public.hospitals ADD COLUMN unit_type TEXT DEFAULT 'pcu' CHECK (unit_type IN ('hospital', 'pcc', 'pcu', 'sso', 'other'));
  END IF;
END $$;

-- 2. Enable RLS on hospitals
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for hospitals
DROP POLICY IF EXISTS "Anyone logged in can view hospitals" ON public.hospitals;
CREATE POLICY "Anyone logged in can view hospitals"
ON public.hospitals FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Pharmacists can manage hospitals" ON public.hospitals;
CREATE POLICY "Pharmacists can manage hospitals"
ON public.hospitals FOR ALL
TO authenticated
USING (public.is_admin_or_pharmacist())
WITH CHECK (public.is_admin_or_pharmacist());

-- 4. RPC: admin_set_user_password (เปลี่ยนรหัสผ่านโดย Admin/Pharmacist เท่านั้น)
CREATE OR REPLACE FUNCTION public.admin_set_user_password(target_user_id UUID, new_password TEXT)
RETURNS boolean AS $$
BEGIN
  IF NOT public.is_admin_or_pharmacist() THEN
    RAISE EXCEPTION 'Unauthorized: only approved pharmacists or admin can reset passwords.';
  END IF;

  IF length(new_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters.';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = target_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Seed / Upsert Official Healthcare Facilities (โรงพยาบาล, PCC, PCU)
INSERT INTO public.hospitals (name, code, unit_type, display_order)
VALUES
  ('โรงพยาบาลสวรรคโลก', '11248', 'hospital', 1),
  ('สำนักงานสาธารณสุขอำเภอสวรรคโลก (สสอ.)', 'sso', 'sso', 2),
  ('เทศบาลเมืองสวรรคโลก', '14857', 'pcc', 3),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลคลองกระจง', '07450', 'pcu', 4),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลวังพิณพาทย์', '07451', 'pcu', 5),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลวังไม้ขอน', '07452', 'pcu', 6),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลย่านยาว', '07453', 'pcu', 7),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลนาทุ่ง', '07454', 'pcu', 8),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลคลองยาง', '07455', 'pcu', 9),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านไผ่ตะล่อม ตำบลคลองยาง', '07456', 'pcu', 10),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลเมืองบางยม', '07457', 'pcu', 11),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลท่าทอง', '07458', 'pcu', 12),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลปากน้ำ', '07459', 'pcu', 13),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลป่ากุมเกาะ', '07460', 'pcu', 14),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลเมืองบางขลัง', '07461', 'pcu', 15),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลหนองกลับ', '07462', 'pcu', 16),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านมาบป่าเลา ตำบลปากน้ำ', '14051', 'pcu', 17),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านใหม่โพธิ์งาม ตำบลป่ากุมเกาะ', '14052', 'pcu', 18),
  ('โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านขอนซุง ตำบลเมืองบางขลัง', '14053', 'pcu', 19),
  ('หน่วยบริการอื่นในเครือข่าย', 'other', 'other', 99)
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  unit_type = EXCLUDED.unit_type,
  display_order = EXCLUDED.display_order;

-- 6. ปรับชื่อใน profiles และ medication_errors เดิมให้ตรงกับชื่อทางการใหม่
UPDATE public.profiles SET hospital_name = 'โรงพยาบาลส่งเสริมสุขภาพตำบลหนองกลับ' WHERE hospital_name IN ('รพ.สต. หนองกลับ', 'หนองกลับ');
UPDATE public.profiles SET hospital_name = 'โรงพยาบาลสวรรคโลก' WHERE hospital_name IN ('โรงพยาบาลสวรรคโลก (แม่ข่าย)', 'รพ.สวรรคโลก');

UPDATE public.medication_errors SET hospital_name = 'โรงพยาบาลส่งเสริมสุขภาพตำบลหนองกลับ' WHERE hospital_name IN ('รพ.สต. หนองกลับ', 'หนองกลับ');
UPDATE public.medication_errors SET hospital_name = 'โรงพยาบาลสวรรคโลก' WHERE hospital_name IN ('โรงพยาบาลสวรรคโลก (แม่ข่าย)', 'รพ.สวรรคโลก');
