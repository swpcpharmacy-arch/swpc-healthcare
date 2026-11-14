export type EvidenceStatus = 'draft' | 'submitted' | 'verified' | 'needs_revision';

export interface EvidenceDocument {
  id: string;
  staff_id: string;
  hospital_name: string;
  criteria_id?: string;
  checklist_item_key: string;
  checklist_item_title: string;
  document_link: string;
  notes?: string | null;
  fiscal_year: number;
  status: EvidenceStatus;
  review_comment?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  last_updated_by?: string | null;
}

export interface EvidenceItemDef {
  key: string;
  title: string;
  description?: string;
  category: string;
  criteriaTitle: string;
  criteriaOrder: number;
  order: number;
  isFolderOption?: boolean;
}

export const EVIDENCE_STATUS_CONFIG: Record<
  EvidenceStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  draft: {
    label: 'ร่างเอกสาร',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  submitted: {
    label: 'แนบหลักฐานแล้ว',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  verified: {
    label: 'ตรวจผ่านแล้ว',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  needs_revision: {
    label: 'ต้องแก้ไข/ปรับปรุง',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
};

export const FISCAL_YEARS = [2567, 2568, 2569];
export const DEFAULT_FISCAL_YEAR = 2568;
