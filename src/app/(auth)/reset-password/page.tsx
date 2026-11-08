'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { updateUserPasswordAction } from '@/app/auth/actions';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Check if session exists (either from cookie or parsed from URL hash)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasValidSession(true);
      }
      setIsCheckingSession(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasValidSession(true);
        setIsCheckingSession(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setErrorMessage('รหัสผ่านยืนยันไม่ตรงกับรหัสผ่านใหม่');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      
      // 1. Try client-side update first (covers hash-fragment recovery tokens)
      const { error: clientError } = await supabase.auth.updateUser({ password });

      if (!clientError) {
        setSuccessMessage('เปลี่ยนรหัสผ่านใหม่สำเร็จแล้ว! กำลังนำคุณเข้าสู่ระบบ...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
        return;
      }

      // 2. Try server-action fallback (covers server-cookie recovery sessions)
      const serverRes = await updateUserPasswordAction(formData);
      if (serverRes.success) {
        setSuccessMessage('เปลี่ยนรหัสผ่านใหม่สำเร็จแล้ว! กำลังนำคุณเข้าสู่ระบบ...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setErrorMessage(
          clientError?.message || 
          serverRes.error || 
          'ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณากดขอรับลิงก์รีเซ็ตรหัสผ่านใหม่อีกครั้ง'
        );
      }
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/60 space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 mb-2 shadow-inner">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">ตั้งรหัสผ่านใหม่</h1>
        <p className="text-sm text-slate-500">
          กำหนดรหัสผ่านใหม่สำหรับเข้าใช้งานระบบ SWPC Healthcare
        </p>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            รหัสผ่านใหม่ (New Password)
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              minLength={6}
              placeholder="•••••••• (อย่างน้อย 6 ตัวอักษร)"
              className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-slate-800 placeholder:text-slate-400 text-sm shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            ยืนยันรหัสผ่านใหม่ (Confirm Password)
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-slate-800 placeholder:text-slate-400 text-sm shadow-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-primary/30"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>กำลังบันทึกรหัสผ่านใหม่...</span>
            </div>
          ) : (
            <span>บันทึกรหัสผ่านใหม่</span>
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-slate-100 text-center">
        <Link
          href="/login"
          className="text-xs text-slate-500 hover:text-slate-800 transition"
        >
          ยกเลิกและกลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}
