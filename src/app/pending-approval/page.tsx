import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { 
  Clock, 
  ShieldCheck, 
  Building2, 
  User, 
  Mail, 
  LogOut, 
  RotateCw,
  PhoneCall,
  Activity
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from '@/app/auth/actions';

export const dynamic = 'force-dynamic';

export default async function PendingApprovalPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const email = profile?.email || user?.email || '';
  const isNetworkAdmin = email.trim().toLowerCase() === 'swpc.pharmacy@gmail.com';

  // If already approved or is network admin, update and direct straight to dashboard
  if (profile?.status === 'approved' || isNetworkAdmin) {
    if (isNetworkAdmin && profile?.status !== 'approved') {
      await supabase
        .from('profiles')
        .update({ status: 'approved', role: 'pharmacist' })
        .eq('id', user.id);
    }
    redirect('/dashboard');
  }

  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'ผู้ใช้งาน';
  const role = profile?.role || user?.user_metadata?.role || 'staff';
  const hospitalName = profile?.hospital_name || user?.user_metadata?.hospital_name || 'รพ.สต. ในเครือข่าย';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-teal-50/30 to-cyan-50 flex flex-col justify-between p-6">
      {/* Header bar */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-primary p-2.5 rounded-2xl shadow-md group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-800 tracking-tight block">
              SWPC Healthcare
            </span>
            <span className="text-xs text-slate-500 font-medium">
              เครือข่ายบริการสุขภาพอำเภอสวรรคโลก
            </span>
          </div>
        </Link>

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 rounded-xl transition border border-rose-200 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </form>
      </header>

      {/* Main Content Box */}
      <main className="max-w-xl mx-auto w-full my-auto">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/60 space-y-6 text-center">
          {/* Animated Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 shadow-inner ring-8 ring-amber-50">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="inline-block text-[11px] font-bold tracking-wider uppercase px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
              สถานะ: รอการอนุมัติ (Pending Approval)
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              บัญชีของคุณอยู่ระหว่างรออนุมัติ
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              เพื่อความปลอดภัยของข้อมูลผู้ป่วยและอุบัติการณ์ด้านยาในเครือข่ายอำเภอสวรรคโลก 
              เภสัชกรผู้รับผิดชอบงาน คบส. จะทำการตรวจสอบสังกัดและอนุมัติการเข้าใช้งานโดยเร็ว
            </p>
          </div>

          {/* User Details Preview */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-left space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                ชื่อ-สกุล:
              </span>
              <span className="font-semibold text-slate-800">{fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                อีเมล:
              </span>
              <span className="font-semibold text-slate-800">{email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                หน่วยบริการที่สังกัด:
              </span>
              <span className="font-semibold text-slate-800">{hospitalName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                บทบาทที่ลงทะเบียน:
              </span>
              <span className="font-semibold text-primary">
                {role === 'pharmacist' ? 'เภสัชกร / Admin' : 'เจ้าหน้าที่ รพ.สต.'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="flex-1 btn-primary py-3 text-sm flex items-center justify-center gap-2 shadow-md"
            >
              <RotateCw className="w-4 h-4" />
              <span>รีเฟรชตรวจสอบสถานะ</span>
            </Link>
          </div>

          {/* Helper contact */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <PhoneCall className="w-3.5 h-3.5 text-primary" />
            <span>กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค โรงพยาบาลสวรรคโลก</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-4">
        © 2026 เครือข่ายบริการสุขภาพอำเภอสวรรคโลก. สงวนลิขสิทธิ์.
      </footer>
    </div>
  );
}
