'use client';

import React from 'react';
import { 
  Award, 
  BookOpen, 
  Edit3, 
  CheckCircle2, 
  ArrowRight, 
  FolderGit2,
  FileText
} from 'lucide-react';
import { CriteriaItem } from './CriteriaDetailModal';
import { DEFAULT_CRITERIA_DATA } from '@/lib/data/defaultCriteriaData';

interface CriteriaCardProps {
  criteria: CriteriaItem;
  index: number;
  isPharmacist: boolean;
  onOpenDetail: (criteria: CriteriaItem) => void;
}

export default function CriteriaCard({
  criteria,
  index,
  isPharmacist,
  onOpenDetail,
}: CriteriaCardProps) {
  const isPharmacyCategory = criteria.category.includes('เภสัชกรรม');
  const defaultInfo = DEFAULT_CRITERIA_DATA[criteria.title];
  const hasKnowledge = Boolean(criteria.knowledge_base || defaultInfo?.knowledge_base);
  const summary = defaultInfo?.summary || 'เกณฑ์การประเมินมาตรฐาน รพ.สต. และงานคุ้มครองผู้บริโภคด้านสุขภาพ';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-teal-300 transition-all duration-300 flex flex-col justify-between">
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
            isPharmacyCategory
              ? 'bg-teal-50 text-teal-800 border-teal-200'
              : 'bg-sky-50 text-sky-800 border-sky-200'
          }`}>
            {isPharmacyCategory ? 'บริการเภสัชกรรม' : 'งาน คบส.'}
          </span>

          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-800 shadow-xs">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>{criteria.points_possible} คะแนน</span>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-base text-slate-800 group-hover:text-primary transition-colors leading-snug">
            {criteria.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {summary}
          </p>
        </div>
      </div>

      {/* Meta & Status */}
      <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-500">
            {hasKnowledge ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                มีแนวทางปฏิบัติแล้ว
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                <FileText className="w-3 h-3" />
                ยังไม่มีแนวทาง
              </span>
            )}
          </div>

          {criteria.updated_at && (
            <span className="text-[10px] text-slate-400">
              อัปเดต: {new Date(criteria.updated_at).toLocaleDateString('th-TH')}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onOpenDetail(criteria)}
            className="flex-1 py-2 px-3 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ดูแนวทาง</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {isPharmacist && (
            <button
              type="button"
              onClick={() => onOpenDetail(criteria)}
              className="p-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition"
              title="แก้ไขแนวทางเกณฑ์ข้อนี้"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
