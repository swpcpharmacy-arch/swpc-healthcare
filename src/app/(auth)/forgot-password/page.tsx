'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { KeyRound, Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { requestPasswordResetAction } from '@/app/auth/actions';

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await requestPasswordResetAction(formData);
      if (res.success && res.message) {
        setSuccessMessage(res.message);
      } else if (!res.success && res.error) {
        setErrorMessage(res.error);
      }
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/60 space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mb-2 shadow-inner">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">ลืมรหัสผ่าน?</h1>
        <p className="text-sm text-slate-500">
          กรอกอีเมลที่ใช้ลงทะเบียนเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
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
      {!successMessage ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              อีเมลของคุณ (Registered Email)
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

          <button
            type="submit"
            disabled={isPending}
            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-primary/30"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังส่งลิงก์...</span>
              </div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>ส่งลิงก์รีเซ็ตรหัสผ่าน</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="text-center pt-2">
          <p className="text-xs text-slate-500 mb-4">
            หากไม่พบอีเมลในกล่องจดหมายหลัก กรุณาตรวจสอบในโฟลเดอร์ Junk/Spam
          </p>
        </div>
      )}

      {/* Back to Login */}
      <div className="pt-4 border-t border-slate-100 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับไปหน้าเข้าสู่ระบบ</span>
        </Link>
      </div>
    </div>
  );
}
