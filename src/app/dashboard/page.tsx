import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { 
  Activity, 
  ShieldCheck, 
  LogOut, 
  User, 
  Building2, 
  ClipboardList, 
  AlertCircle, 
  Pill, 
  FolderGit2, 
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from '@/app/auth/actions';
import UserApprovalManager from '@/components/admin/UserApprovalManager';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in and Supabase is configured, redirect to login
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const isConfigured = supabaseUrl && !supabaseUrl.includes('your-project');

  if (isConfigured && !user) {
    redirect('/login');
  }

  // Fetch profile if available
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  // If user is not yet approved, strictly redirect to pending screen
  if (!profile || profile.status !== 'approved') {
    redirect('/pending-approval');
  }

  const role = profile?.role || user?.user_metadata?.role || 'staff';
  const fullName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'บุคลากรสาธารณสุข';
  const hospitalName = profile?.hospital_name || user?.user_metadata?.hospital_name || 'เครือข่ายบริการสุขภาพอำเภอสวรรคโลก';
  const email = profile?.email || user?.email || 'user@hospital.moph.go.th';

  // If pharmacist, fetch all profiles for approval management
  let allProfiles: any[] = [];
  if (role === 'pharmacist') {
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    allProfiles = usersData || [];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/40">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl text-white shadow-sm">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-800 hidden sm:block">
                  SWPC Healthcare
                </span>
                <span className="text-xs text-slate-500 font-medium block">
                  ระบบบริหารงานเภสัชกรรมปฐมภูมิ & คบส.
                </span>
              </div>
            </Link>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold text-slate-800 flex items-center justify-end gap-1.5">
                <span>{fullName}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  role === 'pharmacist' 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : 'bg-teal-100 text-teal-800 border border-teal-200'
                }`}>
                  {role === 'pharmacist' ? 'เภสัชกร / Admin' : 'เจ้าหน้าที่ รพ.สต.'}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
                <Building2 className="w-3 h-3" />
                <span>{hospitalName}</span>
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 rounded-xl transition border border-rose-200 shadow-sm"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-teal-600 to-emerald-600 p-8 text-white shadow-xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -z-0"></div>
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ยินดีต้อนรับสู่ระบบบริหารงาน</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
              สวัสดี, {fullName}
            </h1>
            <p className="text-teal-100 text-sm md:text-base leading-relaxed">
              สังกัด: <strong>{hospitalName}</strong> | สิทธิ์การใช้งาน:{' '}
              <span className="underline decoration-teal-300">
                {role === 'pharmacist' ? 'เภสัชกร (สิทธิ์แก้ไขเกณฑ์และจัดการ คบส.)' : 'เจ้าหน้าที่ รพ.สต. (สิทธิ์รายงานและแนบหลักฐาน)'}
              </span>
            </p>
          </div>
        </div>

        {/* Status notice if Supabase keys are default */}
        {!isConfigured && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold">โปรดตั้งค่า Supabase API Key ใน .env.local</p>
              <p className="text-xs text-amber-700 mt-1">
                ขณะนี้ระบบแสดงผลในโหมดตัวอย่าง (Preview Mode) เมื่อคุณใส่ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ในไฟล์ .env.local ระบบจะเชื่อมต่อฐานข้อมูลจริงทันที
              </p>
            </div>
          </div>
        )}

        {/* Feature Cards Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>เมนูบริการหลัก</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Criteria Part 7 */}
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 border border-slate-200/80 bg-white group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">
                  เกณฑ์การประเมินส่วนที่ 7
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  บริการเภสัชกรรม (64 คะแนน) และงาน คบส. (18 คะแนน) พร้อมแนวทางปฏิบัติ
                </p>
              </div>
              <div className="pt-6 flex items-center justify-between text-xs font-semibold text-primary">
                <span>เข้าสู่เกณฑ์ประเมิน</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Medication Errors */}
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 border border-slate-200/80 bg-white group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">
                  ระบบรายงาน ME
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  บันทึกอุบัติการณ์ความคลาดเคลื่อนทางยา สถิติแบบเรียลไทม์ และพิมพ์รายงาน
                </p>
              </div>
              <div className="pt-6 flex items-center justify-between text-xs font-semibold text-emerald-600">
                <span>จัดการรายงาน ME</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Unsafe Products */}
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 border border-slate-200/80 bg-white group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Pill className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">
                  แจ้งผลิตภัณฑ์ไม่ปลอดภัย
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  เฝ้าระวังผลิตภัณฑ์สุขภาพในชุมชน แนบรูปภาพ และติดตามสถานะรับเรื่อง
                </p>
              </div>
              <div className="pt-6 flex items-center justify-between text-xs font-semibold text-sky-600">
                <span>แจ้งผลิตภัณฑ์</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 4: Evidence Checklist */}
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 border border-slate-200/80 bg-white group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">
                  คลังเอกสารหลักฐาน
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Checklist การนิเทศงาน เชื่อมโยง Google Drive และพิมพ์แบบสรุป A4
                </p>
              </div>
              <div className="pt-6 flex items-center justify-between text-xs font-semibold text-indigo-600">
                <span>ดู Checklist หลักฐาน</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* User Approval Management (For Pharmacists only) */}
        {role === 'pharmacist' && (
          <UserApprovalManager initialProfiles={allProfiles} />
        )}

        {/* Profile Details Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <span>ข้อมูลบัญชีผู้ใช้งาน</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">ชื่อ - สกุล</span>
              <span className="font-semibold text-slate-800 text-sm">{fullName}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">อีเมล</span>
              <span className="font-semibold text-slate-800 text-sm">{email}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">หน่วยบริการที่สังกัด</span>
              <span className="font-semibold text-slate-800 text-sm">{hospitalName}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">บทบาท (Role)</span>
              <span className="font-semibold text-slate-800 text-sm">
                {role === 'pharmacist' ? 'เภสัชกร / คบส. อำเภอ' : 'เจ้าหน้าที่ รพ.สต.'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
