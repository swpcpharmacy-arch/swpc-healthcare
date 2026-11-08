'use client';

import React, { useState, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { loginAction } from '@/app/auth/actions';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const errorParam = searchParams.get('error');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    errorParam === 'auth_callback_failed' 
      ? 'การยืนยันตัวตนล้มเหลว กรุณาลองเข้าสู่ระบบอีกครั้ง' 
      : ''
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    formData.set('redirectTo', redirectTo);

    startTransition(async () => {
      const res = await loginAction(formData);
      if (res && !res.success && res.error) {
        setErrorMessage(res.error);
      }
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/60 space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-2 shadow-inner">
          <LogIn className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">เข้าสู่ระบบ</h1>
        <p className="text-sm text-slate-500">
          เข้าใช้งานระบบบริหารงานเภสัชกรรมปฐมภูมิและงาน คบส.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            อีเมล (Email)
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="email"
              name="email"
              required
              placeholder="name@hospital.moph.go.th"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-slate-800 placeholder:text-slate-400 text-sm shadow-sm"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              รหัสผ่าน (Password)
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline font-medium transition"
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              placeholder="••••••••"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-primary/30"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>กำลังตรวจสอบข้อมูล...</span>
            </div>
          ) : (
            <>
              <span>เข้าสู่ระบบ</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Register prompt */}
      <div className="pt-4 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-600">
          ยังไม่มีบัญชีผู้ใช้งาน?{' '}
          <Link
            href="/register"
            className="text-primary font-semibold hover:underline transition"
          >
            ลงทะเบียนบุคลากรใหม่
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 text-center text-slate-400 shadow-xl">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">กำลังโหลดหน้าเข้าสู่ระบบ...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
