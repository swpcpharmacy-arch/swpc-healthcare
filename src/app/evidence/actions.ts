'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { EvidenceDocument, EvidenceStatus } from '@/lib/constants/evidence';
import { EVIDENCE_CRITERIA_GROUPS } from '@/lib/data/evidenceChecklistData';

export interface EvidenceActionState {
  success?: boolean;
  error?: string;
  message?: string;
}

/**
 * Fetch all evidence documents for a specific hospital and fiscal year
 */
export async function getEvidenceDocumentsAction(
  hospitalName: string,
  fiscalYear: number
): Promise<{ data: EvidenceDocument[]; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: [], error: 'กรุณาเข้าสู่ระบบก่อนดูข้อมูล' };
    }

    const { data, error } = await supabase
      .from('evidence_documents')
      .select('*')
      .eq('hospital_name', hospitalName)
      .eq('fiscal_year', fiscalYear);

    if (error) {
      console.error('Error fetching evidence documents:', error);
      return { data: [], error: error.message };
    }

    return { data: (data as EvidenceDocument[]) || [] };
  } catch (err: any) {
    console.error('Unexpected error fetching evidence:', err);
    return { data: [], error: err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล' };
  }
}

/**
 * Save or update a single evidence item (Google Drive Link)
 */
export async function upsertEvidenceAction(
  prevState: EvidenceActionState | null,
  formData: FormData
): Promise<EvidenceActionState> {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
    }

    // 2. Profile & role check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, hospital_name, email, status')
      .eq('id', user.id)
      .single();

    const isNetworkAdmin = (profile?.email || user.email || '').trim().toLowerCase() === 'swpc.pharmacy@gmail.com';
    const isPharmacist = isNetworkAdmin || (profile?.role === 'pharmacist' && profile?.status === 'approved');

    // 3. Extract inputs
    const hospitalName = (formData.get('hospital_name') as string)?.trim();
    const fiscalYear = parseInt(formData.get('fiscal_year') as string, 10) || 2568;
    const checklistItemKey = (formData.get('checklist_item_key') as string)?.trim();
    const checklistItemTitle = (formData.get('checklist_item_title') as string)?.trim();
    const documentLink = (formData.get('document_link') as string)?.trim();
    const notes = (formData.get('notes') as string)?.trim() || null;
    const criteriaId = (formData.get('criteria_id') as string)?.trim() || null;

    if (!hospitalName) {
      return { success: false, error: 'กรุณาระบุชื่อหน่วยบริการ (รพ.สต.)' };
    }

    // Staff cannot edit other hospitals
    if (!isPharmacist && profile?.hospital_name && profile.hospital_name !== hospitalName) {
      return { success: false, error: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลของหน่วยบริการอื่น' };
    }

    if (!checklistItemKey || !checklistItemTitle) {
      return { success: false, error: 'ข้อมูลหัวข้อหลักฐานไม่ครบถ้วน' };
    }

    if (!documentLink) {
      return { success: false, error: 'กรุณากรอกลิงก์ Google Drive ของเอกสารหลักฐาน' };
    }

    // Validate URL format
    try {
      const parsedUrl = new URL(documentLink);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { success: false, error: 'ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://' };
      }
    } catch {
      return { success: false, error: 'รูปแบบ URL ไม่ถูกต้อง กรุณาคัดลอกลิงก์จากแถบเบราว์เซอร์หรือปุ่มแชร์ของ Google Drive' };
    }

    // 4. Perform Upsert
    const payload: any = {
      hospital_name: hospitalName,
      fiscal_year: fiscalYear,
      checklist_item_key: checklistItemKey,
      checklist_item_title: checklistItemTitle,
      document_link: documentLink,
      notes: notes,
      status: 'submitted',
      last_updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    if (criteriaId) {
      payload.criteria_id = criteriaId;
    }

    // Check if record exists
    const { data: existing } = await supabase
      .from('evidence_documents')
      .select('id, staff_id')
      .eq('hospital_name', hospitalName)
      .eq('fiscal_year', fiscalYear)
      .eq('checklist_item_key', checklistItemKey)
      .maybeSingle();

    let resultError = null;

    if (existing) {
      // Update existing record
      const { error: updateErr } = await supabase
        .from('evidence_documents')
        .update(payload)
        .eq('id', existing.id);
      resultError = updateErr;
    } else {
      // Insert new record
      payload.staff_id = user.id;
      const { error: insertErr } = await supabase
        .from('evidence_documents')
        .insert(payload);
      resultError = insertErr;
    }

    if (resultError) {
      console.error('Error upserting evidence document:', resultError);
      return { success: false, error: `ไม่สามารถบันทึกข้อมูลได้: ${resultError.message}` };
    }

    revalidatePath('/evidence');
    return { success: true, message: 'บันทึกหลักฐานเรียบร้อยแล้ว' };
  } catch (err: any) {
    console.error('Unexpected error in upsertEvidenceAction:', err);
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
  }
}

/**
 * Batch apply a single Google Drive folder link to all items in a criteria group
 */
