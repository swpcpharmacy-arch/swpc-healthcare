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
  X
} from 'lucide-react';
import { updateUserStatusAction } from '@/app/auth/actions';

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
}

export default function UserApprovalManager({ initialProfiles }: UserApprovalManagerProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>(initialProfiles);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
          text: newStatus === 'approved' ? 'อนุมัติการเข้าใช้งานสำเร็จ' : 'ปฏิเสธการเข้าใช้งานแล้ว',
        });
      } else {
        setActionMessage({
          type: 'error',
          text: res.error || 'เกิดข้อผิดพลาดในการปรับปรุงสถานะ',
        });
      }
    });
  };

  const pendingList = profiles.filter((p) => p.status === 'pending');
  const approvedList = profiles.filter((p) => p.status === 'approved');
  const displayList = 
    activeTab === 'pending' 
      ? pendingList 
      : activeTab === 'approved' 
      ? approvedList 
      : profiles;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              จัดการอนุมัติผู้ใช้งานเครือข่าย
            </h2>
            {pendingList.length > 0 && (
              <span className="px-2.5 py-0.5 bg-rose-500 text-white text-xs font-bold rounded-full animate-bounce">
                รออนุมัติ {pendingList.length} คน
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            เฉพาะเภสัชกรผู้ดูแลระบบ: ตรวจสอบและอนุมัติบุคลากร รพ.สต. ก่อนเข้าถึงข้อมูลระบบ
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex p-1 bg-slate-100 rounded-2xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'pending'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            รออนุมัติ ({pendingList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'approved'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            อนุมัติแล้ว ({approvedList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'all'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({profiles.length})
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Users Table / List */}
      {displayList.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl space-y-2">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">
            {activeTab === 'pending' 
              ? 'ไม่มีคำขอที่รอการอนุมัติในขณะนี้' 
              : 'ยังไม่มีข้อมูลผู้ใช้งานในส่วนนี้'}
          </p>
          <p className="text-xs text-slate-400">
            เมื่อมีเจ้าหน้าที่ รพ.สต. หรือเภสัชกรสมัครเข้ามาใหม่ รายชื่อจะปรากฏที่นี่
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2 font-semibold">ชื่อ - นามสกุล</th>
                <th className="pb-3 font-semibold">สังกัดหน่วยบริการ</th>
                <th className="pb-3 font-semibold">บทบาท</th>
                <th className="pb-3 font-semibold">สถานะ</th>
                <th className="pb-3 pr-2 text-right font-semibold">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayList.map((item) => {
                const isPendingUser = item.status === 'pending';
                const isApprovedUser = item.status === 'approved';
                const isRejectedUser = item.status === 'rejected';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-4 pl-2">
                      <div className="font-semibold text-slate-800 text-sm">
                        {item.full_name}
                      </div>
                      <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span>{item.email}</span>
                      </div>
                    </td>

                    <td className="py-4 text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.hospital_name}</span>
                      </div>
                    </td>

                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.role === 'pharmacist'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-teal-100 text-teal-800'
                      }`}>
                        <ShieldCheck className="w-3 h-3" />
                        <span>{item.role === 'pharmacist' ? 'เภสัชกร' : 'เจ้าหน้าที่ รพ.สต.'}</span>
                      </span>
                    </td>

                    <td className="py-4">
                      {isPendingUser && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>รออนุมัติ</span>
                        </span>
                      )}
                      {isApprovedUser && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>อนุมัติแล้ว</span>
                        </span>
                      )}
                      {isRejectedUser && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" />
                          <span>ไม่อนุมัติ</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 pr-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        {isPendingUser && (
                          <>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleUpdateStatus(item.id, 'approved')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1 transition shadow-sm hover:shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>อนุมัติ</span>
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleUpdateStatus(item.id, 'rejected')}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-semibold flex items-center gap-1 transition border border-rose-200 active:scale-95 disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>ปฏิเสธ</span>
                            </button>
                          </>
                        )}

                        {isApprovedUser && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleUpdateStatus(item.id, 'rejected')}
                            className="px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition text-[11px]"
                            title="ระงับสิทธิ์"
                          >
                            ระงับสิทธิ์
                          </button>
                        )}

                        {isRejectedUser && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleUpdateStatus(item.id, 'approved')}
                            className="px-2.5 py-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition text-[11px]"
                            title="อนุมัติย้อนหลัง"
                          >
                            กู้คืนสิทธิ์
                          </button>
                        )}
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
  );
}
