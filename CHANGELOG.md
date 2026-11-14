# บันทึกการเปลี่ยนแปลง (Changelog) - SWPC Healthcare

เอกสารบันทึกประวัติการเปลี่ยนแปลงทั้งหมดของโครงการ **SWPC Healthcare** โดยอ้างอิงรูปแบบตามข้อกำหนดของ [Keep a Changelog](https://keepachangelog.com/th/1.0.0/) และยึดตามหลักการกำหนดเลขเวอร์ชัน [Semantic Versioning (SemVer)](https://semver.org/lang/th/).

---

## [Unreleased]

### Planned (v1.1.0 - Data Engine)
- **Data Export**: ส่งออกรายงาน Medication Errors (ME) เป็นไฟล์ Excel (.xlsx) และ CSV พร้อมแยกหมวดความรุนแรง A–I
- **Product Registry Export**: ส่งออกรายการผลิตภัณฑ์ไม่ปลอดภัยและประวัติร้านชำในชุมชน
- **Auto-Scoring**: ระบบคำนวณและสรุปคะแนนเกณฑ์ส่วนที่ 7 (82 คะแนน) อัตโนมัติจากสถานะ `verified` ในระบบตรวจหลักฐาน

### Planned (v1.2.0 - Community Alerts & Field Operation)
- **Emergency Notifications**:
  - ระบบแจ้งเตือนอุบัติการณ์รุนแรง (ME ระดับ E–I และการตรวจพบสเตียรอยด์ปนเปื้อนในยาชุด/สมุนไพร)
  - ช่องทางหลัก: **LINE Messaging API** ส่งแจ้งเตือนตรงสู่กลุ่มงานเภสัชกรรมเครือข่าย
  - **Webhook Fallback Architecture**: ระบบสลับส่งแจ้งเตือนสำรองผ่าน **Discord Webhook / Telegram Webhook** เมื่อ LINE มีปัญหาหรือติดเพดานโควตาฟรี 200 ข้อความ/เดือน
- **Mobile PWA**: ปรับปรุงหน้าจอสำหรับสมาร์ตโฟนเพื่อความสะดวกของเจ้าหน้าที่ รพ.สต. และ อสม. ในการเก็บข้อมูลภาคสนาม

---

## [1.0.0] - 2026-11-14

### Added
- **ระบบยืนยันตัวตนและการจัดการผู้ใช้งาน (Auth & Admin Management)**:
  - รองรับการลงทะเบียนและเข้าสู่ระบบผ่าน Supabase Auth
  - รองรับระบบสถานะผู้ใช้งาน 3 ระดับ (`pending`, `staff`, `pharmacist`)
  - ตาราง `hospitals` และระบบจัดการรายชื่อ รพ.สต./สอน./ศสม. ทั้ง 19 แห่งในเครือข่าย อ.สวรรคโลก
  - ฟังก์ชัน Stored Procedures (RPC) สำหรับผู้ดูแลระบบ: รีเซ็ตรหัสผ่าน, อนุมัติ/ระงับผู้ใช้งาน, กำหนดเภสัชกรผู้รับผิดชอบประจำ รพ.สต.
- **ระบบเกณฑ์มาตรฐานส่วนที่ 7 (Part 7 Evaluation Criteria)**:
  - ตาราง `evaluation_criteria` บรรจุเกณฑ์มาตรฐาน 8 หมวด รวม 82 คะแนน
  - ระบบคลังความรู้ (Knowledge Base) สำหรับอธิบายรายละเอียดและแนวทางปฏิบัติของแต่ละเกณฑ์
- **ระบบเฝ้าระวังความคลาดเคลื่อนทางยา (Medication Errors)**:
  - เส้นทาง `/me`: แบบฟอร์มรายงานอุบัติการณ์ตามระดับความรุนแรง A ถึง I (มาตรฐาน NCC MERP)
  - จำแนกขั้นตอนความผิดพลาด: สั่งยา (Prescribing), ถอดคำสั่ง (Transcribing), จัดยา/จ่ายยา (Dispensing), และบริหารยา (Administering)
  - หน้ารายงานรายละเอียดอุบัติการณ์พร้อมโมดอลพิมพ์รายงานมาตรฐานกระดาษ A4 (`MEPrintReport`)
- **ระบบเฝ้าระวังผลิตภัณฑ์สุขภาพไม่ปลอดภัยในชุมชน (Unsafe Products Surveillance)**:
  - รองรับการเฝ้าระวัง ยาชุด, ยาสเตียรอยด์, อาหารปลอมปน, และเครื่องสำอางอันตราย (`/unsafe-products`)
  - วงจรการจัดการความเสี่ยง 4 ขั้นตอน: `pending` → `investigating` → `action_taken` → `resolved`
  - ระบบบีบอัดรูปภาพหน้างานฝั่ง Client อัตโนมัติก่อนส่งขึ้น Supabase Storage (`unsafe-product-images`)
  - ระบบบันทึกส่งต่อพิกัดร้านค้า/ร้านชำ, ลิงก์สำรองหลักฐานขึ้น Google Drive พร้อมรายงานพิมพ์ A4 (`UnsafeProductsPrintReport`)
- **ระบบบริหารจัดการและตรวจหลักฐานการประเมิน (Evidence Management)**:
  - ระบบบันทึกลิงก์ Google Drive Folder แยกตามหมวดเกณฑ์ส่วนที่ 7 และปีงบประมาณ (`/evidence`)
  - สถาปัตยกรรมแยกข้อมูลราย รพ.สต. (Hospital Isolation) พร้อม Hospital Switcher สำหรับเภสัชกร
  - วงจรการตรวจหลักฐาน: `draft` → `submitted` → `verified` / `needs_revision` พร้อมระบบ Comment ให้คำแนะนำ
  - หน้ารายงานสรุปผลการประเมินและคะแนนสำหรับพิมพ์เอกสารราชการ A4 ผ่านคอมโพเนนต์พิมพ์ (`EvidencePrintReport`)
- **เอกสารมาตรฐาน 4 เสาหลักของโครงการ**:
  - `README.md`: คู่มือภาพรวม การติดตั้ง Quick Start และขั้นตอนการรัน SQL
  - `CHANGELOG.md`: บันทึกประวัติการพัฒนาโครงการ
  - `DEVLOG.md`: บันทึกข้อควรระวังเชิงเทคนิค (Gotchas) และแนวทางการแก้ไขเชิงลึก
  - `HANDOFF.md`: เอกสารส่งต่องานสำหรับ AI และผู้พัฒนา พร้อม Prompt Template
- **Package Manager Standardization**:
  - เปลี่ยนมาใช้ `npm` 100% พร้อมสร้าง `package-lock.json` และยกเลิก `pnpm-lock.yaml`

### Changed
- ปรับเลขเวอร์ชันโครงการใน `package.json` เป็น `1.0.0`
- ปรับโครงสร้าง CSS การพิมพ์ทั่วทั้งระบบ โดยใช้คลาส `.screen-only` ครอบ UI หน้าจอ และใช้ `@media print` จัดหน้ารายงาน A4 ไม่ให้องค์ประกอบหน้าจอปะปนในเอกสารพิมพ์

### Security
- ติดตั้ง Row Level Security (RLS) บนทุกตารางหลักใน Supabase
- แก้ปัญหา Infinite Recursion ของ RLS บนตาราง `profiles` ด้วยฟังก์ชัน `is_admin_or_pharmacist()` ที่ทำงานด้วยสิทธิ์ `SECURITY DEFINER`
