# เอกสารส่งต่องานสำหรับ AI และนักพัฒนา (HANDOFF) - SWPC Healthcare

> **คำแนะนำสำหรับ AI หรือผู้พัฒนาที่มารับช่วงต่อ:**
> กรุณาอ่านเอกสารฉบับนี้ก่อนเริ่มทำงานต่อ เพื่อเข้าใจภาพรวมสถาปัตยกรรม กฎเหล็ก และสถานะล่าสุดของโครงการโดยไม่ต้องเริ่มต้นสำรวจโค้ดใหม่ทั้งหมด

---

## 1. บริบทโครงการและสถานะล่าสุด (Current Project State)

- **ชื่อโครงการ**: SWPC Healthcare (ระบบบริหารจัดการงานเภสัชกรรมปฐมภูมิและงานคุ้มครองผู้บริโภคด้านสุขภาพ เครือข่าย อ.สวรรคโลก จ.สุโขทัย)
- **เวอร์ชันปัจจุบัน**: `v1.0.0` (Production Baseline)
- **Package Manager**: **`npm` 100%** (ห้ามใช้ `pnpm` หรือ `yarn`)
- **สภาพแวดล้อม**: Node.js v20.x / v22.x, Next.js 15.5+, React 19, Supabase (PostgreSQL 15+, Auth, Storage, RLS)

### สรุปสถานะ 5 โมดูลหลักที่เปิดใช้งานแล้ว
| เส้นทาง (Route) | สถานะความพร้อม | ฟังก์ชันหลักที่ทำงานได้แล้ว |
| :--- | :---: | :--- |
| `/login`, `/register`, `/dashboard` | ✅ สมบูรณ์ 100% | ล็อกอิน, สมัครสมาชิก, อนุมัติผู้ใช้ 3 ระดับ, จัดการ 19 รพ.สต., กำหนดเภสัชกรผู้ดูแล, รีเซ็ตรหัสผ่าน (Admin UI อยู่บนหน้า `/dashboard`) |
| `/criteria` | ✅ สมบูรณ์ 100% | แสดงและแก้ไขเกณฑ์มาตรฐานส่วนที่ 7 (8 หมวด 82 คะแนน) พร้อมระบบคลังความรู้ |
| `/me` | ✅ สมบูรณ์ 100% | บันทึกรายงานความคลาดเคลื่อนทางยา (ระดับ A–I), จำแนก 4 ขั้นตอน, ส่งออกพิมพ์ A4 ผ่านโมดอลรายงาน (`MEPrintReport`) |
| `/unsafe-products` | ✅ สมบูรณ์ 100% | เฝ้าระวังยาชุด/สเตียรอยด์, บีบอัดภาพหน้างานฝั่ง Client, อัปโหลด Storage, จัดการ 4 สถานะความเสี่ยง, สำรอง Google Drive, รายงานพิมพ์ A4 (`UnsafeProductsPrintReport`) |
| `/evidence` | ✅ สมบูรณ์ 100% | เชื่อมโยง Google Drive Link ราย รพ.สต. และปีงบประมาณ, ระบบตรวจและ Comment, หน้าพิมพ์สรุปผลงานตรวจราชการ A4 (`EvidencePrintReport`) |

---

## 2. กฎเหล็กเชิงสถาปัตยกรรม (Architectural Guardrails - DO NOT BREAK)

1. **ห้ามเปลี่ยนชื่อหรือย้ายตำแหน่งไฟล์ SQL นี้:**
   `supabase_hospitals_and_admin_rpc.sql` ใน Root ถูกอ้างอิงชื่อไฟล์ตรงในโค้ดแจ้งเตือนที่:
   - `src/app/auth/actions.ts`
   - `src/app/hospitals/actions.ts`
   - `src/components/admin/UserApprovalManager.tsx`
2. **การเขียน RLS บนตาราง `profiles`:**
   ห้ามเขียน Subquery วนหา Role ในตาราง `profiles` โดยตรง ให้ใช้ฟังก์ชัน `public.is_admin_or_pharmacist()` ซึ่งมีสิทธิ์ `SECURITY DEFINER` เพื่อป้องกัน Infinite Recursion
3. **การรีโหลด Schema หลังรัน SQL:**
   ทุกครั้งที่มีการแก้ Schema ใน Supabase ให้รันคำสั่ง `NOTIFY pgrst, 'reload schema';` ทันที
4. **โครงสร้างการพิมพ์เอกสารราชการ (Print Views):**
   ส่วนของหน้าจอทั้งหมดต้องครอบด้วย `<div className="screen-only">` เสมอ และส่วนพิมพ์ต้องแยกคลาสสำหรับ `@media print` ชัดเจน
5. **นโยบายการจัดเก็บไฟล์ (Zero Quota Bloat):**
   - งานตรวจหลักฐาน (`/evidence`): ใช้การเก็บ URL Google Drive Folder ห้ามอัปโหลด PDF/Word ขนาดใหญ่ขึ้น Supabase Storage
   - ภาพถ่ายหน้างาน (`/unsafe-products`): ต้องบีบอัดผ่าน HTML Canvas ฝั่ง Client ก่อนส่งขึ้น Bucket `unsafe-product-images` เสมอ

