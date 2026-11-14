import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getHospitalsAction } from '@/app/hospitals/actions';
import { getEvidenceDocumentsAction } from '@/app/evidence/actions';
import EvidenceDashboard from '@/components/evidence/EvidenceDashboard';
import { DEFAULT_FISCAL_YEAR } from '@/lib/constants/evidence';

export const dynamic = 'force-dynamic';

export default async function EvidencePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect if not logged in
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

  // If user is not yet approved (and not the network admin), strictly redirect to pending screen
  if (!isNetworkAdmin && (!profile || profile.status !== 'approved')) {
    redirect('/pending-approval');
  }

  const role = isNetworkAdmin ? 'pharmacist' : (profile?.role || user?.user_metadata?.role || 'staff');
  const isPharmacist = role === 'pharmacist';
  const fullName = profile?.full_name || user?.user_metadata?.full_name || email.split('@')[0] || 'บุคลากรสาธารณสุข';
  const hospitalName = profile?.hospital_name || user?.user_metadata?.hospital_name || 'รพ.สต.บ้านสวน';

  // Fetch all hospitals
  const hospRes = await getHospitalsAction();
  const allHospitals = (hospRes.data || []).map((h) => ({ id: h.id, name: h.name }));

  // Determine which hospital to load initially
  const targetHospital = isPharmacist ? (allHospitals[0]?.name || hospitalName) : hospitalName;

  // Fetch initial evidence documents
  const evidenceRes = await getEvidenceDocumentsAction(targetHospital, DEFAULT_FISCAL_YEAR);
  const initialEvidence = evidenceRes.data || [];

  return (
    <EvidenceDashboard
      initialHospitals={allHospitals}
      userHospital={hospitalName}
      userRole={role}
      userFullName={fullName}
      isPharmacist={isPharmacist}
      initialEvidence={initialEvidence}
    />
  );
}
