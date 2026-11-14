'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Store, 
  Tag, 
  Pill, 
  FileText,
  Loader2,
  Trash2
} from 'lucide-react';
import { 
  PRODUCT_CATEGORIES, 
  DISTRIBUTION_CHANNELS, 
  TEST_KIT_OPTIONS, 
  SWPC_SUBDISTRICTS,
  ProductCategory,
  DistributionChannel,
  TestKitResult,
  RiskLevel
} from '@/lib/constants/unsafeProducts';
import { compressImage, formatBytes, CompressionResult } from '@/lib/utils/imageCompression';
import { createUnsafeProductAction } from '@/app/unsafe-products/actions';

interface UnsafeProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userHospital?: string;
  userRole?: string;
}

export default function UnsafeProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  userHospital = 'รพ.สต. ในเครือข่าย',
}: UnsafeProductFormModalProps) {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('drug_set');
  const [riskType, setRiskType] = useState('พบยาชุดไม่ระบุชื่อ / สงสัยสเตียรอยด์');
  const [channel, setChannel] = useState<DistributionChannel>('grocery_store');
  const [storeName, setStoreName] = useState('');
  const [villageMoo, setVillageMoo] = useState('');
  const [subdistrict, setSubdistrict] = useState(SWPC_SUBDISTRICTS[0]);
  const [locationFound, setLocationFound] = useState('');
  const [testKitResult, setTestKitResult] = useState<TestKitResult>('not_tested');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('moderate');
  const [description, setDescription] = useState('');

  // Image upload and client compression state
  const [compressedImage, setCompressedImage] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setErrorMessage('');
      const result = await compressImage(file, 1400, 0.82);
      setCompressedImage(result);
    } catch (err: any) {
      console.error('Image compression error:', err);
      setErrorMessage('ไม่สามารถบีบอัดรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = () => {
    setCompressedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setErrorMessage('กรุณาระบุชื่อผลิตภัณฑ์');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const formData = new FormData();
      formData.append('product_name', productName.trim());
      formData.append('product_category', category);
      formData.append('risk_type', riskType.trim());
      formData.append('distribution_channel', channel);
      formData.append('store_name', storeName.trim());
      formData.append('village_moo', villageMoo.trim());
      formData.append('subdistrict', subdistrict);
      
      const fullLocation = locationFound.trim() || 
        `${storeName ? storeName + ' ' : ''}${villageMoo ? villageMoo + ' ' : ''}ต.${subdistrict} อ.สวรรคโลก`;
      formData.append('location_found', fullLocation);

      formData.append('description', description.trim());
      formData.append('test_kit_result', testKitResult);
      formData.append('risk_level', riskLevel);

      // Attach compressed image file if available
      if (compressedImage?.file) {
        formData.append('image_file', compressedImage.file);
      }

      const res = await createUnsafeProductAction(null, formData);

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">แจ้งเบาะแสผลิตภัณฑ์สุขภาพไม่ปลอดภัย</h2>
              <p className="text-xs text-teal-100">
                ระบบเฝ้าระวังยาและผลิตภัณฑ์สุขภาพในชุมชน (G-RDU & G-SHP) • สวรรคโลก
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Product Category Selection (Quick Chips) */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-teal-600" />
              <span>หมวดหมู่ผลิตภัณฑ์สุขภาพ <span className="text-rose-500">*</span></span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRODUCT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id);
                    if (cat.id === 'drug_set') setRiskType('ยาชุดแก้ปวดเมื่อย/ยาชุดจัดซอง');
                    else if (cat.id === 'herbal_steroid') setRiskType('ยาน้ำสมุนไพรสงสัยสเตียรอยด์');
                    else if (cat.id === 'antibiotic_grocery') setRiskType('ยาปฏิชีวนะขายในร้านชำ');
                    else if (cat.id === 'cosmetics') setRiskType('ครีมหน้าขาวไม่จดแจ้ง/สารปรอท');
                    else if (cat.id === 'food_supplement') setRiskType('เสริมอาหารโอ้อวดสรรพคุณ');
                  }}
                  className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                    category === cat.id
                      ? 'border-teal-500 bg-teal-50/80 text-teal-900 font-semibold shadow-sm ring-1 ring-teal-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{cat.label}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{cat.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Product Name & Risk description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800">
                ชื่อผลิตภัณฑ์ / ยี่ห้อ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น ยาน้ำกษัยเส้น ตรา..., ยาชุดแก้ปวด 5 เม็ด"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800">
                รูปแบบความเสี่ยง / ข้อสงสัย
              </label>
              <input
                type="text"
                placeholder="เช่น สงสัยสเตียรอยด์, ไม่มีเลข อย., ตัดแผงขาย"
                value={riskType}
                onChange={(e) => setRiskType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
              />
            </div>
          </div>

          {/* Distribution Channel */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-teal-600" />
              <span>แหล่งที่พบ / ช่องทางกระจายยาในชุมชน <span className="text-rose-500">*</span></span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DISTRIBUTION_CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setChannel(ch.id)}
                  className={`px-3 py-2 rounded-xl border text-xs text-left transition ${
                    channel === ch.id
                      ? 'border-teal-500 bg-teal-50 text-teal-900 font-semibold ring-1 ring-teal-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">ชื่อร้านค้า / รถเร่</label>
              <input
                type="text"
                placeholder="เช่น ร้านชำป้าสม, รถกระบะเร่"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-teal-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">หมู่ที่ / ชุมชน</label>
              <input
                type="text"
                placeholder="เช่น หมู่ 3 บ้านวังไม้ขอน"
                value={villageMoo}
                onChange={(e) => setVillageMoo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-teal-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">ตำบลใน อ.สวรรคโลก</label>
              <select
                value={subdistrict}
                onChange={(e) => setSubdistrict(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-teal-500"
              >
                {SWPC_SUBDISTRICTS.map((sub) => (
                  <option key={sub} value={sub}>
                    ต.{sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Test Kit Result */}
          <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="font-semibold text-slate-800 text-xs flex items-center justify-between">
              <span>ผลตรวจด้วยชุดทดสอบเบื้องต้น (Test Kit / กรมวิทย์ฯ)</span>
              <span className="text-[10px] text-slate-500 font-normal">เช่น ชุดตรวจสเตียรอยด์ / สารปรอท</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TEST_KIT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTestKitResult(opt.id);
                    if (opt.id === 'positive_steroid') setRiskLevel('critical');
                    else if (opt.id === 'positive_chemical') setRiskLevel('high');
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs text-left transition ${
                    testKitResult === opt.id
                      ? 'border-teal-500 bg-teal-100/70 text-teal-900 font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>รายละเอียดเหตุการณ์ / ข้อมูลผู้ได้รับผลกระทบ</span>
            </label>
            <textarea
              rows={3}
              placeholder="ระบุอาการผิดปกติของผู้ป่วย (ถ้ามี), พฤติกรรมการขาย, ป้ายทะเบียนรถเร่ หรือข้อสังเกตเพิ่มเติม"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition text-xs"
            />
          </div>

          {/* Photo Upload with Client-Side Compression */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-teal-600" />
                <span>แนบภาพถ่ายหลักฐาน (ฉลาก / ซองยา / หน้าร้าน)</span>
              </span>
              <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
                ⚡ มีระบบบีบอัดรูปภาพอัตโนมัติประหยัดพื้นที่
              </span>
            </label>

            {!compressedImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/30 rounded-2xl p-5 text-center cursor-pointer transition group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {isCompressing ? (
                  <div className="flex flex-col items-center justify-center py-2 space-y-2">
                    <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                    <span className="text-xs text-slate-600 font-medium">กำลังบีบอัดรูปภาพ...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-teal-100 text-slate-500 group-hover:text-teal-600 flex items-center justify-center transition">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        กดเพื่อถ่ายภาพจากมือถือ หรือเลือกไฟล์รูปภาพ
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        ระบบจะย่อขนาดให้อัตโนมัติ (จาก 5MB เหลือ ~150KB) เพื่อประหยัดพื้นที่โควตาฟรี
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative rounded-2xl border border-teal-200 bg-teal-50/40 p-3 flex items-center gap-4">
                <img
                  src={compressedImage.previewUrl}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-xl border border-teal-300 shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>บีบอัดรูปภาพสำเร็จ! ประหยัดพื้นที่ {compressedImage.reductionPercentage}%</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    ขนาดเดิม: <span className="line-through">{formatBytes(compressedImage.originalSize)}</span> →{' '}
                    <strong className="text-teal-800">{formatBytes(compressedImage.compressedSize)}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 rounded-xl transition"
                  title="ลบรูปภาพ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-600/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึกเบาะแส...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ส่งเบาะแสเข้าสู่ระบบเฝ้าระวัง</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
