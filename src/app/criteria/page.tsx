import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { 
  Activity, 
  Building2, 
  LogOut, 
  ArrowLeft 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from '@/app/auth/actions';
import CriteriaDashboard from '@/components/criteria/CriteriaDashboard';
import { CriteriaItem } from '@/components/criteria/CriteriaDetailModal';
import { DEFAULT_CRITERIA_DATA } from '@/lib/data/defaultCriteriaData';

export const dynamic = 'force-dynamic';

export default async function CriteriaPage() {
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

  // Fetch criteria from Supabase
  let criteriaItems: CriteriaItem[] = [];
  const { data: criteriaData, error: criteriaError } = await supabase
    .from('evaluation_criteria')
    .select('*')
    .order('category', { ascending: true })
    .order('title', { ascending: true });

  if (!criteriaError && criteriaData && criteriaData.length > 0) {
    criteriaItems = criteriaData.map((item: any) => ({
      id: item.id,
      category: item.category,
      title: item.title,
      points_possible: item.points_possible,
      knowledge_base: item.knowledge_base || DEFAULT_CRITERIA_DATA[item.title]?.knowledge_base || null,
      updated_at: item.updated_at,
      last_updated_by: item.last_updated_by,
    }));
  } else {
    // Fallback if table is not yet seeded
    criteriaItems = Object.entries(DEFAULT_CRITERIA_DATA).map(([title, item], idx) => ({
      id: `default-${idx + 1}`,
      category: item.category,
      title: item.title,
      points_possible: item.points_possible,
      knowledge_base: item.knowledge_base,
    }));
  }

  // Sort criteria so Pharmacy (64 points) comes first, followed by Consumer Protection (18 points)
  criteriaItems.sort((a, b) => {
    const aIsPharmacy = a.category.includes('เภสัชกรรม');
    const bIsPharmacy = b.category.includes('เภสัชกรรม');
    if (aIsPharmacy && !bIsPharmacy) return -1;
    if (!aIsPharmacy && bIsPharmacy) return 1;
    const aOrder = DEFAULT_CRITERIA_DATA[a.title]?.order || 99;
    const bOrder = DEFAULT_CRITERIA_DATA[b.title]?.order || 99;
    return aOrder - bOrder;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-emerald-50/30">
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
                  เกณฑ์การประเมินส่วนที่ 7 (64 + 18 คะแนน)
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        <CriteriaDashboard
          initialCriteria={criteriaItems}
          isPharmacist={isPharmacist}
          userHospital={hospitalName}
          userFullName={fullName}
        />
      </main>
    </div>
  );
}
