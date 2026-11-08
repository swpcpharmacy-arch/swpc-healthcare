import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { 
  Activity, 
  Building2, 
  LogOut, 
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from '@/app/auth/actions';
import MEDashboard from '@/components/me/MEDashboard';
import { DEFAULT_ME_RECORDS } from '@/lib/data/defaultMEData';
import { MedicationErrorRecord } from '@/lib/constants/me';

export const dynamic = 'force-dynamic';

export default async function MedicationErrorsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in and Supabase is configured, redirect to login
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const isConfigured = supabaseUrl && !supabaseUrl.includes('your-project');

  if (isConfigured && !user) {
    redirect('/login');
  }

  // Fetch profile
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  const email = profile?.email || user?.email || 'user@hospital.moph.go.th';
  const isNetworkAdmin = email.trim().toLowerCase() === 'swpc.pharmacy@gmail.com';

  // Check approval
  if (!isNetworkAdmin && (!profile || profile.status !== 'approved')) {
    redirect('/pending-approval');
  }

  const role = isNetworkAdmin ? 'pharmacist' : (profile?.role || user?.user_metadata?.role || 'staff');
  const fullName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'บุคลากรสาธารณสุข';
  const hospitalName = profile?.hospital_name || user?.user_metadata?.hospital_name || 'เครือข่ายบริการสุขภาพอำเภอสวรรคโลก';
  const isPharmacist = role === 'pharmacist';

  // Fetch Medication Errors
  let records: MedicationErrorRecord[] = [];

  let query = supabase
    .from('medication_errors')
    .select(`
      id,
      reporter_id,
      hospital_name,
      report_date,
      patient_hn,
      drug_name,
      error_type,
      severity,
      contributing_factor,
      description,
      actions_taken,
      created_at,
      profiles:reporter_id (
        full_name,
        hospital_name
      )
    `)
    .order('report_date', { ascending: false })
    .order('created_at', { ascending: false });

  // Staff can strictly view only their own hospital
  if (!isPharmacist) {
    query = query.eq('hospital_name', hospitalName);
  }

  const { data: meData, error: meError } = await query;

  if (!meError && meData && meData.length > 0) {
    records = meData.map((item: any) => ({
      id: item.id,
      reporter_id: item.reporter_id,
      report_date: item.report_date,
      patient_hn: item.patient_hn,
      drug_name: item.drug_name,
      error_type: item.error_type,
      severity: item.severity,
      contributing_factor: item.contributing_factor,
      description: item.description,
      actions_taken: item.actions_taken,
      created_at: item.created_at,
      reporter_name: item.profiles?.full_name || 'เจ้าหน้าที่',
      hospital_name: item.hospital_name || item.profiles?.hospital_name || hospitalName,
    }));
  } else {
    // If table is empty or fallback, populate with default seed data
    records = DEFAULT_ME_RECORDS;
  }

  // Strictly enforce hospital isolation for Staff (including fallback dataset)
  if (!isPharmacist) {
    records = records.filter((r) => r.hospital_name === hospitalName);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-emerald-50/30">
      {/* Top Navbar */}
      <header className="screen-only sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition mr-1"
              title="กลับสู่แดชบอร์ดหลัก"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl text-white shadow-sm">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-800 hidden sm:block">
                  SWPC Healthcare
                </span>
                <span className="text-xs text-slate-500 font-medium block">
                  ระบบรายงานความคลาดเคลื่อนทางยา (ME)
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
                  isPharmacist 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : 'bg-teal-100 text-teal-800 border border-teal-200'
                }`}>
                  {isPharmacist ? 'เภสัชกร / Admin' : 'เจ้าหน้าที่ รพ.สต.'}
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

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <MEDashboard
          initialRecords={records}
          currentUserId={user?.id}
          userRole={role}
          fullName={fullName}
          hospitalName={hospitalName}
          isPharmacist={isPharmacist}
        />
      </main>
    </div>
  );
}
