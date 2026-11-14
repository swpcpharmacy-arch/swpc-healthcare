'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Pill, 
  Search, 
  Filter, 
  Plus, 
  Printer, 
  Archive, 
  BellRing, 
  AlertTriangle, 
  CheckCircle2, 
  Store, 
  MapPin, 
  Building2, 
  ArrowLeft,
  Calendar,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  FolderArchive,
  RefreshCw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { 
  UnsafeProductRecord, 
  PRODUCT_CATEGORIES, 
  DISTRIBUTION_CHANNELS, 
  RISK_LEVELS, 
  ACTION_STATUSES, 
  SWPC_SUBDISTRICTS,
  ProductCategory,
  ActionStatus,
  RiskLevel
} from '@/lib/constants/unsafeProducts';
import UnsafeProductFormModal from './UnsafeProductFormModal';
import UnsafeProductDetailDrawer from './UnsafeProductDetailDrawer';
import UnsafeProductsArchiveModal from './UnsafeProductsArchiveModal';
import UnsafeProductsPrintReport from './UnsafeProductsPrintReport';

interface UnsafeProductsDashboardProps {
  initialRecords: UnsafeProductRecord[];
  isPharmacist: boolean;
  currentUser: {
    id: string;
    fullName: string;
    hospitalName: string;
    role: string;
  };
  isMock?: boolean;
}

