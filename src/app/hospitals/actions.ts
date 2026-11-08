'use server';

import { createClient } from '@/lib/supabase/server';
import { HOSPITALS, HospitalOption } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

export interface HospitalWithPharmacist {
  id: string;
  name: string;
  code?: string | null;
  unit_type?: 'hospital' | 'pcc' | 'pcu' | 'sso' | 'other' | string;
  responsible_pharmacist_id?: string | null;
  responsible_pharmacist?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  is_active: boolean;
  display_order: number;
}

/**
 * ดึงรายชื่อ รพ.สต. ทั้งหมด (พร้อมข้อมูลเภสัชกรผู้รับผิดชอบ)
 * มีระบบ Fallback ไปใช้ค่า Default ใน constants หากยังไม่ได้รัน SQL migration
 */
export async function getHospitalsAction(): Promise<{
  success: boolean;
  data: HospitalWithPharmacist[];
  isFallback?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('hospitals')
      .select(`
        id,
        name,
        code,
        unit_type,
        responsible_pharmacist_id,
        responsible_pharmacist_name,
        is_active,
        display_order,
        responsible_pharmacist:profiles!hospitals_responsible_pharmacist_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      // Fallback to default constants
      const fallbackList: HospitalWithPharmacist[] = HOSPITALS.map((h, idx) => ({
        id: h.id,
        name: h.name,
        code: h.code || h.id,
        unit_type: h.unit_type || 'pcu',
        responsible_pharmacist_id: null,
        responsible_pharmacist: null,
        is_active: true,
        display_order: idx + 1,
      }));

      return {
        success: true,
        data: fallbackList,
        isFallback: true,
        error: error?.message,
      };
    }

    // Format query response
    const formatted: HospitalWithPharmacist[] = data.map((item: any) => {
      const pharmFromJoin = Array.isArray(item.responsible_pharmacist)
        ? item.responsible_pharmacist[0]
        : item.responsible_pharmacist;

      const pharmName = item.responsible_pharmacist_name || pharmFromJoin?.full_name || null;

      return {
        id: item.id,
        name: item.name,
        code: item.code,
        unit_type: item.unit_type || 'pcu',
        responsible_pharmacist_id: item.responsible_pharmacist_id,
        responsible_pharmacist: pharmName
          ? {
              id: item.responsible_pharmacist_id || pharmFromJoin?.id || '',
              full_name: pharmName,
              email: pharmFromJoin?.email || '',
            }
          : null,
        is_active: item.is_active ?? true,
        display_order: item.display_order ?? 0,
      };
    });

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error('getHospitalsAction error:', err);
    return {
      success: false,
      data: HOSPITALS.map((h, idx) => ({
        id: h.id,
        name: h.name,
        code: h.code || h.id,
        unit_type: h.unit_type || 'pcu',
        responsible_pharmacist_id: null,
        responsible_pharmacist: null,
        is_active: true,
        display_order: idx + 1,
      })),
      isFallback: true,
      error: err.message || 'เกิดข้อผิดพลาดในการโหลดรายชื่อ รพ.สต.',
    };
  }
}

/**
 * ตรวจสอบสิทธิ์ผู้ดูแลระบบ/เภสัชกร
 */
async function verifyPharmacistAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false, error: 'กรุณาเข้าสู่ระบบก่อน' };

  if (user.email?.toLowerCase() === 'swpc.pharmacy@gmail.com') {
    return { allowed: true, user };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'pharmacist' || profile?.status !== 'approved') {
    return { allowed: false, error: 'คุณไม่มีสิทธิ์ในการจัดการข้อมูล รพ.สต. (เฉพาะเภสัชกร/Admin)' };
  }

  return { allowed: true, user };
}

function formatHospError(err: any): string {
  if (err?.message?.includes('schema cache') || err?.message?.includes('public.hospitals')) {
    return 'ยังไม่ได้สร้างตาราง "hospitals" ในฐานข้อมูล Supabase กรุณานำไฟล์ supabase_hospitals_and_admin_rpc.sql ไปกด Run ใน Supabase SQL Editor ก่อน';
  }
  if (err?.code === '23505') {
    return 'มีชื่อ รพ.สต. นี้อยู่ในระบบแล้ว';
  }
  return err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
}

/**
 * เพิ่ม รพ.สต. ใหม่
 */
export async function createHospitalAction(data: {
  name: string;
  code?: string;
  unitType?: string;
  responsiblePharmacistId?: string | null;
  displayOrder?: number;
}) {
  const supabase = await createClient();
  const authCheck = await verifyPharmacistAdmin(supabase);
  if (!authCheck.allowed) return { success: false, error: authCheck.error };

  const trimmedName = data.name.trim();
  if (!trimmedName) {
    return { success: false, error: 'กรุณากรอกชื่อหน่วยบริการ' };
  }

  let pharmName: string | null = null;
  if (data.responsiblePharmacistId) {
    const { data: pharmProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.responsiblePharmacistId)
      .single();
    pharmName = pharmProfile?.full_name || null;
  }

  const { error } = await supabase.from('hospitals').insert({
    name: trimmedName,
    code: data.code?.trim() || null,
    unit_type: data.unitType || 'pcu',
    responsible_pharmacist_id: data.responsiblePharmacistId || null,
    responsible_pharmacist_name: pharmName,
    display_order: data.displayOrder ?? 50,
    is_active: true,
  });

  if (error) {
    return { success: false, error: formatHospError(error) };
  }

  revalidatePath('/dashboard');
  revalidatePath('/me');
  return { success: true };
}

/**
 * แก้ไขชื่อหน่วยบริการ, รหัส, ประเภท, หรือเภสัชกรผู้รับผิดชอบ
 */
export async function updateHospitalAction(
  hospitalId: string,
  data: {
    name: string;
    code?: string;
    unitType?: string;
    responsiblePharmacistId?: string | null;
    isActive?: boolean;
    displayOrder?: number;
    oldName?: string;
  }
) {
  const supabase = await createClient();
  const authCheck = await verifyPharmacistAdmin(supabase);
  if (!authCheck.allowed) return { success: false, error: authCheck.error };

  const trimmedName = data.name.trim();
  if (!trimmedName) {
    return { success: false, error: 'กรุณากรอกชื่อหน่วยบริการ' };
  }

  let pharmName: string | null = null;
  if (data.responsiblePharmacistId) {
    const { data: pharmProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.responsiblePharmacistId)
      .single();
    pharmName = pharmProfile?.full_name || null;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hospitalId);

  let updateQuery = supabase
    .from('hospitals')
    .update({
      name: trimmedName,
      code: data.code?.trim() || null,
      unit_type: data.unitType || 'pcu',
      responsible_pharmacist_id: data.responsiblePharmacistId || null,
      responsible_pharmacist_name: pharmName,
      is_active: data.isActive ?? true,
      display_order: data.displayOrder ?? 0,
      updated_at: new Date().toISOString(),
    });

  if (isUuid) {
    updateQuery = updateQuery.eq('id', hospitalId);
  } else {
    const cleanCode = hospitalId.replace(/^pcu_|^pcc_|^hosp_/, '');
    updateQuery = updateQuery.or(`code.eq.${cleanCode},code.eq.${hospitalId},name.eq.${data.oldName || trimmedName}`);
  }

  const { error } = await updateQuery;

  if (error) {
    return { success: false, error: formatHospError(error) };
  }

  // หากมีการเปลี่ยนชื่อ ให้อัปเดตชื่อใน profiles ของผู้ใช้ที่เคยผูกกับชื่อเดิมด้วย
  if (data.oldName && data.oldName !== trimmedName) {
    await supabase
      .from('profiles')
      .update({ hospital_name: trimmedName })
      .eq('hospital_name', data.oldName);
  }

  revalidatePath('/dashboard');
  revalidatePath('/me');
  return { success: true };
}

/**
 * สลับสถานะเปิด/ปิดการใช้งาน รพ.สต. (Soft delete)
 */
export async function toggleHospitalActiveAction(hospitalId: string, isActive: boolean) {
  const supabase = await createClient();
  const authCheck = await verifyPharmacistAdmin(supabase);
  if (!authCheck.allowed) return { success: false, error: authCheck.error };

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hospitalId);
  let toggleQuery = supabase
    .from('hospitals')
    .update({ is_active: isActive, updated_at: new Date().toISOString() });

  if (isUuid) {
    toggleQuery = toggleQuery.eq('id', hospitalId);
  } else {
    const cleanCode = hospitalId.replace(/^pcu_|^pcc_|^hosp_/, '');
    toggleQuery = toggleQuery.or(`code.eq.${cleanCode},code.eq.${hospitalId}`);
  }

  const { error } = await toggleQuery;

  if (error) {
    return { success: false, error: formatHospError(error) };
  }

  revalidatePath('/dashboard');
  revalidatePath('/me');
  return { success: true };
}

/**
 * ลบ รพ.สต. (ตรวจสอบการผูกข้อมูลก่อนลบจริง)
 */
export async function deleteHospitalAction(hospitalId: string, hospitalName: string) {
  const supabase = await createClient();
  const authCheck = await verifyPharmacistAdmin(supabase);
  if (!authCheck.allowed) return { success: false, error: authCheck.error };

  // ตรวจสอบว่ามีผู้ใช้หรือรายงาน ME ผูกอยู่หรือไม่
  const [{ count: userCount }, { count: meCount }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_name', hospitalName),
    supabase
      .from('medication_errors')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_name', hospitalName),
  ]);

  if ((userCount && userCount > 0) || (meCount && meCount > 0)) {
    return {
      success: false,
      error: `ไม่สามารถลบถาวรได้ เนื่องจากมีผู้ใช้งาน ${userCount || 0} คน และรายงาน ME ${meCount || 0} รายการ ผูกอยู่กับ รพ.สต. นี้ แนะนำให้ใช้การ 'ปิดการใช้งาน' แทน`,
    };
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hospitalId);
  let deleteQuery = supabase.from('hospitals').delete();
  if (isUuid) {
    deleteQuery = deleteQuery.eq('id', hospitalId);
  } else {
    deleteQuery = deleteQuery.eq('name', hospitalName);
  }

  const { error } = await deleteQuery;
  if (error) {
    return { success: false, error: formatHospError(error) };
  }

  revalidatePath('/dashboard');
  revalidatePath('/me');
  return { success: true };
}
