export type ProductCategory = 
  | 'drug_set'
  | 'antibiotic_grocery'
  | 'dangerous_drug'
  | 'herbal_steroid'
  | 'cosmetics'
  | 'food_supplement'
  | 'other';

export type DistributionChannel = 
  | 'grocery_store'
  | 'mobile_truck'
  | 'flea_market'
  | 'online'
  | 'patient_home'
  | 'temple'
  | 'other';

export type ActionStatus = 'pending' | 'investigating' | 'action_taken' | 'resolved';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type TestKitResult = 
  | 'not_tested' 
  | 'negative' 
  | 'positive_steroid' 
  | 'positive_chemical' 
  | 'pending_lab';

export interface UnsafeProductRecord {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  reporter_hospital?: string;
  reporter_role?: string;
  product_name: string;
  product_category: ProductCategory;
  risk_type: string;
  distribution_channel: DistributionChannel;
  store_name?: string;
  village_moo?: string;
  subdistrict?: string;
  location_found: string;
  description: string;
  test_kit_result: TestKitResult;
  image_url?: string;
  additional_images?: string[];
  risk_level: RiskLevel;
  status: ActionStatus;
  acknowledged_by?: string;
  acknowledged_name?: string;
  acknowledged_at?: string;
  action_details?: string;
  action_taken_by?: string;
  action_taken_name?: string;
  action_taken_at?: string;
  is_safety_alert: boolean;
  alert_notes?: string;
  is_archived?: boolean;
  archived_at?: string;
  archived_by?: string;
  archive_drive_link?: string;
  created_at: string;
}

export const PRODUCT_CATEGORIES: { id: ProductCategory; label: string; badgeColor: string; description: string }[] = [
  { 
    id: 'drug_set', 
    label: 'ยาชุด', 
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    description: 'ยาชุดแก้ปวดเมื่อย ยาชุดบำรุง ยาชุดจัดซอง'
  },
  { 
    id: 'herbal_steroid', 
    label: 'สมุนไพร / แผนโบราณ', 
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'ยาน้ำสมุนไพร ยาลูกกลอน ยาผง สงสัยลักลอบผสมสเตียรอยด์'
  },
  { 
    id: 'antibiotic_grocery', 
    label: 'ยาปฏิชีวนะในร้านชำ', 
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
    description: 'ยาแก้อักเสบ อะม็อกซี่ แอมพิซิลลิน นอร์ฟล็อกซาซิน'
  },
  { 
    id: 'dangerous_drug', 
    label: 'ยาอันตราย / ควบคุมพิเศษ', 
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    description: 'ยาลดน้ำหนัก ยานอนหลับ ยาแก้ปวดชนิดรุนแรง NSAIDs'
  },
  { 
    id: 'cosmetics', 
    label: 'เครื่องสำอางอันตราย', 
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-300',
    description: 'ครีมหน้าขาว ครีมฝ้ากระ สงสัยสารปรอท ไฮโดรควิโนน'
  },
  { 
    id: 'food_supplement', 
    label: 'อาหาร / เสริมอาหาร', 
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'เสริมอาหารโอ้อวดสรรพคุณ กาแฟลดน้ำหนักผสมสารอันตราย'
  },
  { 
    id: 'other', 
    label: 'ผลิตภัณฑ์อื่นๆ', 
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'ยาเสื่อมคุณภาพ ยาไม่มีเลขทะเบียน วัตถุอันตรายในบ้าน'
  },
];

export const DISTRIBUTION_CHANNELS: { id: DistributionChannel; label: string; icon: string }[] = [
  { id: 'grocery_store', label: 'ร้านชำ / โชห่วยในหมู่บ้าน', icon: 'Store' },
  { id: 'mobile_truck', label: 'รถเร่ / รถขายยา / เร่ฉายหนัง', icon: 'Truck' },
  { id: 'flea_market', label: 'ตลาดนัด / ตลาดสด / หาบเร่', icon: 'ShoppingBag' },
  { id: 'online', label: 'สื่อออนไลน์ / Facebook / TikTok / พัสดุ', icon: 'Globe' },
  { id: 'patient_home', label: 'พบในบ้านผู้ป่วย / ญาติซื้อมาฝาก', icon: 'Home' },
  { id: 'temple', label: 'วัด / พระสงฆ์ / งานประเพณี', icon: 'Landmark' },
  { id: 'other', label: 'แหล่งอื่นๆ ในชุมชน', icon: 'MapPin' },
];

export const RISK_LEVELS: { id: RiskLevel; label: string; color: string; badge: string }[] = [
  { id: 'low', label: 'ความเสี่ยงต่ำ', color: 'text-slate-600', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'moderate', label: 'ความเสี่ยงปานกลาง', color: 'text-amber-600', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'high', label: 'ความเสี่ยงสูง', color: 'text-orange-600', badge: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'critical', label: 'วิกฤติ / เร่งด่วนมาก', color: 'text-rose-600', badge: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' },
];

export const ACTION_STATUSES: { id: ActionStatus; label: string; badge: string; step: number }[] = [
  { id: 'pending', label: 'รอดำเนินการ (Pending)', badge: 'bg-amber-50 text-amber-700 border-amber-200', step: 1 },
  { id: 'investigating', label: 'กำลังตรวจสอบ / วางแผน (Investigating)', badge: 'bg-sky-50 text-sky-700 border-sky-200', step: 2 },
  { id: 'action_taken', label: 'ลงพื้นที่ / จัดการแล้ว (Action Taken)', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', step: 3 },
  { id: 'resolved', label: 'ยุติเรื่อง / แก้ไขเรียบร้อย (Resolved)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', step: 4 },
];

export const TEST_KIT_OPTIONS: { id: TestKitResult; label: string; badge: string }[] = [
  { id: 'not_tested', label: 'ไม่ได้ใช้ชุดทดสอบ', badge: 'bg-slate-100 text-slate-600' },
  { id: 'negative', label: 'ผลทดสอบเป็นลบ (-) ไม่พบสาร', badge: 'bg-emerald-100 text-emerald-700' },
  { id: 'positive_steroid', label: 'ผลทดสอบเป็นบวก (+) พบสเตียรอยด์', badge: 'bg-rose-100 text-rose-700 font-bold' },
  { id: 'positive_chemical', label: 'ผลทดสอบเป็นบวก (+) พบสารเคมีห้ามใช้', badge: 'bg-rose-100 text-rose-700 font-bold' },
  { id: 'pending_lab', label: 'เก็บตัวอย่างส่งแล็บ สสจ./ศวคม.', badge: 'bg-indigo-100 text-indigo-700' },
];

export const SWPC_SUBDISTRICTS = [
  'เมืองสวรรคโลก',
  'ในเมือง',
  'คลองกระจง',
  'วังพิณพาทย์',
  'วังไม้ขอน',
  'ย่านยาว',
  'นาทุ่ง',
  'คลองยาง',
  'เมืองบางยม',
  'ท่าทอง',
  'ปากน้ำ',
  'ป่ากุมเกาะ',
  'เมืองบางขลัง',
  'หนองกลับ',
];
