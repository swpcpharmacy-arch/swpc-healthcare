# บันทึกข้อพึงระวังเชิงเทคนิคและสถาปัตยกรรม (DEVLOG) - SWPC Healthcare

เอกสารฉบับนี้รวบรวม **Gotchas**, จุดเสี่ยงทางเทคนิค (Critical Technical Traps), เหตุผลในการตัดสินใจเชิงสถาปัตยกรรม และแนวทางแก้ไขปัญหาที่เกิดขึ้นจริงระหว่างการพัฒนาโครงการ **SWPC Healthcare** เพื่อป้องกันการเกิดข้อผิดพลาดซ้ำเมื่อมีการส่งต่องานหรือพัฒนาต่อยอด

---

## 1. การป้องกัน RLS Infinite Recursion บนตาราง `profiles`

### ปัญหาที่พบ
เมื่อเขียนนโยบายความปลอดภัย (Row Level Security - RLS) เพื่อตรวจสอบว่าผู้ใช้ที่กำลังล็อกอินมีบทบาทเป็น `pharmacist` หรือไม่ เช่น:
```sql
-- ❌ ตัวอย่างที่ทำให้เกิด Infinite Recursion
CREATE POLICY "Pharmacists can view all profiles" ON public.profiles
FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'pharmacist'
);
```
คำสั่งด้านบนจะส่งผลให้ PostgreSQL ฟ้องข้อผิดพลาด:
```text
ERROR: infinite recursion detected in policy for relation "profiles"
```
เนื่องจากการประเมินเงื่อนไข Policy ของตาราง `profiles` จะวนกลับไป Query ที่ตาราง `profiles` ซ้ำอย่างไม่รู้จบ

