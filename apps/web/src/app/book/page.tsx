'use client';
// Mama Fua — Booking Flow Controller
// KhimTech | 2026

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { CalendarDays, CreditCard, MapPin, Sparkles, UserRound } from 'lucide-react';
import { bookingApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import StepService from '@/components/booking/StepService';
import StepLocation from '@/components/booking/StepLocation';
import StepDateTime from '@/components/booking/StepDateTime';
import StepCleaner from '@/components/booking/StepCleaner';
import StepConfirm from '@/components/booking/StepConfirm';

export type BookingMode = 'AUTO_ASSIGN' | 'BROWSE_PICK' | 'POST_BID';
export type BookingType = 'ONE_OFF' | 'RECURRING';
export type RecurringFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
export type PaymentMethod = 'MPESA' | 'WALLET' | 'CASH';

export interface BookingDraft {
  serviceId: string;
  serviceName: string;
  baseServicePrice: number;
  servicePrice: number;
  mode: BookingMode;
  bookingType: BookingType;
  recurringFrequency?: RecurringFrequency | undefined;
  specialInstructions?: string | undefined;
  addressId?: string | undefined;
  address?:
    | {
        label: string;
        addressLine1: string;
        area: string;
        city: string;
        lat: number;
        lng: number;
        instructions?: string;
        saveAddress?: boolean;
      }
    | undefined;
  scheduledAt?: string | undefined;
  paymentMethod: PaymentMethod;
  mpesaPhone?: string | undefined;
  cleanerId?: string | undefined;
  cleanerProfile?:
    | {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        rating: number;
        totalReviews: number;
        servicePrice: number;
        distanceKm: number;
        nextAvailableLabel: string;
      }
    | undefined;
}

const BOOKING_RESUME_STORAGE_KEY = 'mama-fua-booking-resume';

function getDefaultDraft(phone?: string | null): Partial<BookingDraft> {
  return {
    mode: 'AUTO_ASSIGN',
    bookingType: 'ONE_OFF',
    paymentMethod: 'MPESA',
    ...(phone ? { mpesaPhone: phone } : {}),
  };
}

function buildResumeHref(searchParams: { toString(): string }) {
  const params = new URLSearchParams(searchParams.toString());
  params.set('resume', '1');
  const query = params.toString();
  return query.length > 0 ? `/book?${query}` : '/book';
}

export default function BookPage() {
  return (
    <Suspense fallback={<BookPageFallback />}>
      <BookPageContent />
    </Suspense>
  );
}

function BookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Partial<BookingDraft>>(getDefaultDraft(user?.phone));
  const [resumeNotice, setResumeNotice] = useState<string | null>(null);

  const createBooking = useMutation({
    mutationFn: (data: BookingDraft) => bookingApi.create(data),
    onSuccess: (res) => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(BOOKING_RESUME_STORAGE_KEY);
      }
      router.push(`/bookings/${res.data.data.id}?new=1`);
    },
  });

  useEffect(() => {
    if (!user?.phone) return;

    setDraft((prev) => {
      if (prev.mpesaPhone) return prev;
      return {
        ...prev,
        mpesaPhone: user.phone,
      };
    });
  }, [user?.phone]);

  useEffect(() => {
    if (searchParams.get('resume') !== '1' || typeof window === 'undefined') {
      return;
    }

    const raw = window.sessionStorage.getItem(BOOKING_RESUME_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        step?: number;
        draft?: Partial<BookingDraft>;
      };

      if (parsed.draft) {
        setDraft({
          ...getDefaultDraft(user?.phone),
          ...parsed.draft,
          ...(parsed.draft.mpesaPhone || !user?.phone ? {} : { mpesaPhone: user.phone }),
        });
      }

      if (typeof parsed.step === 'number' && Number.isFinite(parsed.step)) {
        setStep(Math.max(0, Math.floor(parsed.step)));
      }

      setResumeNotice('Your booking draft was restored so you can continue where you left off.');
    } catch {
      window.sessionStorage.removeItem(BOOKING_RESUME_STORAGE_KEY);
    }
  }, [searchParams, user?.phone]);

  const updateDraft = (updates: Partial<BookingDraft>) => {
    setResumeNotice(null);
    setDraft((prev) => {
      const nextDraft = { ...prev, ...updates };
      const nextMode = updates.mode ?? prev.mode;
      const shouldResetCleaner =
        nextMode !== 'BROWSE_PICK' ||
        'serviceId' in updates ||
        'addressId' in updates ||
        'address' in updates ||
        'scheduledAt' in updates;

      if (shouldResetCleaner) {
        nextDraft.cleanerId = undefined;
        nextDraft.cleanerProfile = undefined;
        if (nextDraft.baseServicePrice != null) {
          nextDraft.servicePrice = nextDraft.baseServicePrice;
        }
      }

      return nextDraft;
    });
  };

  const steps =
    draft.mode === 'BROWSE_PICK'
      ? ['Service', 'Location', 'Date & Time', 'Cleaner', 'Confirm']
      : ['Service', 'Location', 'Date & Time', 'Confirm'];
  const stepDescriptions =
    draft.mode === 'BROWSE_PICK'
      ? [
          'Pick the service you want.',
          'Add the address for the job.',
          'Set the preferred date and time.',
          'Browse available cleaners in your area.',
          'Review the booking before sending the request.',
        ]
      : [
          'Pick the service you want.',
          'Add the address for the job.',
          'Set the preferred date and time.',
          'Review the booking before payment.',
        ];

  useEffect(() => {
    setStep((currentStep) => Math.min(currentStep, steps.length - 1));
  }, [steps.length]);

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const progress = ((step + 1) / steps.length) * 100;
  const currentStepLabel = steps[step] ?? steps[steps.length - 1] ?? 'Step';
  const currentStepDescription =
    stepDescriptions[step] ?? stepDescriptions[stepDescriptions.length - 1] ?? '';

  const handleConfirm = () => {
    if (!user) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          BOOKING_RESUME_STORAGE_KEY,
          JSON.stringify({ step, draft })
        );
      }

      router.push(
        `/login?role=CLIENT&next=${encodeURIComponent(buildResumeHref(searchParams))}`
      );
      return;
    }

    if (user.role !== 'CLIENT') {
      return;
    }

    createBooking.mutate(draft as BookingDraft);
  };

  const summary = [
    {
      label: 'Service',
      value: draft.serviceName ?? 'Choose a service',
      icon: Sparkles,
    },
    {
      label: 'Location',
      value: draft.address
        ? `${draft.address.label} · ${draft.address.area}`
        : draft.addressId
          ? 'Saved address selected'
          : 'Add an address',
      icon: MapPin,
    },
    {
      label: 'Schedule',
      value: draft.scheduledAt
        ? new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(
            new Date(draft.scheduledAt)
          )
        : 'Pick a date and time',
      icon: CalendarDays,
    },
    {
      label: 'Payment',
      value:
        draft.paymentMethod === 'MPESA'
          ? 'M-Pesa'
          : draft.paymentMethod === 'WALLET'
            ? 'Wallet'
            : draft.paymentMethod === 'CASH'
              ? 'Cash on completion'
              : 'Choose payment',
      icon: CreditCard,
    },
  ];

  if (draft.mode === 'BROWSE_PICK') {
    summary.splice(3, 0, {
      label: 'Cleaner',
      value: draft.cleanerProfile
        ? `${draft.cleanerProfile.firstName} ${draft.cleanerProfile.lastName}`
        : 'Choose a cleaner',
      icon: UserRound,
    });
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="section-shell px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start gap-4">
            <button
              onClick={() => (step === 0 ? router.back() : back())}
              className="btn-ghost px-4 py-2.5 text-sm"
            >
              ← {step === 0 ? 'Cancel' : 'Back'}
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-brand-700">
                Step {step + 1} of {steps.length}
              </p>
              <h1 className="mt-1 text-3xl">{currentStepLabel}</h1>
              <p className="mt-2 text-sm text-ink-500">{currentStepDescription}</p>
            </div>
          </div>

          {resumeNotice && (
            <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-4 text-sm text-brand-800">
              {resumeNotice}
            </div>
          )}

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div
            className={`mt-4 grid gap-2 ${
              draft.mode === 'BROWSE_PICK' ? 'sm:grid-cols-5' : 'sm:grid-cols-4'
            }`}
          >
            {steps.map((label, index) => (
              <div
                key={label}
                className={`rounded-xl border px-3 py-3 text-sm ${
                  index === step
                    ? 'border-brand-200 bg-brand-50 text-brand-800'
                    : index < step
                      ? 'border-mint-200 bg-mint-50 text-mint-800'
                      : 'border-slate-200 bg-white text-ink-400'
                }`}
              >
                <p className="font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <section className="section-shell px-5 py-6 sm:px-8 sm:py-8">
            {step === 0 && (
              <StepService
                draft={draft}
                onChange={updateDraft}
                onNext={next}
                prefillService={searchParams.get('service')}
              />
            )}
            {step === 1 && (
              <StepLocation
                draft={draft}
                onChange={updateDraft}
                onNext={next}
                canUseSavedAddresses={user?.role === 'CLIENT'}
              />
            )}
            {step === 2 && (
              <StepDateTime
                draft={draft}
                onChange={updateDraft}
                onNext={next}
                {...(draft.mode === 'BROWSE_PICK'
                  ? { nextLabel: 'Continue to cleaner selection' }
                  : {})}
              />
            )}
            {draft.mode === 'BROWSE_PICK' && step === 3 && (
              <StepCleaner draft={draft} onChange={updateDraft} onNext={next} />
            )}
            {step === steps.length - 1 && (
              <StepConfirm
                draft={draft as BookingDraft}
                onChange={updateDraft}
                onConfirm={handleConfirm}
                isLoading={createBooking.isPending}
                error={createBooking.error as Error | null}
                stepNumber={steps.length}
                canLoadProfile={user?.role === 'CLIENT'}
                submitLabel={
                  !user
                    ? 'Continue to sign in'
                    : user.role !== 'CLIENT'
                      ? 'Client account required'
                      : undefined
                }
                notice={
                  !user
                    ? {
                        tone: 'info',
                        title: 'Sign in at the last step',
                        body: 'We let you build the booking first. When you continue, we will sign you in and bring you back to this draft.',
                      }
                    : user.role !== 'CLIENT'
                      ? {
                          tone: 'error',
                          title: 'Client account required',
                          body: 'Only client accounts can place bookings. Sign in with a client account to finish this booking.',
                        }
                      : null
                }
                disableSubmit={!!user && user.role !== 'CLIENT'}
              />
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
            <div className="dark-panel px-6 py-6">
              <p className="text-sm font-medium text-brand-100">Booking summary</p>
              <h2 className="mt-2 text-3xl text-white">Keep track of the draft as you go.</h2>
              <p className="mt-3 text-sm leading-7 text-white/70">
                The form stays focused on the left. The key decisions stay visible here.
              </p>
            </div>

            <div className="section-shell p-5">
              <div className="space-y-3">
                {summary.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                        <item.icon className="h-5 w-5 text-brand-700" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm font-medium text-ink-800">{item.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function BookPageFallback() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="section-shell px-5 py-5 sm:px-6">
          <div className="h-6 w-28 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-10 w-48 animate-pulse rounded-2xl bg-slate-200" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-6 h-2 rounded-full bg-slate-100" />
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <section className="section-shell px-5 py-6 sm:px-8 sm:py-8">
            <div className="space-y-4">
              <div className="h-8 w-40 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-24 animate-pulse rounded-[1.6rem] bg-slate-100" />
              <div className="h-24 animate-pulse rounded-[1.6rem] bg-slate-100" />
              <div className="h-24 animate-pulse rounded-[1.6rem] bg-slate-100" />
            </div>
          </section>

          <aside className="space-y-4">
            <div className="dark-panel px-6 py-6">
              <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
              <div className="mt-4 h-10 w-56 animate-pulse rounded-2xl bg-white/10" />
            </div>
            <div className="section-shell p-5">
              <div className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
                  />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
