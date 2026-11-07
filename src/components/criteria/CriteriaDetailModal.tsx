'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  X, 
  Award, 
  BookOpen, 
  Edit3, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  FileCheck, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { updateCriteriaKnowledgeBase } from '@/app/criteria/actions';
import { DEFAULT_CRITERIA_DATA } from '@/lib/data/defaultCriteriaData';

export interface CriteriaItem {
  id: string;
  category: string;
  title: string;
  points_possible: number;
  knowledge_base: string | null;
  updated_at?: string;
  last_updated_by?: string;
}

interface CriteriaDetailModalProps {
  criteria: CriteriaItem | null;
  isOpen: boolean;
  onClose: () => void;
  isPharmacist: boolean;
  onCriteriaUpdated: (updatedCriteria: CriteriaItem) => void;
}

export default function CriteriaDetailModal({
  criteria,
  isOpen,
  onClose,
  isPharmacist,
  onCriteriaUpdated,
}: CriteriaDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (criteria) {
      // If DB has knowledge_base, use it; otherwise fallback to rich default
      const defaultInfo = DEFAULT_CRITERIA_DATA[criteria.title];
      const initialContent = criteria.knowledge_base || defaultInfo?.knowledge_base || '';
      setContent(initialContent);
      setIsEditing(false);
      setSaveStatus(null);
    }
  }, [criteria]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !criteria) return null;

  const isPharmacyCategory = criteria.category.includes('เภสัชกรรม');
  const defaultInfo = DEFAULT_CRITERIA_DATA[criteria.title];

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await updateCriteriaKnowledgeBase(criteria.id, content);
      if (res.success) {
        setSaveStatus({ type: 'success', message: res.message || 'บันทึกสำเร็จ' });
        const updated = { ...criteria, knowledge_base: content, updated_at: new Date().toISOString() };
        onCriteriaUpdated(updated);
        setTimeout(() => {
          setIsEditing(false);
          setSaveStatus(null);
        }, 1200);
      } else {
        setSaveStatus({ type: 'error', message: res.error || 'เกิดข้อผิดพลาดในการบันทึก' });
      }
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (defaultInfo && confirm('คุณต้องการดึงแนวทางมาตรฐานเริ่มต้นของเกณฑ์ข้อนี้กลับมาใช่หรือไม่?')) {
      setContent(defaultInfo.knowledge_base);
    }
  };

  // Helper to format markdown text visually
  const renderFormattedContent = (rawText: string) => {
    if (!rawText.trim()) {
      return (
        <div className="py-12 text-center text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="text-sm">ยังไม่มีการบันทึกแนวทางปฏิบัติสำหรับเกณฑ์ข้อนี้</p>
          {isPharmacist && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              คลิกที่นี่เพื่อเริ่มเขียนแนวทางปฏิบัติ
            </button>
          )}
        </div>
      );
    }

    const lines = rawText.split('\n');
    return (
      <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-base text-slate-800 pt-4 pb-1 border-b border-slate-100 flex items-center gap-2">
                <span>{trimmed.replace('### ', '')}</span>
              </h4>
            );
          }
          if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
            const isChecked = trimmed.startsWith('- [x] ');
            const label = trimmed.replace(/- \[[ x]\] /, '');
            return (
              <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white transition-colors">
                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white'}`}>
                  {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <span className="text-xs sm:text-sm text-slate-700">{label}</span>
              </div>
            );
          }
          if (/^\d+\.\s/.test(trimmed)) {
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-2">
                <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {trimmed.match(/^\d+/)?.[0]}
                </span>
                <p className="text-xs sm:text-sm text-slate-700">
                  {trimmed.replace(/^\d+\.\s/, '')}
                </p>
              </div>
            );
          }
          if (trimmed.startsWith('- ')) {
            return (
              <li key={idx} className="ml-5 text-xs sm:text-sm text-slate-600 list-disc">
                {trimmed.replace('- ', '')}
              </li>
            );
          }
          if (trimmed === '') {
            return <div key={idx} className="h-1.5" />;
          }
          return (
            <p key={idx} className="text-xs sm:text-sm text-slate-600">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-teal-50/40 to-white flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                isPharmacyCategory 
                  ? 'bg-teal-100 text-teal-800 border border-teal-200' 
                  : 'bg-sky-100 text-sky-800 border border-sky-200'
              }`}>
                {criteria.category}
              </span>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-600" />
                <span>คะแนนเต็ม: {criteria.points_possible} คะแนน</span>
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 leading-snug">
              {criteria.title}
            </h3>
            {defaultInfo?.summary && (
              <p className="text-xs text-slate-500">{defaultInfo.summary}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar / Mode switcher */}
        <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                !isEditing
                  ? 'bg-white text-primary shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>แนวทางและเกณฑ์ (View)</span>
            </button>

            {isPharmacist && (
              <button
                onClick={() => setIsEditing(true)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                  isEditing
                    ? 'bg-white text-primary shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>แก้ไขเนื้อหาเกณฑ์ (Edit)</span>
              </button>
            )}
          </div>

          {isEditing && defaultInfo && (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium hover:underline text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ดึงแนวทางมาตรฐาน</span>
            </button>
          )}
        </div>

        {/* Status Alert */}
        {saveStatus && (
          <div className={`px-6 py-2.5 text-xs flex items-center gap-2 border-b ${
            saveStatus.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
              : 'bg-rose-50 text-rose-800 border-rose-100'
          }`}>
            {saveStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{saveStatus.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">กล่องแก้ไขแนวทางและข้อกำหนด (Markdown / Plain Text):</span>
                <span>รองรับ `### หัวข้อ` และ `- [ ] Checklist`</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                className="w-full p-4 text-xs sm:text-sm font-mono border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition leading-relaxed bg-slate-50/50"
                placeholder="ระบุวัตถุประสงค์ เกณฑ์การพิจารณา และเอกสารหลักฐานที่ต้องเตรียม..."
              />
            </div>
          ) : (
            <div className="space-y-4">
              {renderFormattedContent(content)}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50/90 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              title="พิมพ์หน้านี้"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>พิมพ์เกณฑ์</span>
            </button>
            <Link
              href={`/evidence?criteria_id=${criteria.id}`}
              className="px-3.5 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <FileCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>ตรวจ Checklist หลักฐาน</span>
              <ExternalLink className="w-3 h-3 text-teal-500" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-teal-700 rounded-xl transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>บันทึกแนวทาง</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition shadow-sm"
              >
                ปิดหน้าต่าง
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
