'use client';

import React, { useState, useTransition } from 'react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Mail, 
  ShieldCheck, 
  AlertCircle,
  Check,
  X,
  KeyRound,
  Edit3,
  Plus,
  Search,
  UserCheck,
  Hospital,
  Lock,
  Eye,
  EyeOff,
  Power,
  Trash2,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  updateUserStatusAction, 
  adminUpdateUserAction, 
  adminResetPasswordAction 
} from '@/app/auth/actions';
import { 
  HospitalWithPharmacist,
  createHospitalAction,
  updateHospitalAction,
  toggleHospitalActiveAction,
  deleteHospitalAction
} from '@/app/hospitals/actions';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'staff' | 'pharmacist';
  hospital_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface UserApprovalManagerProps {
  initialProfiles: UserProfile[];
  initialHospitals?: HospitalWithPharmacist[];
  isFallbackHospitals?: boolean;
}

export default function UserApprovalManager({ 
  initialProfiles,
  initialHospitals = [],
  isFallbackHospitals = false,
}: UserApprovalManagerProps) {
  // Navigation tabs
  const [mainTab, setMainTab] = useState<'users' | 'hospitals'>('users');
  const [userStatusFilter, setUserStatusFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('all');

  // Data states
  const [profiles, setProfiles] = useState<UserProfile[]>(initialProfiles);
  const [hospitals, setHospitals] = useState<HospitalWithPharmacist[]>(initialHospitals);
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal states: Edit User
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<'staff' | 'pharmacist'>('staff');
  const [editHospital, setEditHospital] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');

  // Modal states: Reset Password
  const [resettingUser, setResettingUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Modal states: Hospital (Create or Edit)
  const [hospitalModalMode, setHospitalModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<HospitalWithPharmacist | null>(null);
  const [hospName, setHospName] = useState('');
  const [hospCode, setHospCode] = useState('');
  const [hospUnitType, setHospUnitType] = useState<string>('pcu');
  const [hospPharmacistId, setHospPharmacistId] = useState<string>('');
  const [hospOrder, setHospOrder] = useState<number>(10);

  // List of pharmacists for dropdown
  const pharmacistUsers = profiles.filter(
    (p) => p.role === 'pharmacist' && p.status === 'approved'
  );

  // Hospital options for dropdowns (active ones preferred)
  const hospitalListOptions = hospitals.length > 0
    ? hospitals.filter((h) => h.is_active).map((h) => h.name)
    : Array.from(new Set(profiles.map((p) => p.hospital_name).filter(Boolean)));

  // --- Quick Status Update (Approve / Reject) ---
  const handleUpdateStatus = (userId: string, newStatus: 'approved' | 'rejected') => {
    setActionMessage(null);
    startTransition(async () => {
      const res = await updateUserStatusAction(userId, newStatus);
      if (res.success) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === userId ? { ...p, status: newStatus } : p))
        );
        setActionMessage({
          type: 'success',
          text: newStatus === 'approved' ? 'อนุมัติการเข้าใช้งานสำเร็จ' : 'ระงับสิทธิ์การใช้งานแล้ว',
        });
      } else {
        setActionMessage({
          type: 'error',
          text: res.error || 'เกิดข้อผิดพลาดในการปรับปรุงสถานะ',
        });
      }
    });
  };

  // --- Open Edit User Modal ---
  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEditFullName(user.full_name);
    setEditRole(user.role);
    setEditHospital(user.hospital_name);
    setEditStatus(user.status);
  };

  // --- Save Edit User ---
  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setActionMessage(null);
    startTransition(async () => {
      const res = await adminUpdateUserAction(editingUser.id, {
        fullName: editFullName,
        role: editRole,
        hospitalName: editHospital,
        status: editStatus,
      });

      if (res.success) {
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === editingUser.id
              ? {
                  ...p,
                  full_name: editFullName,
                  role: editRole,
                  hospital_name: editHospital,
                  status: editStatus,
                }
              : p
          )
        );
        setActionMessage({ type: 'success', text: `ปรับปรุงข้อมูลผู้ใช้ "${editFullName}" เรียบร้อยแล้ว` });
        setEditingUser(null);
      } else {
        setActionMessage({ type: 'error', text: res.error || 'ไม่สามารถแก้ไขข้อมูลได้' });
      }
    });
  };

  // --- Open Reset Password Modal ---
  const openResetPasswordModal = (user: UserProfile) => {
    setResettingUser(user);
    setNewPassword('');
    setShowPassword(false);
  };

  // --- Submit Reset Password ---
  const handleAdminResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    if (newPassword.length < 6) {
      setActionMessage({ type: 'error', text: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
      return;
    }

    setActionMessage(null);
    startTransition(async () => {
      const res = await adminResetPasswordAction(resettingUser.id, newPassword);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `รีเซ็ตรหัสผ่านใหม่ให้กับ "${resettingUser.full_name}" (${resettingUser.email}) เรียบร้อยแล้ว`,
        });
        setResettingUser(null);
      } else {
        setActionMessage({ type: 'error', text: res.error || 'ไม่สามารถรีเซ็ตรหัสผ่านได้' });
      }
    });
  };

  // --- Open Hospital Create / Edit Modal ---
  const openHospitalModal = (mode: 'create' | 'edit', hosp?: HospitalWithPharmacist) => {
    setHospitalModalMode(mode);
    if (mode === 'edit' && hosp) {
      setSelectedHospital(hosp);
      setHospName(hosp.name);
      setHospCode(hosp.code || '');
      setHospUnitType(hosp.unit_type || 'pcu');
      setHospPharmacistId(hosp.responsible_pharmacist_id || '');
      setHospOrder(hosp.display_order ?? 10);
    } else {
      setSelectedHospital(null);
      setHospName('');
      setHospCode('');
      setHospUnitType('pcu');
      setHospPharmacistId('');
      setHospOrder(hospitals.length + 1);
    }
  };

  // --- Save Hospital (Create or Edit) ---
  const handleSaveHospital = (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);

    const pharmObj = hospPharmacistId
      ? pharmacistUsers.find((p) => p.id === hospPharmacistId)
      : null;

    startTransition(async () => {
      if (hospitalModalMode === 'create') {
        const res = await createHospitalAction({
          name: hospName,
          code: hospCode,
          unitType: hospUnitType,
          responsiblePharmacistId: hospPharmacistId || null,
          displayOrder: hospOrder,
        });

        if (res.success) {
          const newHospItem: HospitalWithPharmacist = {
            id: `temp_${Date.now()}`,
            name: hospName.trim(),
            code: hospCode.trim() || null,
            unit_type: hospUnitType,
            responsible_pharmacist_id: hospPharmacistId || null,
            responsible_pharmacist: pharmObj ? { id: pharmObj.id, full_name: pharmObj.full_name, email: pharmObj.email } : null,
            is_active: true,
            display_order: hospOrder,
          };
          setHospitals((prev) => [...prev, newHospItem]);
          setActionMessage({ type: 'success', text: `เพิ่มหน่วยบริการ "${hospName}" เรียบร้อยแล้ว` });
          setHospitalModalMode(null);
        } else {
          setActionMessage({ type: 'error', text: res.error || 'ไม่สามารถเพิ่มข้อมูลได้' });
        }
      } else if (hospitalModalMode === 'edit' && selectedHospital) {
        const res = await updateHospitalAction(selectedHospital.id, {
          name: hospName,
          code: hospCode,
          unitType: hospUnitType,
          responsiblePharmacistId: hospPharmacistId || null,
          displayOrder: hospOrder,
          oldName: selectedHospital.name,
        });

        if (res.success) {
          setHospitals((prev) =>
            prev.map((h) =>
              h.id === selectedHospital.id
                ? {
                    ...h,
                    name: hospName.trim(),
                    code: hospCode.trim() || null,
                    unit_type: hospUnitType,
                    responsible_pharmacist_id: hospPharmacistId || null,
                    responsible_pharmacist: pharmObj ? { id: pharmObj.id, full_name: pharmObj.full_name, email: pharmObj.email } : null,
                    display_order: hospOrder,
                  }
                : h
            )
          );
          // If name changed, update local profiles
          if (selectedHospital.name !== hospName.trim()) {
            setProfiles((prev) =>
              prev.map((p) =>
                p.hospital_name === selectedHospital.name ? { ...p, hospital_name: hospName.trim() } : p
              )
            );
          }
          setActionMessage({ type: 'success', text: `บันทึกการแก้ไข "${hospName}" เรียบร้อยแล้ว` });
          setHospitalModalMode(null);
        } else {
          setActionMessage({ type: 'error', text: res.error || 'ไม่สามารถแก้ไขข้อมูลได้' });
        }
      }
    });
  };

  // --- Toggle Hospital Active/Inactive ---
  const handleToggleHospitalActive = (hosp: HospitalWithPharmacist) => {
    setActionMessage(null);
    const newActiveState = !hosp.is_active;

    startTransition(async () => {
      const res = await toggleHospitalActiveAction(hosp.id, newActiveState);
      if (res.success) {
        setHospitals((prev) =>
          prev.map((h) => (h.id === hosp.id ? { ...h, is_active: newActiveState } : h))
        );
        setActionMessage({
          type: 'success',
          text: newActiveState ? `เปิดใช้งาน "${hosp.name}" แล้ว` : `ปิดการใช้งาน "${hosp.name}" แล้ว`,
        });
      } else {
        setActionMessage({ type: 'error', text: res.error || 'ไม่สามารถปรับสถานะได้' });
      }
    });
  };

  // --- Delete Hospital ---
  const handleDeleteHospital = (hosp: HospitalWithPharmacist) => {
    if (!confirm(`คุณต้องการลบ "${hosp.name}" ใช่หรือไม่?`)) return;

    setActionMessage(null);
    startTransition(async () => {
      const res = await deleteHospitalAction(hosp.id, hosp.name);
      if (res.success) {
        setHospitals((prev) => prev.filter((h) => h.id !== hosp.id));
        setActionMessage({ type: 'success', text: `ลบ "${hosp.name}" เรียบร้อยแล้ว` });
      } else {
        setActionMessage({ type: 'error', text: res.error || 'ไม่สามารถลบข้อมูลได้' });
      }
    });
  };

  // Filter profiles
  const pendingCount = profiles.filter((p) => p.status === 'pending').length;
  const filteredProfiles = profiles.filter((p) => {
    if (userStatusFilter === 'pending' && p.status !== 'pending') return false;
    if (userStatusFilter === 'approved' && p.status !== 'approved') return false;
    if (hospitalFilter !== 'all' && p.hospital_name !== hospitalFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.full_name?.toLowerCase().includes(q);
      const matchEmail = p.email?.toLowerCase().includes(q);
      const matchHosp = p.hospital_name?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchHosp) return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
      {/* Main Header & Tab Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                ระบบจัดการผู้ใช้ & เครือข่าย รพ.สต. (Admin Console)
              </h2>
              <p className="text-xs text-slate-500">
                จัดการสิทธิ์ผู้ใช้งาน, รีเซ็ตรหัสผ่าน, ย้ายสังกัด และมอบหมายเภสัชกรผู้รับผิดชอบ รพ.สต.
              </p>
            </div>
          </div>
        </div>

        {/* Major Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl text-xs font-bold self-start lg:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setMainTab('users')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              mainTab === 'users'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>จัดการผู้ใช้งาน ({profiles.length})</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMainTab('hospitals')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              mainTab === 'hospitals'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Hospital className="w-4 h-4" />
            <span>จัดการ รพ.สต. & เภสัชกร ({hospitals.length})</span>
          </button>
        </div>
      </div>

      {/* Global Action Message Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-2 animate-in fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: USERS MANAGEMENT */}
      {/* ========================================================================= */}
      {mainTab === 'users' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            {/* Status pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setUserStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  userStatusFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>รออนุมัติ</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-black/15 rounded-full">{pendingCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setUserStatusFilter('approved')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  userStatusFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>อนุมัติแล้ว</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-black/15 rounded-full">
                  {profiles.filter((p) => p.status === 'approved').length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setUserStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  userStatusFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                <span>ทั้งหมด ({profiles.length})</span>
              </button>
            </div>

            {/* Search & Hospital Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, อีเมล..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {hospitalListOptions.length > 0 && (
                <select
                  value={hospitalFilter}
                  onChange={(e) => setHospitalFilter(e.target.value)}
                  aria-label="กรองตามหน่วยบริการ"
                  className="bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400 max-w-[140px] truncate"
                >
                  <option value="all">ทุกหน่วยบริการ</option>
                  {hospitalListOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* User Table */}
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">
                ไม่พบรายชื่อผู้ใช้งานตามเงื่อนไขที่เลือก
              </p>
              <p className="text-xs text-slate-400">
                ลองปรับตัวกรองหรือคำค้นหาด้านบน
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200/70 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3 font-semibold">ชื่อ - นามสกุล / อีเมล</th>
                    <th className="py-3 px-3 font-semibold">สังกัดหน่วยบริการ</th>
                    <th className="py-3 px-3 font-semibold">บทบาท</th>
                    <th className="py-3 px-3 font-semibold">สถานะ</th>
                    <th className="py-3 px-3 text-right font-semibold">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProfiles.map((item) => {
                    const isPendingUser = item.status === 'pending';
                    const isApprovedUser = item.status === 'approved';
                    const isRejectedUser = item.status === 'rejected';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition group">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900 text-sm">
                            {item.full_name}
                          </div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-mono">{item.email}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-slate-700">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.hospital_name}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            item.role === 'pharmacist'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-teal-100 text-teal-800 border border-teal-200'
                          }`}>
                            <ShieldCheck className="w-3 h-3" />
                            <span>{item.role === 'pharmacist' ? 'เภสัชกร' : 'เจ้าหน้าที่ รพ.สต.'}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          {isPendingUser && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              <span>รออนุมัติ</span>
                            </span>
                          )}
                          {isApprovedUser && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>อนุมัติแล้ว</span>
                            </span>
                          )}
                          {isRejectedUser && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3" />
                              <span>ระงับสิทธิ์</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Quick Approve/Reject for pending users */}
                            {isPendingUser && (
                              <>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => handleUpdateStatus(item.id, 'approved')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 transition shadow-sm cursor-pointer"
                                  title="อนุมัติการเข้าใช้งาน"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>อนุมัติ</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => handleUpdateStatus(item.id, 'rejected')}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                                  title="ปฏิเสธ"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>ปฏิเสธ</span>
                                </button>
                              </>
                            )}

                            {/* Reset Password Button */}
                            <button
                              type="button"
                              onClick={() => openResetPasswordModal(item)}
                              className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg border border-slate-200 transition cursor-pointer"
                              title="รีเซ็ตรหัสผ่านใหม่ให้ผู้ใช้"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit User Button */}
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="แก้ไขข้อมูล, ปรับสิทธิ์ หรือย้าย รพ.สต."
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              <span>แก้ไข</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HOSPITALS & RESPONSIBLE PHARMACISTS */}
      {/* ========================================================================= */}
      {mainTab === 'hospitals' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Header & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Hospital className="w-4 h-4 text-teal-700" />
                <span>รายชื่อ รพ.สต. และหน่วยบริการในเครือข่ายสวรรคโลก</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนดเภสัชกรผู้รับผิดชอบหลักประจำแต่ละ รพ.สต. เพื่อใช้ออกชื่อในรายงานสรุป ME
              </p>
            </div>

            <button
              type="button"
              onClick={() => openHospitalModal('create')}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่ม รพ.สต. ใหม่</span>
            </button>
          </div>

          {/* Database Setup Notice if using fallback */}
          {isFallbackHospitals && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">
                  ระบบกำลังแสดงรายชื่อเริ่มต้น 13 หน่วยบริการ (ยังไม่ได้รัน SQL สร้างตาราง 'hospitals' ใน Supabase)
                </p>
                <p className="text-amber-800 leading-relaxed">
                  เมื่อคุณกดเพิ่มหรือแก้ไข รพ.สต. ระบบจำเป็นต้องใช้ตารางฐานข้อมูลจริง หากพบข้อผิดพลาด กรุณานำโค้ดในไฟล์ 
                  <code className="bg-amber-100/90 text-amber-950 px-1.5 py-0.5 rounded font-mono font-bold mx-1">supabase_hospitals_and_admin_rpc.sql</code> 
                  ไปวางและกด <strong>Run</strong> ใน Supabase Dashboard &gt; SQL Editor เพื่อเปิดใช้งานตาราง
                </p>
              </div>
            </div>
          )}

          {/* Hospitals Table */}
          {hospitals.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl space-y-2">
              <Hospital className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">
                ยังไม่มีข้อมูล รพ.สต. ในระบบ
              </p>
              <button
                type="button"
                onClick={() => openHospitalModal('create')}
                className="text-xs text-teal-700 font-bold hover:underline"
              >
                กดเพิ่ม รพ.สต. แห่งแรก
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200/70 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3 font-semibold">ลำดับ</th>
                    <th className="py-3 px-3 font-semibold">ชื่อหน่วยบริการ (รพ.สต.)</th>
                    <th className="py-3 px-3 font-semibold">รหัสหน่วยงาน</th>
                    <th className="py-3 px-3 font-semibold">เภสัชกรผู้รับผิดชอบ</th>
                    <th className="py-3 px-3 font-semibold">สถานะ</th>
                    <th className="py-3 px-3 text-right font-semibold">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hospitals.map((hosp, idx) => {
                    const pharmName = hosp.responsible_pharmacist?.full_name || null;
                    const pharmEmail = hosp.responsible_pharmacist?.email || null;

                    return (
                      <tr 
                        key={hosp.id} 
                        className={`hover:bg-slate-50/60 transition group ${
                          !hosp.is_active ? 'opacity-60 bg-slate-50/40' : ''
                        }`}
                      >
                        <td className="py-3.5 px-3 font-mono text-slate-400">
                          {hosp.display_order ?? idx + 1}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm">
                              {hosp.name}
                            </span>
                            {hosp.unit_type === 'pcc' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                PCC
                              </span>
                            )}
                            {hosp.unit_type === 'pcu' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
                                PCU
                              </span>
                            )}
                            {hosp.unit_type === 'hospital' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200">
                                รพ.แม่ข่าย
                              </span>
                            )}
                            {hosp.unit_type === 'sso' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                สสอ.
                              </span>
                            )}
                          </div>
                          {!hosp.is_active && (
                            <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">
                              (ปิดการใช้งานชั่วคราว)
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-slate-600 font-mono">
                          {hosp.code || '-'}
                        </td>

                        <td className="py-3.5 px-3">
                          {pharmName ? (
                            <div>
                              <div className="font-bold text-purple-900 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                <span>{pharmName}</span>
                              </div>
                              {pharmEmail && (
                                <span className="text-[10px] text-slate-400 block font-mono pl-5">
                                  {pharmEmail}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              ยังไม่ได้ระบุ (เว้นว่างในรายงาน ME)
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleHospitalActive(hosp)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                              hosp.is_active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                            title="คลิกเพื่อสลับเปิด-ปิดการใช้งาน"
                          >
                            <Power className="w-3 h-3" />
                            <span>{hosp.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
                          </button>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openHospitalModal('edit', hosp)}
                              className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="แก้ไขชื่อ หรือเปลี่ยนเภสัชกร"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              <span>แก้ไข</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteHospital(hosp)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="ลบ รพ.สต."
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT USER (ROLE, HOSPITAL, STATUS) */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">แก้ไขข้อมูลผู้ใช้งาน & สิทธิ์</h3>
                  <p className="text-xs text-slate-500 font-mono">{editingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4 text-xs">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">ชื่อ - นามสกุล</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:outline-none text-slate-800"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">บทบาท (Role)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole('staff')}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer ${
                      editRole === 'staff'
                        ? 'border-teal-500 bg-teal-50/70 text-teal-900 ring-2 ring-teal-400/40'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="font-bold">เจ้าหน้าที่ รพ.สต.</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">บันทึก ME และดูข้อมูล รพ.สต. ตนเอง</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('pharmacist')}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer ${
                      editRole === 'pharmacist'
                        ? 'border-purple-500 bg-purple-50/70 text-purple-900 ring-2 ring-purple-400/40'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="font-bold">เภสัชกร / Admin</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">ดูแลระบบ อนุมัติผู้ใช้ ออกรายงานสรุป</div>
                  </button>
                </div>
              </div>

              {/* Hospital Transfer */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">สังกัดหน่วยบริการ (รพ.สต.)</label>
                <select
                  value={editHospital}
                  onChange={(e) => setEditHospital(e.target.value)}
                  aria-label="สังกัดหน่วยบริการ"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:outline-none bg-white text-slate-800"
                >
                  {hospitalListOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  {/* In case current user's hospital isn't in active list */}
                  {!hospitalListOptions.includes(editHospital) && editHospital && (
                    <option value={editHospital}>{editHospital}</option>
                  )}
                </select>
                <p className="text-[11px] text-slate-400">
                  กรณีบุคลากรย้าย รพ.สต. สามารถเลือกหน่วยบริการใหม่ได้ทันที
                </p>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">สถานะการใช้งาน</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  aria-label="สถานะการใช้งาน"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:outline-none bg-white text-slate-800"
                >
                  <option value="approved">อนุมัติแล้ว (เข้าใช้งานระบบได้ตามปกติ)</option>
                  <option value="pending">รออนุมัติ (ผู้ใช้จะถูกส่งไปหน้ารออนุมัติ)</option>
                  <option value="rejected">ระงับสิทธิ์ / ลาออก (ไม่อนุญาตให้เข้าสู่ระบบ)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isPending ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESET PASSWORD (ADMIN FORCED RESET) */}
      {/* ========================================================================= */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">กำหนดรหัสผ่านใหม่</h3>
                  <p className="text-xs text-slate-500 font-medium">{resettingUser.full_name}</p>
                </div>
              </div>
              <button
                onClick={() => setResettingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                เมื่อบันทึกแล้ว รหัสผ่านใหม่จะมีผลทันที โปรดแจ้งรหัสผ่านนี้ให้กับผู้ใช้งานผ่านช่องทางที่ปลอดภัย
              </span>
            </div>

            <form onSubmit={handleAdminResetPassword} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="กำหนดรหัสผ่านใหม่..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isPending ? 'กำลังบันทึก...' : 'ตั้งรหัสผ่านทันที'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: HOSPITAL CREATE / EDIT */}
      {/* ========================================================================= */}
      {hospitalModalMode && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
                  <Hospital className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {hospitalModalMode === 'create' ? 'เพิ่มหน่วยบริการ (รพ.สต.) ใหม่' : 'แก้ไขข้อมูล รพ.สต.'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    กำหนดชื่อ รหัส และเภสัชกรผู้รับผิดชอบหลัก
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHospitalModalMode(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHospital} className="space-y-4 text-xs">
              {/* Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">ชื่อหน่วยบริการ / รพ.สต. *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น รพ.สต. บ้านคลองด่าน"
                  value={hospName}
                  onChange={(e) => setHospName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:outline-none text-slate-800"
                />
              </div>

              {/* Code & Unit Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">รหัสสถานพยาบาล 5 หลัก (เช่น 07450)</label>
                  <input
                    type="text"
                    placeholder="เช่น 07450, 14857"
                    value={hospCode}
                    onChange={(e) => setHospCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:outline-none text-slate-800 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ประเภทหน่วยบริการ</label>
                  <select
                    value={hospUnitType}
                    onChange={(e) => setHospUnitType(e.target.value)}
                    aria-label="ประเภทหน่วยบริการ"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:outline-none bg-white text-slate-800 font-medium"
                  >
                    <option value="pcu">PCU (รพ.สต. / หน่วยบริการปฐมภูมิ)</option>
                    <option value="pcc">PCC (ศูนย์บริการสาธารณสุข / เทศบาล)</option>
                    <option value="hospital">โรงพยาบาลแม่ข่าย</option>
                    <option value="sso">สำนักงานสาธารณสุขอำเภอ (สสอ.)</option>
                    <option value="other">หน่วยบริการอื่นในเครือข่าย</option>
                  </select>
                </div>
              </div>

              {/* Responsible Pharmacist */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  เภสัชกรผู้รับผิดชอบหลัก (จะปรากฏในรายงาน ME)
                </label>
                <select
                  value={hospPharmacistId}
                  onChange={(e) => setHospPharmacistId(e.target.value)}
                  aria-label="เภสัชกรผู้รับผิดชอบหลัก"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:outline-none bg-white text-slate-800"
                >
                  <option value="">-- ยังไม่ระบุ (เว้นว่างชื่อผู้ตรวจสอบในรายงาน) --</option>
                  {pharmacistUsers.map((ph) => (
                    <option key={ph.id} value={ph.id}>
                      {ph.full_name} ({ph.email})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  * เภสัชกร 1 ท่าน สามารถดูแลและรับผิดชอบได้หลาย รพ.สต.
                </p>
              </div>

              {/* Display order */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">ลำดับการแสดงผล</label>
                <input
                  type="number"
                  min={1}
                  value={hospOrder}
                  onChange={(e) => setHospOrder(parseInt(e.target.value) || 0)}
                  className="w-28 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:outline-none text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHospitalModalMode(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล รพ.สต.'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
