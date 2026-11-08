'use client';

import React, { useState } from 'react';
import { Printer, X, FileText, TableProperties, CheckSquare } from 'lucide-react';

interface MEBlankFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalName?: string;
}

export default function MEBlankFormsModal({
  isOpen,
  onClose,
  hospitalName = 'รพ.สต. ในเครือข่ายบริการสุขภาพอำเภอสวรรคโลก',
}: MEBlankFormsModalProps) {
  const [formType, setFormType] = useState<'multi' | 'single'>('multi');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center">
      {/* Floating Control Bar (Hidden on print) */}
      <div className="screen-only fixed top-4 right-4 z-50 flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200">
        {/* Toggle Form Type */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFormType('multi')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              formType === 'multi'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5 text-teal-600" />
            <span>1. แบบตารางหลายเหตุการณ์ (1 แผ่น)</span>
          </button>

          <button
            onClick={() => setFormType('single')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              formType === 'single'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>2. แบบเดี่ยวละเอียด (1 แผ่นต่อเคส)</span>
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/30 transition cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>สั่งพิมพ์แบบฟอร์ม (Print A4)</span>
        </button>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          title="ปิด"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sheet 1: Multi-Incident Form */}
      {formType === 'multi' && (
        <div className="print-report-container w-full max-w-4xl bg-white shadow-2xl rounded-2xl p-6 md:p-8 text-slate-900 border border-slate-300">
          {/* Header */}
          <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900">
              แบบบันทึกอุบัติการณ์ความคลาดเคลื่อนทางยาหน้างาน (ME Daily Log Sheet)
            </h1>
            <p className="text-xs text-slate-700 font-medium">
              งานเภสัชกรรมปฐมภูมิ เครือข่ายบริการสุขภาพอำเภอสวรรคโลก จังหวัดสุโขทัย
            </p>
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-800 pt-2 px-1">
              <span>หน่วยบริการ: <strong>{hospitalName}</strong></span>
              <span>ประจำเดือน: ........................................... พ.ศ. ...............</span>
              <span>แผ่นที่: ......... / .........</span>
            </div>
          </div>

          {/* Table */}
          <div className="mt-3">
            <table className="w-full text-left text-xs border-2 border-slate-800">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-800 text-center">
                <tr>
                  <th className="py-2 px-1 border-r border-slate-600 w-8">ที่</th>
                  <th className="py-2 px-1 border-r border-slate-600 w-16">วัน/เวลา</th>
                  <th className="py-2 px-1 border-r border-slate-600 w-16">HN</th>
                  <th className="py-2 px-2 border-r border-slate-600 w-32">ชื่อยา/ความแรง</th>
                  <th className="py-2 px-1 border-r border-slate-600 w-16">ขั้นตอน</th>
                  <th className="py-2 px-1 border-r border-slate-600 w-24">ระดับความรุนแรง</th>
                  <th className="py-2 px-2 border-r border-slate-600">รายละเอียดเหตุการณ์ & สาเหตุที่พบ</th>
                  <th className="py-2 px-2 border-r border-slate-600 w-36">การแก้ไขเบื้องต้น</th>
                  <th className="py-2 px-1 w-16">ผู้บันทึก</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b border-slate-800">
                {Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className="h-16 text-[11px] align-top">
                    <td className="py-1 px-1 border-r border-slate-400 text-center font-bold text-slate-500">
                      {i + 1}
                    </td>
                    <td className="py-1 px-1 border-r border-slate-400 text-[10px]">
                      ...... / ...... / ......<br />
                      เวลา: ..........
                    </td>
                    <td className="py-1 px-1 border-r border-slate-400"></td>
                    <td className="py-1 px-1 border-r border-slate-400"></td>
                    <td className="py-1 px-1 border-r border-slate-400 text-[9px] leading-tight text-center">
                      [ ] PE<br />
                      [ ] TE<br />
                      [ ] DE<br />
                      [ ] AE
                    </td>
                    <td className="py-1 px-1 border-r border-slate-400 text-[10px] text-center font-mono">
                      (วงกลมระดับ)<br />
                      <span className="font-bold">A B C D</span><br />
                      <span className="font-bold text-rose-800">E F G H I</span>
                    </td>
                    <td className="py-1 px-2 border-r border-slate-400"></td>
                    <td className="py-1 px-2 border-r border-slate-400"></td>
                    <td className="py-1 px-1 text-center"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Reference Cheat Sheet */}
          <div className="mt-3 p-2.5 border border-slate-400 rounded-lg bg-slate-50/50 print:bg-transparent text-[10px] text-slate-800 space-y-1">
            <div className="font-bold text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
              <span>* คำอธิบายประกอบการบันทึก (Cheat Sheet สำหรับเจ้าหน้าที่หน้างาน):</span>
              <span className="font-normal italic">กรอกในกระดาษแล้วนำบันทึกเข้าระบบ SWPC Healthcare ภายหลัง</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div>
                <strong>ขั้นตอน: </strong>
                <span><strong>PE</strong>=สั่งยาแพทย์, <strong>TE</strong>=คัดลอก/คีย์คำสั่ง, <strong>DE</strong>=จัด/จ่ายยา, <strong>AE</strong>=บริหารยา/ใช้ยา</span>
              </div>
              <div>
                <strong>ระดับความรุนแรง (NCC MERP): </strong>
                <span><strong>A</strong>=มีโอกาสเกิด, <strong>B</strong>=เกิดแต่ยังไม่ถึงผู้ป่วย, <strong>C</strong>=ถึงผู้ป่วยไม่เกิดอันตราย, <strong>D</strong>=ต้องเฝ้าระวัง, <strong>E-F</strong>=อันตรายชั่วคราว, <strong>G-H</strong>=อันตรายถาวร/วิกฤต, <strong>I</strong>=เสียชีวิต</span>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="mt-4 pt-2 flex items-center justify-between text-xs text-slate-700">
            <div>ผู้ส่งตรวจทาน/บันทึกเข้าระบบ: ................................................................ วันที่ ....... / ....... / ............</div>
            <div>เภสัชกร/ผู้ตรวจรับ: ................................................................ วันที่ ....... / ....... / ............</div>
          </div>
        </div>
      )}

      {/* Sheet 2: Single Incident Form */}
      {formType === 'single' && (
        <div className="print-report-container w-full max-w-4xl bg-white shadow-2xl rounded-2xl p-6 md:p-8 text-slate-900 border border-slate-300">
          {/* Header */}
          <div className="text-center pb-2 border-b-2 border-slate-900 space-y-0.5">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900">
              แบบรายงานอุบัติการณ์ความคลาดเคลื่อนทางยา (ฉบับรายเหตุการณ์)
            </h1>
            <p className="text-xs text-slate-700">
              งานเภสัชกรรมปฐมภูมิ เครือข่ายบริการสุขภาพอำเภอสวรรคโลก จังหวัดสุโขทัย
            </p>
          </div>

          <div className="mt-3 space-y-3 text-xs">
            {/* Section 1 */}
            <div className="border border-slate-400 p-2.5 rounded-lg space-y-1.5">
              <span className="font-bold block text-slate-900 bg-slate-100 p-1 rounded">1. ข้อมูลทั่วไป</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>หน่วยบริการ: <strong>{hospitalName}</strong></div>
                <div>วันที่เกิดเหตุ: ...... / ...... / .........</div>
                <div>เวลา: ................... น.</div>
                <div>HN ผู้ป่วย: ...........................</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>ชื่อ-นามสกุล: ........................................................</div>
                <div>เพศ: [ ] ชาย  [ ] หญิง   อายุ: ......... ปี</div>
                <div>ประวัติแพ้ยา: ..........................................</div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="border border-slate-400 p-2.5 rounded-lg space-y-1.5">
              <span className="font-bold block text-slate-900 bg-slate-100 p-1 rounded">2. ขั้นตอนที่เกิดความคลาดเคลื่อน (Error Stage)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>[ ] <strong>Prescribing (PE)</strong><br /><span className="text-[10px] text-slate-600">การสั่งใช้ยาของแพทย์</span></div>
                <div>[ ] <strong>Transcribing (TE)</strong><br /><span className="text-[10px] text-slate-600">การคัดลอก/ส่งต่อคำสั่ง</span></div>
                <div>[ ] <strong>Dispensing (DE)</strong><br /><span className="text-[10px] text-slate-600">การจัดและจ่ายยา</span></div>
                <div>[ ] <strong>Administration (AE)</strong><br /><span className="text-[10px] text-slate-600">การบริหารยา/การใช้ยา</span></div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="border border-slate-400 p-2.5 rounded-lg space-y-1.5">
              <span className="font-bold block text-slate-900 bg-slate-100 p-1 rounded">3. ระดับความรุนแรงตามดัชนี NCC MERP (กาเลือก 1 ข้อ)</span>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="space-y-1 border-r border-slate-300 pr-2">
                  <span className="font-bold text-teal-800 block text-[10px] uppercase">กลุ่มดักจับได้ (Near Miss)</span>
                  <div>[ ] <strong>Cat A:</strong> มีโอกาสทำให้เกิดคลาดเคลื่อน</div>
                  <div>[ ] <strong>Cat B:</strong> เกิดขึ้นแต่ยังไม่ถึงตัวผู้ป่วย</div>
                </div>
                <div className="space-y-1 border-r border-slate-300 pr-2">
                  <span className="font-bold text-amber-800 block text-[10px] uppercase">ยาถึงผู้ป่วย-ไม่เกิดอันตราย</span>
                  <div>[ ] <strong>Cat C:</strong> ยาถึงผู้ป่วย แต่ไม่เกิดอันตราย</div>
                  <div>[ ] <strong>Cat D:</strong> ยาถึงผู้ป่วย ต้องเฝ้าระวังอาการ</div>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-rose-800 block text-[10px] uppercase">เกิดอันตรายต่อผู้ป่วย (Harm)</span>
                  <div>[ ] <strong>Cat E-F:</strong> อันตรายชั่วคราว/ต้องรักษา</div>
                  <div>[ ] <strong>Cat G-H:</strong> อันตรายถาวร/วิกฤติต้องกู้ชีพ</div>
                  <div>[ ] <strong>Cat I:</strong> เป็นเหตุทำให้ผู้ป่วยเสียชีวิต</div>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="border border-slate-400 p-2.5 rounded-lg space-y-1.5">
              <span className="font-bold block text-slate-900 bg-slate-100 p-1 rounded">4. ข้อมูลยาและรายละเอียดเหตุการณ์</span>
              <div className="grid grid-cols-2 gap-2">
                <div>ชื่อยาที่เกี่ยวข้อง: ..........................................................................</div>
                <div>ขนาดยา/รูปแบบ: ..............................................................</div>
              </div>
              <div className="space-y-0.5">
                <div>รายละเอียดเหตุการณ์ที่เกิดขึ้น:</div>
                <div className="border border-dashed border-slate-400 rounded h-14 p-1.5 text-slate-400 text-[10px]">
                  (ระบุสิ่งที่สั่ง vs สิ่งที่จ่ายจริง vs สิ่งที่ผู้ป่วยได้รับประทาน...)
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="border border-slate-400 p-2.5 rounded-lg space-y-1.5">
              <span className="font-bold block text-slate-900 bg-slate-100 p-1 rounded">5. สาเหตุ ปัจจัยที่เกี่ยวข้อง และการแก้ไข</span>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <div>[ ] ยาชื่อพ้องมองคล้าย (LASA)</div>
                <div>[ ] ลายมือ/คำสั่งไม่ชัดเจน</div>
                <div>[ ] หยิบยาผิดขนาด/ผิดรูปแบบ</div>
                <div>[ ] ชื่อ-สกุลผู้ป่วยซ้ำกัน</div>
                <div>[ ] ฉลากยาไม่ชัดเจน/วางยาติดกัน</div>
                <div>[ ] ภาระงานเร่งด่วน/เสียงรบกวน</div>
              </div>
              <div className="pt-1">
                <div>การแก้ไขปัญหาเบื้องต้นและการป้องกัน:</div>
                <div className="border border-dashed border-slate-400 rounded h-12 p-1.5 text-slate-400 text-[10px]">
                  (ระบุการช่วยเหลือผู้ป่วยทันที และมาตรการป้องกันไม่ให้เกิดซ้ำ...)
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-2 grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <p>ลงชื่อ............................................................</p>
                <p className="mt-1">(............................................................)</p>
                <p className="text-[10px] text-slate-500">ผู้พบเห็น/ผู้รายงาน</p>
              </div>
              <div>
                <p>ลงชื่อ............................................................</p>
                <p className="mt-1">(............................................................)</p>
                <p className="text-[10px] text-slate-500">ผู้บันทึกเข้าระบบเว็บ SWPC</p>
              </div>
              <div>
                <p>ลงชื่อ............................................................</p>
                <p className="mt-1">(............................................................)</p>
                <p className="text-[10px] text-slate-500">เภสัชกร/ผู้ตรวจสอบ</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
