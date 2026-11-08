export interface HospitalOption {
  id: string;
  code: string;
  name: string;
  unit_type: 'hospital' | 'pcc' | 'pcu' | 'sso' | 'other';
}

export const HOSPITALS: HospitalOption[] = [
  { id: 'hosp_11248', code: '11248', name: 'โรงพยาบาลสวรรคโลก', unit_type: 'hospital' },
  { id: 'sso_swpc', code: 'sso', name: 'สำนักงานสาธารณสุขอำเภอสวรรคโลก (สสอ.)', unit_type: 'sso' },
  { id: 'pcc_14857', code: '14857', name: 'เทศบาลเมืองสวรรคโลก', unit_type: 'pcc' },
  { id: 'pcu_07450', code: '07450', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลคลองกระจง', unit_type: 'pcu' },
  { id: 'pcu_07451', code: '07451', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลวังพิณพาทย์', unit_type: 'pcu' },
  { id: 'pcu_07452', code: '07452', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลวังไม้ขอน', unit_type: 'pcu' },
  { id: 'pcu_07453', code: '07453', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลย่านยาว', unit_type: 'pcu' },
  { id: 'pcu_07454', code: '07454', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลนาทุ่ง', unit_type: 'pcu' },
  { id: 'pcu_07455', code: '07455', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลคลองยาง', unit_type: 'pcu' },
  { id: 'pcu_07456', code: '07456', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านไผ่ตะล่อม ตำบลคลองยาง', unit_type: 'pcu' },
  { id: 'pcu_07457', code: '07457', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลเมืองบางยม', unit_type: 'pcu' },
  { id: 'pcu_07458', code: '07458', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลท่าทอง', unit_type: 'pcu' },
  { id: 'pcu_07459', code: '07459', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลปากน้ำ', unit_type: 'pcu' },
  { id: 'pcu_07460', code: '07460', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลป่ากุมเกาะ', unit_type: 'pcu' },
  { id: 'pcu_07461', code: '07461', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลเมืองบางขลัง', unit_type: 'pcu' },
  { id: 'pcu_07462', code: '07462', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลหนองกลับ', unit_type: 'pcu' },
  { id: 'pcu_14051', code: '14051', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านมาบป่าเลา ตำบลปากน้ำ', unit_type: 'pcu' },
  { id: 'pcu_14052', code: '14052', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านใหม่โพธิ์งาม ตำบลป่ากุมเกาะ', unit_type: 'pcu' },
  { id: 'pcu_14053', code: '14053', name: 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านขอนซุง ตำบลเมืองบางขลัง', unit_type: 'pcu' },
  { id: 'other', code: 'other', name: 'หน่วยบริการอื่นในเครือข่าย', unit_type: 'other' },
];

export const USER_ROLES = [
  { 
    id: 'staff', 
    label: 'เจ้าหน้าที่ PCU / PCC / รพ.สต. (Staff)', 
    description: 'บันทึก ME, แจ้งผลิตภัณฑ์ไม่ปลอดภัย, แนบหลักฐานประเมิน' 
  },
  { 
    id: 'pharmacist', 
    label: 'เภสัชกร / ผู้รับผิดชอบงาน คบส. (Pharmacist)', 
    description: 'จัดการองค์ความรู้เกณฑ์ประเมิน, ตรวจสอบและรับเรื่องผลิตภัณฑ์' 
  },
] as const;
