import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUnsafeProductsAction } from '@/app/unsafe-products/actions';
import UnsafeProductsDashboard from '@/components/unsafe-products/UnsafeProductsDashboard';

export const dynamic = 'force-dynamic';

export default async function UnsafeProductsPage() {
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

  // Fetch unsafe products records
  const { data: records, isMock } = await getUnsafeProductsAction();

  return (
    <UnsafeProductsDashboard
      initialRecords={records}
      isPharmacist={isPharmacist}
      currentUser={{
        id: user?.id || 'demo-user',
        fullName,
        hospitalName,
        role,
      }}
      isMock={isMock}
    />
  );
}
