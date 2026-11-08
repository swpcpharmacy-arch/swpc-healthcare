'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, Building2, AlertCircle, CheckCircle2, Shield, Eye, EyeOff } from 'lucide-react';
import { registerAction } from '@/app/auth/actions';
import { getHospitalsAction } from '@/app/hospitals/actions';
import { HOSPITALS, USER_ROLES } from '@/lib/constants';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'staff' | 'pharmacist'>('staff');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hospitalOptions, setHospitalOptions] = useState<string[]>(HOSPITALS.map((h) => h.name));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    getHospitalsAction().then((res) => {
      if (isMounted && res.success && res.data && res.data.length > 0) {
        const activeNames = res.data.filter((h) => h.is_active).map((h) => h.name);
        if (activeNames.length > 0) {
          setHospitalOptions(activeNames);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const formData = new FormData(e.currentTarget);
    formData.set('role', selectedRole);

    startTransition(async () => {
      const res = await registerAction(formData);
      if (res) {
        if (!res.success && res.error) {
          setErrorMessage(res.error);
        } else if (res.success && res.message) {
          setSuccessMessage(res.message);
        }
      }
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/60 space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary/10 text-secondary mb-2 shadow-inner">
          <UserPlus className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">สมัครสมาชิก</h1>
        <p className="text-sm text-slate-500">
          ลงทะเบียนบุคลากรเครือข่ายบริการสุขภาพอำเภอสวรรคโลก
        </p>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{successMessage}</p>
            <Link href="/login" className="text-xs text-primary underline font-medium block">
              คลิกที่นี่เพื่อไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            ชื่อ - นามสกุล (พร้อมคำนำหน้า)
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              name="fullName"
              required
              placeholder="ภก. สมชาย ใจดี หรือ พยาบาลวิชาชีพ..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-slate-800 placeholder:text-slate-400 text-sm shadow-sm"
            />
          </div>
        </div>

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

        {/* Role Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            บทบาทการใช้งาน (Role)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {USER_ROLES.map((r) => {
              const isSelected = selectedRole === r.id;
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setSelectedRole(r.id as 'staff' | 'pharmacist')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary shadow-sm ring-2 ring-primary/20'
                      : 'border-slate-200 bg-white/60 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />
                    <span className="font-semibold text-xs">{r.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {r.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hospital Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            หน่วยบริการที่สังกัด (โรงพยาบาล / รพ.สต.)
          </label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <select
              name="hospitalName"
              required
              defaultValue=""
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-slate-800 text-sm shadow-sm appearance-none"
            >
              <option value="" disabled>-- เลือกหน่วยบริการในอำเภอสวรรคโลก --</option>
              {hospitalOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Passwords */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              รหัสผ่าน
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-slate-800 placeholder:text-slate-400 text-xs shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                ยืนยันรหัสผ่าน
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-slate-400 hover:text-slate-600 transition flex items-center gap-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
                placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-slate-800 placeholder:text-slate-400 text-xs shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-primary/30"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>กำลังสร้างบัญชีผู้ใช้งาน...</span>
            </div>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>ยืนยันการสมัครสมาชิก</span>
            </>
          )}
        </button>
      </form>

      {/* Login prompt */}
      <div className="pt-4 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-600">
          มีบัญชีผู้ใช้งานอยู่แล้ว?{' '}
          <Link
            href="/login"
            className="text-primary font-semibold hover:underline transition"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
