'use client';

import React, { useState, useTransition } from 'react';
import { 
  X, 
  Calendar, 
  Hash, 
  Pill, 
  Building, 
  User, 
  Trash2, 
  AlertCircle, 
  CheckCircle2,
  Share2
} from 'lucide-react';
import { 
  MedicationErrorRecord, 
  ME_ERROR_TYPES, 
  ME_SEVERITY_LEVELS 
} from '@/lib/constants/me';
import { deleteMedicationErrorAction } from '@/app/me/actions';

interface MEDetailModalProps {
  record: MedicationErrorRecord | null;
  isOpen: boolean;
  onClose: () => void;
  canDelete?: boolean;
}

export default function MEDetailModal({
  record,
  isOpen,
  onClose,
  canDelete = false,
}: MEDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (!isOpen || !record) return null;

  const stageMeta = ME_ERROR_TYPES[record.error_type];
  const severityMeta = ME_SEVERITY_LEVELS[record.severity];

  const handleDelete = () => {
    startTransition(async () => {
      await deleteMedicationErrorAction(record.id);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${severityMeta.badgeClass}`}>
              Cat {record.severity}
            </span>
            <div>
              <h2 className="text-base font-bold">
                รายละเอียดอุบัติการณ์ความคลาดเคลื่อนทางยา
              </h2>
              <p className="text-xs text-slate-300">
                รหัสบันทึก: #{record.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Key Badges Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-teal-600" />
                <span>วันที่เกิดเหตุ</span>
              </span>
              <span className="font-bold text-slate-800 text-xs">
                {new Date(record.report_date).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-600" />
                <span>HN ผู้ป่วย</span>
              </span>
              <span className="font-bold text-slate-800 text-xs">
                {record.patient_hn || '- ไม่ได้ระบุ -'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-1">
                ขั้นตอน (Stage)
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block ${stageMeta?.bgLight} ${stageMeta?.color}`}>
                {stageMeta?.code} - {stageMeta?.label.split('(')[0]}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-1">
                กลุ่มความรุนแรง
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block ${severityMeta.badgeClass}`}>
                {severityMeta.groupLabel.split('(')[0]}
              </span>
            </div>
          </div>

          {/* Drug & Factor info */}
          {(record.drug_name || record.contributing_factor) && (
            <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-2">
              {record.drug_name && (
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-xs text-slate-500">ชื่อยาที่เกี่ยวข้อง:</span>
                  <span className="font-bold text-xs text-slate-800">{record.drug_name}</span>
                </div>
              )}
              {record.contributing_factor && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500">ปัจจัย/สาเหตุที่พบ: </span>
                    <span className="font-semibold text-xs text-slate-800">{record.contributing_factor}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>รายละเอียดเหตุการณ์</span>
            </h4>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 leading-relaxed text-xs">
              {record.description}
            </div>
          </div>

          {/* Actions Taken */}
          <div>
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>การแก้ไขปัญหาเบื้องต้น และแนวทางป้องกัน (Actions Taken)</span>
            </h4>
            <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200/80 text-emerald-950 leading-relaxed text-xs">
              {record.actions_taken || '- ไม่ได้ระบุ -'}
            </div>
          </div>

          {/* Reporter & Hospital Info */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>ผู้รายงาน: <strong className="text-slate-700">{record.reporter_name || 'เจ้าหน้าที่'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>หน่วยบริการ: <strong className="text-slate-700">{record.hospital_name || 'รพ.สต. ในเครือข่าย'}</strong></span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            {canDelete && (
              <>
                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1.5 font-semibold hover:bg-rose-50 px-3 py-1.5 rounded-xl transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบรายการนี้</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-600 font-semibold">ยืนยันการลบ?</span>
                    <button
                      onClick={handleDelete}
                      disabled={isPending}
                      className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition"
                    >
                      {isPending ? 'กำลังลบ...' : 'ใช่, ลบทันที'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="px-2 py-1 text-slate-500 text-xs hover:bg-slate-200 rounded-lg"
                    >
                      ยกเลิก
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition shadow-sm"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
