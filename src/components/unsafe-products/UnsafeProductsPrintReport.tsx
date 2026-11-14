'use client';

import React from 'react';
import { Printer, X } from 'lucide-react';
import { 
  UnsafeProductRecord, 
  PRODUCT_CATEGORIES, 
  DISTRIBUTION_CHANNELS, 
  ACTION_STATUSES 
} from '@/lib/constants/unsafeProducts';

interface UnsafeProductsPrintReportProps {
  records: UnsafeProductRecord[];
  subdistrictFilter?: string;
  isOpen: boolean;
  onClose: () => void;
  pharmacistName?: string;
}

export default function UnsafeProductsPrintReport({
  records,
  subdistrictFilter,
  isOpen,
  onClose,
  pharmacistName = 'ภก.อดิศร (เภสัชกรผู้รับผิดชอบงาน คบส.)',
}: UnsafeProductsPrintReportProps) {
  if (!isOpen) return null;

  const total = records.length;
  const criticalCount = records.filter((r) => r.risk_level === 'critical').length;
  const highCount = records.filter((r) => r.risk_level === 'high').length;
  const resolvedCount = records.filter((r) => r.status === 'resolved').length;
  const inActionCount = records.filter((r) => r.status === 'investigating' || r.status === 'action_taken').length;
  const pendingCount = records.filter((r) => r.status === 'pending').length;

  const handlePrint = () => {
    window.print();
  };

  const printDateStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="print-modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center">
      {/* Floating Control Bar (Hidden on print) */}
      <div className="screen-only fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/30 transition cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>สั่งพิมพ์รายงาน (Print / Save PDF)</span>
        </button>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-500 flex items-center justify-center transition cursor-pointer"
          title="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Printable Sheet (Standard A4) */}
      <div className="printable-sheet print-report-container bg-white w-full max-w-4xl p-8 sm:p-12 rounded-3xl shadow-2xl border border-slate-200 my-auto text-slate-800 font-sans print:shadow-none print:border-none print:m-0 print:p-6 print:rounded-none">
        {/* Header */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-widest text-teal-800 uppercase">
                เครือข่ายบริการสุขภาพอำเภอสวรรคโลก (SWPC) • งานคุ้มครองผู้บริโภคด้านสุขภาพ (คบส.)
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                รายงานสรุปสถานการณ์เฝ้าระวังยาและผลิตภัณฑ์สุขภาพในชุมชน
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                ตามเกณฑ์การประเมินมาตรฐานปฐมภูมิ ส่วนที่ 7 และแนวทาง RDU Community / G-RDU & G-SHP
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold block text-slate-800">วันที่ออกรายงาน:</span>
              <span className="text-slate-600">{printDateStr}</span>
            </div>
          </div>
        </div>

        {/* Filters and Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-6">
          <div>
            <span className="text-slate-500 block text-[10px]">พื้นที่ครอบคลุม:</span>
            <span className="font-bold text-slate-800">
              {subdistrictFilter ? `ต.${subdistrictFilter} อ.สวรรคโลก` : 'ทุกลำดับตำบล ใน อ.สวรรคโลก'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">จำนวนเบาะแสทั้งหมด:</span>
            <span className="font-bold text-teal-800">{total} รายการ</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">ดำเนินการเสร็จสิ้น:</span>
            <span className="font-bold text-emerald-700">{resolvedCount} รายการ ({(total > 0 ? (resolvedCount / total * 100).toFixed(0) : 0)}%)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">ความเสี่ยงสูง/วิกฤติ:</span>
            <span className="font-bold text-rose-700">{criticalCount + highCount} รายการ</span>
          </div>
        </div>

        {/* Statistical Summary Cards */}
        <div className="grid grid-cols-4 gap-2 mb-6 text-center text-xs">
          <div className="border border-slate-200 p-2 rounded-lg">
            <span className="text-[10px] text-slate-500 block">รอดำเนินการ</span>
            <span className="text-sm font-bold text-amber-600">{pendingCount}</span>
          </div>
          <div className="border border-slate-200 p-2 rounded-lg">
            <span className="text-[10px] text-slate-500 block">กำลังจัดการ/ลงพื้นที่</span>
            <span className="text-sm font-bold text-sky-600">{inActionCount}</span>
          </div>
          <div className="border border-slate-200 p-2 rounded-lg">
            <span className="text-[10px] text-slate-500 block">ยุติเรื่องแล้ว</span>
            <span className="text-sm font-bold text-emerald-600">{resolvedCount}</span>
          </div>
          <div className="border border-slate-200 p-2 rounded-lg">
            <span className="text-[10px] text-slate-500 block">ประกาศเตือนภัยชุมชน</span>
            <span className="text-sm font-bold text-rose-600">{records.filter((r) => r.is_safety_alert).length}</span>
          </div>
        </div>

        {/* Table of Surveillance Records */}
        <div className="overflow-hidden border border-slate-200 rounded-xl mb-6">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                <th className="py-2.5 px-3">ชื่อผลิตภัณฑ์ / ความเสี่ยง</th>
                <th className="py-2.5 px-3">หมวดหมู่</th>
                <th className="py-2.5 px-3">สถานที่พบ / แหล่งกระจาย</th>
                <th className="py-2.5 px-3">ผลตรวจ Test Kit</th>
                <th className="py-2.5 px-3">สถานะ / ข้อสั่งการเภสัชกร</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.map((r, idx) => {
                const catMeta = PRODUCT_CATEGORIES.find((c) => c.id === r.product_category);
                const stMeta = ACTION_STATUSES.find((s) => s.id === r.status);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-center font-medium text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900">{r.product_name}</div>
                      <div className="text-[10px] text-slate-500">{r.risk_type}</div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-slate-700">
                        {catMeta?.label || r.product_category}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-800">
                        {r.store_name ? `${r.store_name} ` : ''}ต.{r.subdistrict || 'สวรรคโลก'}
                      </div>
                      <div className="text-[10px] text-slate-500">{r.location_found}</div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-semibold ${
                        r.test_kit_result.includes('positive') ? 'text-rose-700 font-bold' : 'text-slate-600'
                      }`}>
                        {r.test_kit_result === 'positive_steroid' ? 'พบสเตียรอยด์ (+)' :
                         r.test_kit_result === 'positive_chemical' ? 'พบสารเคมี (+)' :
                         r.test_kit_result === 'negative' ? 'ผลลบ (-)' : 'ไม่ได้ตรวจ'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-800 text-[10px]">
                        {stMeta?.label.split(' ')[0] || r.status}
                      </div>
                      <div className="text-[10px] text-slate-600 line-clamp-2">
                        {r.action_details || 'รอดำเนินการ'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs">
          <div className="text-center space-y-8">
            <p className="text-slate-600">ลงชื่อ .............................................................. ผู้จัดทำรายงาน</p>
            <div>
              <p className="font-bold text-slate-800">( .............................................................. )</p>
              <p className="text-slate-500 text-[10px] mt-0.5">เจ้าหน้าที่ผู้รับผิดชอบงานคุ้มครองผู้บริโภค รพ.สต.</p>
            </div>
          </div>
          <div className="text-center space-y-8">
            <p className="text-slate-600">ลงชื่อ .............................................................. ผู้ตรวจสอบ/รับทราบ</p>
            <div>
              <p className="font-bold text-slate-800">( {pharmacistName} )</p>
              <p className="text-slate-500 text-[10px] mt-0.5">เภสัชกรชำนาญการ / ประธาน คกก.คบส. อำเภอสวรรคโลก</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
