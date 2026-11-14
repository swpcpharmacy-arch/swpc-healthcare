'use client';

import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Link2, 
  FileText, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  FolderOpen
} from 'lucide-react';
import { EvidenceItemDef } from '@/lib/constants/evidence';
import { upsertEvidenceAction } from '@/app/evidence/actions';

interface EvidenceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: EvidenceItemDef | null;
  hospitalName: string;
  fiscalYear: number;
  initialLink?: string;
  initialNotes?: string;
  onSaved: () => void;
}

export default function EvidenceEditModal({
  isOpen,
  onClose,
  item,
  hospitalName,
  fiscalYear,
  initialLink = '',
  initialNotes = '',
  onSaved,
}: EvidenceEditModalProps) {
  const [link, setLink] = useState(initialLink);
  const [notes, setNotes] = useState(initialNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when item changes or modal opens
  React.useEffect(() => {
    setLink(initialLink || '');
    setNotes(initialNotes || '');
    setError(null);
  }, [item, initialLink, initialNotes, isOpen]);

  if (!isOpen || !item) return null;

  const isGoogleDrive = link.includes('drive.google.com') || link.includes('docs.google.com');

  const handleTestLink = () => {
    if (!link.trim()) return;
    let url = link.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let trimmedLink = link.trim();
    if (!trimmedLink) {
      setError('กรุณาระบุลิงก์ Google Drive หรือลิงก์เอกสาร');
      return;
    }

    if (!trimmedLink.startsWith('http://') && !trimmedLink.startsWith('https://')) {
      trimmedLink = 'https://' + trimmedLink;
    }

    try {
      new URL(trimmedLink);
    } catch {
      setError('รูปแบบ URL ไม่ถูกต้อง กรุณาคัดลอกลิงก์ที่สมบูรณ์');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('hospital_name', hospitalName);
    formData.append('fiscal_year', fiscalYear.toString());
    formData.append('checklist_item_key', item.key);
    formData.append('checklist_item_title', item.title);
    formData.append('document_link', trimmedLink);
    formData.append('notes', notes.trim());

    const result = await upsertEvidenceAction(null, formData);
    setIsSubmitting(false);

    if (result.success) {
      onSaved();
      onClose();
    } else {
      setError(result.error || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-start justify-between">
          <div className="space-y-1 pr-4">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
              ปีงบประมาณ {fiscalYear} | {hospitalName}
            </span>
            <h3 className="font-bold text-lg leading-snug">
              บันทึก / แก้ไขลิงก์เอกสารหลักฐาน
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Item details */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5">
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
              {item.criteriaTitle}
            </span>
            <p className="font-semibold text-slate-800 text-sm">
              {item.title}
            </p>
            {item.description && (
              <p className="text-xs text-slate-500 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Drive Link Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-teal-600" />
                <span>ลิงก์ Google Drive (ไฟล์ หรือ โฟลเดอร์)</span>
                <span className="text-rose-500">*</span>
              </label>

              {isGoogleDrive && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Google Drive Link
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/... หรือ file/d/..."
                className="w-full text-xs font-mono px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 pr-24 text-slate-800 placeholder:text-slate-400"
                required
              />
              <button
                type="button"
                onClick={handleTestLink}
                disabled={!link.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                title="ทดสอบเปิดลิงก์ในแท็บใหม่"
              >
                <span>ทดสอบ</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Notes input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>หมายเหตุ / คำอธิบายเพิ่มเติมสำหรับผู้นิเทศ (ไม่บังคับ)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น อัปเดตคำสั่งปี 2568 ล่าสุด หรือ ดูหน้า 4-8 เป็นต้น"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Tips info box */}
          <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-2xl flex items-start gap-2.5 text-xs text-sky-800 leading-relaxed">
            <Info className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">คำแนะนำการตั้งค่าแชร์ใน Google Drive:</p>
              <p className="text-[11px] text-sky-700">
                คลิกขวาที่ไฟล์หรือโฟลเดอร์ใน Google Drive &rarr; เลือก <strong>แชร์ (Share)</strong> &rarr; เปลี่ยนการเข้าถึงทั่วไปเป็น <strong>&ldquo;ทุกคนที่มีลิงก์มีสิทธิ์ดู (Anyone with the link can view)&rdquo;</strong> แล้วกดคัดลอกลิงก์มาวาง
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>บันทึกหลักฐาน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