export async function batchUpsertFolderAction(
  hospitalName: string,
  fiscalYear: number,
  criteriaGroupId: string,
  folderUrl: string,
  notes?: string
): Promise<EvidenceActionState> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, hospital_name, email, status')
      .eq('id', user.id)
      .single();

    const isNetworkAdmin = (profile?.email || user.email || '').trim().toLowerCase() === 'swpc.pharmacy@gmail.com';
    const isPharmacist = isNetworkAdmin || (profile?.role === 'pharmacist' && profile?.status === 'approved');

    if (!isPharmacist && profile?.hospital_name && profile.hospital_name !== hospitalName) {
      return { success: false, error: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลของหน่วยบริการอื่น' };
    }

    const trimmedUrl = folderUrl?.trim();
    if (!trimmedUrl) {
      return { success: false, error: 'กรุณากรอกลิงก์ Google Drive Folder' };
    }

    try {
      new URL(trimmedUrl);
    } catch {
      return { success: false, error: 'รูปแบบ URL ไม่ถูกต้อง' };
    }

    const group = EVIDENCE_CRITERIA_GROUPS.find((g) => g.id === criteriaGroupId);
    if (!group) {
      return { success: false, error: 'ไม่พบหมวดหมู่เกณฑ์ที่ระบุ' };
    }

    // Save folder link for each item in this group
    for (const item of group.items) {
      const { data: existing } = await supabase
        .from('evidence_documents')
        .select('id')
        .eq('hospital_name', hospitalName)
        .eq('fiscal_year', fiscalYear)
        .eq('checklist_item_key', item.key)
        .maybeSingle();

      const payload: any = {
        hospital_name: hospitalName,
        fiscal_year: fiscalYear,
        checklist_item_key: item.key,
        checklist_item_title: item.title,
        document_link: trimmedUrl,
        notes: notes ? `${notes} (โฟลเดอร์รวม)` : 'แนบโฟลเดอร์รวม Google Drive',
        status: 'submitted',
        last_updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from('evidence_documents').update(payload).eq('id', existing.id);
      } else {
        payload.staff_id = user.id;
        await supabase.from('evidence_documents').insert(payload);
      }
    }

    revalidatePath('/evidence');
    return { success: true, message: `อัปเดตลิงก์โฟลเดอร์สำหรับทุกรายการใน "${group.title}" เรียบร้อยแล้ว` };
  } catch (err: any) {
    console.error('Error in batchUpsertFolderAction:', err);
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการบันทึกโฟลเดอร์' };
  }
}

/**
 * Delete an evidence item
 */
export async function deleteEvidenceAction(id: string): Promise<EvidenceActionState> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, hospital_name, email, status')
      .eq('id', user.id)
      .single();

    const isNetworkAdmin = (profile?.email || user.email || '').trim().toLowerCase() === 'swpc.pharmacy@gmail.com';
    const isPharmacist = isNetworkAdmin || (profile?.role === 'pharmacist' && profile?.status === 'approved');

    // Fetch evidence record to check ownership
    const { data: evidence } = await supabase
      .from('evidence_documents')
      .select('staff_id, hospital_name')
      .eq('id', id)
      .single();

    if (!evidence) {
      return { success: false, error: 'ไม่พบรายการหลักฐานที่ต้องการลบ' };
    }

    if (!isPharmacist && evidence.hospital_name !== profile?.hospital_name && evidence.staff_id !== user.id) {
      return { success: false, error: 'คุณไม่มีสิทธิ์ลบรายการนี้' };
    }

    const { error: deleteErr } = await supabase
      .from('evidence_documents')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      return { success: false, error: `ไม่สามารถลบข้อมูลได้: ${deleteErr.message}` };
    }

    revalidatePath('/evidence');
    return { success: true, message: 'ลบรายการหลักฐานเรียบร้อยแล้ว' };
  } catch (err: any) {
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการลบ' };
  }
}

/**
 * Review/audit an evidence item by pharmacist
 */
export async function reviewEvidenceAction(
  evidenceId: string,
  status: EvidenceStatus,
  reviewComment?: string
): Promise<EvidenceActionState> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email, status')
      .eq('id', user.id)
      .single();

    const isNetworkAdmin = (profile?.email || user.email || '').trim().toLowerCase() === 'swpc.pharmacy@gmail.com';
    const isPharmacist = isNetworkAdmin || (profile?.role === 'pharmacist' && profile?.status === 'approved');

    if (!isPharmacist) {
      return { success: false, error: 'เฉพาะเภสัชกรหรือผู้ดูแลระบบเท่านั้นที่สามารถตรวจรับรองหลักฐานได้' };
    }

    const { error: updateErr } = await supabase
      .from('evidence_documents')
      .update({
        status: status,
        review_comment: reviewComment?.trim() || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', evidenceId);

    if (updateErr) {
      return { success: false, error: `ไม่สามารถบันทึกผลการตรวจได้: ${updateErr.message}` };
    }

    revalidatePath('/evidence');
    return { success: true, message: 'บันทึกผลการตรวจนิเทศเรียบร้อยแล้ว' };
  } catch (err: any) {
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการตรวจรับรอง' };
  }
}
