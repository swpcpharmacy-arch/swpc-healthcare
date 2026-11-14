'use client';

import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Loader2, 
  MessageSquare,
  Building2,
  ExternalLink
} from 'lucide-react';
import { EvidenceDocument, EvidenceStatus } from '@/lib/constants/evidence';
import { reviewEvidenceAction } from '@/app/evidence/actions';

interface EvidenceReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: EvidenceDocument | null;
  onReviewed: () => void;
}

export default function EvidenceReviewModal({
  isOpen,
  onClose,
  evidence,
  onReviewed,
}: EvidenceReviewModalProps) {
  const [status, setStatus] = useState<EvidenceStatus>('verified');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (evidence) {
      setStatus(evidence.status === 'needs_revision' ? 'needs_revision' : 'verified');
      setComment(evidence.review_comment || '');
      setError(null);
    }
  }, [evidence, isOpen]);

  if (!isOpen || !evidence) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await reviewEvidenceAction(evidence.id, status, comment);
    setIsSubmitting(false);

    if (result.success) {
      onReviewed();
      onClose();
    } else {
      setError(result.error || 'ไม่สามารถบันทึกผลการตรวจได้');
    }
  };

  const openDocument = () => {
    if (evidence.document_link) {
      window.open(evidence.document_link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-start justify-between">
          <div className="space-y-1 pr-4">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
              ตรวจนิเทศงานโดยเภสัชกร
            </span>
            <h3 className="font-bold text-lg leading-snug">
              บันทึกผลการตรวจรับรองหลักฐาน
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
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              <span className="font-semibold text-slate-700">{evidence.hospital_name}</span>
              <span>(ปีงบประมาณ {evidence.fiscal_year})</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">
              {evidence.checklist_item_title}
            </p>

            {evidence.notes && (
              <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200/60">
                &ldquo;{evidence.notes}&rdquo;
              </p>
            )}

            {evidence.document_link && (
              <button
                type="button"
                onClick={openDocument}
                className="w-full mt-2 py-2 px-3 bg-purple-50 hover:bg-purple-100/80 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <span>เปิดดูหลักฐานใน Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              ผลการตรวจรับรอง
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('verified')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                  status === 'verified'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 ${status === 'verified' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>ผ่านการตรวจ (สมบูรณ์)</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('needs_revision')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                  status === 'needs_revision'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 ${status === 'needs_revision' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span>ต้องแก้ไข / ปรับปรุง</span>
              </button>
            </div>
          </div>

          {/* Feedback comment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span>ข้อเสนอแนะ / ข้อสั่งการจากผู้นิเทศ</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="เช่น เอกสารถูกต้องสมบูรณ์ หรือ กรุณาแนบใบแต่งตั้งที่มีลายมือชื่อรับรองเพิ่มเติม"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 text-slate-800 placeholder:text-slate-400"
            />
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
              className="px-6 py-2.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>บันทึกผลการตรวจ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
