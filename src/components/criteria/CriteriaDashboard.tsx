'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  Pill, 
  FolderGit2, 
  HelpCircle,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import CriteriaCard from './CriteriaCard';
import CriteriaDetailModal, { CriteriaItem } from './CriteriaDetailModal';
import { DEFAULT_CRITERIA_DATA } from '@/lib/data/defaultCriteriaData';

interface CriteriaDashboardProps {
  initialCriteria: CriteriaItem[];
  isPharmacist: boolean;
  userHospital?: string;
  userFullName?: string;
}

export default function CriteriaDashboard({
  initialCriteria,
  isPharmacist,
  userHospital,
  userFullName,
}: CriteriaDashboardProps) {
  const [criteriaList, setCriteriaList] = useState<CriteriaItem[]>(initialCriteria);
  const [selectedCriteria, setSelectedCriteria] = useState<CriteriaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pharmacy' | 'consumer'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate score breakdown
  const stats = useMemo(() => {
    let pharmacyPoints = 0;
    let pharmacyCount = 0;
    let consumerPoints = 0;
    let consumerCount = 0;

    criteriaList.forEach((item) => {
      if (item.category.includes('เภสัชกรรม')) {
        pharmacyPoints += item.points_possible || 0;
        pharmacyCount += 1;
      } else {
        consumerPoints += item.points_possible || 0;
        consumerCount += 1;
      }
    });

    const totalPoints = pharmacyPoints + consumerPoints;
    const totalCount = pharmacyCount + consumerCount;

    return {
      pharmacyPoints,
      pharmacyCount,
      consumerPoints,
      consumerCount,
      totalPoints,
      totalCount,
    };
  }, [criteriaList]);

  // Filtered criteria based on active tab and search query
  const filteredCriteria = useMemo(() => {
    return criteriaList.filter((item) => {
      // Tab filter
      if (activeTab === 'pharmacy' && !item.category.includes('เภสัชกรรม')) return false;
      if (activeTab === 'consumer' && item.category.includes('เภสัชกรรม')) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(query);
        const categoryMatch = item.category.toLowerCase().includes(query);
        const defaultInfo = DEFAULT_CRITERIA_DATA[item.title];
        const summaryMatch = defaultInfo?.summary?.toLowerCase().includes(query);
        return titleMatch || categoryMatch || summaryMatch;
      }

      return true;
    });
  }, [criteriaList, activeTab, searchQuery]);

  const handleOpenDetail = (criteria: CriteriaItem) => {
    setSelectedCriteria(criteria);
    setIsModalOpen(true);
  };

  const handleCriteriaUpdated = (updated: CriteriaItem) => {
    setCriteriaList((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    setSelectedCriteria(updated);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Breadcrumb */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -z-0"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-100 hover:text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full backdrop-blur-md transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่หน้าหลัก Dashboard</span>
            </Link>

            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 bg-white/20 backdrop-blur-md rounded-full font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>มาตรฐานบริการเภสัชกรรมและ คบส. ระดับปฐมภูมิ</span>
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              เกณฑ์การประเมินส่วนที่ 7
            </h1>
            <p className="text-teal-100 text-xs sm:text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
              การจัดบริการเภสัชกรรม (64 คะแนน) และงานคุ้มครองผู้บริโภคด้านสุขภาพ (18 คะแนน)
              เครือข่ายบริการสุขภาพอำเภอสวรรคโลก
            </p>
          </div>
        </div>
      </div>

      {/* Scorecards Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Total Scorecard */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              คะแนนประเมินรวมทั้งสิ้น
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">
                {stats.totalPoints}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ 82 คะแนน</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ครอบคลุมทั้งหมด 2 หมวดงาน ({stats.totalCount} เกณฑ์ย่อย)
            </p>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full w-full" />
          </div>
        </div>

        {/* Pharmacy Scorecard */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              หมวด 1: บริการเภสัชกรรม
            </span>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-teal-900">
                {stats.pharmacyPoints}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ 64 คะแนน</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              4 หัวข้อหลัก (ข้อละ 16 คะแนน: ระบบยา, จ่ายยา, คลังยา, RDU)
            </p>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className="bg-teal-600 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Consumer Protection Scorecard */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
              หมวด 2: งาน คบส. สุขภาพ
            </span>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-sky-900">
                {stats.consumerPoints}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ 18 คะแนน</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              6 หัวข้อหลัก (ข้อละ 3 คะแนน: บริหาร, อาหาร, ร้านชำ, ผู้จำหน่าย, อสม., เครือข่าย)
            </p>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className="bg-sky-600 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Segmented Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-full sm:w-auto text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({stats.totalCount})
            </button>
            <button
              onClick={() => setActiveTab('pharmacy')}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'pharmacy'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              บริการเภสัชกรรม (64 คะแนน)
            </button>
            <button
              onClick={() => setActiveTab('consumer')}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'consumer'
                  ? 'bg-white text-sky-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              งาน คบส. (18 คะแนน)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเกณฑ์หรือคำสำคัญ..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ล้าง
              </button>
            )}
          </div>
        </div>

        {/* Role hint info */}
        <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-3">
          <span>
            แสดงผล: <strong>{filteredCriteria.length}</strong> จาก {criteriaList.length} รายการ
          </span>
          <span className="flex items-center gap-1">
            {isPharmacist ? (
              <span className="text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                คุณมีสิทธิ์แก้ไขแนวทางเกณฑ์ (เภสัชกร)
              </span>
            ) : (
              <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                โหมดอ่านแนวทางเกณฑ์ (รพ.สต.)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Criteria Grid */}
      {filteredCriteria.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCriteria.map((item, index) => (
            <CriteriaCard
              key={item.id}
              criteria={item}
              index={index}
              isPharmacist={isPharmacist}
              onOpenDetail={handleOpenDetail}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-base">ไม่พบเกณฑ์การประเมินที่ตรงกับการค้นหา</h3>
          <p className="text-xs text-slate-500">
            ลองปรับเปลี่ยนคำค้นหา หรือคลิกปุ่ม &quot;ทั้งหมด&quot; เพื่อดูเกณฑ์ทั้งหมด
          </p>
          <button
            onClick={() => {
              setActiveTab('all');
              setSearchQuery('');
            }}
            className="mt-2 text-xs font-semibold text-primary hover:underline"
          >
            รีเซ็ตตัวกรองทั้งหมด
          </button>
        </div>
      )}

      {/* Criteria Detail & Edit Modal */}
      <CriteriaDetailModal
        criteria={selectedCriteria}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isPharmacist={isPharmacist}
        onCriteriaUpdated={handleCriteriaUpdated}
      />
    </div>
  );
}
