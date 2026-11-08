'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard';

  if (!email || !password) {
    return { success: false, error: 'กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน' };
  }

  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !authData.user) {
    return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือยังไม่ได้ยืนยันตัวตน' };
  }

  // Check user approval status in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('status, role')
    .eq('id', authData.user.id)
    .single();

  if (!profile || profile.status !== 'approved') {
    if (profile?.status === 'rejected') {
      await supabase.auth.signOut();
      return { 
        success: false, 
        error: 'บัญชีนี้ไม่ได้รับการอนุมัติการเข้าใช้งาน โปรดติดต่อเภสัชกรผู้ดูแลระบบเครือข่าย' 
      };
    }
    // Any status other than 'approved' goes to pending screen
    redirect('/pending-approval');
  }

  redirect(redirectTo);
}

export async function registerAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const fullName = formData.get('fullName') as string;
  const role = formData.get('role') as string;
  const hospitalName = formData.get('hospitalName') as string;

  if (!email || !password || !fullName || !role || !hospitalName) {
    return { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' };
  }

  if (password.length < 6) {
    return { success: false, error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
  }

  if (password !== confirmPassword) {
    return { success: false, error: 'รหัสผ่านยืนยันไม่ตรงกับรหัสผ่าน' };
  }

  const supabase = await createClient();

  const headersList = await headers();
  const host = headersList.get('host') || 'swpc-healthcare.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  // 1. Sign up user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        role,
        hospital_name: hospitalName,
      },
    },
  });

  if (authError) {
    return { success: false, error: authError.message || 'เกิดข้อผิดพลาดในการลงทะเบียน' };
  }

  if (authData.user) {
    // Only designated system admin email is auto-approved.
    // Everyone else (Staff & Pharmacists) is strictly 'pending' and requires admin approval.
    const isNetworkAdmin = email.toLowerCase() === 'swpc.pharmacy@gmail.com';
    const status = isNetworkAdmin ? 'approved' : 'pending';

    // 2. Insert into profiles table
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      full_name: fullName,
      email,
      role,
      hospital_name: hospitalName,
      status,
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      console.warn('Could not insert profile:', profileError.message);
    }

    // If session created directly (email confirmation off)
    if (authData.session) {
      if (status === 'approved') {
        redirect('/dashboard');
      } else {
        redirect('/pending-approval');
      }
    }
  }

  return { 
    success: true, 
    message: 'ลงทะเบียนสำเร็จ! บัญชีของคุณอยู่ระหว่างรอเภสัชกรผู้ดูแลระบบอนุมัติการเข้าใช้งาน' 
  };
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
    return { allowed: false, error: 'คุณไม่มีสิทธิ์ในการจัดการข้อมูล (เฉพาะเภสัชกรที่ได้รับอนุมัติแล้วเท่านั้น)' };
  }

  return { allowed: true, user };
}

/**
 * อัปเดตสถานะผู้ใช้งาน (อนุมัติ / ปฏิเสธ)
 */
export async function updateUserStatusAction(userId: string, newStatus: 'approved' | 'rejected' | 'pending') {
  const supabase = await createClient();
  const authCheck = await verifyPharmacistAdmin(supabase);
  if (!authCheck.allowed) return { success: false, error: authCheck.error };

  const { error } = await supabase
    .from('profiles')
    .update({ status: newStatus })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message || 'ไม่สามารถอัปเดตสถานะได้' };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * แก้ไขข้อมูลผู้ใช้งานโดย Admin: ชื่อ, สิทธิ์ (Role), ย้าย รพ.สต., ปรับสถานะ
 */
export async function adminUpdateUserAction(
  userId: string,
  data: {
    fullName: string;
    role: 'staff' | 'pharmacist';
    hospitalName: string;
    status: 'pending' | 'approved' | 'rejected';
  }
) {
  const supabase = await createClient();
  const authCheck = await verifyPharmacistAdmin(supabase);
  if (!authCheck.allowed) return { success: false, error: authCheck.error };

  const trimmedName = data.fullName.trim();
  if (!trimmedName) {
    return { success: false, error: 'กรุณากรอกชื่อ-นามสกุล' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: trimmedName,
      role: data.role,
      hospital_name: data.hospitalName,
      status: data.status,
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message || 'ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้' };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * รีเซ็ตรหัสผ่านให้ User โดย Admin/Pharmacist
 */
export async function adminResetPasswordAction(userId: string, newPassword: string) {
  const supabase = await createClient();
  const authCheck = await verifyPharmacistAdmin(supabase);
  if (!authCheck.allowed) return { success: false, error: authCheck.error };

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
  }

  // เรียกใช้ RPC function ที่กำหนดความปลอดภัย SECURITY DEFINER ไว้
  const { data, error } = await supabase.rpc('admin_set_user_password', {
    target_user_id: userId,
    new_password: newPassword,
  });

  if (error) {
    console.error('adminResetPasswordAction error:', error);
    // ถ้ายังไม่ได้รันฟังก์ชันใน Supabase ให้แจ้งผู้ใช้
    if (error.message?.includes('function public.admin_set_user_password') || error.code === '42883') {
      return { 
        success: false, 
        error: 'ยังไม่ได้สร้างฟังก์ชัน admin_set_user_password ในฐานข้อมูล กรุณารันไฟล์ supabase_hospitals_and_admin_rpc.sql ใน Supabase SQL Editor' 
      };
    }
    return { success: false, error: error.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้' };
  }

  return { success: true };
}

/**
 * ขอรับลิงก์รีเซ็ตรหัสผ่านทางอีเมล (Self-service Forgot Password)
 */
export async function requestPasswordResetAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  if (!email) {
    return { success: false, error: 'กรุณากรอกอีเมลของคุณ' };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get('host') || 'swpc-healthcare.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?type=recovery&next=/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message || 'ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้' };
  }

  return { 
    success: true, 
    message: 'ระบบได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว โปรดตรวจสอบกล่องข้อความหรือกล่องสแปม' 
  };
}

/**
 * อัปเดตรหัสผ่านใหม่ของผู้ใช้ (สำหรับหน้า Reset Password)
 */
export async function updateUserPasswordAction(formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || !confirmPassword) {
    return { success: false, error: 'กรุณากรอกรหัสผ่านให้ครบทั้งสองช่อง' };
  }

  if (password.length < 6) {
    return { success: false, error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
  }

  if (password !== confirmPassword) {
    return { success: false, error: 'รหัสผ่านยืนยันไม่ตรงกับรหัสผ่านใหม่' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, error: error.message || 'ไม่สามารถบันทึกรหัสผ่านใหม่ได้' };
  }

  return { success: true };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
