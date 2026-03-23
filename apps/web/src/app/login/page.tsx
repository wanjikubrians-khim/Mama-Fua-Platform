'use client';
// Mama Fua — Login Page
// KhimTech | 2026

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Phone, Lock } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { normalisePhone } from '@mama-fua/shared';

const phoneSchema = z.object({
  phone: z.string().min(9, 'Enter a valid phone number'),
});
const otpSchema = z.object({
  otp: z.string().length(6, 'Enter the 6-digit code'),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  const onPhoneSubmit = async (data: PhoneForm) => {
    setError('');
    try {
      const normalised = normalisePhone(data.phone);
      await authApi.requestOtp(normalised);
      setPhone(normalised);
      setStep('otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg ?? 'Failed to send OTP. Try again.');
    }
  };

  const onOtpSubmit = async (data: OtpForm) => {
    setError('');
    try {
      const res = await authApi.verifyOtp(phone, data.otp);
      const { isNewUser, accessToken, refreshToken, user } = res.data.data;
      if (isNewUser) {
        router.push(`/register?phone=${encodeURIComponent(phone)}&otp=${data.otp}`);
        return;
      }
      setAuth(user, accessToken, refreshToken);
      router.push(user.role === 'CLEANER' ? '/cleaner/dashboard' : '/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg ?? 'Invalid code. Try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-brand-600">Mama Fua</Link>
          <p className="text-gray-500 text-sm mt-1">Welcome back</p>
        </div>

        <div className="card">
          {step === 'phone' ? (
            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-5">
              <div>
                <h1 className="text-xl font-semibold mb-1">Log in to your account</h1>
                <p className="text-sm text-gray-500">We'll send a code to your phone</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...phoneForm.register('phone')}
                    className="input pl-10"
                    placeholder="+254 712 345 678"
                    type="tel"
                    autoComplete="tel"
                  />
                </div>
                {phoneForm.formState.errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{phoneForm.formState.errors.phone.message}</p>
                )}
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={phoneForm.formState.isSubmitting}
                className="btn-primary w-full"
              >
                {phoneForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Send code
              </button>

              <p className="text-center text-sm text-gray-500">
                No account?{' '}
                <Link href="/register" className="text-brand-600 font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">
              <div>
                <h1 className="text-xl font-semibold mb-1">Enter your code</h1>
                <p className="text-sm text-gray-500">
                  Sent to <span className="font-medium text-gray-700">{phone}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">6-digit code</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...otpForm.register('otp')}
                    className="input pl-10 text-center text-2xl tracking-[0.5em] font-mono"
                    placeholder="000000"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>
                {otpForm.formState.errors.otp && (
                  <p className="text-red-500 text-xs mt-1">{otpForm.formState.errors.otp.message}</p>
                )}
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={otpForm.formState.isSubmitting}
                className="btn-primary w-full"
              >
                {otpForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify & log in
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setError(''); }}
                className="btn-ghost w-full text-sm"
              >
                ← Change number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
