'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

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

  if (profile) {
    if (profile.status === 'rejected') {
      await supabase.auth.signOut();
      return { 
        success: false, 
        error: 'บัญชีนี้ไม่ได้รับการอนุมัติการเข้าใช้งาน โปรดติดต่อเภสัชกรผู้ดูแลระบบเครือข่าย' 
      };
    }

    if (profile.status === 'pending') {
      redirect('/pending-approval');
    }
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
    // Check if this is the very first user in the system or admin email
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // The first user ever created or network admin email is automatically approved
    const isFirstUser = count === null || count === 0;
    const isNetworkAdmin = email.toLowerCase() === 'swpc.pharmacy@gmail.com';
    const status = (isFirstUser || isNetworkAdmin) ? 'approved' : 'pending';

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

export async function updateUserStatusAction(userId: string, newStatus: 'approved' | 'rejected') {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อน' };
  }

  // Check if current user is an approved pharmacist
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (currentProfile?.role !== 'pharmacist' || currentProfile?.status !== 'approved') {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการอนุมัติผู้ใช้งาน (เฉพาะเภสัชกรที่ได้รับอนุมัติแล้วเท่านั้น)' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ status: newStatus })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message || 'ไม่สามารถอัปเดตสถานะได้' };
  }

  return { success: true };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
