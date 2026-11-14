'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { 
  FolderGit2, 
  Building2, 
  Calendar, 
  Printer, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowLeft,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  Info,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { 
  EVIDENCE_CRITERIA_GROUPS, 
  ALL_EVIDENCE_ITEMS 
} from '@/lib/data/evidenceChecklistData';
import { 
  EvidenceDocument, 
  EvidenceItemDef, 
  FISCAL_YEARS, 
  DEFAULT_FISCAL_YEAR 
} from '@/lib/constants/evidence';
import EvidenceCriteriaAccordion from './EvidenceCriteriaAccordion';
import EvidenceEditModal from './EvidenceEditModal';
import EvidenceReviewModal from './EvidenceReviewModal';
import EvidencePrintReport from './EvidencePrintReport';
import { deleteEvidenceAction, getEvidenceDocumentsAction } from '@/app/evidence/actions';

interface EvidenceDashboardProps {
  initialHospitals: Array<{ id: string; name: string }>;
  userHospital: string;
  userRole: string;
  userFullName: string;
  isPharmacist: boolean;
  initialEvidence: EvidenceDocument[];
}

export default function EvidenceDashboard({
  initialHospitals,
  userHospital,
  userRole,
  userFullName,
  isPharmacist,
  initialEvidence,
}: EvidenceDashboardProps) {
  const [selectedHospital, setSelectedHospital] = useState(
    isPharmacist ? (initialHospitals[0]?.name || userHospital) : userHospital
  );
  const [selectedYear, setSelectedYear] = useState<number>(DEFAULT_FISCAL_YEAR);
  const [evidenceList, setEvidenceList] = useState<EvidenceDocument[]>(initialEvidence);
  const [isPending, startTransition] = useTransition();

  // Search and Filter states
  const [activeCategory, setActiveCategory] = useState<'all' | 'pharmacy' | 'consumer'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'unsubmitted' | 'verified' | 'revision'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDriveGuide, setShowDriveGuide] = useState(false);

  // Modal states
  const [editingItem, setEditingItem] = useState<EvidenceItemDef | null>(null);
  const [editingEvidence, setEditingEvidence] = useState<EvidenceDocument | undefined>(undefined);
  const [reviewingEvidence, setReviewingEvidence] = useState<EvidenceDocument | null>(null);

  // Map of checklist_item_key to EvidenceDocument
  const evidenceMap: Record<string, EvidenceDocument> = {};
  evidenceList.forEach((doc) => {
    evidenceMap[doc.checklist_item_key] = doc;
  });

  const canEdit = isPharmacist || userHospital === selectedHospital;

  // Reload data when hospital or fiscal year changes
  const handleRefresh = () => {
    startTransition(async () => {
      const res = await getEvidenceDocumentsAction(selectedHospital, selectedYear);
      if (res.data) {
        setEvidenceList(res.data);
      }
    });
  };

  const handleHospitalChange = (newHospital: string) => {
    setSelectedHospital(newHospital);
    startTransition(async () => {
      const res = await getEvidenceDocumentsAction(newHospital, selectedYear);
      if (res.data) {
        setEvidenceList(res.data);
      }
    });
  };

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    startTransition(async () => {
      const res = await getEvidenceDocumentsAction(selectedHospital, newYear);
      if (res.data) {
        setEvidenceList(res.data);
      }
    });
  };

  // Open Edit Modal
  const handleEditItem = (item: EvidenceItemDef, evidence?: EvidenceDocument) => {
    setEditingItem(item);
    setEditingEvidence(evidence);
  };

  // Open Review Modal
  const handleReviewItem = (evidence: EvidenceDocument) => {
    setReviewingEvidence(evidence);
  };

  // Delete evidence item
  const handleDeleteItem = async (evidenceId: string) => {
    if (confirm('คุณต้องการลบลิงก์หลักฐานรายการนี้ใช่หรือไม่?')) {
      const res = await deleteEvidenceAction(evidenceId);
      if (res.success) {
        handleRefresh();
      } else {
        alert(res.error || 'ไม่สามารถลบได้');
      }
    }
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Calculate statistics
  const totalItems = ALL_EVIDENCE_ITEMS.length;
  let submittedCount = 0;
  let verifiedCount = 0;
  let needsRevisionCount = 0;

  ALL_EVIDENCE_ITEMS.forEach((item) => {
    const doc = evidenceMap[item.key];
    if (doc?.document_link) {
      submittedCount++;
      if (doc.status === 'verified') {
        verifiedCount++;
      } else if (doc.status === 'needs_revision') {
        needsRevisionCount++;
      }
    }
  });

  const completionPercent = totalItems > 0 ? Math.round((submittedCount / totalItems) * 100) : 0;

  // Filter groups
  const filteredGroups = EVIDENCE_CRITERIA_GROUPS.filter((group) => {
    if (activeCategory === 'pharmacy') {
      return group.category.includes('จัดบริการเภสัชกรรม');
    }
    if (activeCategory === 'consumer') {
      return group.category.includes('คุ้มครองผู้บริโภค');
    }
    return true;
  }).map((group) => {
    // Also filter items inside group if searching or filtering by status
    const matchedItems = group.items.filter((item) => {
      const doc = evidenceMap[item.key];
      const hasLink = !!doc?.document_link;

      // Status filter
      if (statusFilter === 'submitted' && !hasLink) return false;
      if (statusFilter === 'unsubmitted' && hasLink) return false;
      if (statusFilter === 'verified' && doc?.status !== 'verified') return false;
      if (statusFilter === 'revision' && doc?.status !== 'needs_revision') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesNotes = doc?.notes?.toLowerCase().includes(query);
        return matchesTitle || matchesDesc || matchesNotes;
      }

      return true;
    });

    return {
      ...group,
      items: matchedItems,
    };
  }).filter((group) => group.items.length > 0);

  const printedAt = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      {/* 1. Web View (Screen Only) */}
      <div className="screen-only min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-emerald-50/30 pb-20">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                title="กลับสู่แดชบอร์ดหลัก"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="bg-teal-600 p-2 rounded-xl text-white shadow-xs">
                <FolderGit2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <span>คลังหลักฐานการนิเทศงาน</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    Google Drive
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  ระบบจัดเก็บและเชื่อมโยงหลักฐานเกณฑ์มาตรฐานส่วนที่ 7
                </p>
              </div>
            </div>

            {/* Actions: Help, Print, Refresh */}
            <div className="flex items-center gap-2.5 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setShowDriveGuide(true)}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              >
                <HelpCircle className="w-4 h-4 text-teal-600" />
                <span className="hidden md:inline">วิธีแชร์ Google Drive</span>
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isPending}
                className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs transition shadow-xs disabled:opacity-50"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin text-teal-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์สรุป A4</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
          {/* Controls Bar: Hospital Selector & Fiscal Year */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex flex-wrap items-center gap-4">
              {/* Hospital Switcher */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>หน่วยบริการ (รพ.สต.)</span>
                </label>
                {isPharmacist ? (
                  <select
                    value={selectedHospital}
                    onChange={(e) => handleHospitalChange(e.target.value)}
                    className="text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-800 cursor-pointer shadow-2xs"
                  >
                    {initialHospitals.map((hosp) => (
                      <option key={hosp.id} value={hosp.name}>
                        {hosp.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-bold text-xs">
                    {userHospital}
                  </div>
                )}
              </div>

              {/* Fiscal Year */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>ปีงบประมาณ</span>
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                  className="text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-800 cursor-pointer shadow-2xs"
                >
                  {FISCAL_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      พ.ศ. {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role Notice */}
            <div className="text-xs text-slate-500 flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                ผู้ใช้งาน: <strong>{userFullName}</strong> ({isPharmacist ? 'เภสัชกร/Admin - สิทธิ์ตรวจรับรอง' : 'เจ้าหน้าที่ รพ.สต. - สิทธิ์บันทึกหลักฐาน'})
              </span>
            </div>
          </div>

          {/* Progress Overview Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total items card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <FolderGit2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">รายการหลักฐานทั้งหมด</p>
                <p className="text-2xl font-bold text-slate-800">{totalItems} ข้อ</p>
              </div>
            </div>

            {/* Submitted card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-medium">แนบลิงก์แล้ว</p>
                  <span className="text-xs font-bold text-sky-700">{completionPercent}%</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  {submittedCount} <span className="text-xs font-normal text-slate-400">/{totalItems}</span>
                </p>
              </div>
            </div>

            {/* Verified card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">ผ่านการตรวจรับรอง</p>
                <p className="text-2xl font-bold text-emerald-700">{verifiedCount} ข้อ</p>
              </div>
            </div>

            {/* Needs Revision card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">ต้องแก้ไข/ปรับปรุง</p>
                <p className="text-2xl font-bold text-rose-600">{needsRevisionCount} ข้อ</p>
              </div>
            </div>
          </div>

          {/* Overall Progress Meter */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">
                ความพร้อมการเตรียมหลักฐานสำหรับรับการนิเทศงาน: {selectedHospital}
              </span>
              <span className="text-teal-700">{completionPercent}% สมบูรณ์</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category tabs */}
            <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs self-start">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeCategory === 'all'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                ทั้งหมด (10 เกณฑ์)
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('pharmacy')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeCategory === 'pharmacy'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                บริการเภสัชกรรม (64 คะแนน)
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('consumer')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeCategory === 'consumer'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                งาน คบส. (18 คะแนน)
              </button>
            </div>

            {/* Search and Status filter */}
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="unsubmitted">ยังไม่แนบหลักฐาน</option>
                <option value="submitted">แนบหลักฐานแล้ว</option>
                <option value="verified">ตรวจผ่านแล้ว</option>
                <option value="revision">ต้องแก้ไข</option>
              </select>

              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อหลักฐาน..."
                  className="text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 w-48 md:w-56"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Criteria Accordion List */}
          <div className="space-y-4">
            {filteredGroups.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
                <FolderGit2 className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-semibold">ไม่พบรายการหลักฐานตามเงื่อนไขที่เลือก</p>
                <p className="text-xs text-slate-400">ลองเปลี่ยนตัวกรองหรือล้างคำค้นหา</p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <EvidenceCriteriaAccordion
                  key={group.id}
                  group={group}
                  evidenceMap={evidenceMap}
                  hospitalName={selectedHospital}
                  fiscalYear={selectedYear}
                  canEdit={canEdit}
                  isPharmacist={isPharmacist}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleDeleteItem}
                  onReviewItem={handleReviewItem}
                  onRefresh={handleRefresh}
                />
              ))
            )}
          </div>
        </main>

        {/* Google Drive Guide Modal */}
        {showDriveGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
              <div className="px-6 py-5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  <h3 className="font-bold text-base">คู่มือการแชร์ลิงก์ Google Drive</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDriveGuide(false)}
                  className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs text-slate-700 leading-relaxed overflow-y-auto">
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-slate-800">
                    📌 ขั้นตอนการตั้งค่าแชร์ลิงก์ให้กรรมการเปิดดูได้:
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 pl-1 text-slate-600">
                    <li>เปิด <strong>Google Drive</strong> แล้วไปที่โฟลเดอร์หรือไฟล์ที่ต้องการส่ง</li>
                    <li>คลิกขวาที่ไฟล์หรือโฟลเดอร์นั้น &rarr; เลือก <strong>แชร์ (Share)</strong></li>
                    <li>
                      ในช่อง <strong>การเข้าถึงทั่วไป (General access)</strong> ให้เปลี่ยนจาก &ldquo;จำกัด (Restricted)&rdquo; เป็น <strong>&ldquo;ทุกคนที่มีลิงก์ (Anyone with the link)&rdquo;</strong>
                    </li>
                    <li>สิทธิ์ด้านหลังให้เลือกเป็น <strong>&ldquo;ผู้มีสิทธิ์อ่าน (Viewer)&rdquo;</strong></li>
                    <li>คลิกปุ่ม <strong>คัดลอกลิงก์ (Copy link)</strong> แล้วนำมาวางในช่องของระบบ</li>
                  </ol>
                </div>

                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 space-y-1">
                  <p className="font-bold">⚠️ ข้อควรระวัง:</p>
                  <p className="text-[11px]">
                    หากไม่ได้เปิดสิทธิ์ &ldquo;ทุกคนที่มีลิงก์มีสิทธิ์อ่าน&rdquo; กรรมการหรือเภสัชกรผู้ตรวจนิเทศจะไม่สามารถเปิดดูไฟล์ได้ และระบบจะขึ้นสถานะต้องแก้ไข
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
                <button
                  type="button"
                  onClick={() => setShowDriveGuide(false)}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition"
                >
                  เข้าใจแล้ว
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <EvidenceEditModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          item={editingItem}
          hospitalName={selectedHospital}
          fiscalYear={selectedYear}
          initialLink={editingEvidence?.document_link}
          initialNotes={editingEvidence?.notes || ''}
          onSaved={handleRefresh}
        />

        {/* Review Modal */}
        <EvidenceReviewModal
          isOpen={!!reviewingEvidence}
          onClose={() => setReviewingEvidence(null)}
          evidence={reviewingEvidence}
          onReviewed={handleRefresh}
        />
      </div>

      {/* 2. Printable View (Print Only) */}
      <EvidencePrintReport
        hospitalName={selectedHospital}
        fiscalYear={selectedYear}
        evidenceMap={evidenceMap}
        printedAt={printedAt}
      />
    </>
  );
}
