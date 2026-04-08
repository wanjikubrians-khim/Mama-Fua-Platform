'use client';
// Mama Fua — Login Page
// KhimTech | 2026

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Phone, Lock, ShieldCheck, Sparkles, Clock3 } from 'lucide-react';
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

const highlights = [
  {
    icon: ShieldCheck,
    title: 'Secure sign-in',
    body: 'Use a one-time code instead of remembering a password.',
  },
  {
    icon: Sparkles,
    title: 'Fast return',
    body: 'Get back into your bookings and status updates quickly.',
  },
  {
    icon: Clock3,
    title: 'Built for mobile',
    body: 'The login flow stays simple on smaller screens.',
  },
];

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  return value;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const requestedRole = searchParams.get('role') === 'CLEANER' ? 'CLEANER' : 'CLIENT';
  const nextPath = getSafeNextPath(searchParams.get('next'));
  const registerParams = new URLSearchParams();

  registerParams.set('role', requestedRole);
  if (nextPath) {
    registerParams.set('next', nextPath);
  }

  const registerHref = `/register?${registerParams.toString()}`;

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
      // In development mode, allow proceeding even if OTP request fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: proceeding despite OTP request failure');
        setPhone(normalisePhone(data.phone));
        setStep('otp');
        return;
      }
      
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response
        ?.data?.error?.message;
      setError(msg ?? 'Failed to send OTP. Try again.');
    }
  };

  const onOtpSubmit = async (data: OtpForm) => {
    setError('');
    try {
      // In development, try multiple approaches
      let res;
      if (process.env.NODE_ENV === 'development' && data.otp === '123456') {
        // First try the regular OTP - might work with the service changes
        try {
          res = await authApi.verifyOtp(phone, data.otp);
        } catch (err) {
          // If that fails, try a hardcoded login
          const mockResponse = {
            data: {
              success: true,
              data: {
                isNewUser: false,
                accessToken: 'dev-token-' + Date.now(),
                refreshToken: 'dev-refresh-' + Date.now(),
                user: {
                  id: 'dev-user-id',
                  firstName: phone.includes('0000001') ? 'Brian' : phone.includes('0000002') ? 'Test' : 'Grace',
                  lastName: phone.includes('0000001') ? 'Wanjiku' : phone.includes('0000002') ? 'Client' : 'Muthoni',
                  role: phone.includes('0000001') ? 'ADMIN' : phone.includes('0000002') ? 'CLIENT' : 'CLEANER',
                  phone: phone,
                  email: phone.includes('0000001') ? 'admin@mamafua.co.ke' : phone.includes('0000002') ? 'client@test.com' : 'cleaner@test.com',
                }
              }
            }
          };
          res = mockResponse;
        }
      } else {
        res = await authApi.verifyOtp(phone, data.otp);
      }
      
      const { isNewUser, accessToken, refreshToken, user } = res.data.data;
      if (isNewUser) {
        const params = new URLSearchParams({
          phone,
          otp: data.otp,
          role: requestedRole,
        });

        if (nextPath) {
          params.set('next', nextPath);
        }

        router.push(`/register?${params.toString()}`);
        return;
      }
      setAuth(user, accessToken, refreshToken);
      router.push(nextPath ?? (user.role === 'CLEANER' ? '/cleaner/dashboard' : '/dashboard'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response
        ?.data?.error?.message;
      setError(msg ?? 'Invalid code. Try again.');
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-6 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[0.88fr_1.12fr]">
        <aside className="dark-panel hidden flex-col justify-between px-8 py-8 lg:flex">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-ink-900">
                MF
              </span>
              <span className="text-sm font-semibold text-white">Mama Fua</span>
            </Link>

            <p className="mt-10 text-sm font-medium text-brand-100">Welcome back</p>
            <h1 className="mt-3 max-w-md text-4xl text-white">
              Sign in and continue with your current bookings.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
              This screen is intentionally quieter now: one dark support panel, one bright form, and
              clear next steps.
            </p>
          </div>

          <div className="grid gap-4">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <item.icon className="h-5 w-5 text-brand-100" />
                </div>
                <h2 className="mt-4 text-xl text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-white/68">{item.body}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="section-shell flex items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-md space-y-8">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                  MF
                </span>
                <span className="text-sm font-semibold text-ink-900">Mama Fua</span>
              </Link>
              <p className="mt-5 text-sm font-medium text-brand-700">Secure sign in</p>
              <p className="mt-2 text-sm leading-7 text-ink-500">
                Use your phone number to receive a one-time verification code.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
              {step === 'phone' ? (
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-6">
                  <div>
                    <h2 className="text-3xl">Log in to your account</h2>
                    <p className="mt-2 text-sm text-ink-500">
                      We&apos;ll send a code to your phone.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink-700">
                      Phone number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input
                        {...phoneForm.register('phone')}
                        className="input pl-11"
                        placeholder="+254 712 345 678"
                        type="tel"
                        autoComplete="tel"
                      />
                    </div>
                    {phoneForm.formState.errors.phone && (
                      <p className="mt-1 text-xs text-red-500">
                        {phoneForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  {error && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={phoneForm.formState.isSubmitting}
                    className="btn-primary w-full py-3.5 text-base"
                  >
                    {phoneForm.formState.isSubmitting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Send code
                  </button>

                  <p className="text-center text-sm text-ink-500">
                    No account?{' '}
                    <Link
                      href={registerHref}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      Sign up
                    </Link>
                  </p>
                </form>
              ) : (
                <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                  <div>
                    <h2 className="text-3xl">Enter your code</h2>
                    <p className="mt-2 text-sm text-ink-500">
                      Sent to <span className="font-semibold text-ink-800">{phone}</span>
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink-700">
                      6-digit code
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input
                        {...otpForm.register('otp')}
                        className="input pl-11 text-center font-mono text-2xl tracking-[0.45em]"
                        placeholder="000000"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        autoFocus
                      />
                    </div>
                    {otpForm.formState.errors.otp && (
                      <p className="mt-1 text-xs text-red-500">
                        {otpForm.formState.errors.otp.message}
                      </p>
                    )}
                  </div>

                  {error && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={otpForm.formState.isSubmitting}
                    className="btn-primary w-full py-3.5 text-base"
                  >
                    {otpForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Verify & log in
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setError('');
                    }}
                    className="btn-ghost w-full"
                  >
                    Change number
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-6 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[0.88fr_1.12fr]">
        <aside className="dark-panel hidden flex-col justify-between px-8 py-8 lg:flex">
          <div>
            <div className="h-10 w-28 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-10 h-4 w-28 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-10 w-72 animate-pulse rounded-2xl bg-white/10" />
            <div className="mt-4 h-4 w-80 animate-pulse rounded-full bg-white/10" />
          </div>
        </aside>

        <section className="section-shell flex items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-md space-y-8">
            <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200" />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
              <div className="space-y-4">
                <div className="h-8 w-40 animate-pulse rounded-2xl bg-slate-200" />
                <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
