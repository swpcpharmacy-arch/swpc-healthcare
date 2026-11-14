'use client';

import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  MapPin, 
  Store, 
  Calendar, 
  User, 
  Building2, 
  FileText, 
  Pill, 
  Send, 
  BellRing, 
  Sparkles,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { 
  UnsafeProductRecord, 
  PRODUCT_CATEGORIES, 
  DISTRIBUTION_CHANNELS, 
  RISK_LEVELS, 
  ACTION_STATUSES, 
  TEST_KIT_OPTIONS,
  ActionStatus,
  RiskLevel
} from '@/lib/constants/unsafeProducts';
import { updateUnsafeProductTriageAction, deleteUnsafeProductAction } from '@/app/unsafe-products/actions';

interface UnsafeProductDetailDrawerProps {
  record: UnsafeProductRecord | null;
  isOpen: boolean;
  onClose: () => void;
  isPharmacist: boolean;
  currentUserId?: string;
  onUpdated?: () => void;
}

export default function UnsafeProductDetailDrawer({
  record,
  isOpen,
  onClose,
  isPharmacist,
  currentUserId,
  onUpdated,
}: UnsafeProductDetailDrawerProps) {
  if (!isOpen || !record) return null;

  const [status, setStatus] = useState<ActionStatus>(record.status);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(record.risk_level);
  const [actionDetails, setActionDetails] = useState(record.action_details || '');
  const [isSafetyAlert, setIsSafetyAlert] = useState(record.is_safety_alert);
  const [alertNotes, setAlertNotes] = useState(record.alert_notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const categoryMeta = PRODUCT_CATEGORIES.find((c) => c.id === record.product_category) || PRODUCT_CATEGORIES[0];
  const channelMeta = DISTRIBUTION_CHANNELS.find((c) => c.id === record.distribution_channel) || DISTRIBUTION_CHANNELS[0];
  const riskMeta = RISK_LEVELS.find((r) => r.id === record.risk_level) || RISK_LEVELS[1];
  const statusMeta = ACTION_STATUSES.find((s) => s.id === record.status) || ACTION_STATUSES[0];
  const testKitMeta = TEST_KIT_OPTIONS.find((t) => t.id === record.test_kit_result) || TEST_KIT_OPTIONS[0];

  const canDelete = isPharmacist || (record.reporter_id === currentUserId && record.status === 'pending');

  const handleSaveTriage = async () => {
    try {
      setIsSaving(true);
      setNotification(null);

      const res = await updateUnsafeProductTriageAction(record.id, {
        status,
        risk_level: riskLevel,
        action_details: actionDetails,
        is_safety_alert: isSafetyAlert,
        alert_notes: alertNotes,
      });

      if (res.success) {
        setNotification({ type: 'success', text: 'บันทึกข้อสั่งการและการจัดการสำเร็จ' });
        if (onUpdated) onUpdated();
      } else {
        setNotification({ type: 'error', text: res.error || 'เกิดข้อผิดพลาดในการบันทึก' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการเบาะแสนี้ออกจากระบบ?')) return;
    try {
      setIsDeleting(true);
      const res = await deleteUnsafeProductAction(record.id);
      if (res.success) {
        if (onUpdated) onUpdated();
        onClose();
      } else {
        alert(res.error || 'ไม่สามารถลบรายการได้');
      }
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการลบ');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
      <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryMeta.badgeColor}`}>
                {categoryMeta.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${riskMeta.badge}`}>
                {riskMeta.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusMeta.badge}`}>
                {statusMeta.label}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mt-1 line-clamp-1">
              {record.product_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {notification && (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
              notification.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{notification.text}</span>
            </div>
          )}

          {/* Safety Alert Banner if active */}
          {record.is_safety_alert && (
            <div className="p-4 bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                  ประกาศเตือนภัยในเครือข่ายสวรรคโลก (Active Community Safety Alert)
                </div>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  {record.alert_notes || 'รายการนี้ถูกปักหมุดเป็นกรณีเร่งด่วน รพ.สต. ทุกแห่งโปรดเฝ้าระวังผลิตภัณฑ์นี้ในพื้นที่'}
                </p>
              </div>
            </div>
          )}

          {/* Photo gallery */}
          {record.image_url && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                ภาพถ่ายหลักฐานในพื้นที่
              </label>
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 relative group max-h-72 flex items-center justify-center">
                <img
                  src={record.image_url}
                  alt={record.product_name}
                  className="w-full h-full max-h-72 object-contain"
                />
                <a
                  href={record.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/70 hover:bg-black/90 text-white rounded-xl text-xs flex items-center gap-1.5 backdrop-blur-md transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>ดูภาพเต็ม</span>
                </a>
              </div>
            </div>
          )}

          {/* Incident Details Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">ข้อมูลเบาะแสและการค้นพบ</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">รูปแบบความเสี่ยง:</span>
                <span className="font-semibold text-slate-800">{record.risk_type}</span>
              </div>
              <div>
                <span className="text-slate-500 block">ช่องทางกระจาย:</span>
                <span className="font-semibold text-slate-800">{channelMeta.label}</span>
              </div>
              <div>
                <span className="text-slate-500 block">สถานที่ / ร้านค้า:</span>
                <span className="font-semibold text-slate-800">
                  {record.store_name ? `${record.store_name} ` : ''}
                  {record.village_moo ? `(${record.village_moo})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">ตำบล:</span>
                <span className="font-semibold text-slate-800">ต.{record.subdistrict || 'สวรรคโลก'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">พิกัดที่พบละเอียด:</span>
                <span className="font-semibold text-slate-800">{record.location_found}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">ผลตรวจชุดทดสอบเบื้องต้น:</span>
                <span className={`inline-block mt-0.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${testKitMeta.badge}`}>
                  {testKitMeta.label}
                </span>
              </div>
            </div>

            {record.description && (
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-500 block text-xs mb-1">รายละเอียดเพิ่มเติม:</span>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  {record.description}
                </p>
              </div>
            )}
          </div>

          {/* Reporter & Audit Info */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>ผู้แจ้งเบาะแส: <strong>{record.reporter_name}</strong></span>
              </span>
              <span>{new Date(record.created_at).toLocaleDateString('th-TH')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>สังกัด: {record.reporter_hospital}</span>
            </div>
          </div>

          {/* Pharmacist Action / Triage Section */}
          <div className="rounded-2xl border-2 border-teal-200 bg-teal-50/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    ข้อสั่งการและแนวทางจัดการ (โดยเภสัชกร คบส.)
                  </h4>
                  <p className="text-[11px] text-teal-800">
                    {isPharmacist 
                      ? 'คุณมีสิทธิ์กำหนดระดับความเสี่ยง และสั่งการแนวทางปฏิบัติแก่ รพ.สต.' 
                      : 'คำแนะนำและแนวทางปฏิบัติจากเภสัชกร'}
                  </p>
                </div>
              </div>
            </div>

            {isPharmacist ? (
              <div className="space-y-4 pt-2">
                {/* Status Switcher */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">สถานะการดำเนินงาน:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ACTION_STATUSES.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStatus(st.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition ${
                          status === st.id
                            ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Risk Level Switcher */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">ระดับความเสี่ยง (Triage):</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {RISK_LEVELS.map((rl) => (
                      <button
                        key={rl.id}
                        type="button"
                        onClick={() => setRiskLevel(rl.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border text-center transition ${
                          riskLevel === rl.id
                            ? 'bg-slate-900 text-white border-slate-900 font-bold'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {rl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action details */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    แนวทางจัดการ / ข้อสั่งการ / บันทึกผลการลงพื้นที่:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="เช่น ประสานทีม รพ.สต. ลงตรวจสอบร้านค้า, สุ่มเก็บตัวอย่างส่งแล็บ, หรือประสาน สสจ./อย. ดำเนินการตามกฎหมาย"
                    value={actionDetails}
                    onChange={(e) => setActionDetails(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                {/* Safety Alert Toggle */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSafetyAlert}
                      onChange={(e) => setIsSafetyAlert(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                      <BellRing className="w-3.5 h-3.5" />
                      <span>เปิดประกาศเตือนภัยในเครือข่าย (Broadcast Safety Alert)</span>
                    </span>
                  </label>
                  {isSafetyAlert && (
                    <input
                      type="text"
                      placeholder="ข้อความเตือนภัยที่จะแสดงให้ รพ.สต. ทุกแห่งเห็น..."
                      value={alertNotes}
                      onChange={(e) => setAlertNotes(e.target.value)}
                      className="w-full px-3 py-1.5 bg-rose-50/50 border border-rose-200 rounded-lg text-xs outline-none focus:border-rose-500"
                    />
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveTriage}
                    disabled={isSaving}
                    className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>บันทึกข้อสั่งการ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {record.action_details ? (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                    {record.action_details}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">
                    ยังไม่มีข้อสั่งการจากเภสัชกร (สถานะ: รอดำเนินการ)
                  </p>
                )}
                {record.action_taken_name && (
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                    <span>ดำเนินการโดย: <strong>{record.action_taken_name}</strong></span>
                    {record.action_taken_at && (
                      <span>{new Date(record.action_taken_at).toLocaleDateString('th-TH')}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบรายการนี้</span>
              </button>
            )}
          </div>
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
