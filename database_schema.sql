-- Database Schema for SWPC Healthcare (Primary Care Pharmacy Services)

-- 1. Users Table (handled partly by Supabase Auth, but we need profile info)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('staff', 'pharmacist')) NOT NULL,
  hospital_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Evaluation Criteria (Part 7)
CREATE TABLE evaluation_criteria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- e.g., 'ด้านการจัดบริการเภสัชกรรม', 'งานคุ้มครองผู้บริโภคด้านสุขภาพ'
  title TEXT NOT NULL,
  points_possible INTEGER NOT NULL,
  knowledge_base TEXT, -- HTML or Markdown content
  last_updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Medication Errors (ME)
CREATE TABLE medication_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) NOT NULL,
  report_date DATE DEFAULT CURRENT_DATE NOT NULL,
  patient_hn TEXT,
  drug_name TEXT,
  error_type TEXT NOT NULL, -- e.g., 'Prescribing', 'Dispensing', 'Administration'
  severity TEXT NOT NULL, -- e.g., 'A', 'B', 'C', 'D' to 'I'
  contributing_factor TEXT,
  description TEXT NOT NULL,
  actions_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Unsafe Products
CREATE TABLE unsafe_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) NOT NULL,
  product_name TEXT NOT NULL,
  location_found TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged')) NOT NULL,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Evidence Documents / Checklist
CREATE TABLE evidence_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES profiles(id) NOT NULL,
  criteria_id UUID REFERENCES evaluation_criteria(id) NOT NULL,
  document_link TEXT NOT NULL, -- Google Drive Link or Supabase Storage Path
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed Initial Data for Evaluation Criteria
INSERT INTO evaluation_criteria (category, title, points_possible) VALUES
('ด้านการจัดบริการเภสัชกรรม (64 คะแนน)', 'การบริหารจัดการระบบยา', 16),
('ด้านการจัดบริการเภสัชกรรม (64 คะแนน)', 'การคัดเลือก การส่งมอบยาที่ปลอดภัยและมีคุณภาพ', 16),
('ด้านการจัดบริการเภสัชกรรม (64 คะแนน)', 'คลังยาและเวชภัณฑ์ หรือ ตู้เก็บยา', 16),
('ด้านการจัดบริการเภสัชกรรม (64 คะแนน)', 'การใช้ยาอย่างปลอดภัยและมีความสมเหตุผล (RDU)', 16),
('งานคุ้มครองผู้บริโภคด้านสุขภาพ (คบส.) (18 คะแนน)', 'การบริหารจัดการงาน คบส. ระดับอำเภอ', 3),
('งานคุ้มครองผู้บริโภคด้านสุขภาพ (คบส.) (18 คะแนน)', 'การตรวจสอบ เฝ้าระวัง อาหารสด อาหารแปรรูป', 3),
('งานคุ้มครองผู้บริโภคด้านสุขภาพ (คบส.) (18 คะแนน)', 'การตรวจสอบร้านค้า/ร้านชำและบ้านผู้ป่วย', 3),
('งานคุ้มครองผู้บริโภคด้านสุขภาพ (คบส.) (18 คะแนน)', 'องค์ความรู้ด้านผลิตภัณฑ์สุขภาพของผู้จำหน่าย', 3),
('งานคุ้มครองผู้บริโภคด้านสุขภาพ (คบส.) (18 คะแนน)', 'การพัฒนาศักยภาพผู้บริโภค (อสม., นักเรียน)', 3),
('งานคุ้มครองผู้บริโภคด้านสุขภาพ (คบส.) (18 คะแนน)', 'การมีส่วนร่วมของเครือข่าย', 3);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsafe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_documents ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Pharmacists can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'pharmacist' AND status = 'approved')
);
CREATE POLICY "Pharmacists can update profiles status" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'pharmacist' AND status = 'approved')
);

-- Policies for evaluation_criteria
CREATE POLICY "Anyone logged in can view evaluation criteria" ON evaluation_criteria FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Pharmacists can update evaluation criteria" ON evaluation_criteria FOR UPDATE USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'pharmacist');

-- Policies for medication_errors
CREATE POLICY "Staff can report ME" ON medication_errors FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Staff can view their own reports" ON medication_errors FOR SELECT USING (auth.uid() = reporter_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'pharmacist');
CREATE POLICY "Users and Pharmacists can delete ME" ON medication_errors FOR DELETE USING (auth.uid() = reporter_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'pharmacist');

-- Policies for unsafe_products
CREATE POLICY "Anyone logged in can view unsafe products" ON unsafe_products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can report unsafe products" ON unsafe_products FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Pharmacists can update status" ON unsafe_products FOR UPDATE USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'pharmacist');

-- Policies for evidence_documents
CREATE POLICY "Anyone logged in can view evidence documents" ON evidence_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can insert evidence documents" ON evidence_documents FOR INSERT WITH CHECK (auth.uid() = staff_id);
CREATE POLICY "Staff can update own evidence documents" ON evidence_documents FOR UPDATE USING (auth.uid() = staff_id);
