export type MEStage = 'Prescribing' | 'Transcribing' | 'Dispensing' | 'Administration';

export type MESeverityGroup = 'near_miss' | 'no_harm' | 'harm';

export interface MEErrorTypeMeta {
  id: MEStage;
  code: string;
  label: string;
  description: string;
  color: string;
  bgLight: string;
  borderColor: string;
}

export const ME_ERROR_TYPES: Record<MEStage, MEErrorTypeMeta> = {
  Prescribing: {
    id: 'Prescribing',
    code: 'PE',
    label: 'การสั่งใช้ยา (Prescribing Error)',
    description: 'ความคลาดเคลื่อนที่เกิดขึ้นในขั้นตอนการสั่งใช้ยาของแพทย์ เช่น สั่งยาผิดชนิด ผิดขนาด ข้อห้ามใช้ หรือซ้ำซ้อน',
    color: 'text-indigo-700',
    bgLight: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  Transcribing: {
    id: 'Transcribing',
    code: 'TE',
    label: 'การคัดลอก/ส่งต่อคำสั่ง (Transcribing Error)',
    description: 'ความคลาดเคลื่อนจากการคัดลอกคำสั่ง คีย์ข้อมูลลงระบบ หรือส่งต่อคำสั่งแพทย์ผิดพลาด',
    color: 'text-sky-700',
    bgLight: 'bg-sky-50',
    borderColor: 'border-sky-200',
  },
  Dispensing: {
    id: 'Dispensing',
    code: 'DE',
    label: 'การจัดและจ่ายยา (Dispensing Error)',
    description: 'ความคลาดเคลื่อนในขั้นตอนการจัดยา ติดฉลาก หรือส่งมอบยาให้ผู้ป่วยผิดซอง ผิดขนาด หรือผิดคน',
    color: 'text-amber-700',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  Administration: {
    id: 'Administration',
    code: 'AE',
    label: 'การบริหารยา/การใช้ยา (Administration Error)',
    description: 'ความคลาดเคลื่อนในการบริหารยาให้ผู้ป่วย เช่น ให้ยาผิดเวลา ผิดวิธี ผิดอัตรา หรือผู้ป่วยเข้าใจวิธีใช้ยาคลาดเคลื่อน',
    color: 'text-rose-700',
    bgLight: 'bg-rose-50',
    borderColor: 'border-rose-200',
  },
};

export type MESeverityLevel = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';

export interface MESeverityMeta {
  level: MESeverityLevel;
  group: MESeverityGroup;
  groupLabel: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
  badgeClass: string;
}

export const ME_SEVERITY_LEVELS: Record<MESeverityLevel, MESeverityMeta> = {
  A: {
    level: 'A',
    group: 'near_miss',
    groupLabel: 'ไม่เกิดความคลาดเคลื่อน (Near Miss)',
    title: 'มีโอกาสทำให้เกิดความคลาดเคลื่อน',
    description: 'เกิดเหตุการณ์หรือสภาพแวดล้อมที่มีศักยภาพอาจนำไปสู่ความคลาดเคลื่อนได้ แต่ยังไม่เกิด',
    color: '#0D9488',
    bgColor: 'bg-teal-500',
    textColor: 'text-teal-700',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  B: {
    level: 'B',
    group: 'near_miss',
    groupLabel: 'ไม่เกิดความคลาดเคลื่อน (Near Miss)',
    title: 'เกิดความคลาดเคลื่อนแต่ยังไม่ถึงผู้ป่วย',
    description: 'เกิดความคลาดเคลื่อนขึ้นแล้ว แต่สามารถตรวจจับและยับยั้งไว้ได้ก่อนที่ยาจะถึงตัวผู้ป่วย',
    color: '#0284C7',
    bgColor: 'bg-sky-500',
    textColor: 'text-sky-700',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  C: {
    level: 'C',
    group: 'no_harm',
    groupLabel: 'เกิดความคลาดเคลื่อน-ไม่เกิดอันตราย (No Harm)',
    title: 'ยาถึงผู้ป่วย แต่ไม่เกิดอันตราย',
    description: 'เกิดความคลาดเคลื่อนและยาถึงตัวผู้ป่วยแล้ว แต่ไม่ทำให้เกิดอันตรายต่อผู้ป่วย',
    color: '#16A34A',
    bgColor: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  D: {
    level: 'D',
    group: 'no_harm',
    groupLabel: 'เกิดความคลาดเคลื่อน-ไม่เกิดอันตราย (No Harm)',
    title: 'ยาถึงผู้ป่วย ต้องติดตามเฝ้าระวัง',
    description: 'เกิดความคลาดเคลื่อน ยาถึงตัวผู้ป่วย และจำเป็นต้องติดตามเฝ้าระวังอาการเพื่อให้แน่ใจว่าไม่เกิดอันตราย',
    color: '#D97706',
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-700',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  E: {
    level: 'E',
    group: 'harm',
    groupLabel: 'เกิดอันตรายต่อผู้ป่วย (Harm Events)',
    title: 'เกิดอันตรายชั่วคราว ต้องให้การบำบัดรักษา',
    description: 'เกิดความคลาดเคลื่อนจนทำให้เกิดอันตรายชั่วคราวต่อผู้ป่วย และจำเป็นต้องได้รับการรักษาหรือแก้ไขเพิ่มเติม',
    color: '#EA580C',
    bgColor: 'bg-orange-500',
    textColor: 'text-orange-700',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  F: {
    level: 'F',
    group: 'harm',
    groupLabel: 'เกิดอันตรายต่อผู้ป่วย (Harm Events)',
    title: 'เกิดอันตรายชั่วคราว ต้องนอน รพ. หรืออยู่นานขึ้น',
    description: 'เกิดความคลาดเคลื่อนจนเกิดอันตรายชั่วคราว ต้องเข้ารับการรักษาในโรงพยาบาลหรือยืดระยะเวลาการรักษาตัว',
    color: '#DC2626',
    bgColor: 'bg-red-500',
    textColor: 'text-red-700',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
  },
  G: {
    level: 'G',
    group: 'harm',
    groupLabel: 'เกิดอันตรายต่อผู้ป่วย (Harm Events)',
    title: 'เกิดอันตรายถาวรแก่ผู้ป่วย',
    description: 'เกิดความคลาดเคลื่อนจนส่งผลกระทบให้ผู้ป่วยมีความพิการหรือสูญเสียการทำงานของอวัยวะอย่างถาวร',
    color: '#B91C1C',
    bgColor: 'bg-rose-600',
    textColor: 'text-rose-700',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  H: {
    level: 'H',
    group: 'harm',
    groupLabel: 'เกิดอันตรายต่อผู้ป่วย (Harm Events)',
    title: 'อันตรายเกือบถึงแก่ชีวิต ต้องทำการช่วยกู้ชีพ',
    description: 'เกิดความคลาดเคลื่อนจนทำให้ผู้ป่วยอยู่ในภาวะวิกฤติต้องได้รับการกู้ชีพ (Life-sustaining intervention)',
    color: '#991B1B',
    bgColor: 'bg-rose-700',
    textColor: 'text-rose-800',
    badgeClass: 'bg-rose-200 text-rose-900 border-rose-400 font-bold',
  },
  I: {
    level: 'I',
    group: 'harm',
    groupLabel: 'เกิดอันตรายต่อผู้ป่วย (Harm Events)',
    title: 'เป็นสาเหตุทำให้ผู้ป่วยเสียชีวิต',
    description: 'ความคลาดเคลื่อนนั้นเป็นสาเหตุโดยตรงที่ทำให้ผู้ป่วยเสียชีวิต',
    color: '#7F1D1D',
    bgColor: 'bg-slate-900',
    textColor: 'text-slate-900',
    badgeClass: 'bg-slate-900 text-white border-slate-900 font-bold',
  },
};

export const COMMON_CONTRIBUTING_FACTORS = [
  'ยาชื่อพ้องมองคล้าย (LASA: Look-Alike Sound-Alike)',
  'ลายมือแพทย์หรือคำสั่งไม่ชัดเจน/คำสั่งทางวาจา',
  'จัดยาผิดขนาดความแรง (Strength) / ผิดรูปแบบยา',
  'ผู้ป่วยมีชื่อ-นามสกุลซ้ำหรือคล้ายกัน',
  'ฉลากยาไม่ชัดเจน / ตำแหน่งจัดเก็บยาใกล้เคียงกัน',
  'การคำนวณขนาดยาคลาดเคลื่อน (เด็ก/ผู้สูงอายุ/ไตบกพร่อง)',
  'ประวัติการแพ้ยาหรือประวัติยาเดิมไม่ครบถ้วน',
  'ภาระงานเร่งด่วน / สภาพแวดล้อมมีเสียงรบกวน',
  'ผู้ป่วยเข้าใจวิธีการรับประทานยาไม่ถูกต้อง',
  'อื่นๆ',
] as const;

export interface MedicationErrorRecord {
  id: string;
  reporter_id: string;
  report_date: string;
  patient_hn?: string | null;
  error_type: MEStage;
  severity: MESeverityLevel;
  description: string;
  actions_taken?: string | null;
  drug_name?: string | null;
  contributing_factor?: string | null;
  created_at?: string;
  reporter_name?: string;
  hospital_name?: string;
}

export type DateFilterMode = 'all' | 'this_month' | 'last_month' | 'quarter' | 'fiscal_year' | 'custom';

export interface MEFilterState {
  searchQuery: string;
  dateFilterMode: DateFilterMode;
  customStartDate: string;
  customEndDate: string;
  hospital: string;
  stage: string;
  severityGroup: 'all' | 'near_miss' | 'no_harm' | 'harm';
}

