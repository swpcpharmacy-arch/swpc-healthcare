'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Building, 
  AlertTriangle, 
  Eye, 
  Trash2, 
  Layers, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { 
  MedicationErrorRecord, 
  ME_ERROR_TYPES, 
  ME_SEVERITY_LEVELS, 
  MEStage, 
  MESeverityLevel 
} from '@/lib/constants/me';
import { HOSPITALS } from '@/lib/constants';
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
  const [search, setSearch] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedSeverityGroup, setSelectedSeverityGroup] = useState<'all' | 'near_miss' | 'no_harm' | 'harm'>('all');
  const [dateRange, setDateRange] = useState<'all' | '30days' | '90days' | 'this_year'>('all');

  const [activeRecord, setActiveRecord] = useState<MedicationErrorRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchHn = item.patient_hn?.toLowerCase().includes(q);
        const matchDrug = item.drug_name?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchAction = item.actions_taken?.toLowerCase().includes(q);
        const matchHosp = item.hospital_name?.toLowerCase().includes(q);
        const matchReporter = item.reporter_name?.toLowerCase().includes(q);
        if (!matchHn && !matchDrug && !matchDesc && !matchAction && !matchHosp && !matchReporter) {
          return false;
        }
      }

      // Hospital
      if (selectedHospital !== 'all' && item.hospital_name !== selectedHospital) {
        return false;
      }

      // Stage
      if (selectedStage !== 'all' && item.error_type !== selectedStage) {
        return false;
      }

      // Severity Group
      if (selectedSeverityGroup !== 'all') {
        const meta = ME_SEVERITY_LEVELS[item.severity];
        if (meta?.group !== selectedSeverityGroup) {
          return false;
        }
      }

      // Date Range
      if (dateRange !== 'all') {
        const itemDate = new Date(item.report_date);
        const now = new Date();
        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);

        if (dateRange === '30days' && diffDays > 30) return false;
        if (dateRange === '90days' && diffDays > 90) return false;
        if (dateRange === 'this_year' && itemDate.getFullYear() !== now.getFullYear()) return false;
      }

      return true;
    });
  }, [records, search, selectedHospital, selectedStage, selectedSeverityGroup, dateRange]);

  const handleOpenDetail = (record: MedicationErrorRecord) => {
    setActiveRecord(record);
    setIsDetailOpen(true);
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedHospital('all');
    setSelectedStage('all');
    setSelectedSeverityGroup('all');
    setDateRange('all');
  };

  const hasActiveFilters = search || selectedHospital !== 'all' || selectedStage !== 'all' || selectedSeverityGroup !== 'all' || dateRange !== 'all';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4">
      {/* Table Toolbar & Filters */}
      <div className="p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              <span>รายการอุบัติการณ์ความคลาดเคลื่อนทางยา</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงผล {filteredRecords.length} จากทั้งหมด {records.length} รายการ
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา HN, ชื่อยา, รายละเอียด..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition placeholder:text-slate-400"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* Hospital Filter (Pharmacist only or all) */}
          {isPharmacist && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                หน่วยบริการ (รพ.สต.)
              </label>
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="w-full py-2 px-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="all">ทุกหน่วยบริการ</option>
                {HOSPITALS.map((hosp) => (
                  <option key={hosp.id} value={hosp.name}>
                    {hosp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stage Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              ขั้นตอน (Stage)
            </label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">ทุกขั้นตอน (PE/TE/DE/AE)</option>
              <option value="Prescribing">PE - สั่งใช้ยา</option>
              <option value="Transcribing">TE - คัดลอกคำสั่ง</option>
              <option value="Dispensing">DE - จัด/จ่ายยา</option>
              <option value="Administration">AE - บริหารยา</option>
            </select>
          </div>

          {/* Severity Group */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              ระดับความรุนแรง
            </label>
            <select
              value={selectedSeverityGroup}
              onChange={(e) => setSelectedSeverityGroup(e.target.value as any)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">ทุกระดับความรุนแรง (A-I)</option>
              <option value="near_miss">ดักจับได้ (Cat A - B)</option>
              <option value="no_harm">ถึงผู้ป่วย-ไม่อันตราย (Cat C - D)</option>
              <option value="harm">เกิดอันตราย (Cat E - I)</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              ช่วงเวลา
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="30days">30 วันล่าสุด</option>
              <option value="90days">90 วันล่าสุด</option>
              <option value="this_year">ปีปัจจุบัน</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="py-2 px-3 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition font-medium flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>ล้างตัวกรอง</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">วันที่เกิดเหตุ</th>
              <th className="py-3.5 px-4">ความรุนแรง</th>
              <th className="py-3.5 px-4">ขั้นตอน</th>
              <th className="py-3.5 px-4">HN / ชื่อยา</th>
              <th className="py-3.5 px-4">รายละเอียดเหตุการณ์</th>
              <th className="py-3.5 px-4">หน่วยบริการ</th>
              <th className="py-3.5 px-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600">ไม่พบรายการความคลาดเคลื่อนทางยา</p>
                    <p className="text-[11px] text-slate-400">
                      {hasActiveFilters 
                        ? 'ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือล้างตัวกรอง' 
                        : 'ยังไม่มีการบันทึกอุบัติการณ์ในช่วงเวลานี้ สามารถคลิก "+ บันทึก ME" เพื่อเพิ่มข้อมูล'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((item) => {
                const stageMeta = ME_ERROR_TYPES[item.error_type];
                const severityMeta = ME_SEVERITY_LEVELS[item.severity];

                return (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenDetail(item)}
                    className="hover:bg-slate-50/80 cursor-pointer transition group"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {new Date(item.report_date).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Severity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-xl font-bold inline-flex items-center gap-1 ${severityMeta.badgeClass}`}>
                        <span>Cat {item.severity}</span>
                      </span>
                    </td>

                    {/* Error Stage */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${stageMeta?.bgLight} ${stageMeta?.color}`}>
                        {stageMeta?.code}
                      </span>
                      <span className="text-slate-600 text-[11px] ml-1.5 hidden sm:inline">
                        {stageMeta?.label.split('(')[0]}
                      </span>
                    </td>

                    {/* HN / Drug */}
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 max-w-xs">
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
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{item.hospital_name || 'รพ.สต.'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(item);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition"
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
