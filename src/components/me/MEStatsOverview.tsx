'use client';

import React from 'react';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  TrendingUp, 
  CheckCircle, 
  Layers,
  HeartPulse
} from 'lucide-react';
import { 
  MedicationErrorRecord, 
  ME_ERROR_TYPES, 
  ME_SEVERITY_LEVELS, 
  MEStage, 
  MESeverityLevel 
} from '@/lib/constants/me';

interface MEStatsOverviewProps {
  records: MedicationErrorRecord[];
  onSelectSeverityFilter?: (severityGroup: 'all' | 'near_miss' | 'no_harm' | 'harm') => void;
  onSelectStageFilter?: (stage: string) => void;
}

export default function MEStatsOverview({
  records,
  onSelectSeverityFilter,
  onSelectStageFilter,
}: MEStatsOverviewProps) {
  const total = records.length;

  // Group counts by Severity
  const nearMissCount = records.filter(
    (r) => r.severity === 'A' || r.severity === 'B'
  ).length;

  const noHarmCount = records.filter(
    (r) => r.severity === 'C' || r.severity === 'D'
  ).length;

  const harmCount = records.filter(
    (r) => ['E', 'F', 'G', 'H', 'I'].includes(r.severity)
  ).length;

  // Percentage calculations
  const nearMissPct = total > 0 ? Math.round((nearMissCount / total) * 100) : 0;
  const noHarmPct = total > 0 ? Math.round((noHarmCount / total) * 100) : 0;
  const harmPct = total > 0 ? Math.round((harmCount / total) * 100) : 0;

  // Stage Breakdown counts
  const stageCounts: Record<MEStage, number> = {
    Prescribing: records.filter((r) => r.error_type === 'Prescribing').length,
    Transcribing: records.filter((r) => r.error_type === 'Transcribing').length,
    Dispensing: records.filter((r) => r.error_type === 'Dispensing').length,
    Administration: records.filter((r) => r.error_type === 'Administration').length,
  };

  // Severity Level counts (A to I)
  const severityCounts: Record<MESeverityLevel, number> = {
    A: records.filter((r) => r.severity === 'A').length,
    B: records.filter((r) => r.severity === 'B').length,
    C: records.filter((r) => r.severity === 'C').length,
    D: records.filter((r) => r.severity === 'D').length,
    E: records.filter((r) => r.severity === 'E').length,
    F: records.filter((r) => r.severity === 'F').length,
    G: records.filter((r) => r.severity === 'G').length,
    H: records.filter((r) => r.severity === 'H').length,
    I: records.filter((r) => r.severity === 'I').length,
  };

  return (
    <div className="space-y-6">
      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Incidents */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">อุบัติการณ์ทั้งหมด</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{total}</span>
            <span className="text-xs font-medium text-slate-500">ครั้ง</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span>รายงานสะสมในเครือข่าย</span>
          </div>
        </div>

        {/* KPI 2: Near Miss (A-B) */}
        <div 
          onClick={() => onSelectSeverityFilter && onSelectSeverityFilter('near_miss')}
          className="bg-white rounded-2xl p-5 border border-teal-200/80 shadow-sm hover:shadow-md transition cursor-pointer group hover:border-teal-400"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-800">ดักจับได้ (Near Miss)</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-teal-700 tracking-tight">{nearMissCount}</span>
            <span className="text-xs font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full">
              {nearMissPct}%
            </span>
          </div>
          <div className="mt-3 text-xs text-teal-700 font-medium flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>ระดับ A และ B (ไม่ถึงตัวผู้ป่วย)</span>
          </div>
        </div>

        {/* KPI 3: No Harm (C-D) */}
        <div 
          onClick={() => onSelectSeverityFilter && onSelectSeverityFilter('no_harm')}
          className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-sm hover:shadow-md transition cursor-pointer group hover:border-amber-400"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">ถึงผู้ป่วย-ไม่อันตราย</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700 tracking-tight">{noHarmCount}</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
              {noHarmPct}%
            </span>
          </div>
          <div className="mt-3 text-xs text-amber-700 font-medium flex items-center gap-1">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>ระดับ C และ D (เฝ้าระวังอาการ)</span>
          </div>
        </div>

        {/* KPI 4: Harm (E-I) */}
        <div 
          onClick={() => onSelectSeverityFilter && onSelectSeverityFilter('harm')}
          className="bg-white rounded-2xl p-5 border border-rose-200/80 shadow-sm hover:shadow-md transition cursor-pointer group hover:border-rose-400"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">เกิดอันตราย (Harm)</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-700 tracking-tight">{harmCount}</span>
            <span className="text-xs font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
              {harmPct}%
            </span>
          </div>
          <div className="mt-3 text-xs text-rose-700 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>ระดับ E ถึง I (ต้องทบทวน RCA)</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Breakdown by Error Stage (PE / TE / DE / AE) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>จำแนกตามขั้นตอนการเกิดความคลาดเคลื่อน</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                การสั่งใช้ (PE), คัดลอกคำสั่ง (TE), จัด/จ่ายยา (DE), บริหารยา (AE)
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {(Object.keys(ME_ERROR_TYPES) as MEStage[]).map((stageKey) => {
              const meta = ME_ERROR_TYPES[stageKey];
              const count = stageCounts[stageKey];
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div 
                  key={stageKey}
                  onClick={() => onSelectStageFilter && onSelectStageFilter(stageKey)}
                  className="group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${meta.bgLight} ${meta.color}`}>
                        {meta.code}
                      </span>
                      <span className="font-semibold text-slate-700 group-hover:text-teal-700 transition">
                        {meta.label.split('(')[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-slate-800">{count} ครั้ง</span>
                      <span className="text-slate-400 text-[11px]">({percentage}%)</span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        stageKey === 'Prescribing' ? 'bg-indigo-500' :
                        stageKey === 'Transcribing' ? 'bg-sky-500' :
                        stageKey === 'Dispensing' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(percentage, count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Distribution by Severity (A through I) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>การกระจายตัวตามระดับความรุนแรง (Severity A - I)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ระดับดัชนีความรุนแรงตามมาตรฐานกระทรวงสาธารณสุข
              </p>
            </div>
          </div>

          <div className="mt-5">
            {/* 9 Segment Visual Column Chart */}
            <div className="grid grid-cols-9 gap-2 items-end h-40 pt-4 pb-2 border-b border-slate-100">
              {(Object.keys(ME_SEVERITY_LEVELS) as MESeverityLevel[]).map((level) => {
                const meta = ME_SEVERITY_LEVELS[level];
                const count = severityCounts[level];
                const maxCount = Math.max(...Object.values(severityCounts), 1);
                const heightPct = Math.round((count / maxCount) * 100);

                return (
                  <div key={level} className="flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap shadow-lg">
                      <span>Cat {level}: {count} ครั้ง</span>
                      <span className="text-slate-300 text-[9px]">{meta.title}</span>
                    </div>

                    <span className="text-[11px] font-bold text-slate-600 mb-1">
                      {count > 0 ? count : ''}
                    </span>

                    <div className="w-full bg-slate-100 rounded-t-lg h-28 flex items-end overflow-hidden p-0.5">
                      <div 
                        className={`w-full rounded-t-md transition-all duration-700 ${meta.bgColor}`}
                        style={{ height: `${Math.max(heightPct, count > 0 ? 10 : 0)}%` }}
                      />
                    </div>

                    <span className="mt-2 text-xs font-bold text-slate-700 group-hover:text-teal-600">
                      {level}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Severity Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span>Cat A-B: ดักจับได้</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Cat C-D: ยาถึงผู้ป่วย</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Cat E-I: เกิดอันตราย</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
