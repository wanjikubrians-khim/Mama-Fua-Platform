'use client';
// Mama Fua — Register Page
// KhimTech | 2026

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Phone, User, Mail, ArrowRight, ChevronLeft } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { normalisePhone } from '@mama-fua/shared';

const registerSchema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName:  z.string().min(2, 'At least 2 characters'),
  email:     z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone:     z.string().min(9, 'Enter a valid phone number'),
  otp:       z.string().length(6, 'Enter the 6-digit code'),
  role:      z.enum(['CLIENT', 'CLEANER']),
});

type RegisterForm = z.infer<typeof registerSchema>;

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterSkeleton />}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const setAuth      = useAuthStore((s) => s.setAuth);

  const [step, setStep]     = useState<'details' | 'otp'>('details');
  const [phone, setPhone]   = useState('');
  const [error, setError]   = useState('');
  const nextPath = getSafeNextPath(searchParams.get('next'));

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role:  (searchParams.get('role') as 'CLIENT' | 'CLEANER') || 'CLIENT',
      phone: searchParams.get('phone') || '',
      otp:   searchParams.get('otp')   || '',
    },
  });

  const selectedRole   = form.watch('role');
  const isClient       = selectedRole === 'CLIENT';

  const signInParams = new URLSearchParams({ role: selectedRole });
  if (nextPath) signInParams.set('next', nextPath);
  const signInHref = `/login?${signInParams.toString()}`;

  useEffect(() => {
    const urlOtp   = searchParams.get('otp');
    const urlPhone = searchParams.get('phone');
    if (urlOtp && urlPhone) {
      setPhone(urlPhone);
      setStep('otp');
      form.setValue('phone', urlPhone);
      form.setValue('otp', urlOtp);
    }
  }, [searchParams, form]);

  const onDetailsSubmit = async (data: RegisterForm) => {
    setError('');
    try {
      const normalised = normalisePhone(data.phone);
      await authApi.requestOtp(normalised);
      setPhone(normalised);
      setStep('otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(msg ?? 'Failed to send OTP. Try again.');
    }
  };

  const onOtpSubmit = async (data: RegisterForm) => {
    setError('');
    try {
      const res = await authApi.register({
        phone: data.phone,
        otp: data.otp,
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email || undefined,
        role:      data.role,
        preferredLang: 'en',
      });
      const { accessToken, refreshToken, user } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      router.push(nextPath ?? (data.role === 'CLEANER' ? '/cleaner/dashboard' : '/dashboard'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(msg ?? 'Registration failed. Try again.');
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-50">

      {/* ── Left dark panel ────────────────────────────────────── */}
      <div className="relative hidden w-[420px] flex-shrink-0 overflow-hidden bg-ink-900 px-10 py-10 lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgb(148 163 184 / 0.3) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-mint-600/10 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-extrabold text-white shadow-brand">
              MF
            </span>
            <div>
              <p className="text-sm font-bold text-white leading-none">Mama Fua</p>
              <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-widest">KhimTech</p>
            </div>
          </Link>

          <div className="mt-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
              {isClient ? 'Book a cleaner' : 'Join as a cleaner'}
            </p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight text-white">
              {isClient
                ? 'Create an account and get your home cleaned today.'
                : 'Start earning with a steady stream of local clients.'}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              {isClient
                ? 'Save addresses, track bookings, and pay securely with M-Pesa or card.'
                : 'Build your digital profile, set your rates, and get paid automatically.'}
            </p>
          </div>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-3">
          {(isClient
            ? [
                { icon: '🏠', title: 'Verified cleaners only',  body: 'Every cleaner is background-checked before joining.' },
                { icon: '🔒', title: 'Escrow payments',         body: 'Your money is held until the job is confirmed complete.' },
                { icon: '📍', title: 'Real-time tracking',      body: 'Follow your cleaner en route right on the map.' },
              ]
            : [
                { icon: '💳', title: 'M-Pesa payouts',          body: 'Earnings hit your M-Pesa within an hour.' },
                { icon: '⭐', title: 'Build your reputation',   body: 'Ratings help you earn more over time.' },
                { icon: '📅', title: 'You control your hours',  body: 'Set your own schedule and service area.' },
              ]
          ).map((f) => (
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

      {/* ── Right form panel ───────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-extrabold text-white shadow-brand">MF</span>
            <span className="text-sm font-bold text-ink-900">Mama Fua</span>
          </Link>

          {step === 'details' ? (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-ink-500">
                {isClient ? 'Sign up to book trusted cleaners.' : 'Sign up to offer cleaning services.'}
              </p>

              <form onSubmit={form.handleSubmit(onDetailsSubmit)} className="mt-8 space-y-5">

                {/* Role selector */}
                <div>
                  <p className="label">I want to</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { role: 'CLIENT',  emoji: '🏠', label: 'Book a cleaner', sub: 'Find help for my home' },
                      { role: 'CLEANER', emoji: '🧹', label: 'Be a cleaner',   sub: 'Offer my services' },
                    ] as const).map(({ role, emoji, label, sub }) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => form.setValue('role', role)}
                        className={`select-card text-left ${selectedRole === role ? 'select-card-active' : ''}`}
                      >
                        <span className="text-2xl">{emoji}</span>
                        <p className="mt-3 text-sm font-bold text-ink-900">{label}</p>
                        <p className="text-xs text-ink-400">{sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="field-group mb-0">
                    <label className="label">First name</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input {...form.register('firstName')} className={`input pl-10 ${form.formState.errors.firstName ? 'input-error' : ''}`} placeholder="Grace" />
                    </div>
                    {form.formState.errors.firstName && (
                      <p className="mt-1 text-xs text-red-500">{form.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="field-group mb-0">
                    <label className="label">Last name</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input {...form.register('lastName')} className={`input pl-10 ${form.formState.errors.lastName ? 'input-error' : ''}`} placeholder="Muthoni" />
                    </div>
                    {form.formState.errors.lastName && (
                      <p className="mt-1 text-xs text-red-500">{form.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="field-group mb-0">
                  <label className="label">Email <span className="label-optional">(optional)</span></label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input {...form.register('email')} className="input pl-10" placeholder="grace@email.com" type="email" />
                  </div>
                </div>

                {/* Phone */}
                <div className="field-group mb-0">
                  <label className="label">Phone number</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input {...form.register('phone')} className={`input pl-10 ${form.formState.errors.phone ? 'input-error' : ''}`} placeholder="+254 712 345 678" type="tel" />
                  </div>
                  {form.formState.errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                {error && (
                  <div className="callout-danger">
                    <span>⚠️</span><span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={form.formState.isSubmitting} className="btn-primary w-full py-3.5 text-base rounded-2xl">
                  {form.formState.isSubmitting
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <>Send verification code <ArrowRight className="h-4 w-4" /></>
                  }
                </button>

                <p className="text-center text-xs text-ink-400">
                  Already have an account?{' '}
                  <Link href={signInHref} className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link>
                </p>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in">
              <button
                onClick={() => { setStep('details'); setError(''); }}
                className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>

              <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
                Verify your number
              </h2>
              <p className="mt-2 text-sm text-ink-500">
                We sent a code to{' '}
                <span className="font-bold text-ink-800">{phone}</span>
              </p>

              <form onSubmit={form.handleSubmit(onOtpSubmit)} className="mt-8 space-y-5">
                <div className="field-group mb-0">
                  <label className="label">6-digit code</label>
                  <input
                    {...form.register('otp')}
                    className={`input text-center font-mono text-3xl tracking-[0.5em] py-4 ${form.formState.errors.otp ? 'input-error' : ''}`}
                    placeholder="000000"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                  {form.formState.errors.otp && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.otp.message}</p>
                  )}
                </div>

                {error && (
                  <div className="callout-danger">
                    <span>⚠️</span><span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={form.formState.isSubmitting} className="btn-primary w-full py-3.5 text-base rounded-2xl">
                  {form.formState.isSubmitting
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <>Create account <ArrowRight className="h-4 w-4" /></>
                  }
                </button>

                <p className="text-center text-xs text-ink-400">
                  Didn&apos;t get a code?{' '}
                  <button type="button" onClick={() => { setStep('details'); setError(''); }} className="font-semibold text-brand-600 hover:text-brand-700">
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

function RegisterSkeleton() {
  return (
    <div className="flex min-h-screen bg-surface-50">
      <div className="hidden w-[420px] bg-ink-900 lg:block" />
      <div className="flex flex-1 items-center justify-center px-8 py-12">
        <div className="w-full max-w-md space-y-5">
          <div className="skeleton h-8 w-56 rounded-xl" />
          <div className="skeleton h-4 w-72 rounded-lg" />
          <div className="skeleton h-24 w-full rounded-2xl" />
          <div className="skeleton h-12 w-full rounded-2xl" />
          <div className="skeleton h-14 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
