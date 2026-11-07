'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface UpdateCriteriaState {
  success?: boolean;
  error?: string;
  message?: string;
}

export async function updateCriteriaKnowledgeBase(
  criteriaId: string,
  knowledgeBase: string
): Promise<UpdateCriteriaState> {
  try {
    const supabase = await createClient();

    // 1. Get current logged in user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
    }

    // 2. Fetch user profile to verify pharmacist role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status, email')
      .eq('id', user.id)
      .single();

    const isNetworkAdmin = (profile?.email || user.email || '').trim().toLowerCase() === 'swpc.pharmacy@gmail.com';
    const isPharmacist = isNetworkAdmin || (profile?.role === 'pharmacist' && profile?.status === 'approved');

    if (!isPharmacist) {
      return { 
        success: false, 
        error: 'สิทธิ์ไม่เพียงพอ: เฉพาะบทบาทเภสัชกร/ผู้ดูแลระบบเท่านั้นที่สามารถแก้ไขแนวทางเกณฑ์ประเมินได้' 
      };
    }

    // 3. Update evaluation criteria
    const { error: updateError } = await supabase
      .from('evaluation_criteria')
      .update({
        knowledge_base: knowledgeBase,
        last_updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', criteriaId);

    if (updateError) {
      console.error('Error updating evaluation criteria:', updateError);
      return { success: false, error: `ไม่สามารถบันทึกข้อมูลได้: ${updateError.message}` };
    }

    revalidatePath('/criteria');
    revalidatePath('/dashboard');
    return { success: true, message: 'บันทึกแนวทางปฏิบัติเกณฑ์มาตรฐานเรียบร้อยแล้ว' };
  } catch (err: any) {
    console.error('Unexpected error updating criteria:', err);
    return { success: false, error: err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ' };
  }
}
