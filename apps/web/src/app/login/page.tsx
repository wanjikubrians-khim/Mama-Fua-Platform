'use client';
// Mama Fua — Login Page
// KhimTech | 2026

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Phone, ArrowRight, ChevronLeft, ShieldCheck } from 'lucide-react';
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
type OtpForm   = z.infer<typeof otpSchema>;

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const setAuth      = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const requestedRole = searchParams.get('role') === 'CLEANER' ? 'CLEANER' : 'CLIENT';
  const nextPath      = getSafeNextPath(searchParams.get('next'));

  const registerParams = new URLSearchParams({ role: requestedRole });
  if (nextPath) registerParams.set('next', nextPath);
  const registerHref = `/register?${registerParams.toString()}`;

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });
  const otpForm   = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  const onPhoneSubmit = async (data: PhoneForm) => {
    setError('');
    try {
      const normalised = normalisePhone(data.phone);
      await authApi.requestOtp(normalised);
      setPhone(normalised);
      setStep('otp');
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        setPhone(normalisePhone(data.phone));
        setStep('otp');
        return;
      }
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(msg ?? 'Failed to send OTP. Try again.');
    }
  };

  const onOtpSubmit = async (data: OtpForm) => {
    setError('');
    try {
      let res;
      if (process.env.NODE_ENV === 'development' && data.otp === '123456') {
        try {
          res = await authApi.verifyOtp(phone, data.otp);
        } catch {
          res = {
            data: {
              success: true,
              data: {
                isNewUser: false,
                accessToken:  'dev-token-' + Date.now(),
                refreshToken: 'dev-refresh-' + Date.now(),
                user: {
                  id:        'dev-user-id',
                  firstName: phone.includes('0000001') ? 'Brian'  : phone.includes('0000002') ? 'Test'  : 'Grace',
                  lastName:  phone.includes('0000001') ? 'Wanjiku': phone.includes('0000002') ? 'Client': 'Muthoni',
                  role:      phone.includes('0000001') ? 'ADMIN'  : phone.includes('0000002') ? 'CLIENT': 'CLEANER',
                  phone,
                  email: phone.includes('0000001') ? 'admin@mamafua.co.ke' : 'client@test.com',
                },
              },
            },
          };
        }
      } else {
        res = await authApi.verifyOtp(phone, data.otp);
      }

      const { isNewUser, accessToken, refreshToken, user } = res.data.data;
      if (isNewUser) {
        const p = new URLSearchParams({ phone, otp: data.otp, role: requestedRole });
        if (nextPath) p.set('next', nextPath);
        router.push(`/register?${p.toString()}`);
        return;
      }
      setAuth(user, accessToken, refreshToken);
      router.push(nextPath ?? (user.role === 'CLEANER' ? '/cleaner/dashboard' : '/dashboard'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(msg ?? 'Invalid code. Try again.');
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-50">

      {/* ── Left panel — dark brand ────────────────────────────── */}
      <div className="relative hidden w-[420px] flex-shrink-0 overflow-hidden lg:flex lg:flex-col lg:justify-between bg-ink-900 px-10 py-10">
        {/* Background dots */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgb(148 163 184 / 0.3) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Gradient orb */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-800/20 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-extrabold text-white shadow-brand">
              MF
            </span>
            <div>
              <p className="text-sm font-bold text-white leading-none">Mama Fua</p>
              <p className="text-[10px] text-white/40 leading-none mt-0.5 uppercase tracking-widest">KhimTech</p>
            </div>
          </Link>

          <div className="mt-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">Welcome back</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight text-white">
              Sign in to your account
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              Access your bookings, track your cleaners in real time,
              and manage payments — all in one place.
            </p>
          </div>
        </div>

        {/* Feature cards */}
        <div className="relative z-10 space-y-3">
          {[
            { icon: '🔐', title: 'No password needed', body: 'Sign in with a one-time code sent to your phone.' },
            { icon: '📍', title: 'Live tracking', body: 'See your cleaner en route in real time.' },
            { icon: '💳', title: 'M-Pesa ready', body: 'Pay and get refunded directly via M-Pesa.' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
              <span className="text-xl flex-shrink-0">{f.icon}</span>
              <div>
                <p className="text-sm font-bold text-white">{f.title}</p>
                <p className="mt-0.5 text-xs text-white/50">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <Link href="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-extrabold text-white shadow-brand">
              MF
            </span>
            <span className="text-sm font-bold text-ink-900">Mama Fua</span>
          </Link>

          {step === 'phone' ? (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
                Enter your phone number
              </h2>
              <p className="mt-2 text-sm text-ink-500">
                We&apos;ll send a one-time code to verify it&apos;s you.
              </p>

              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="mt-8 space-y-5">
                <div className="field-group">
                  <label className="label">Phone number</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                      <Phone className="h-4 w-4 text-ink-400" />
                    </div>
                    <input
                      {...phoneForm.register('phone')}
                      className={`input pl-11 ${phoneForm.formState.errors.phone ? 'input-error' : ''}`}
                      placeholder="+254 712 345 678"
                      type="tel"
                      autoComplete="tel"
                    />
                  </div>
                  {phoneForm.formState.errors.phone && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {phoneForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="callout-danger">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={phoneForm.formState.isSubmitting}
                  className="btn-primary w-full py-3.5 text-base rounded-2xl"
                >
                  {phoneForm.formState.isSubmitting
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <>Send verification code <ArrowRight className="h-4 w-4" /></>
                  }
                </button>

                <div className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-ink-400" />
                  <p className="text-center text-xs text-ink-400">
                    New to Mama Fua?{' '}
                    <Link href={registerHref} className="font-semibold text-brand-600 hover:text-brand-700">
                      Create an account
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in">
              <button
                onClick={() => { setStep('phone'); setError(''); }}
                className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>

              <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
                Check your messages
              </h2>
              <p className="mt-2 text-sm text-ink-500">
                We sent a 6-digit code to{' '}
                <span className="font-bold text-ink-800">{phone}</span>
              </p>

              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="mt-8 space-y-5">
                <div className="field-group">
                  <label className="label">6-digit code</label>
                  <input
                    {...otpForm.register('otp')}
                    className={`input text-center font-mono text-3xl tracking-[0.5em] py-4 ${otpForm.formState.errors.otp ? 'input-error' : ''}`}
                    placeholder="000000"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {otpForm.formState.errors.otp.message}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="callout-danger">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otpForm.formState.isSubmitting}
                  className="btn-primary w-full py-3.5 text-base rounded-2xl"
                >
                  {otpForm.formState.isSubmitting
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <>Verify & sign in <ArrowRight className="h-4 w-4" /></>
                  }
                </button>

                <p className="text-center text-xs text-ink-400">
                  Didn&apos;t receive a code?{' '}
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setError(''); }}
                    className="font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Try again
                  </button>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="flex min-h-screen bg-surface-50">
      <div className="hidden w-[420px] bg-ink-900 lg:block" />
      <div className="flex flex-1 items-center justify-center px-8 py-12">
        <div className="w-full max-w-md space-y-5">
          <div className="skeleton h-8 w-56 rounded-xl" />
          <div className="skeleton h-4 w-72 rounded-lg" />
          <div className="skeleton h-12 w-full rounded-2xl" />
          <div className="skeleton h-14 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
