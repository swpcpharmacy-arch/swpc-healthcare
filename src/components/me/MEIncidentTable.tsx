'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Building, 
  AlertTriangle, 
  Eye, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { 
  MedicationErrorRecord, 
  ME_ERROR_TYPES, 
  ME_SEVERITY_LEVELS 
} from '@/lib/constants/me';
import MEDetailModal from './MEDetailModal';

interface MEIncidentTableProps {
  records: MedicationErrorRecord[];
  currentUserId?: string;
  isPharmacist?: boolean;
}

export default function MEIncidentTable({
  records,
  currentUserId,
  isPharmacist = false,
}: MEIncidentTableProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [activeRecord, setActiveRecord] = useState<MedicationErrorRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filter with local search if typed
  const displayRecords = useMemo(() => {
    if (!localSearch.trim()) return records;
    const q = localSearch.toLowerCase();
    return records.filter((item) => {
      const matchHn = item.patient_hn?.toLowerCase().includes(q);
      const matchDrug = item.drug_name?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchAction = item.actions_taken?.toLowerCase().includes(q);
      const matchHosp = item.hospital_name?.toLowerCase().includes(q);
      const matchReporter = item.reporter_name?.toLowerCase().includes(q);
      return matchHn || matchDrug || matchDesc || matchAction || matchHosp || matchReporter;
    });
  }, [records, localSearch]);

  const handleOpenDetail = (record: MedicationErrorRecord) => {
    setActiveRecord(record);
    setIsDetailOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4">
      {/* Table Toolbar */}
      <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm md:text-base text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
            <span>บัญชีรายการอุบัติการณ์ความคลาดเคลื่อนทางยา</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            แสดงผล {displayRecords.length} จากทั้งหมด {records.length} รายการ
          </p>
        </div>

        {/* Local Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="ค้นหาในตาราง..."
            className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition placeholder:text-slate-400"
          />
          {localSearch && (
            <button 
              onClick={() => setLocalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">วันที่เกิดเหตุ</th>
              <th className="py-3 px-4">ความรุนแรง</th>
              <th className="py-3 px-4">ขั้นตอน</th>
              <th className="py-3 px-4">HN / ชื่อยา</th>
              <th className="py-3 px-4">รายละเอียดเหตุการณ์</th>
              <th className="py-3 px-4">หน่วยบริการ</th>
              <th className="py-3 px-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600">ไม่พบรายการความคลาดเคลื่อนทางยา</p>
                    <p className="text-[11px] text-slate-400">
                      {localSearch 
                        ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหาในตาราง' 
                        : 'ไม่มีรายการอุบัติการณ์ในช่วงเวลาหรือเงื่อนไขที่เลือก'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              displayRecords.map((item) => {
                const stageMeta = ME_ERROR_TYPES[item.error_type];
                const severityMeta = ME_SEVERITY_LEVELS[item.severity];

                return (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenDetail(item)}
                    className="hover:bg-slate-50/80 cursor-pointer transition group"
                  >
                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {new Date(item.report_date).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-xl font-bold inline-flex items-center gap-1 ${severityMeta.badgeClass}`}>
                        <span>Cat {item.severity}</span>
                      </span>
                    </td>

                    {/* Error Stage */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${stageMeta?.bgLight} ${stageMeta?.color}`}>
                        {stageMeta?.code}
                      </span>
                      <span className="text-slate-600 text-[11px] ml-1.5 hidden sm:inline">
                        {stageMeta?.label.split('(')[0]}
                      </span>
                    </td>

                    {/* HN / Drug */}
                    <td className="py-3 px-4">
                      {item.patient_hn && (
                        <span className="font-mono font-semibold text-slate-700 block text-[11px]">
                          HN: {item.patient_hn}
                        </span>
                      )}
                      {item.drug_name ? (
                        <span className="text-teal-700 font-medium line-clamp-1 text-[11px]">
                          {item.drug_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-800 line-clamp-2 leading-relaxed text-xs">
                        {item.description}
                      </p>
                      {item.actions_taken && (
                        <p className="text-emerald-700 text-[11px] line-clamp-1 mt-0.5">
                          ✓ {item.actions_taken}
                        </p>
                      )}
                    </td>

                    {/* Hospital */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{item.hospital_name || 'รพ.สต.'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(item);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition cursor-pointer"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <MEDetailModal
        record={activeRecord}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setActiveRecord(null);
        }}
        canDelete={
          isPharmacist || (!!currentUserId && activeRecord?.reporter_id === currentUserId)
        }
      />
    </div>
  );
}
