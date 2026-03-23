'use client';
// Mama Fua — Booking Flow Controller
// KhimTech | 2026

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { bookingApi, locationApi } from '@/lib/api';
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
  // Step 1
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  mode: BookingMode;
  bookingType: BookingType;
  recurringFrequency?: RecurringFrequency;
  specialInstructions?: string;
  // Step 2
  addressId?: string;
  address?: {
    label: string;
    addressLine1: string;
    area: string;
    city: string;
    lat: number;
    lng: number;
    instructions?: string;
    saveAddress?: boolean;
  };
  // Step 3
  scheduledAt?: string;
  // Step 4
  paymentMethod: PaymentMethod;
  mpesaPhone?: string;
  cleanerId?: string;
}

const STEPS = ['Service', 'Location', 'Date & Time', 'Confirm'] as const;

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

  const handleConfirm = () => {
    createBooking.mutate(draft as BookingDraft);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => step === 0 ? router.back() : back()}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← {step === 0 ? 'Cancel' : 'Back'}
            </button>
            <span className="text-sm text-gray-400 ml-auto">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1.5">
            {STEPS.map((label, i) => (
              <div key={label} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-brand-600' : 'bg-gray-200'
                }`} />
                <p className={`text-xs mt-1.5 font-medium transition-colors ${
                  i === step ? 'text-brand-600' : i < step ? 'text-gray-400' : 'text-gray-300'
                }`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="mx-auto max-w-2xl px-6 py-8">
        {step === 0 && (
          <StepService
            draft={draft}
            onChange={updateDraft}
            onNext={next}
          />
        )}
        {step === 1 && (
          <StepLocation
            draft={draft}
            onChange={updateDraft}
            onNext={next}
          />
        )}
        {step === 2 && (
          <StepDateTime
            draft={draft}
            onChange={updateDraft}
            onNext={next}
          />
        )}
        {step === 3 && (
          <StepConfirm
            draft={draft as BookingDraft}
            onChange={updateDraft}
            onConfirm={handleConfirm}
            isLoading={createBooking.isPending}
            error={createBooking.error as Error | null}
          />
        )}
      </div>
    </div>
  );
}
