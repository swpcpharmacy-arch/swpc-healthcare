'use client';

import React, { useState, useActionState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  Save, 
  CheckCircle2, 
  Info,
  Calendar,
  Hash,
  Pill,
  ClipboardCheck,
  Building,
  HelpCircle
} from 'lucide-react';
import { 
  ME_ERROR_TYPES, 
  ME_SEVERITY_LEVELS, 
  COMMON_CONTRIBUTING_FACTORS,
  MEStage, 
  MESeverityLevel 
} from '@/lib/constants/me';
import { createMedicationErrorAction, MEActionState } from '@/app/me/actions';

interface MEFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalName?: string;
  onSuccess?: () => void;
}

export default function MEFormModal({
  isOpen,
  onClose,
  hospitalName,
  onSuccess,
}: MEFormModalProps) {
  const [selectedStage, setSelectedStage] = useState<MEStage>('Dispensing');
  const [selectedSeverity, setSelectedSeverity] = useState<MESeverityLevel>('B');
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [state, formAction, isPending] = useActionState<MEActionState, FormData>(
    createMedicationErrorAction,
    {}
  );

  useEffect(() => {
    if (state.success) {
      if (onSuccess) onSuccess();
      const timer = setTimeout(() => {
        onClose();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.success, onClose, onSuccess]);

  if (!isOpen) return null;

  const currentSeverityMeta = ME_SEVERITY_LEVELS[selectedSeverity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="me-modal-title"
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="me-modal-title" className="text-lg font-bold">
                บันทึกอุบัติการณ์ความคลาดเคลื่อนทางยา (ME Report)
              </h2>
              <p className="text-xs text-teal-100 flex items-center gap-1.5 mt-0.5">
                <Building className="w-3 h-3" />
                <span>หน่วยบริการ: {hospitalName || 'เครือข่ายบริการสุขภาพอำเภอสวรรคโลก'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {state.error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">ไม่สามารถบันทึกข้อมูลได้</p>
                <p className="text-xs text-rose-600 mt-0.5">{state.error}</p>
              </div>
            </div>
          )}

          {state.success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">สำเร็จ!</p>
                <p className="text-xs text-emerald-700 mt-0.5">{state.message}</p>
              </div>
            </div>
          )}

          <form action={formAction} id="me-report-form" className="space-y-6">
            <input type="hidden" name="error_type" value={selectedStage} />
            <input type="hidden" name="severity" value={selectedSeverity} />

            {/* Row 1: Date & HN & Drug Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>วันที่เกิดเหตุการณ์ <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="date"
                  name="report_date"
                  required
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-slate-500" />
                  <span>HN ผู้ป่วย (ถ้ามี)</span>
                </label>
                <input
                  type="text"
                  name="patient_hn"
                  placeholder="เช่น 6701234 (ไม่ระบุก็ได้)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Pill className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ชื่อยาที่เกี่ยวข้อง</span>
                </label>
                <input
                  type="text"
                  name="drug_name"
                  placeholder="เช่น Amlodipine 5 mg, ยา LASA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Row 2: Error Type / Stage */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                ขั้นตอนที่เกิดความคลาดเคลื่อน (Error Stage) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(Object.keys(ME_ERROR_TYPES) as MEStage[]).map((stageKey) => {
                  const stageMeta = ME_ERROR_TYPES[stageKey];
                  const isSelected = selectedStage === stageKey;
                  return (
                    <button
                      key={stageKey}
                      type="button"
                      onClick={() => setSelectedStage(stageKey)}
                      className={`p-3 rounded-2xl border text-left transition-all duration-200 relative ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/70 shadow-sm ring-2 ring-teal-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${stageMeta.bgLight} ${stageMeta.color}`}>
                          {stageMeta.code}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                        )}
                      </div>
                      <div className="font-semibold text-xs text-slate-800 mt-2 line-clamp-1">
                        {stageMeta.label.split('(')[0]}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {stageMeta.code}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 italic">
                {ME_ERROR_TYPES[selectedStage].description}
              </p>
            </div>

            {/* Row 3: Severity Level (A - I) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>ระดับความรุนแรง (Severity Index A - I)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  มาตรฐาน NCC MERP / กระทรวงสาธารณสุข
                </span>
              </div>

              {/* Grouped A-I Selector */}
              <div className="space-y-2">
                {/* 3 Categories: Near miss (A-B), No Harm (C-D), Harm (E-I) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* Near Miss */}
                  <div className="p-2.5 rounded-2xl bg-teal-50/40 border border-teal-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-teal-800 block uppercase tracking-wider">
                      กลุ่มดักจับได้ (Near Miss)
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['A', 'B'] as MESeverityLevel[]).map((lvl) => {
                        const isSelected = selectedSeverity === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setSelectedSeverity(lvl)}
                            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                              isSelected
                                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 ring-2 ring-teal-400'
                                : 'bg-white text-slate-700 border border-teal-200 hover:bg-teal-100/50'
                            }`}
                          >
                            <span>Cat {lvl}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* No Harm */}
                  <div className="p-2.5 rounded-2xl bg-amber-50/40 border border-amber-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-800 block uppercase tracking-wider">
                      ยาถึงตัวผู้ป่วย (No Harm)
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['C', 'D'] as MESeverityLevel[]).map((lvl) => {
                        const isSelected = selectedSeverity === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setSelectedSeverity(lvl)}
                            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                              isSelected
                                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400'
                                : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100/50'
                            }`}
                          >
                            <span>Cat {lvl}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Harm */}
                  <div className="p-2.5 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-rose-800 block uppercase tracking-wider">
                      เกิดอันตราย (Harm / Severe)
                    </span>
                    <div className="grid grid-cols-5 gap-1">
                      {(['E', 'F', 'G', 'H', 'I'] as MESeverityLevel[]).map((lvl) => {
                        const isSelected = selectedSeverity === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setSelectedSeverity(lvl)}
                            className={`py-2 px-1 rounded-xl font-bold text-xs flex items-center justify-center transition ${
                              isSelected
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400'
                                : 'bg-white text-slate-700 border border-rose-200 hover:bg-rose-100/50'
                            }`}
                          >
                            <span>{lvl}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Live Definition Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ${currentSeverityMeta.badgeClass}`}>
                    ระดับ {currentSeverityMeta.level}
                  </span>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">{currentSeverityMeta.title}</p>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{currentSeverityMeta.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Contributing Factor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                สาเหตุ / ปัจจัยที่เกี่ยวข้อง (Contributing Factor)
              </label>
              <select
                name="contributing_factor"
                defaultValue=""
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white"
              >
                <option value="">-- เลือกสาเหตุที่ตรวจพบ (ถ้ามี) --</option>
                {COMMON_CONTRIBUTING_FACTORS.map((factor) => (
                  <option key={factor} value={factor}>
                    {factor}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 5: Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                รายละเอียดเหตุการณ์ความคลาดเคลื่อน <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="description"
                required
                rows={3}
                placeholder="ระบุสิ่งที่เกิดขึ้น เช่น สั่งยาผิดขนาด, หยิบยาผิดช่อง, ผู้ป่วยได้รับยาแล้วหรือไม่ อย่างไร..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition placeholder:text-slate-400 leading-relaxed"
              />
            </div>

            {/* Row 6: Actions Taken */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                การแก้ไขเบื้องต้น และแนวทางป้องกันในอนาคต (Actions Taken)
              </label>
              <textarea
                name="actions_taken"
                rows={2}
                placeholder="ระบุการช่วยเหลือแก้ไขทันที เช่น ประสานแพทย์แก้ไขคำสั่ง, เปลี่ยนยาถูกต้อง, ให้คำแนะนำผู้ป่วย และการติดป้ายเตือน..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition placeholder:text-slate-400 leading-relaxed"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/80 transition"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            form="me-report-form"
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-600/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            {isPending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังบันทึกข้อมูล...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>บันทึกรายงาน ME</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
