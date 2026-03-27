'use client';
// Mama Fua — Register Page
// KhimTech | 2026

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Phone, User, Mail, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { normalisePhone } from '@mama-fua/shared';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().min(9, 'Enter a valid phone number'),
  otp: z.string().length(6, 'Enter the 6-digit code'),
  role: z.enum(['CLIENT', 'CLEANER']),
});

type RegisterForm = z.infer<typeof registerSchema>;

const highlights = [
  {
    icon: ShieldCheck,
    title: 'Verified profiles',
    body: 'All cleaners go through background checks and ID verification.',
  },
  {
    icon: Sparkles,
    title: 'Flexible work',
    body: 'Set your own schedule and service areas. Work when you want.',
  },
  {
    icon: MapPin,
    title: 'Local focus',
    body: 'Connect with clients in your neighborhood for efficient jobs.',
  },
];

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  return value;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const nextPath = getSafeNextPath(searchParams.get('next'));

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: (searchParams.get('role') as 'CLIENT' | 'CLEANER') || 'CLIENT',
      phone: searchParams.get('phone') || '',
      otp: searchParams.get('otp') || '',
    },
  });

  const selectedRole = form.watch('role');
  const isClientSignup = selectedRole === 'CLIENT';
  const signInParams = new URLSearchParams({ role: selectedRole });

  if (nextPath) {
    signInParams.set('next', nextPath);
  }

  const signInHref = `/login?${signInParams.toString()}`;

  // If OTP is provided in URL, skip to OTP step
  useEffect(() => {
    const urlOtp = searchParams.get('otp');
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
      setOtpSent(true);
      setStep('otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response
        ?.data?.error?.message;
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
        lastName: data.lastName,
        email: data.email || undefined,
        role: data.role,
        preferredLang: 'en',
      });
      const { accessToken, refreshToken, user } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      router.push(nextPath ?? (data.role === 'CLEANER' ? '/cleaner/dashboard' : '/dashboard'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response
        ?.data?.error?.message;
      setError(msg ?? 'Registration failed. Try again.');
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

            <p className="mt-10 text-sm font-medium text-brand-100">Join our community</p>
            <h1 className="mt-3 max-w-md text-4xl text-white">
              {isClientSignup
                ? 'Create a client account and finish your booking faster'
                : 'Start your journey as a trusted cleaner'}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
              {isClientSignup
                ? 'Save your addresses, keep job updates in one place, and pay securely when your booking is ready.'
                : 'Create your profile, set your rates, and start earning. Our platform handles payments, reviews, and connects you with local clients.'}
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
              <p className="mt-5 text-sm font-medium text-brand-700">Create your account</p>
              <p className="mt-2 text-sm leading-7 text-ink-500">
                {isClientSignup
                  ? 'Join as a client to book trusted cleaners and track every step in one place.'
                  : 'Join as a cleaner and start building your profile.'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
              {step === 'details' ? (
                <form onSubmit={form.handleSubmit(onDetailsSubmit)} className="space-y-6">
                  <div>
                    <h2 className="text-3xl">
                      {isClientSignup ? 'Sign up to book a cleaner' : 'Sign up as a cleaner'}
                    </h2>
                    <p className="mt-2 text-sm text-ink-500">
                      {isClientSignup
                        ? 'We&apos;ll verify your phone number before creating your client account.'
                        : 'We&apos;ll send a code to verify your phone.'}
                    </p>
                  </div>

                  {/* Role selector */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-ink-700">I want to:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => form.setValue('role', 'CLIENT')}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          form.watch('role') === 'CLIENT'
                            ? 'border-brand-600 bg-brand-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏠</span>
                          <div>
                            <p className="font-medium text-ink-900">Book a cleaner</p>
                            <p className="text-xs text-ink-500">Find help for my home</p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => form.setValue('role', 'CLEANER')}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          form.watch('role') === 'CLEANER'
                            ? 'border-brand-600 bg-brand-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🧹</span>
                          <div>
                            <p className="font-medium text-ink-900">Be a cleaner</p>
                            <p className="text-xs text-ink-500">Offer cleaning services</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-ink-700">
                        First name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                        <input
                          {...form.register('firstName')}
                          className="input pl-10"
                          placeholder="Grace"
                        />
                      </div>
                      {form.formState.errors.firstName && (
                        <p className="mt-1 text-xs text-red-500">
                          {form.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-ink-700">
                        Last name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                        <input
                          {...form.register('lastName')}
                          className="input pl-10"
                          placeholder="Muthoni"
                        />
                      </div>
                      {form.formState.errors.lastName && (
                        <p className="mt-1 text-xs text-red-500">
                          {form.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink-700">
                      Email (optional)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input
                        {...form.register('email')}
                        className="input pl-10"
                        placeholder="grace@email.com"
                        type="email"
                      />
                    </div>
                    {form.formState.errors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink-700">
                      Phone number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input
                        {...form.register('phone')}
                        className="input pl-11"
                        placeholder="+254 712 345 678"
                        type="tel"
                      />
                    </div>
                    {form.formState.errors.phone && (
                      <p className="mt-1 text-xs text-red-500">
                        {form.formState.errors.phone.message}
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
                    disabled={form.formState.isSubmitting}
                    className="btn-primary w-full py-3.5 text-base"
                  >
                    {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send verification code
                  </button>

                  <p className="text-center text-sm text-ink-500">
                    Already have an account?{' '}
                    <Link href={signInHref} className="font-semibold text-brand-700 hover:underline">
                      Sign in
                    </Link>
                  </p>
                </form>
              ) : (
                <form onSubmit={form.handleSubmit(onOtpSubmit)} className="space-y-6">
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
                    <input
                      {...form.register('otp')}
                      className="input text-center font-mono text-2xl tracking-[0.45em]"
                      placeholder="000000"
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                    />
                    {form.formState.errors.otp && (
                      <p className="mt-1 text-xs text-red-500">
                        {form.formState.errors.otp.message}
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
                    disabled={form.formState.isSubmitting}
                    className="btn-primary w-full py-3.5 text-base"
                  >
                    {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create account
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('details');
                      setError('');
                    }}
                    className="btn-ghost w-full"
                  >
                    Change details
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

function RegisterPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-8 text-center shadow-card">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-700" />
        <p className="mt-4 text-sm text-ink-500">Loading registration...</p>
      </div>
    </div>
  );
}
