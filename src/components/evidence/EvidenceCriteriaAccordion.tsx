'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  FolderPlus, 
  CheckCircle2, 
  FolderOpen, 
  Link2,
  ExternalLink,
  Award,
  Sparkles
} from 'lucide-react';
import { CriteriaGroupDef } from '@/lib/data/evidenceChecklistData';
import { EvidenceDocument, EvidenceItemDef } from '@/lib/constants/evidence';
import EvidenceItemRow from './EvidenceItemRow';
import { batchUpsertFolderAction } from '@/app/evidence/actions';

interface EvidenceCriteriaAccordionProps {
  group: CriteriaGroupDef;
  evidenceMap: Record<string, EvidenceDocument>;
  hospitalName: string;
  fiscalYear: number;
  canEdit: boolean;
  isPharmacist: boolean;
  onEditItem: (item: EvidenceItemDef, evidence?: EvidenceDocument) => void;
  onDeleteItem: (evidenceId: string) => void;
  onReviewItem: (evidence: EvidenceDocument) => void;
  onRefresh: () => void;
}

export default function EvidenceCriteriaAccordion({
  group,
  evidenceMap,
  hospitalName,
  fiscalYear,
  canEdit,
  isPharmacist,
  onEditItem,
  onDeleteItem,
  onReviewItem,
  onRefresh,
}: EvidenceCriteriaAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folderUrl, setFolderUrl] = useState('');
  const [folderNotes, setFolderNotes] = useState('');
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  // Calculate statistics for this group
  const totalItems = group.items.length;
  let submittedCount = 0;
  let verifiedCount = 0;

  group.items.forEach((item) => {
    const doc = evidenceMap[item.key];
    if (doc?.document_link) {
      submittedCount++;
      if (doc.status === 'verified') {
        verifiedCount++;
      }
    }
  });

  const completionPercent = totalItems > 0 ? Math.round((submittedCount / totalItems) * 100) : 0;
  const isFullyCompleted = submittedCount === totalItems;

  const handleSaveBatchFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchError(null);
    if (!folderUrl.trim()) {
      setBatchError('กรุณากรอกลิงก์ Google Drive Folder');
      return;
    }

    setIsBatchSaving(true);
    const res = await batchUpsertFolderAction(
      hospitalName,
      fiscalYear,
      group.id,
      folderUrl.trim(),
      folderNotes.trim()
    );
    setIsBatchSaving(false);

    if (res.success) {
      setShowFolderInput(false);
      setFolderUrl('');
      setFolderNotes('');
      onRefresh();
    } else {
      setBatchError(res.error || 'เกิดข้อผิดพลาดในการบันทึกโฟลเดอร์รวม');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-300">
      {/* Accordion Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
      >
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm font-bold text-sm ${
            isFullyCompleted 
              ? 'bg-emerald-500 text-white' 
              : 'bg-teal-50 border border-teal-200 text-teal-800'
          }`}>
            {isFullyCompleted ? <CheckCircle2 className="w-6 h-6" /> : group.order}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-base md:text-lg text-slate-800">
                {group.title}
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/70">
                {group.pointsPossible} คะแนน
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {group.category} &bull; รายการเอกสารทั้งหมด {totalItems} รายการ
            </p>
          </div>
        </div>

        {/* Right stats & collapse button */}
        <div className="flex items-center justify-between md:justify-end gap-5">
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">ความพร้อม:</span>
              <span className={`text-xs font-bold ${
                isFullyCompleted ? 'text-emerald-600' : 'text-teal-700'
              }`}>
                {submittedCount}/{totalItems} ข้อ ({completionPercent}%)
              </span>
            </div>

            {/* Micro progress bar */}
            <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden mt-1 ml-auto">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isFullyCompleted ? 'bg-emerald-500' : 'bg-teal-600'
                }`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          <div className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Accordion Body */}
      {isOpen && (
        <div className="px-5 pb-6 pt-2 border-t border-slate-100 space-y-4">
          {/* Quick Option: Batch Folder Link */}
          {canEdit && (
            <div className="p-3.5 bg-gradient-to-r from-teal-50/70 to-emerald-50/50 border border-teal-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-teal-900">
                <FolderOpen className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>ทางเลือกสะดวกรวดเร็ว:</strong> ใส่ลิงก์ Google Drive Folder รวมของเกณฑ์นี้เพียงลิงก์เดียว
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFolderInput(!showFolderInput);
                }}
                className="px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition shadow-xs self-start md:self-auto shrink-0"
              >
                <FolderPlus className="w-3.5 h-3.5 text-teal-600" />
                <span>{showFolderInput ? 'ปิดช่องใส่โฟลเดอร์' : 'ใส่โฟลเดอร์รวม'}</span>
              </button>
            </div>
          )}

          {/* Batch Folder Input Form */}
          {showFolderInput && (
            <form onSubmit={handleSaveBatchFolder} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>ลิงก์ Google Drive Folder รวมสำหรับ &ldquo;{group.title}&rdquo;</span>
                </label>
                <input
                  type="text"
                  value={folderUrl}
                  onChange={(e) => setFolderUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  หมายเหตุโฟลเดอร์ (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={folderNotes}
                  onChange={(e) => setFolderNotes(e.target.value)}
                  placeholder="เช่น รวมเอกสารระบบยา 5 รายการในโฟลเดอร์นี้"
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-800"
                />
              </div>

              {batchError && (
                <p className="text-xs text-rose-600 font-medium">{batchError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowFolderInput(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isBatchSaving}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition disabled:opacity-50"
                >
                  {isBatchSaving ? 'กำลังบันทึก...' : 'บันทึกลิงก์ให้ทุกข้อในเกณฑ์นี้'}
                </button>
              </div>
            </form>
          )}

          {/* Checklist items */}
          <div className="space-y-2.5">
            {group.items.map((item) => (
              <EvidenceItemRow
                key={item.key}
                item={item}
                evidence={evidenceMap[item.key]}
                canEdit={canEdit}
                isPharmacist={isPharmacist}
                onEdit={onEditItem}
                onDelete={onDeleteItem}
                onReview={onReviewItem}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
