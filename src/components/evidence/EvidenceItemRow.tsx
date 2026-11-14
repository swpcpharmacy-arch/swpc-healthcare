'use client';

import React from 'react';
import { 
  ExternalLink, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MessageSquare,
  Link2,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { EvidenceDocument, EvidenceItemDef, EVIDENCE_STATUS_CONFIG } from '@/lib/constants/evidence';

interface EvidenceItemRowProps {
  item: EvidenceItemDef;
  evidence?: EvidenceDocument;
  canEdit: boolean;
  isPharmacist: boolean;
  onEdit: (item: EvidenceItemDef, evidence?: EvidenceDocument) => void;
  onDelete: (evidenceId: string) => void;
  onReview: (evidence: EvidenceDocument) => void;
}

export default function EvidenceItemRow({
  item,
  evidence,
  canEdit,
  isPharmacist,
  onEdit,
  onDelete,
  onReview,
}: EvidenceItemRowProps) {
  const isSubmitted = !!evidence?.document_link;
  const status = evidence?.status || 'draft';
  const statusConfig = isSubmitted 
    ? EVIDENCE_STATUS_CONFIG[status] 
    : { label: 'ยังไม่แนบหลักฐาน', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-300' };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (evidence?.document_link) {
      window.open(evidence.document_link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-200 ${
      isSubmitted 
        ? status === 'verified'
          ? 'bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-300'
          : status === 'needs_revision'
            ? 'bg-rose-50/30 border-rose-200/80 hover:border-rose-300'
            : 'bg-white border-slate-200 hover:border-teal-300'
        : 'bg-slate-50/50 border-slate-200/60 hover:border-slate-300'
    }`}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        {/* Left: Checklist details */}
        <div className="space-y-1.5 flex-1 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
              {item.order}
            </span>
            <h4 className="font-semibold text-slate-800 text-sm leading-snug">
              {item.title}
            </h4>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
              {statusConfig.label}
            </span>
          </div>

          {item.description && (
            <p className="text-xs text-slate-500 pl-7 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Notes by Staff */}
          {evidence?.notes && (
            <div className="ml-7 mt-1 text-xs text-slate-600 bg-slate-100/70 px-3 py-1.5 rounded-xl border border-slate-200/60 inline-flex items-center gap-1.5">
              <span className="font-medium text-slate-700">หมายเหตุ:</span>
              <span>{evidence.notes}</span>
            </div>
          )}

          {/* Pharmacist Review Feedback */}
          {evidence?.review_comment && (
            <div className={`ml-7 mt-1.5 text-xs p-2.5 rounded-xl border flex items-start gap-2 ${
              status === 'needs_revision'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-purple-50 text-purple-800 border-purple-200'
            }`}>
              <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">ข้อเสนอแนะผู้นิเทศ: </span>
                <span>{evidence.review_comment}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 pl-7 md:pl-0 shrink-0 self-end md:self-center">
          {isSubmitted ? (
            <>
              {/* Open Google Drive button */}
              <button
                type="button"
                onClick={handleOpenLink}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100/80 text-teal-700 border border-teal-200/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                title="เปิดดูไฟล์ใน Google Drive"
              >
                <Link2 className="w-3.5 h-3.5 text-teal-600" />
                <span>เปิดดูเอกสาร</span>
                <ExternalLink className="w-3 h-3 text-teal-500" />
              </button>

              {/* Edit link button */}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(item, evidence)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                  title="แก้ไขลิงก์"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}

              {/* Delete button */}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => evidence && onDelete(evidence.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="ลบหลักฐานข้อนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* Pharmacist audit button */}
              {isPharmacist && (
                <button
                  type="button"
                  onClick={() => onReview(evidence)}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ml-1"
                  title="บันทึกผลการตรวจนิเทศ"
                >
                  <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>ตรวจนิเทศ</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Not submitted: Add Link button */}
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>ใส่ลิงก์ Google Drive</span>
                </button>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  ยังไม่ได้แนบหลักฐาน
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
