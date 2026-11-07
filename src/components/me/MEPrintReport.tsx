'use client';

import React from 'react';
import { Printer, X } from 'lucide-react';
import { 
  MedicationErrorRecord, 
  ME_ERROR_TYPES, 
  ME_SEVERITY_LEVELS, 
  MEStage, 
  MESeverityLevel 
} from '@/lib/constants/me';

interface MEPrintReportProps {
  records: MedicationErrorRecord[];
  hospitalFilter?: string;
  isOpen: boolean;
  onClose: () => void;
  reporterName?: string;
}

export default function MEPrintReport({
  records,
  hospitalFilter,
  isOpen,
  onClose,
  reporterName,
}: MEPrintReportProps) {
  if (!isOpen) return null;

  const total = records.length;
  const nearMiss = records.filter((r) => r.severity === 'A' || r.severity === 'B').length;
  const noHarm = records.filter((r) => r.severity === 'C' || r.severity === 'D').length;
  const harm = records.filter((r) => ['E', 'F', 'G', 'H', 'I'].includes(r.severity)).length;

  const stageCounts: Record<MEStage, number> = {
    Prescribing: records.filter((r) => r.error_type === 'Prescribing').length,
    Transcribing: records.filter((r) => r.error_type === 'Transcribing').length,
    Dispensing: records.filter((r) => r.error_type === 'Dispensing').length,
    Administration: records.filter((r) => r.error_type === 'Administration').length,
  };

  const handlePrint = () => {
    window.print();
  };

  const printDateStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center">
      {/* Floating Control Bar (Hidden on print) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-slate-200">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/30 transition"
        >
          <Printer className="w-4 h-4" />
          <span>สั่งพิมพ์รายงาน (Print A4)</span>
        </button>
        <button
          onClick={onClose}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          title="ปิด"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Printable Sheet (Simulated A4 Paper) */}
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl p-8 md:p-12 text-slate-800 border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none">
        {/* Header */}
        <div className="text-center pb-6 border-b-2 border-slate-800 space-y-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            รายงานสรุปอุบัติการณ์ความคลาดเคลื่อนทางยา (Medication Error Report)
          </h1>
          <h2 className="text-sm md:text-base font-semibold text-slate-700">
            เครือข่ายบริการสุขภาพอำเภอสวรรคโลก จังหวัดสุโขทัย
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 pt-2">
            <span>
              หน่วยบริการ: <strong>{hospitalFilter && hospitalFilter !== 'all' ? hospitalFilter : 'ทุกหน่วยบริการในเครือข่าย'}</strong>
            </span>
            <span>•</span>
            <span>วันที่ออกรายงาน: <strong>{printDateStr}</strong></span>
            <span>•</span>
            <span>จำนวนรายการทั้งหมด: <strong>{total} รายการ</strong></span>
          </div>
        </div>

        {/* Executive Summary Stats */}
        <div className="mt-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            1. สรุปภาพรวมระดับความรุนแรง (Severity Index Summary)
          </h3>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 border border-slate-300 rounded-xl">
              <span className="text-[11px] text-slate-500 block">ทั้งหมด</span>
              <span className="text-xl font-bold text-slate-800">{total}</span>
              <span className="text-[10px] text-slate-500 block">ครั้ง</span>
            </div>
            <div className="p-3 border border-teal-300 bg-teal-50/30 rounded-xl">
              <span className="text-[11px] text-teal-800 block">ดักจับได้ (A-B)</span>
              <span className="text-xl font-bold text-teal-800">{nearMiss}</span>
              <span className="text-[10px] text-teal-600 block">
                {total > 0 ? Math.round((nearMiss / total) * 100) : 0}%
              </span>
            </div>
            <div className="p-3 border border-amber-300 bg-amber-50/30 rounded-xl">
              <span className="text-[11px] text-amber-800 block">ถึงผู้ป่วย-ไม่อันตราย (C-D)</span>
              <span className="text-xl font-bold text-amber-800">{noHarm}</span>
              <span className="text-[10px] text-amber-600 block">
                {total > 0 ? Math.round((noHarm / total) * 100) : 0}%
              </span>
            </div>
            <div className="p-3 border border-rose-300 bg-rose-50/30 rounded-xl">
              <span className="text-[11px] text-rose-800 block">เกิดอันตราย (E-I)</span>
              <span className="text-xl font-bold text-rose-800">{harm}</span>
              <span className="text-[10px] text-rose-600 block">
                {total > 0 ? Math.round((harm / total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Stage Summary */}
        <div className="mt-6 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            2. จำแนกตามขั้นตอนการเกิดความคลาดเคลื่อน (By Error Stages)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {(Object.keys(stageCounts) as MEStage[]).map((stage) => {
              const meta = ME_ERROR_TYPES[stage];
              return (
                <div key={stage} className="p-2.5 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">{meta.code}</span>
                    <span className="text-[10px] text-slate-500">{meta.label.split('(')[0]}</span>
                  </div>
                  <span className="font-bold text-slate-700">{stageCounts[stage]} ครั้ง</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Incidents Table */}
        <div className="mt-6 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            3. บัญชีรายการอุบัติการณ์ความคลาดเคลื่อนทางยา (Incident Log)
          </h3>
          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
              <tr>
                <th className="py-2 px-2.5 border-r border-slate-300 w-12 text-center">ลำดับ</th>
                <th className="py-2 px-2.5 border-r border-slate-300 w-24">วันที่</th>
                <th className="py-2 px-2.5 border-r border-slate-300 w-16 text-center">ระดับ</th>
                <th className="py-2 px-2.5 border-r border-slate-300 w-20">ขั้นตอน</th>
                <th className="py-2 px-2.5 border-r border-slate-300">รายละเอียดเหตุการณ์ / ชื่อยา</th>
                <th className="py-2 px-2.5 border-r border-slate-300">การแก้ไขเบื้องต้น</th>
                <th className="py-2 px-2.5 w-28">หน่วยบริการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    ไม่มีรายการอุบัติการณ์
                  </td>
                </tr>
              ) : (
                records.map((item, idx) => (
                  <tr key={item.id} className="text-[11px]">
                    <td className="py-2 px-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                    <td className="py-2 px-2 border-r border-slate-200 whitespace-nowrap">
                      {new Date(item.report_date).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-200 text-center font-bold">
                      Cat {item.severity}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-200 font-semibold">
                      {ME_ERROR_TYPES[item.error_type]?.code}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-200">
                      {item.drug_name && <strong className="block text-teal-800">{item.drug_name}</strong>}
                      <p className="line-clamp-2 text-slate-700">{item.description}</p>
                    </td>
                    <td className="py-2 px-2 border-r border-slate-200 text-slate-600">
                      <p className="line-clamp-2">{item.actions_taken || '-'}</p>
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap text-slate-600">
                      {item.hospital_name || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures Section */}
        <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="space-y-6">
            <p className="text-slate-600">ลงชื่อ.................................................................ผู้จัดทำรายงาน</p>
            <div>
              <p className="font-semibold text-slate-800">({reporterName || '.................................................................'})</p>
              <p className="text-slate-500 mt-1">ตำแหน่ง เจ้าหน้าที่ผู้รับผิดชอบงานเภสัชกรรมปฐมภูมิ</p>
              <p className="text-slate-500 mt-1">วันที่ ........ / ........ / ................</p>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-slate-600">ลงชื่อ.................................................................ผู้ตรวจสอบ</p>
            <div>
              <p className="font-semibold text-slate-800">(ภญ. ชนัญชิดา ชุ่มใจ หรือผู้แทน)</p>
              <p className="text-slate-500 mt-1">เภสัชกรชำนาญการ / ผู้รับผิดชอบงานเครือข่ายปฐมภูมิ</p>
              <p className="text-slate-500 mt-1">วันที่ ........ / ........ / ................</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
