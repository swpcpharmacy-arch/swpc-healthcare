'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { MEStage, MESeverityLevel } from '@/lib/constants/me';

export interface MEActionState {
  success?: boolean;
  error?: string;
  message?: string;
}

export async function createMedicationErrorAction(
  prevState: MEActionState | null,
  formData: FormData
): Promise<MEActionState> {
  try {
    const supabase = await createClient();

    // 1. Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการบันทึกข้อมูล' };
    }

    // 2. Extract fields from formData
    const reportDate = formData.get('report_date') as string;
    const patientHn = (formData.get('patient_hn') as string)?.trim() || null;
    const drugName = (formData.get('drug_name') as string)?.trim() || null;
    const errorType = formData.get('error_type') as MEStage;
    const severity = formData.get('severity') as MESeverityLevel;
    const contributingFactor = (formData.get('contributing_factor') as string)?.trim() || null;
    const description = (formData.get('description') as string)?.trim();
    const actionsTaken = (formData.get('actions_taken') as string)?.trim() || null;

    // 3. Validation
    if (!reportDate) {
      return { success: false, error: 'กรุณาระบุวันที่เกิดอุบัติการณ์' };
    }
    if (!errorType) {
      return { success: false, error: 'กรุณาเลือกขั้นตอนที่เกิดความคลาดเคลื่อน' };
    }
    if (!severity) {
      return { success: false, error: 'กรุณาเลือกระดับความรุนแรง (A - I)' };
    }
    if (!description || description.length < 5) {
      return { success: false, error: 'กรุณากรอกรายละเอียดเหตุการณ์อย่างน้อย 5 ตัวอักษร' };
    }

    // 4. Insert into database
    const { error: insertError } = await supabase
      .from('medication_errors')
      .insert({
        reporter_id: user.id,
        report_date: reportDate,
        patient_hn: patientHn,
        drug_name: drugName,
        error_type: errorType,
        severity: severity,
        contributing_factor: contributingFactor,
        description: description,
        actions_taken: actionsTaken,
      });

    if (insertError) {
      console.error('Error inserting medication error:', insertError);
      return {
        success: false,
        error: `เกิดข้อผิดพลาดในการบันทึก: ${insertError.message}`,
      };
    }

    revalidatePath('/me');
    revalidatePath('/dashboard');
    return {
      success: true,
      message: 'บันทึกรายงานความคลาดเคลื่อนทางยาสำเร็จเรียบร้อย',
    };
  } catch (err: any) {
    console.error('Unexpected error in createMedicationErrorAction:', err);
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง',
    };
  }
}

export async function deleteMedicationErrorAction(errorId: string): Promise<MEActionState> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
    }

    const { error: deleteError } = await supabase
      .from('medication_errors')
      .delete()
      .eq('id', errorId);

    if (deleteError) {
      console.error('Error deleting medication error:', deleteError);
      return { success: false, error: deleteError.message };
    }

    revalidatePath('/me');
    revalidatePath('/dashboard');
    return { success: true, message: 'ลบรายการอุบัติการณ์เรียบร้อยแล้ว' };
  } catch (err: any) {
    console.error('Unexpected error in deleteMedicationErrorAction:', err);
    return { success: false, error: 'ไม่สามารถลบรายการได้' };
  }
}