export default function UnsafeProductsDashboard({
  initialRecords,
  isPharmacist,
  currentUser,
  isMock = false,
}: UnsafeProductsDashboardProps) {
  const [records, setRecords] = useState<UnsafeProductRecord[]>(initialRecords);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subdistrictFilter, setSubdistrictFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<UnsafeProductRecord | null>(null);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Active Safety Alerts
  const activeAlerts = useMemo(() => {
    return records.filter((r) => r.is_safety_alert);
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.product_name.toLowerCase().includes(q);
        const matchStore = (r.store_name || '').toLowerCase().includes(q);
        const matchLoc = (r.location_found || '').toLowerCase().includes(q);
        const matchSub = (r.subdistrict || '').toLowerCase().includes(q);
        const matchRisk = (r.risk_type || '').toLowerCase().includes(q);
        if (!matchName && !matchStore && !matchLoc && !matchSub && !matchRisk) {
          return false;
        }
      }

      // Category
      if (categoryFilter !== 'all' && r.product_category !== categoryFilter) {
        return false;
      }

      // Status
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }

      // Subdistrict
      if (subdistrictFilter !== 'all' && r.subdistrict !== subdistrictFilter) {
        return false;
      }

      return true;
    });
  }, [records, searchQuery, categoryFilter, statusFilter, subdistrictFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = records.length;
    const pending = records.filter((r) => r.status === 'pending').length;
    const inAction = records.filter((r) => r.status === 'investigating' || r.status === 'action_taken').length;
    const criticalOrHigh = records.filter((r) => r.risk_level === 'critical' || r.risk_level === 'high').length;
    return { total, pending, inAction, criticalOrHigh };
  }, [records]);

  const handleOpenDetail = (record: UnsafeProductRecord) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Top Banner / Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="กลับสู่หน้าแดชบอร์ดหลัก"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-700/20">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  ระบบเฝ้าระวังยาและผลิตภัณฑ์สุขภาพในชุมชน
                </h1>
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span>เครือข่ายบริการสุขภาพอำเภอสวรรคโลก (G-RDU & G-SHP)</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline text-teal-700 font-medium">สังกัด: {currentUser.hospitalName}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {isPharmacist && (
              <button
                type="button"
                onClick={() => setIsArchiveOpen(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-300/80 shadow-xs cursor-pointer"
                title="สำรองข้อมูลและเคลียร์พื้นที่ Supabase Storage (Phase 2)"
              >
                <FolderArchive className="w-3.5 h-3.5 text-teal-700" />
                <span className="hidden sm:inline">สำรองข้อมูล & Storage</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPrintOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-300/80 shadow-xs cursor-pointer"
              title="พิมพ์รายงานสรุป A4 สำหรับการประชุม คบส."
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">พิมพ์รายงานสรุป A4</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>แจ้งเบาะแสใหม่</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Active Safety Alert Ticker if available */}
        {activeAlerts.length > 0 && (
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => handleOpenDetail(alert)}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 p-4 text-white shadow-lg cursor-pointer hover:shadow-xl transition group"
              >
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                      <BellRing className="w-5 h-5 animate-pulse text-white" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                        <span>🚨 ประกาศเตือนภัยความปลอดภัยในพื้นที่</span>
                      </div>
                      <h2 className="text-sm sm:text-base font-bold mt-0.5">
                        {alert.product_name} • ต.{alert.subdistrict || 'สวรรคโลก'}
                      </h2>
                      <p className="text-xs text-rose-100 line-clamp-1 mt-0.5">
                        {alert.alert_notes || alert.risk_type}
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-xl group-hover:bg-white/30 transition shrink-0">
                    <span>ดูรายละเอียด</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">เบาะแสทั้งหมด</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">{stats.total}</span>
              <span className="text-[10px] text-teal-600 font-medium">ในเครือข่าย อ.สวรรคโลก</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">รอดำเนินการ (Pending)</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.pending}</span>
              <span className="text-[10px] text-amber-700 font-medium">รอเภสัชกร Triage</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">กำลังลงพื้นที่/จัดการ</span>
              <span className="text-2xl font-black text-sky-600 mt-1 block">{stats.inAction}</span>
              <span className="text-[10px] text-sky-700 font-medium">ส่งตรวจ/ตักเตือน/ยึด</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">ความเสี่ยงสูง / สเตียรอยด์</span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">{stats.criticalOrHigh}</span>
              <span className="text-[10px] text-rose-700 font-medium">ยาชุด / ผลิตภัณฑ์วิกฤติ</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อยา, ยี่ห้อ, ร้านค้า, พิกัด หรือข้อสงสัย..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-teal-600 transition"
              />
            </div>

            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-teal-600 text-slate-700 font-medium"
            >
              <option value="all">ทุกหมวดหมู่ผลิตภัณฑ์</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Subdistrict Select */}
            <select
              value={subdistrictFilter}
              onChange={(e) => setSubdistrictFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-teal-600 text-slate-700 font-medium"
            >
              <option value="all">ทุกลำดับตำบล (สวรรคโลก)</option>
              {SWPC_SUBDISTRICTS.map((sub) => (
                <option key={sub} value={sub}>
                  ต.{sub}
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-teal-600 text-slate-700 font-medium"
            >
              <option value="all">ทุกสถานะการดำเนินงาน</option>
              {ACTION_STATUSES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Records Table / List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span>รายการเบาะแสผลิตภัณฑ์สุขภาพ</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {filteredRecords.length} รายการ
              </span>
            </h2>
            <span className="text-xs text-slate-400">
              คลิกที่รายการเพื่อดูรายละเอียดและสั่งการ
            </span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-700 text-sm">ไม่พบรายการเบาะแสที่ตรงกับเงื่อนไข</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                คุณสามารถกดปุ่ม "แจ้งเบาะแสใหม่" ด้านบนเพื่อเพิ่มข้อมูลการตรวจพบผลิตภัณฑ์ในพื้นที่
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRecords.map((item) => {
                const catMeta = PRODUCT_CATEGORIES.find((c) => c.id === item.product_category) || PRODUCT_CATEGORIES[0];
                const riskMeta = RISK_LEVELS.find((r) => r.id === item.risk_level) || RISK_LEVELS[1];
                const statusMeta = ACTION_STATUSES.find((s) => s.id === item.status) || ACTION_STATUSES[0];

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenDetail(item)}
                    className="p-4 sm:p-5 hover:bg-slate-50/80 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Photo Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative flex items-center justify-center">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <Pill className="w-6 h-6 text-slate-300" />
                        )}
                        {item.is_safety_alert && (
                          <div className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${catMeta.badgeColor}`}>
                            {catMeta.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${riskMeta.badge}`}>
                            {riskMeta.label}
                          </span>
                          {item.test_kit_result.includes('positive') && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white">
                              {item.test_kit_result === 'positive_steroid' ? 'พบสเตียรอยด์ (+)' : 'พบสารเคมี (+)'}
                            </span>
                          )}
                          {item.is_archived && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              📦 สำรองข้อมูลแล้ว
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition line-clamp-1">
                          {item.product_name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Store className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.store_name || item.distribution_channel}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>ต.{item.subdistrict || 'สวรรคโลก'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.reporter_hospital}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & CTA */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${statusMeta.badge}`}>
                          {statusMeta.label.split(' ')[0]}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {new Date(item.created_at).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 group-hover:bg-teal-100 group-hover:text-teal-700 flex items-center justify-center transition">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modals & Drawers */}
      <UnsafeProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          // Re-fetch or refresh
          window.location.reload();
        }}
        userHospital={currentUser.hospitalName}
        userRole={currentUser.role}
      />

      <UnsafeProductDetailDrawer
        record={selectedRecord}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        isPharmacist={isPharmacist}
        currentUserId={currentUser.id}
        onUpdated={() => {
          window.location.reload();
        }}
      />

      <UnsafeProductsArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        records={records}
        onArchived={() => {
          window.location.reload();
        }}
      />

      <UnsafeProductsPrintReport
        records={filteredRecords}
        subdistrictFilter={subdistrictFilter !== 'all' ? subdistrictFilter : undefined}
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        pharmacistName={isPharmacist ? currentUser.fullName : undefined}
      />
    </div>
  );
}
