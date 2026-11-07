-- ==============================================================================
-- FIX FOR PROFILES: Permissions, Non-recursive RLS, Auto-sync Trigger & Backfill
-- รันโค้ดชุดนี้ใน Supabase SQL Editor เพื่อแก้ปัญหา RLS Recursion และดึงรายชื่อผู้สมัครกลับมาทันที
-- ==============================================================================

-- 1. ให้สิทธิ์ Table Permissions แก่ authenticated และ anon
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.profiles TO anon, authenticated;

-- 2. สร้าง Helper Function สำหรับตรวจสอบสิทธิ์ Admin / Pharmacist (SECURITY DEFINER ป้องกัน Infinite Recursion)
CREATE OR REPLACE FUNCTION public.is_admin_or_pharmacist()
RETURNS boolean AS $$
BEGIN
  -- ถ้าเป็นอีเมลผู้ดูแลระบบเครือข่าย ให้สิทธิ์ทันที
  IF (SELECT auth.jwt() ->> 'email') = 'swpc.pharmacy@gmail.com' THEN
    RETURN true;
  END IF;
  
  -- ถ้าเป็นเภสัชกรที่ได้รับการอนุมัติแล้ว
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role = 'pharmacist' 
      AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ลบ Policies เดิมของ profiles ที่อาจติด Loop หรือสิทธิ์ไม่พอ
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Pharmacists can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Pharmacists can update profiles status" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or Pharmacist can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or Pharmacist can update any" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- 4. สร้าง Policies ใหม่ที่ทำงานได้อย่างถูกต้อง ไม่เกิด Infinite Recursion
-- ให้ทุกคนที่ login ดูโปรไฟล์ตัวเองได้ และเภสัชกร/Admin ดูได้ทุกคน
CREATE POLICY "Users can view own profile or Pharmacist can view all" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = id OR public.is_admin_or_pharmacist());

-- อนุญาตให้เพิ่มโปรไฟล์ (ทั้ง user เอง และ trigger)
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

-- เจ้าของโปรไฟล์แก้ของตัวเองได้ และ เภสัชกร/Admin อนุมัติปรับสถานะได้ทุกคน
CREATE POLICY "Users can update own profile or Pharmacist can update any" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id OR public.is_admin_or_pharmacist());

-- 5. สร้าง Trigger อัตโนมัติ: เมื่อมีผู้ใช้งานสมัครใน auth.users ให้เพิ่มเข้า profiles ทันที
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, hospital_name, status, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    CASE 
      WHEN lower(trim(new.email)) = 'swpc.pharmacy@gmail.com' THEN 'pharmacist'
      ELSE COALESCE(new.raw_user_meta_data->>'role', 'staff')
    END,
    COALESCE(new.raw_user_meta_data->>'hospital_name', 'รพ.สต. ในเครือข่าย'),
    CASE 
      WHEN lower(trim(new.email)) = 'swpc.pharmacy@gmail.com' THEN 'approved'
      ELSE 'pending'
    END,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    role = CASE WHEN lower(trim(EXCLUDED.email)) = 'swpc.pharmacy@gmail.com' THEN 'pharmacist' ELSE COALESCE(EXCLUDED.role, public.profiles.role) END,
    hospital_name = COALESCE(EXCLUDED.hospital_name, public.profiles.hospital_name),
    status = CASE WHEN lower(trim(EXCLUDED.email)) = 'swpc.pharmacy@gmail.com' THEN 'approved' ELSE public.profiles.status END;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ดึงข้อมูลผู้ใช้งานเดิมทั้งหมดที่เคยสมัครใน auth.users (รวมถึง จนท. รพ.สต. ที่เพิ่งกดสมัครไป) เข้า profiles ทันที!
INSERT INTO public.profiles (id, email, full_name, role, hospital_name, status, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  CASE 
    WHEN lower(trim(email)) = 'swpc.pharmacy@gmail.com' THEN 'pharmacist'
    ELSE COALESCE(raw_user_meta_data->>'role', 'staff')
  END,
  COALESCE(raw_user_meta_data->>'hospital_name', 'รพ.สต. ในเครือข่าย'),
  CASE 
    WHEN lower(trim(email)) = 'swpc.pharmacy@gmail.com' THEN 'approved'
    ELSE 'pending'
  END,
  created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;
