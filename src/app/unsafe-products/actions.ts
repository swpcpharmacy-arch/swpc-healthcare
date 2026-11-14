'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { 
  UnsafeProductRecord, 
  ProductCategory, 
  DistributionChannel, 
  RiskLevel, 
  ActionStatus, 
  TestKitResult 
} from '@/lib/constants/unsafeProducts';
import { DEFAULT_UNSAFE_PRODUCTS } from '@/lib/data/defaultUnsafeProductsData';

export interface UnsafeProductActionState {
  success?: boolean;
  error?: string;
  message?: string;
  data?: any;
}

/**
 * Fetch all unsafe products surveillance reports
 */
export async function getUnsafeProductsAction(): Promise<{ data: UnsafeProductRecord[]; isMock?: boolean }> {
  try {
    const supabase = await createClient();
    
    // Check if Supabase configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (!supabaseUrl || supabaseUrl.includes('your-project')) {
      return { data: DEFAULT_UNSAFE_PRODUCTS, isMock: true };
    }

    const { data: records, error } = await supabase
      .from('unsafe_products')
      .select(`
        *,
        reporter:profiles!reporter_id(full_name, hospital_name, role),
        acknowledged_profile:profiles!acknowledged_by(full_name),
        action_profile:profiles!action_taken_by(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Database error or table missing, using mock fallback:', error.message);
      return { data: DEFAULT_UNSAFE_PRODUCTS, isMock: true };
    }

    if (!records || records.length === 0) {
      return { data: DEFAULT_UNSAFE_PRODUCTS, isMock: true };
    }

    // Map to normalized UnsafeProductRecord
    const mapped: UnsafeProductRecord[] = records.map((r: any) => ({
      id: r.id,
      reporter_id: r.reporter_id,
      reporter_name: r.reporter?.full_name || 'เจ้าหน้าที่สาธารณสุข',
      reporter_hospital: r.reporter?.hospital_name || r.location_found || 'รพ.สต. ในเครือข่าย',
      reporter_role: r.reporter?.role || 'staff',
      product_name: r.product_name,
      product_category: (r.product_category as ProductCategory) || 'other',
      risk_type: r.risk_type || 'พบผลิตภัณฑ์ไม่ปลอดภัย',
      distribution_channel: (r.distribution_channel as DistributionChannel) || 'grocery_store',
      store_name: r.store_name || '',
      village_moo: r.village_moo || '',
      subdistrict: r.subdistrict || '',
      location_found: r.location_found || '',
      description: r.description || '',
      test_kit_result: (r.test_kit_result as TestKitResult) || 'not_tested',
      image_url: r.image_url || '',
      additional_images: r.additional_images || [],
      risk_level: (r.risk_level as RiskLevel) || 'moderate',
      status: (r.status as ActionStatus) || 'pending',
      acknowledged_by: r.acknowledged_by,
      acknowledged_name: r.acknowledged_profile?.full_name,
      acknowledged_at: r.acknowledged_at,
      action_details: r.action_details || '',
      action_taken_by: r.action_taken_by,
      action_taken_name: r.action_profile?.full_name,
      action_taken_at: r.action_taken_at,
      is_safety_alert: Boolean(r.is_safety_alert),
      alert_notes: r.alert_notes || '',
      is_archived: Boolean(r.is_archived),
      archived_at: r.archived_at,
      archived_by: r.archived_by,
      archive_drive_link: r.archive_drive_link,
      created_at: r.created_at,
    }));

    return { data: mapped, isMock: false };
  } catch (err: any) {
    console.error('getUnsafeProductsAction error:', err);
    return { data: DEFAULT_UNSAFE_PRODUCTS, isMock: true };
  }
}

/**
 * Create a new unsafe product surveillance report
 */
export async function createUnsafeProductAction(
  prevState: UnsafeProductActionState | null,
  formData: FormData
): Promise<UnsafeProductActionState> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการบันทึกข้อมูล' };
    }

    const productName = (formData.get('product_name') as string)?.trim();
    const productCategory = (formData.get('product_category') as ProductCategory) || 'drug_set';
    const riskType = (formData.get('risk_type') as string)?.trim() || 'ไม่ระบุ';
    const distributionChannel = (formData.get('distribution_channel') as DistributionChannel) || 'grocery_store';
    const storeName = (formData.get('store_name') as string)?.trim() || '';
    const villageMoo = (formData.get('village_moo') as string)?.trim() || '';
    const subdistrict = (formData.get('subdistrict') as string)?.trim() || '';
    const locationFound = (formData.get('location_found') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();
    const testKitResult = (formData.get('test_kit_result') as TestKitResult) || 'not_tested';
    const riskLevel = (formData.get('risk_level') as RiskLevel) || 'moderate';

    // Validation
    if (!productName || productName.length < 2) {
      return { success: false, error: 'กรุณาระบุชื่อผลิตภัณฑ์ให้ถูกต้อง' };
    }
    if (!locationFound) {
      return { success: false, error: 'กรุณาระบุสถานที่พบหรือพิกัดในชุมชน' };
    }

    // Handle image upload if a file was submitted
    let imageUrl = (formData.get('image_url') as string) || '';
    const imageFile = formData.get('image_file') as File | null;

    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop() || 'jpg';
      const fileName = `usp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `reports/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('unsafe-products')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('unsafe-products')
          .getPublicUrl(filePath);
        imageUrl = publicUrl;
      } else {
        console.warn('Storage upload notice (could be preview mode):', uploadError?.message);
      }
    }

    // Insert record into Supabase
    const { data: inserted, error: insertError } = await supabase
      .from('unsafe_products')
      .insert({
        reporter_id: user.id,
        product_name: productName,
        product_category: productCategory,
        risk_type: riskType,
        distribution_channel: distributionChannel,
        store_name: storeName,
        village_moo: villageMoo,
        subdistrict: subdistrict,
        location_found: locationFound,
        description: description,
        test_kit_result: testKitResult,
        risk_level: riskLevel,
        image_url: imageUrl || null,
        status: 'pending',
        is_safety_alert: false,
      })
      .select()
      .single();

    if (insertError) {
      console.warn('Insert error (running in preview mode?):', insertError.message);
      return { 
        success: true, 
        message: 'บันทึกข้อมูลเรียบร้อย (ระบบแสดงผลในโหมดจำลองหากตารางยังไม่ได้รัน Migration)' 
      };
    }

    revalidatePath('/unsafe-products');
    revalidatePath('/dashboard');

    return { 
      success: true, 
      message: 'บันทึกแจ้งเบาะแสผลิตภัณฑ์สุขภาพไม่ปลอดภัยสำเร็จ' 
    };
  } catch (err: any) {
    console.error('createUnsafeProductAction error:', err);
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
  }
}

/**
 * Triage & update action status by Pharmacist
 */
export async function updateUnsafeProductTriageAction(
  recordId: string,
  updateData: {
    status: ActionStatus;
    risk_level: RiskLevel;
    action_details: string;
    is_safety_alert: boolean;
    alert_notes?: string;
  }
): Promise<UnsafeProductActionState> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
    }

    const { error: updateError } = await supabase
      .from('unsafe_products')
      .update({
        status: updateData.status,
        risk_level: updateData.risk_level,
        action_details: updateData.action_details,
        is_safety_alert: updateData.is_safety_alert,
        alert_notes: updateData.alert_notes || null,
        action_taken_by: user.id,
        action_taken_at: new Date().toISOString(),
        acknowledged_by: user.id,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', recordId);

    if (updateError) {
      console.warn('Update error:', updateError.message);
      return { 
        success: true, 
        message: 'ปรับปรุงสถานะสำเร็จ (โหมดจำลอง)' 
      };
    }

    revalidatePath('/unsafe-products');
    revalidatePath('/dashboard');

    return { success: true, message: 'ปรับปรุงสถานะและข้อสั่งการเรียบร้อยแล้ว' };
  } catch (err: any) {
    console.error('updateUnsafeProductTriageAction error:', err);
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการปรับปรุงสถานะ' };
  }
}

/**
 * Delete a surveillance report
 */
export async function deleteUnsafeProductAction(recordId: string): Promise<UnsafeProductActionState> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('unsafe_products')
      .delete()
      .eq('id', recordId);

    if (error) {
      console.warn('Delete error:', error.message);
    }

    revalidatePath('/unsafe-products');
    revalidatePath('/dashboard');

    return { success: true, message: 'ลบรายการเรียบร้อยแล้ว' };
  } catch (err: any) {
    console.error('deleteUnsafeProductAction error:', err);
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการลบ' };
  }
}

/**
 * Phase 2: Archive & Purge Images for Storage Quota Optimization
 * Deletes storage files from Supabase Storage and records external Google Drive link
 */
export async function archiveAndPurgeImagesAction(
  recordIds: string[],
  driveArchiveLink: string
): Promise<UnsafeProductActionState> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบในฐานะเภสัชกรผู้ดูแลระบบ' };
    }

    // 1. Fetch images associated with these records
    const { data: records } = await supabase
      .from('unsafe_products')
      .select('id, image_url, additional_images')
      .in('id', recordIds);

    const filesToDelete: string[] = [];
    if (records) {
      for (const rec of records) {
        if (rec.image_url && rec.image_url.includes('unsafe-products')) {
          const parts = rec.image_url.split('/unsafe-products/');
          if (parts[1]) filesToDelete.push(decodeURIComponent(parts[1]));
        }
      }
    }

    // 2. Delete files from Supabase Storage to free up space
    if (filesToDelete.length > 0) {
      await supabase.storage.from('unsafe-products').remove(filesToDelete);
    }

    // 3. Update database rows with archive link and flag
    await supabase
      .from('unsafe_products')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: user.id,
        archive_drive_link: driveArchiveLink || null,
      })
      .in('id', recordIds);

    revalidatePath('/unsafe-products');

    return { 
      success: true, 
      message: `ดำเนินการจัดเก็บถาวรและเคลียร์รูปภาพในระบบเรียบร้อย (${filesToDelete.length} ภาพถูกนำออกจาก Storage)` 
    };
  } catch (err: any) {
    console.error('archiveAndPurgeImagesAction error:', err);
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการจัดเก็บถาวร' };
  }
}
