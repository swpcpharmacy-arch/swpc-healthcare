'use client';

import React from 'react';
import { 
  EVIDENCE_CRITERIA_GROUPS, 
  CriteriaGroupDef 
} from '@/lib/data/evidenceChecklistData';
import { EvidenceDocument, EVIDENCE_STATUS_CONFIG } from '@/lib/constants/evidence';

interface EvidencePrintReportProps {
  hospitalName: string;
  fiscalYear: number;
  evidenceMap: Record<string, EvidenceDocument>;
  printedAt: string;
}

export default function EvidencePrintReport({
  hospitalName,
  fiscalYear,
  evidenceMap,
  printedAt,
}: EvidencePrintReportProps) {
  // Statistics
  let totalItems = 0;
  let submittedCount = 0;
  let verifiedCount = 0;

  EVIDENCE_CRITERIA_GROUPS.forEach((group) => {
    group.items.forEach((item) => {
      totalItems++;
      const doc = evidenceMap[item.key];
      if (doc?.document_link) {
        submittedCount++;
        if (doc.status === 'verified') {
          verifiedCount++;
        }
      }
    });
  });

  const percent = totalItems > 0 ? Math.round((submittedCount / totalItems) * 100) : 0;

  return (
    <div className="print-only hidden font-sans text-black bg-white p-6 leading-normal">
      {/* Official Document Header */}
      <div className="text-center border-b-2 border-slate-800 pb-4 mb-5">
        <h1 className="text-xl font-bold tracking-tight">
          แบบสรุปการจัดเตรียมเอกสารหลักฐานประกอบการตรวจนิเทศงาน
        </h1>
        <h2 className="text-base font-semibold mt-1 text-slate-800">
          งานบริการเภสัชกรรมปฐมภูมิ และการคุ้มครองผู้บริโภคด้านสุขภาพ (คบส.) ส่วนที่ 7
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          เครือข่ายบริการสุขภาพอำเภอสวรรคโลก จังหวัดสุโขทัย
        </p>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-300 text-xs text-left">
          <div>
            <strong>หน่วยบริการ (รพ.สต.):</strong> {hospitalName}
          </div>
          <div>
            <strong>ปีงบประมาณ:</strong> พ.ศ. {fiscalYear}
          </div>
          <div className="text-right">
            <strong>วันที่ออกรายงาน:</strong> {printedAt}
          </div>
        </div>

        <div className="mt-2 text-xs flex justify-between bg-slate-100 p-2 rounded border border-slate-300">
          <span>
            <strong>สถานะความพร้อมเอกสาร:</strong> แนบแล้ว {submittedCount} จาก {totalItems} รายการ ({percent}%)
          </span>
          <span>
            <strong>ตรวจรับรองแล้ว:</strong> {verifiedCount} รายการ
          </span>
        </div>
      </div>

      {/* Main Table */}
      <table className="w-full text-xs border-collapse border border-slate-400">
        <thead>
          <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
            <th className="border border-slate-400 p-1.5 w-8 text-center">ที่</th>
            <th className="border border-slate-400 p-1.5 w-36 text-left">เกณฑ์ประเมิน</th>
            <th className="border border-slate-400 p-1.5 text-left">รายการหลักฐาน (Checklist)</th>
            <th className="border border-slate-400 p-1.5 w-28 text-center">สถานะ</th>
            <th className="border border-slate-400 p-1.5 w-44 text-left">ลิงก์ / หมายเหตุ</th>
            <th className="border border-slate-400 p-1.5 w-20 text-center">ผลตรวจนิเทศ</th>
          </tr>
        </thead>
        <tbody>
          {EVIDENCE_CRITERIA_GROUPS.map((group, groupIdx) => {
            return (
              <React.Fragment key={group.id}>
                {/* Section Header Row */}
                <tr className="bg-slate-100 font-bold border-b border-slate-400 break-inside-avoid">
                  <td colSpan={6} className="border border-slate-400 p-1.5 text-slate-900">
                    {group.order}. {group.title} ({group.pointsPossible} คะแนน) &mdash; {group.category}
                  </td>
                </tr>

                {/* Items in this group */}
                {group.items.map((item, itemIdx) => {
                  const doc = evidenceMap[item.key];
                  const hasLink = !!doc?.document_link;
                  const status = doc?.status || 'draft';

                  return (
                    <tr key={item.key} className="border-b border-slate-300 break-inside-avoid">
                      <td className="border border-slate-400 p-1.5 text-center text-slate-600 align-top">
                        {item.order}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-slate-700 align-top">
                        {group.title}
                      </td>
                      <td className="border border-slate-400 p-1.5 align-top">
                        <div className="font-medium text-slate-900">{item.title}</div>
                        {item.description && (
                          <div className="text-[10px] text-slate-500 mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center align-top">
                        {hasLink ? (
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : status === 'needs_revision'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-sky-100 text-sky-800 border border-sky-300'
                          }`}>
                            {status === 'verified' ? '✓ ตรวจผ่าน' : status === 'needs_revision' ? '✕ ต้องแก้ไข' : 'แนบแล้ว'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            - ยังไม่แนบ -
                          </span>
                        )}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-[10px] text-slate-700 align-top break-all">
                        {hasLink ? (
                          <div className="space-y-0.5">
                            <div className="font-mono text-teal-800 truncate max-w-[170px]" title={doc.document_link}>
                              {doc.document_link}
                            </div>
                            {doc.notes && (
                              <div className="text-slate-500 italic">
                                &bull; {doc.notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center align-top text-[10px]">
                        {doc?.review_comment ? (
                          <div className="text-left font-medium text-purple-900">
                            {doc.review_comment}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Signature Section */}
      <div className="mt-8 pt-6 border-t border-slate-400 break-inside-avoid">
        <div className="grid grid-cols-2 gap-8 text-xs text-center">
          <div className="space-y-12">
            <p className="font-semibold text-slate-800">
              ลงชื่อ................................................................. ผู้จัดทำหลักฐาน
            </p>
            <div>
              <p>(.................................................................)</p>
              <p className="text-slate-600 mt-1">ตำแหน่ง เจ้าหน้าที่ผู้รับผิดชอบงานยา / คบส.</p>
              <p className="text-slate-500 mt-1">วันที่ ..... / ..................... / พ.ศ. {fiscalYear}</p>
            </div>
          </div>

          <div className="space-y-12">
            <p className="font-semibold text-slate-800">
              ลงชื่อ................................................................. เภสัชกรผู้ตรวจนิเทศ
            </p>
            <div>
              <p>(.................................................................)</p>
              <p className="text-slate-600 mt-1">ตำแหน่ง เภสัชกรชำนาญการ / ผู้แทน สสอ.สวรรคโลก</p>
              <p className="text-slate-500 mt-1">วันที่ ..... / ..................... / พ.ศ. {fiscalYear}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