### แนวทางแก้ไขที่ถูกต้อง
สร้าง Helper Function ที่มีคุณสมบัติ **`SECURITY DEFINER`** ในสกีมา `public` เพื่อให้ฟังก์ชันทำงานด้วยสิทธิ์ของผู้ออกแบบฐานข้อมูล (Bypass RLS ในระหว่างการตรวจสอบบทบาท):
```sql
-- ✅ แนวทางที่ถูกต้องใน fix_profiles_rls_and_trigger.sql
CREATE OR REPLACE FUNCTION public.is_admin_or_pharmacist()
RETURNS boolean AS $$
BEGIN
  -- บัญชี Superadmin พิเศษ
  IF (SELECT auth.jwt() ->> 'email') = 'swpc.pharmacy@gmail.com' THEN
    RETURN true;
  END IF;
  
  -- เภสัชกรที่ผ่านการอนุมัติแล้ว
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role = 'pharmacist' 
      AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
และใน Policy ทุกตัวที่ต้องการเช็คสิทธิ์ ให้เรียกใช้ `public.is_admin_or_pharmacist()` เท่านั้น

---

## 2. การรีโหลด Schema Cache ของ PostgREST (`NOTIFY pgrst`)

### ปัญหาที่พบ
หลังจากการเพิ่มคอลัมน์ใหม่ (เช่น `checklist_item_key` ใน `evidence_documents`) หรือการรันสคริปต์ Migration SQL ใน Supabase Dashboard แล้ว เมื่อ Next.js รัน Server Actions หรือ Query ข้อมูล จะพบข้อผิดพลาด:
```text
PGRST204: Could not find the 'checklist_item_key' column of 'evidence_documents' in the schema cache
```
เกิดจาก PostgREST ยังเก็บแคชสกีมาเดิมไว้ ไม่รับรู้โครงสร้างตารางใหม่ทันที

### แนวทางแก้ไข
เมื่อใดก็ตามที่มีการรันคำสั่ง DDL (`CREATE TABLE`, `ALTER TABLE`, `DROP CONSTRAINT`) ใน Supabase SQL Editor **ต้องสั่งคำสั่งด้านล่างนี้เสมอ**:
```sql
NOTIFY pgrst, 'reload schema';
```
เพื่อบังคับให้ PostgREST รีโหลด Schema Cache ทันทีโดยไม่ต้อง Restart โครงการ

---

## 3. รายการไฟล์โค้ดที่ผูกชื่อไฟล์ SQL ไว้ตรงๆ (Hardcoded SQL Filename)

### ข้อควรระวังระดับสูง (High Risk)
ไฟล์สคริปต์ SQL ชื่อ **`supabase_hospitals_and_admin_rpc.sql`** ในโฟลเดอร์ Root **ห้ามเปลี่ยนชื่อหรือย้ายโฟลเดอร์โดยเด็ดขาด**

### สาเหตุ
มีไฟล์ในระบบที่นำชื่อไฟล์นี้ไปใช้แจ้งเตือนผู้ใช้งาน/ผู้ดูแลระบบเมื่อเรียก RPC แล้วไม่พบฟังก์ชันในฐานข้อมูล:
1. [`src/app/auth/actions.ts`](file:///c:/SWPC/src/app/auth/actions.ts) - ฟังก์ชัน `adminResetPasswordAction()` (กลไกแจ้งเตือนเมื่อยังไม่ได้รันฟังก์ชัน `admin_set_user_password` ใน Supabase)
2. [`src/app/hospitals/actions.ts`](file:///c:/SWPC/src/app/hospitals/actions.ts) - ฟังก์ชันจัดการรายชื่อ รพ.สต. (กลไกแจ้งเตือนเมื่อยังไม่พบคอลัมน์/ตาราง `hospitals`)
3. [`src/components/admin/UserApprovalManager.tsx`](file:///c:/SWPC/src/components/admin/UserApprovalManager.tsx) - กล่องข้อความแจ้งเตือนคำแนะนำการรัน SQL สำหรับ Admin

> *หมายเหตุ:* หากต้องการเปลี่ยนชื่อหรือจัดระเบียบไฟล์ SQL ในอนาคต จะต้องค้นหาและแก้ไขข้อความแจ้งเตือนในทั้ง 3 ไฟล์นี้พร้อมกัน

---

## 4. สถาปัตยกรรมการจัดการพื้นที่จัดเก็บไฟล์ (Zero-Storage-Bloat)

โครงการตั้งอยู่บนบริการ Supabase Free Tier ซึ่งมีโควตา Storage ฟรี **1 GB** จึงมีการออกแบบแยกการจัดเก็บไฟล์เป็น 2 ระดับ:

### 1) ไฟล์ภาพถ่ายหน้างาน (ระบบเฝ้าระวังผลิตภัณฑ์ไม่ปลอดภัย `/unsafe-products`)
- **ปัญหา**: กล้องสมาร์ตโฟนในปัจจุบันถ่ายภาพขนาด 5–15 MB ต่อรูป หากอัปโหลดตรงๆ จะทำให้ Storage 1 GB เต็มอย่างรวดเร็ว
- **แนวทางแก้**: มี Client-side Canvas Image Compression ในหน้าเว็บก่อนอัปโหลด โดยจำกัดความกว้างสูงสุดไม่เกิน 1,200px คุณภาพ Web-friendly JPEG (ลดขนาดเหลือเฉลี่ยเพียง 150–300 KB ต่อภาพ)
- **วงจร Archiving**: ข้อมูลเคสที่ตรวจติดตามเสร็จสิ้น (`resolved`) สามารถระบุลิงก์ Google Drive เพื่อสำรองภาพ และมีกลไกย้าย/ลบภาพออกจาก Supabase Storage เพื่อคืนพื้นที่

### 2) ไฟล์เอกสารตรวจราชการขนาดใหญ่ (ระบบตรวจหลักฐาน `/evidence`)
- **ปัญหา**: ไฟล์รายงานสรุปผลงาน คู่มือ และเอกสารหลักฐานของ 19 รพ.สต. มีขนาดใหญ่มาก (PDF/Word รวมกันหลายกิกะไบต์)
- **แนวทางแก้**: **ไม่เก็บไฟล์เอกสารเหล่านี้ใน Supabase Storage** แต่ใช้สถาปัตยกรรมเก็บ **Google Drive Folder URL** แทน โดยผู้ใช้งานแชร์ลิงก์โฟลเดอร์ของ รพ.สต. นั้นๆ มาบันทึกในระบบ ทำให้ระบบสามารถใช้งานได้ยาวนานโดยไม่ติดเพดานโควตา

---

## 5. การจัดการหน้าพิมพ์เอกสารราชการ A4 (Print Stylesheet Isolation)

### ปัญหาที่พบ
การสั่งพิมพ์ (`window.print()`) จากหน้าเว็บทั่วไปมักจะมีปัญหา:
- Navbar, Sidebar, ปุ่มบันทึกข้อมูล, และตัวกรอง ติดเข้าไปในกระดาษพิมพ์
- เกิดหน้าว่างเกินมา (Blank trailing page) เนื่องจาก Margin หรือ Flexbox บนหน้าจอหลุดเข้าไปใน Print View
- ฟอนต์และตารางแตกในขณะพิมพ์

### สถาปัตยกรรมที่ใช้แก้ปัญหา
1. **แยกส่วนหน้าจอและส่วนพิมพ์เด็ดขาด**:
   - องค์ประกอบสำหรับหน้าจอทั้งหมดจะถูกห่อหุ้มด้วยคลาส `.screen-only`
   - ใน CSS มีการกำหนด `@media print { .screen-only { display: none !important; } }`
2. **องค์ประกอบสำหรับพิมพ์ (Print Sheet)**:
   - กำหนด `@page { size: A4 portrait; margin: 15mm 12mm 15mm 12mm; }`
   - ใช้ `break-inside-avoid` กับกล่องข้อความหรือแถวตาราง เพื่อป้องกันไม่ให้ข้อความถูกตัดกึ่งกลางระหว่างขึ้นหน้าใหม่
   - ใช้สีพื้นหลังขาวล้วนและเส้นตารางสีเทาเข้ม คมชัดสำหรับเครื่องพิมพ์ขาว-ดำ

---

## 6. การกำหนดมาตรฐานตัวจัดการแพ็กเกจ (Package Manager: npm 100%)

- **การตัดสินใจ**: โครงการยุติการใช้ `pnpm` และเปลี่ยนมาใช้ **`npm` 100%**
- **เหตุผล**: เครื่องปลายทางของบุคลากรและสภาพแวดล้อมมาตรฐานติดตั้ง Node.js พร้อม `npm` มาโดยกำเนิด การคงไฟล์ `pnpm-lock.yaml` ไว้ทำให้เกิดความสับสนและอาจเกิดปัญหารุ่นแพ็กเกจไม่ตรงกันเมื่อรันด้วย `npm install`
- **ข้อปฏิบัติ**: เมื่อมีการเพิ่มแพ็กเกจใหม่ ให้ใช้ `npm install <package-name>` เสมอ และห้ามสร้างหรือ Commit ไฟล์ `pnpm-lock.yaml` หรือ `yarn.lock` กลับเข้ามาอีก
