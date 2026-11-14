'use client';

import React, { useState } from 'react';
import { 
  X, 
  Archive, 
  Download, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  HardDrive, 
  Loader2, 
  ShieldAlert,
  FileSpreadsheet,
  FileJson,
  FolderArchive
} from 'lucide-react';
import { UnsafeProductRecord } from '@/lib/constants/unsafeProducts';
import { createZipArchive, ZipEntry } from '@/lib/utils/simpleZip';
import { archiveAndPurgeImagesAction } from '@/app/unsafe-products/actions';

interface UnsafeProductsArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: UnsafeProductRecord[];
  onArchived?: () => void;
}

export default function UnsafeProductsArchiveModal({
  isOpen,
  onClose,
  records,
  onArchived,
}: UnsafeProductsArchiveModalProps) {
  const [filterMode, setFilterMode] = useState<'resolved_only' | 'all'>('resolved_only');
  const [driveLink, setDriveLink] = useState('');
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Filter candidate records
  const targetRecords = records.filter((r) => {
    if (r.is_archived) return false;
    if (filterMode === 'resolved_only') return r.status === 'resolved';
    return true;
  });

  const recordsWithImages = targetRecords.filter((r) => Boolean(r.image_url));
  const estimatedSpaceKB = recordsWithImages.length * 180; // ~180KB per compressed image

  // Generate & Download ZIP Package
  const handleDownloadZip = async () => {
    if (targetRecords.length === 0) {
      alert('ไม่มีรายการที่ตรงตามเงื่อนไขสำหรับส่งออก');
      return;
    }

    try {
      setIsExportingZip(true);
      setStatusMessage(null);

      const entries: ZipEntry[] = [];

      // 1. Generate JSON Summary
      const jsonContent = JSON.stringify(targetRecords, null, 2);
      entries.push({
        filename: 'unsafe_products_data.json',
        data: jsonContent,
      });

      // 2. Generate CSV Summary with UTF-8 BOM
      const headers = [
        'ID',
        'ชื่อผลิตภัณฑ์',
        'หมวดหมู่',
        'รูปแบบความเสี่ยง',
        'ช่องทางกระจาย',
        'ร้านค้า/สถานที่',
        'ตำบล',
        'ผลชุดทดสอบ',
        'ระดับความเสี่ยง',
        'สถานะ',
        'ผู้รายงาน',
        'สังกัด',
        'ข้อสั่งการ/แนวทางจัดการ',
        'วันที่รายงาน',
      ];

      const csvRows = targetRecords.map((r) => [
        `"${r.id}"`,
        `"${r.product_name.replace(/"/g, '""')}"`,
        `"${r.product_category}"`,
        `"${r.risk_type?.replace(/"/g, '""') || ''}"`,
        `"${r.distribution_channel}"`,
        `"${(r.store_name || r.location_found || '').replace(/"/g, '""')}"`,
        `"${r.subdistrict || ''}"`,
        `"${r.test_kit_result}"`,
        `"${r.risk_level}"`,
        `"${r.status}"`,
        `"${(r.reporter_name || '').replace(/"/g, '""')}"`,
        `"${(r.reporter_hospital || '').replace(/"/g, '""')}"`,
        `"${(r.action_details || '').replace(/"/g, '""')}"`,
        `"${new Date(r.created_at).toLocaleDateString('th-TH')}"`,
      ]);

      const csvString = '\uFEFF' + [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n');
      entries.push({
        filename: 'unsafe_products_summary.csv',
        data: csvString,
      });

      // 3. Fetch images and package into images/ folder
      let fetchedImagesCount = 0;
      for (let i = 0; i < targetRecords.length; i++) {
        const item = targetRecords[i];
        if (item.image_url) {
          try {
            const resp = await fetch(item.image_url);
            if (resp.ok) {
              const arrayBuffer = await resp.arrayBuffer();
              const ext = item.image_url.includes('.png') ? 'png' : 'jpg';
              const imgName = `images/${item.id}_${item.product_name.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}.${ext}`;
              entries.push({
                filename: imgName,
                data: new Uint8Array(arrayBuffer),
              });
              fetchedImagesCount++;
            }
          } catch (e) {
            console.warn('Could not fetch image for zip:', item.image_url);
          }
        }
      }

      // 4. Create ZIP Blob using pure TypeScript generator
      const zipBlob = createZipArchive(entries);
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `SWPC_UnsafeProducts_Archive_${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setStatusMessage({
        type: 'success',
        text: `ดาวน์โหลดแพ็กเกจ ZIP สำเร็จ (${targetRecords.length} เคส, ${fetchedImagesCount} ภาพ)`,
      });
    } catch (err: any) {
      console.error('ZIP generation error:', err);
      setStatusMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP' });
    } finally {
      setIsExportingZip(false);
    }
  };

  // Purge Storage Images
  const handlePurgeStorage = async () => {
    if (targetRecords.length === 0) {
      alert('ไม่มีรายการที่สามารถล้างพื้นที่ได้');
      return;
    }

    const confirmMsg = `ยืนยันการเคลียร์รูปภาพของเคสที่เลือกจำนวน ${targetRecords.length} รายการ ออกจาก Supabase Storage?\n\n(ข้อมูลสรุป รายละเอียด และประวัติในฐานข้อมูลจะยังคงอยู่ 100% แต่ไฟล์รูปในระบบจะถูกลบเพื่อคืนพื้นที่)`;
    if (!confirm(confirmMsg)) return;

    try {
      setIsPurging(true);
      setStatusMessage(null);

      const targetIds = targetRecords.map((r) => r.id);
      const res = await archiveAndPurgeImagesAction(targetIds, driveLink.trim());

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: res.message || 'เคลียร์พื้นที่รูปภาพใน Supabase Storage สำเร็จ',
        });
        if (onArchived) onArchived();
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'เกิดข้อผิดพลาดในการล้างพื้นที่' });
      }
    } catch (err: any) {
      console.error('Purge error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <FolderArchive className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">สำรองข้อมูล & บริหารจัดการ Storage (Phase 2)</h2>
              <p className="text-xs text-slate-300">
                ดาวน์โหลดข้อมูลถาวร และเคลียร์พื้นที่ Supabase Storage 1 GB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {statusMessage && (
            <div className={`p-3.5 rounded-2xl border flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span className="font-semibold">{statusMessage.text}</span>
            </div>
          )}

          {/* Storage Quota Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <HardDrive className="w-4 h-4 text-teal-600" />
                <span>สถานะ Storage และการคัดกรอง</span>
              </div>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-100/60 px-2.5 py-0.5 rounded-full">
                Supabase Free Tier (1 GB)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">เคสพร้อมจัดเก็บ</span>
                <span className="text-base font-bold text-slate-800">{targetRecords.length}</span>
                <span className="text-[10px] text-slate-400 block">รายการ</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">รูปภาพในเคส</span>
                <span className="text-base font-bold text-teal-700">{recordsWithImages.length}</span>
                <span className="text-[10px] text-slate-400 block">ภาพถ่าย</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">พื้นที่ที่จะได้คืน</span>
                <span className="text-base font-bold text-emerald-600">~{(estimatedSpaceKB / 1024).toFixed(1)} MB</span>
                <span className="text-[10px] text-slate-400 block">ประมาณการ</span>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="pt-2 flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">เลือกกลุ่มเป้าหมาย:</span>
              <button
                type="button"
                onClick={() => setFilterMode('resolved_only')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  filterMode === 'resolved_only'
                    ? 'bg-teal-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                เฉพาะเคสที่ยุติเรื่องแล้ว (Resolved)
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  filterMode === 'all'
                    ? 'bg-teal-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ทุกสถานะ
              </button>
            </div>
          </div>

          {/* Step 1: Download Backup Package */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px]">1</span>
              <span>ดาวน์โหลดแพ็กเกจสำรองข้อมูล (ZIP Archive)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              ระบบจะรวมข้อมูล JSON, ตารางสรุป CSV (เปิดใน Excel ได้ทันที) และรูปภาพทั้งหมดลงในไฟล์ ZIP เดียว เพื่อเก็บเป็นหลักฐานสำรองถาวร
            </p>
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isExportingZip || targetRecords.length === 0}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {isExportingZip ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                  <span>กำลังรวบรวมไฟล์และสร้าง ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-teal-300" />
                  <span>ดาวน์โหลดไฟล์ ZIP สำรองข้อมูล ({targetRecords.length} เคส)</span>
                </>
              )}
            </button>
          </div>

          {/* Step 2: Link Google Drive (Optional) */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px]">2</span>
              <span>บันทึกลิงก์ Google Drive ของกลุ่มงาน (อ้างอิงย้อนหลัง)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              เมื่อนำไฟล์ ZIP หรือรูปภาพไปเก็บใน Google Drive ของกลุ่มงาน คบส. / เภสัชกรรม แล้ว สามารถวางลิงก์ไว้เพื่อกดเปิดดูย้อนหลังได้
            </p>
            <input
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-teal-600"
            />
          </div>

          {/* Step 3: Purge Storage */}
          <div className="border border-rose-200 rounded-2xl p-4 bg-rose-50/40 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-xs">
              <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center text-[10px]">3</span>
              <span>ล้างรูปภาพใน Supabase Storage เพื่อคืนโควตาฟรี</span>
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed">
              ลบไฟล์ภาพใน Supabase Storage แต่ <strong>ข้อมูลเคส วันที่ สถานที่ สถิติ และข้อสั่งการจะยังคงอยู่ 100%</strong> สำหรับคำนวณกราฟและรายงานประจำปี
            </p>
            <button
              type="button"
              onClick={handlePurgeStorage}
              disabled={isPurging || targetRecords.length === 0}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {isPurging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังเคลียร์พื้นที่ Storage...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>เคลียร์รูปภาพของเคสที่เลือก เพื่อคืนพื้นที่ Storage</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
