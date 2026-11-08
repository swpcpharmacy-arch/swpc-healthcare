'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  PlusCircle, 
  Printer, 
  BarChart3, 
  ListFilter, 
  Building2, 
  Calendar, 
  Sparkles, 
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  X,
  RotateCcw
} from 'lucide-react';
import { 
  MedicationErrorRecord, 
  DateFilterMode, 
  ME_SEVERITY_LEVELS 
} from '@/lib/constants/me';
import { HOSPITALS } from '@/lib/constants';
import MEStatsOverview from './MEStatsOverview';
import MEIncidentTable from './MEIncidentTable';
import MEFormModal from './MEFormModal';
import MEPrintReport from './MEPrintReport';
import MEBlankFormsModal from './MEBlankFormsModal';

interface MEDashboardProps {
  initialRecords: MedicationErrorRecord[];
  currentUserId?: string;
  userRole?: string;
  fullName?: string;
  hospitalName?: string;
  isPharmacist?: boolean;
}

export default function MEDashboard({
  initialRecords,
  currentUserId,
  userRole,
  fullName,
  hospitalName = 'รพ.สต. ในเครือข่าย',
  isPharmacist = false,
}: MEDashboardProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'incidents'>('analytics');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isBlankFormsModalOpen, setIsBlankFormsModalOpen] = useState(false);

  // Centralized Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(isPharmacist ? 'all' : hospitalName);
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedSeverityGroup, setSelectedSeverityGroup] = useState<'all' | 'near_miss' | 'no_harm' | 'harm'>('all');

  // Filtered Records Calculation
  const filteredRecords = useMemo(() => {
    return initialRecords.filter((item) => {
      // 1. Hospital Filter (Pharmacist can choose, Staff is locked to their hospital)
      if (!isPharmacist) {
        if (item.hospital_name !== hospitalName) return false;
      } else if (selectedHospital !== 'all' && item.hospital_name !== selectedHospital) {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
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

      // 3. Stage Filter (PE, TE, DE, AE)
      if (selectedStage !== 'all' && item.error_type !== selectedStage) {
        return false;
      }

      // 4. Severity Group Filter
      if (selectedSeverityGroup !== 'all') {
        const meta = ME_SEVERITY_LEVELS[item.severity];
        if (meta?.group !== selectedSeverityGroup) return false;
      }

      // 5. Date Period Filter
      if (dateFilterMode !== 'all') {
        const itemDate = new Date(item.report_date);
        const now = new Date();

        if (dateFilterMode === 'this_month') {
          if (itemDate.getFullYear() !== now.getFullYear() || itemDate.getMonth() !== now.getMonth()) {
            return false;
          }
        } else if (dateFilterMode === 'last_month') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          if (itemDate.getFullYear() !== lastMonth.getFullYear() || itemDate.getMonth() !== lastMonth.getMonth()) {
            return false;
          }
        } else if (dateFilterMode === 'quarter') {
          const currentQ = Math.floor(now.getMonth() / 3);
          const itemQ = Math.floor(itemDate.getMonth() / 3);
          if (itemDate.getFullYear() !== now.getFullYear() || itemQ !== currentQ) {
            return false;
          }
        } else if (dateFilterMode === 'fiscal_year') {
          const currentFiscalYear = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
          const itemFiscalYear = itemDate.getMonth() >= 9 ? itemDate.getFullYear() + 1 : itemDate.getFullYear();
          if (itemFiscalYear !== currentFiscalYear) return false;
        } else if (dateFilterMode === 'custom') {
          if (customStartDate && itemDate < new Date(customStartDate)) return false;
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
        }
      }

      return true;
    });
  }, [
    initialRecords,
    isPharmacist,
    hospitalName,
    selectedHospital,
    searchQuery,
    selectedStage,
    selectedSeverityGroup,
    dateFilterMode,
    customStartDate,
    customEndDate,
  ]);

  // Compute Readable Period Label
  const datePeriodLabel = useMemo(() => {
    const now = new Date();
    if (dateFilterMode === 'all') return 'ข้อมูลสะสมทั้งหมดถึงปัจจุบัน';
    if (dateFilterMode === 'this_month') {
      return `ประจำเดือน ${now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`;
    }
    if (dateFilterMode === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `ประจำเดือน ${lastMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`;
    }
    if (dateFilterMode === 'quarter') {
      const q = Math.floor(now.getMonth() / 3) + 1;
      return `ไตรมาสที่ ${q} (ปี พ.ศ. ${now.getFullYear() + 543})`;
    }
    if (dateFilterMode === 'fiscal_year') {
      const fiscalYearBE = (now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()) + 543;
      return `ปีงบประมาณ ${fiscalYearBE} (1 ต.ค. - 30 ก.ย.)`;
    }
    if (dateFilterMode === 'custom') {
      const s = customStartDate ? new Date(customStartDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'เริ่มต้น';
      const e = customEndDate ? new Date(customEndDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'ปัจจุบัน';
      return `ระหว่างวันที่ ${s} ถึง ${e}`;
    }
    return 'ข้อมูลสะสม';
  }, [dateFilterMode, customStartDate, customEndDate]);

  const resetFilters = () => {
    setSearchQuery('');
    setDateFilterMode('all');
    setCustomStartDate('');
    setCustomEndDate('');
    if (isPharmacist) setSelectedHospital('all');
    setSelectedStage('all');
    setSelectedSeverityGroup('all');
  };

  const hasActiveFilters = 
    searchQuery || 
    dateFilterMode !== 'all' || 
    selectedStage !== 'all' || 
    selectedSeverityGroup !== 'all' || 
    (isPharmacist && selectedHospital !== 'all');

  return (
    <div className="space-y-6">
      {/* Screen Interactive UI (Hidden completely on print) */}
      <div className="screen-only space-y-6">
        {/* Top Banner & Quick Actions */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -z-0 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ระบบบริหารความปลอดภัยด้านยา (Patient Safety)</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                ระบบรายงานอุบัติการณ์ความคลาดเคลื่อนทางยา (ME)
              </h1>

              <p className="text-teal-100 text-xs md:text-sm leading-relaxed">
                บันทึก เฝ้าระวัง และวิเคราะห์ความคลาดเคลื่อนทางยาในเครือข่ายบริการสุขภาพอำเภอสวรรคโลก
                ตามมาตรฐานดัชนีความรุนแรง NCC MERP (Cat A - I)
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-teal-200">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>หน่วยบริการ: <strong>{isPharmacist ? (selectedHospital === 'all' ? 'ทุกหน่วยบริการ (ภาพรวม)' : selectedHospital) : hospitalName}</strong></span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>ช่วงเวลา: <strong>{datePeriodLabel}</strong></span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* Button 1: Blank Printable Forms */}
              <button
                onClick={() => setIsBlankFormsModalOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2 border border-white/25 transition shadow-sm cursor-pointer"
                title="พิมพ์แบบฟอร์มเปล่าขนาด A4 ไว้จดบันทึกหน้างาน"
              >
                <FileText className="w-4 h-4 text-teal-200" />
                <span>พิมพ์แบบฟอร์มเปล่า</span>
              </button>

              {/* Button 2: Print A4 Report */}
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2 border border-white/25 transition shadow-sm cursor-pointer"
                title="พิมพ์รายงานสรุปผลพร้อมสถิติขนาด A4"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์รายงาน A4</span>
              </button>

              {/* Button 3: New ME Record */}
              <button
                onClick={() => setIsFormModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-white text-teal-900 hover:bg-teal-50 text-xs font-bold flex items-center gap-2 transition shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>+ บันทึกรายงาน ME</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Control Bar */}
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Filter className="w-4 h-4 text-teal-600" />
              <span>ตัวกรองข้อมูลและการค้นหา</span>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                  กรองแล้ว {filteredRecords.length} จาก {initialRecords.length}
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ล้างตัวกรองทั้งหมด</span>
              </button>
            )}
          </div>

          {/* Filter Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* 1. Date Range Preset */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>ช่วงเวลาที่ต้องการดู</span>
              </label>
              <select
                value={dateFilterMode}
                onChange={(e) => setDateFilterMode(e.target.value as DateFilterMode)}
                className="w-full py-2 px-2.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="all">ทั้งหมด (สะสมถึงปัจจุบัน)</option>
                <option value="this_month">เดือนปัจจุบัน (เดือนนี้)</option>
                <option value="last_month">เดือนที่แล้ว</option>
                <option value="quarter">ไตรมาสปัจจุบัน</option>
                <option value="fiscal_year">ปีงบประมาณปัจจุบัน (1 ต.ค. - 30 ก.ย.)</option>
                <option value="custom">📅 กำหนดช่วงวันที่เอง...</option>
              </select>
            </div>

            {/* 2. Hospital Filter (Pharmacist only) / Staff Hospital Badge */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>หน่วยบริการ (รพ.สต.)</span>
              </label>
              {isPharmacist ? (
                <select
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                  className="w-full py-2 px-2.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="all">ทุกหน่วยบริการในอำเภอสวรรคโลก</option>
                  {HOSPITALS.map((hosp) => (
                    <option key={hosp.id} value={hosp.name}>
                      {hosp.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full py-2 px-3 rounded-xl border border-teal-200 bg-teal-50/60 text-xs text-teal-900 font-bold truncate">
                  {hospitalName}
                </div>
              )}
            </div>

            {/* 3. Stage Filter (PE, TE, DE, AE) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                ขั้นตอนที่เกิดความคลาดเคลื่อน
              </label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full py-2 px-2.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">ทุกขั้นตอน (PE/TE/DE/AE)</option>
                <option value="Prescribing">PE - สั่งใช้ยาของแพทย์</option>
                <option value="Transcribing">TE - คัดลอก/ส่งต่อคำสั่ง</option>
                <option value="Dispensing">DE - จัดและจ่ายยา</option>
                <option value="Administration">AE - บริหารยา/การใช้ยา</option>
              </select>
            </div>

            {/* 4. Search Box */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                ค้นหาคำสำคัญ
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="HN, ชื่อยา, รายละเอียดเหตุการณ์..."
                  className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Custom Date Range Row (Revealed when dateFilterMode === 'custom') */}
          {dateFilterMode === 'custom' && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs bg-teal-50/50 p-3 rounded-xl border border-teal-100">
              <span className="font-bold text-teal-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>ระบุช่วงวันที่:</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">ตั้งแต่:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">ถึงวันที่:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <span>สถิติและบทวิเคราะห์ ({filteredRecords.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'incidents'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-4 h-4 text-teal-600" />
              <span>รายการอุบัติการณ์ ({filteredRecords.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>{isPharmacist ? 'สิทธิ์: เภสัชกร (บริหารจัดการระดับอำเภอ)' : `สิทธิ์: เจ้าหน้าที่ (${hospitalName})`}</span>
          </div>
        </div>

        {/* Tab Panels */}
        {activeTab === 'analytics' ? (
          <div className="space-y-6">
            <MEStatsOverview 
              records={filteredRecords}
              onSelectSeverityFilter={(group) => {
                setSelectedSeverityGroup(group);
                setActiveTab('incidents');
              }}
              onSelectStageFilter={(stage) => {
                setSelectedStage(stage);
                setActiveTab('incidents');
              }}
            />

            {/* Quick list preview below stats */}
            <div className="pt-2">
              <MEIncidentTable
                records={filteredRecords}
                currentUserId={currentUserId}
                isPharmacist={isPharmacist}
              />
            </div>
          </div>
        ) : (
          <MEIncidentTable
            records={filteredRecords}
            currentUserId={currentUserId}
            isPharmacist={isPharmacist}
          />
        )}
      </div>

      {/* Modal: New ME Form */}
      <MEFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        hospitalName={isPharmacist ? selectedHospital : hospitalName}
      />

      {/* Modal: Print A4 Report (Data Summary) */}
      <MEPrintReport
        records={filteredRecords}
        hospitalFilter={isPharmacist ? (selectedHospital === 'all' ? 'ทุกหน่วยบริการในอำเภอสวรรคโลก' : selectedHospital) : hospitalName}
        datePeriodLabel={datePeriodLabel}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reporterName={fullName}
      />

      {/* Modal: Blank Forms for On-Site Recording */}
      <MEBlankFormsModal
        isOpen={isBlankFormsModalOpen}
        onClose={() => setIsBlankFormsModalOpen(false)}
        hospitalName={isPharmacist ? (selectedHospital === 'all' ? 'รพ.สต. ในเครือข่ายอำเภอสวรรคโลก' : selectedHospital) : hospitalName}
      />
    </div>
  );
}
