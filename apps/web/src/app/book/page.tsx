'use client';
// Mama Fua — Booking Flow Controller
// KhimTech | 2026

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { CalendarDays, CreditCard, MapPin, Sparkles } from 'lucide-react';
import { bookingApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import StepService from '@/components/booking/StepService';
import StepLocation from '@/components/booking/StepLocation';
import StepDateTime from '@/components/booking/StepDateTime';
import StepConfirm from '@/components/booking/StepConfirm';

export type BookingMode = 'AUTO_ASSIGN' | 'BROWSE_PICK' | 'POST_BID';
export type BookingType = 'ONE_OFF' | 'RECURRING';
export type RecurringFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
export type PaymentMethod = 'MPESA' | 'WALLET' | 'CASH';

export interface BookingDraft {
  serviceId: string;
  serviceName: string;
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
}

const STEPS = ['Service', 'Location', 'Date & Time', 'Confirm'] as const;
const STEP_DESCRIPTIONS = [
  'Pick the service you want.',
  'Add the address for the job.',
  'Set the preferred date and time.',
  'Review the booking before payment.',
] as const;

export default function BookPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Partial<BookingDraft>>({
    mode: 'AUTO_ASSIGN',
    bookingType: 'ONE_OFF',
    paymentMethod: 'MPESA',
    mpesaPhone: user?.phone ?? '',
  });

  const createBooking = useMutation({
    mutationFn: (data: BookingDraft) => bookingApi.create(data),
    onSuccess: (res) => {
      router.push(`/bookings/${res.data.data.id}?new=1`);
    },
  });

  const updateDraft = (updates: Partial<BookingDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleConfirm = () => {
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
                Step {step + 1} of {STEPS.length}
              </p>
              <h1 className="mt-1 text-3xl">{STEPS[step]}</h1>
              <p className="mt-2 text-sm text-ink-500">{STEP_DESCRIPTIONS[step]}</p>
            </div>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {STEPS.map((label, index) => (
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
            {step === 0 && <StepService draft={draft} onChange={updateDraft} onNext={next} />}
            {step === 1 && <StepLocation draft={draft} onChange={updateDraft} onNext={next} />}
            {step === 2 && <StepDateTime draft={draft} onChange={updateDraft} onNext={next} />}
            {step === 3 && (
              <StepConfirm
                draft={draft as BookingDraft}
                onChange={updateDraft}
                onConfirm={handleConfirm}
                isLoading={createBooking.isPending}
                error={createBooking.error as Error | null}
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