---

## 3. งานที่ต้องทำในระยะถัดไป (Next Tasks & Roadmap)

### ระยะที่ 2: Data Engine (เป้าหมาย: v1.1.0)
1. **ระบบส่งออก Excel / CSV สำหรับ Medication Errors (ME)**:
   - สรุปแยกตามหน่วยงาน (19 รพ.สต. + รพ.สวรรคโลก)
   - สรุปแยกตามระดับความรุนแรง A–I (เน้นกลุ่ม E–I)
   - ส่งออกข้อมูลขั้นตอนที่เกิดอุบัติการณ์ (Prescribing, Transcribing, Dispensing, Administering)
2. **ระบบส่งออกทะเบียนผลิตภัณฑ์ไม่ปลอดภัยและประวัติร้านชำ**:
   - ส่งออกรายการเฝ้าระวัง ผลการตรวจชุดทดสอบ (Test kit) และการส่งต่อพิกัด
3. **ระบบคำนวณคะแนนเกณฑ์ส่วนที่ 7 อัตโนมัติ (Auto-Scoring Engine)**:
   - ดึงสถานะจาก `evidence_documents` ที่ได้รับสถานะ `verified`
   - รวมคะแนนอัตโนมัติเทียบกับคะแนนเต็ม 82 คะแนน แสดงบนหน้า Dashboard

### ระยะที่ 3: Community Alerts & Field Operations (เป้าหมาย: v1.2.0)
1. **ระบบแจ้งเตือนอุบัติการณ์ฉุกเฉิน (Emergency Alert Dispatcher)**:
   - แจ้งเตือนเมื่อเกิด ME รุนแรง (ระดับ E–I) หรือพบสารสเตียรอยด์ในยาชุด
   - **ช่องทางหลัก (Primary)**: LINE Messaging API ส่งข้อความแจ้งเตือนพร้อมลิงก์เคส
   - **สถาปัตยกรรมสำรอง (Fallback / Alternative Webhook)**:
     - *เหตุผล*: บัญชีฟรีของ LINE มีข้อจำกัดโควตา Push Message อยู่ที่ 200 ข้อความ/เดือน
     - *การออกแบบ*: ออกแบบ Service Layer สำหรับส่งแจ้งเตือนแบบ Hybrid:
       ```typescript
       // สถาปัตยกรรมแจ้งเตือนสำรอง
       async function dispatchAlert(payload: AlertPayload) {
         try {
           if (hasLineQuotaRemaining()) {
             await sendLineNotification(payload);
             return;
           }
         } catch (error) {
           console.warn('LINE API failed or quota exceeded, switching to fallback webhook', error);
         }
         // Fallback ไปยัง Discord Webhook หรือ Telegram Bot Webhook โดยอัตโนมัติ
         await sendFallbackWebhook(payload); // Discord/Telegram
       }
       ```
2. **Mobile PWA Optimization**:
   - ปรับแต่งการแสดงผลแบบ Mobile-first สำหรับเจ้าหน้าที่และ อสม. กรอกข้อมูลขณะลงพื้นที่

---

## 4. แม่แบบคำสั่งส่งต่องานสำหรับ AI (Prompt Template for Next AI)

หากต้องเปิดแชทใหม่หรือสลับโมเดล AI ให้คัดลอกข้อความด้านล่างนี้ไปวางในคำสั่งแรกได้ทันที:

```markdown
คุณกำลังทำงานในโครงการ "SWPC Healthcare" (ระบบสารสนเทศงานเภสัชกรรมปฐมภูมิและคุ้มครองผู้บริโภคด้านสุขภาพ อ.สวรรคโลก จ.สุโขทัย)
- เวอร์ชันปัจจุบัน: v1.0.0 (Baseline สมบูรณ์แล้ว 5 โมดูล: /(auth) & /dashboard (ระบบยืนยันตัวตนและจัดการระบบ), /criteria, /me (Medication Errors), /unsafe-products, /evidence)
- เทคโนโลยี: Next.js 15.5, React 19, Tailwind CSS, Supabase (PostgreSQL 15+, Auth, RLS, Storage)
- มาตรฐาน Package Manager: npm 100% (ห้ามใช้ pnpm/yarn)
- ไฟล์อ้างอิงสำคัญ:
  1. เอกสารภาพรวม: README.md
  2. กฎเหล็กและ Gotchas: DEVLOG.md
  3. ประวัติการพัฒนา: CHANGELOG.md
  4. สถานะและแผนงาน: HANDOFF.md
- กฎสำคัญ: ห้ามเปลี่ยนชื่อหรือย้ายไฟล์ supabase_hospitals_and_admin_rpc.sql เพราะมีโค้ดในระบบอ้างอิงตรง
- เป้าหมายถัดไปที่ต้องการให้คุณทำ: [ระบุงานที่ต้องการ เช่น พัฒนาระบบ Export Excel ใน v1.1.0 หรือ ออกแบบ Hybrid Webhook Fallback ใน v1.2.0]
```
