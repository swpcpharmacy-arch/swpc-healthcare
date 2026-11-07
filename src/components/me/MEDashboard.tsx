'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  PlusCircle, 
  Printer, 
  BarChart3, 
  ListFilter, 
  ArrowLeft,
  Building2,
  Calendar,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { MedicationErrorRecord } from '@/lib/constants/me';
import MEStatsOverview from './MEStatsOverview';
import MEIncidentTable from './MEIncidentTable';
import MEFormModal from './MEFormModal';
import MEPrintReport from './MEPrintReport';

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
  hospitalName,
  isPharmacist = false,
}: MEDashboardProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'incidents'>('analytics');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  return (
    <div className="space-y-6">
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

            <div className="flex items-center gap-4 pt-1 text-xs text-teal-200">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>หน่วยบริการ: <strong>{hospitalName}</strong></span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2 border border-white/20 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์รายงาน A4</span>
            </button>

            <button
              onClick={() => setIsFormModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-white text-teal-900 hover:bg-teal-50 text-xs font-bold flex items-center gap-2 transition shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>+ บันทึกรายงาน ME</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span>สถิติและบทวิเคราะห์</span>
          </button>

          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'incidents'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-4 h-4 text-teal-600" />
            <span>รายการอุบัติการณ์ ({initialRecords.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span>{isPharmacist ? 'สิทธิ์: เภสัชกร (ดูข้อมูลได้ทุก รพ.สต.)' : 'สิทธิ์: เจ้าหน้าที่ รพ.สต.'}</span>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'analytics' ? (
        <div className="space-y-6">
          <MEStatsOverview 
            records={initialRecords}
            onSelectSeverityFilter={() => setActiveTab('incidents')}
            onSelectStageFilter={() => setActiveTab('incidents')}
          />

          {/* Quick list preview below stats */}
          <div className="pt-2">
            <MEIncidentTable
              records={initialRecords}
              currentUserId={currentUserId}
              isPharmacist={isPharmacist}
            />
          </div>
        </div>
      ) : (
        <MEIncidentTable
          records={initialRecords}
          currentUserId={currentUserId}
          isPharmacist={isPharmacist}
        />
      )}

      {/* Modal: New ME Form */}
      <MEFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        hospitalName={hospitalName}
      />

      {/* Modal: Print A4 Report */}
      <MEPrintReport
        records={initialRecords}
        hospitalFilter={hospitalName}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reporterName={fullName}
      />
    </div>
  );
}
