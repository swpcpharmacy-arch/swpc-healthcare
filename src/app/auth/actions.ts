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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือยังไม่ได้ยืนยันตัวตน' };
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
    // 2. Insert into profiles table
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      full_name: fullName,
      email,
      role,
      hospital_name: hospitalName,
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      console.warn('Could not insert profile:', profileError.message);
    }
  }

  // If session created directly (email confirmation off)
  if (authData.session) {
    redirect('/dashboard');
  }

  return { 
    success: true, 
    message: 'ลงทะเบียนสำเร็จ! หากมีการตั้งค่าเปิดยืนยันอีเมล โปรดตรวจสอบกล่องจดหมายของคุณ' 
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
