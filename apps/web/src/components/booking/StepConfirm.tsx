'use client';
// Mama Fua — Step 4: Confirm & Pay
// KhimTech | 2026

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatKES, COMMISSION } from '@mama-fua/shared';
import { userApi } from '@/lib/api';
import {
  MapPin,
  Calendar,
  Zap,
  Search,
  MessageSquare,
  Wallet,
  Banknote,
  Smartphone,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { BookingDraft, PaymentMethod } from '@/app/book/page';

interface Props {
  draft: BookingDraft;
  onChange: (updates: Partial<BookingDraft>) => void;
  onConfirm: () => void;
  isLoading: boolean;
  error: Error | null;
}

const MODE_LABELS = {
  AUTO_ASSIGN: 'Auto-assign',
  BROWSE_PICK: 'Browse & pick',
  POST_BID: 'Post & bid',
} as const;

const MODE_ICONS = {
  AUTO_ASSIGN: <Zap className="h-4 w-4" />,
  BROWSE_PICK: <Search className="h-4 w-4" />,
  POST_BID: <MessageSquare className="h-4 w-4" />,
} as const;

interface PaymentOption {
  value: PaymentMethod;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

export default function StepConfirm({ draft, onChange, onConfirm, isLoading, error }: Props) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { data: profileRes } = useQuery({
    queryKey: ['my-profile-confirm'],
    queryFn: () => userApi.me(),
  });

  const walletBalance: number = profileRes?.data?.data?.clientProfile?.walletBalance ?? 0;
  const platformFee = Math.round(draft.servicePrice * COMMISSION.STANDARD);
  const cleanerEarnings = draft.servicePrice - platformFee;

  const paymentOptions: PaymentOption[] = [
    {
      value: 'MPESA',
      label: 'M-Pesa',
      desc: 'Pay via Safaricom M-Pesa STK Push.',
      icon: <Smartphone className="h-5 w-5 text-mint-700" />,
    },
    {
      value: 'WALLET',
      label: 'Wallet',
      desc: `Balance: ${formatKES(walletBalance)}${walletBalance < draft.servicePrice ? ' — insufficient' : ''}`,
      icon: <Wallet className="h-5 w-5 text-brand-700" />,
    },
    {
      value: 'CASH',
      label: 'Cash on completion',
      desc: 'Pay directly to the cleaner after the job is done.',
      icon: <Banknote className="h-5 w-5 text-amber-600" />,
    },
  ];

  const canPay =
    agreedToTerms && (draft.paymentMethod !== 'WALLET' || walletBalance >= draft.servicePrice);

  const addressDisplay = draft.address
    ? `${draft.address.addressLine1}, ${draft.address.area}`
    : 'Saved address';

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <span className="pill">Step 4</span>
        <div>
          <h1 className="text-4xl text-ink-900">Review your booking</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Confirm the details, choose a payment method, and finish the booking.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.8rem] border border-white/90 bg-white/84 shadow-card backdrop-blur">
        <div className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-400">Service</p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold text-ink-900">{draft.serviceName}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="badge bg-brand-50 text-brand-800">
                  {MODE_ICONS[draft.mode]}
                  {MODE_LABELS[draft.mode]}
                </span>
                {draft.bookingType === 'RECURRING' && (
                  <span className="badge bg-mint-100 text-mint-800">
                    {draft.recurringFrequency?.toLowerCase()}
                  </span>
                )}
              </div>
            </div>
            <p className="text-3xl font-semibold text-ink-900">{formatKES(draft.servicePrice)}</p>
          </div>
        </div>

        <div className="border-t border-brand-50 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-400">Location</p>
          <div className="mt-3 flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
            <div>
              <p className="text-sm font-medium text-ink-800">{addressDisplay}</p>
              {(draft.address?.instructions || draft.specialInstructions) && (
                <p className="mt-1 text-sm text-ink-500">
                  {draft.address?.instructions || draft.specialInstructions}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-brand-50 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-400">
            Date & time
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Calendar className="h-4 w-4 flex-shrink-0 text-brand-600" />
            <p className="text-sm font-medium text-ink-800">
              {format(new Date(draft.scheduledAt!), "EEEE, dd MMMM yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>

        <div className="border-t border-brand-50 bg-gradient-to-br from-brand-50/80 to-mint-50/80 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-400">
            Price breakdown
          </p>
          <div className="mt-3 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Service price</span>
              <span className="font-medium text-ink-900">{formatKES(draft.servicePrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Platform fee (15%)</span>
              <span className="text-ink-700">{formatKES(platformFee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Cleaner earns</span>
              <span className="text-ink-700">{formatKES(cleanerEarnings)}</span>
            </div>
            <div className="flex justify-between border-t border-white/80 pt-3">
              <span className="font-semibold text-ink-900">Total charged</span>
              <span className="text-lg font-semibold text-ink-900">
                {formatKES(draft.servicePrice)}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Payment is held in escrow until the job is complete and confirmed.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-3xl text-ink-900">Payment method</h2>
          <p className="mt-2 text-sm text-ink-500">Choose how you want to settle this booking.</p>
        </div>

        <div className="space-y-3">
          {paymentOptions.map((option) => {
            const selected = draft.paymentMethod === option.value;
            const isWalletInsufficient =
              option.value === 'WALLET' && walletBalance < draft.servicePrice;

            return (
              <button
                key={option.value}
                onClick={() => !isWalletInsufficient && onChange({ paymentMethod: option.value })}
                disabled={isWalletInsufficient}
                className={`flex w-full items-center gap-4 rounded-[1.5rem] border px-4 py-4 text-left transition-all duration-200 ${
                  selected
                    ? 'border-brand-200 bg-brand-50 text-ink-900 shadow-soft'
                    : isWalletInsufficient
                      ? 'border-transparent bg-white/50 text-ink-300'
                      : 'border-white/90 bg-white/84 text-ink-900 shadow-soft hover:-translate-y-0.5 hover:border-brand-100'
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${selected ? 'border border-brand-100 bg-white' : 'bg-white shadow-soft'}`}
                >
                  {option.icon}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{option.label}</p>
                  <p
                    className={`mt-1 text-sm ${isWalletInsufficient ? 'text-red-400' : 'text-ink-500'}`}
                  >
                    {option.desc}
                  </p>
                </div>
                {selected && <CheckCircle className="h-5 w-5 text-brand-600" />}
              </button>
            );
          })}
        </div>

        {draft.paymentMethod === 'MPESA' && (
          <div className="card-muted shine-panel p-5">
            <label className="mb-2 block text-sm font-medium text-ink-700">
              M-Pesa phone number
            </label>
            <input
              type="tel"
              value={draft.mpesaPhone ?? ''}
              onChange={(event) => onChange({ mpesaPhone: event.target.value })}
              placeholder="+254 712 345 678"
              className="input"
            />
            <p className="mt-2 text-xs text-ink-500">
              You&apos;ll receive a payment prompt on this number.
            </p>
          </div>
        )}
      </div>

      <label className="flex items-start gap-3 rounded-[1.5rem] border border-white/90 bg-white/74 px-4 py-4 text-sm text-ink-600 shadow-soft backdrop-blur">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(event) => setAgreedToTerms(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-brand-200 text-brand-600 focus:ring-brand-400"
        />
        <span>
          I agree to the{' '}
          <a href="/terms" className="font-semibold text-brand-700 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="font-semibold text-brand-700 hover:underline">
            Privacy Policy
          </a>
          . I understand that payment will be held in escrow until I confirm the job is complete.
        </span>
      </label>

      {error && (
        <div className="flex items-start gap-3 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-800">Booking failed</p>
            <p className="mt-1 text-sm text-red-600">
              {(error as Error & { response?: { data?: { error?: { message?: string } } } })
                ?.response?.data?.error?.message ?? error.message}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onConfirm}
        disabled={!canPay || isLoading}
        className="btn-primary w-full py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Creating booking...
          </span>
        ) : (
          `Confirm & pay ${formatKES(draft.servicePrice)}`
        )}
      </button>

      <div className="dark-panel shine-panel px-5 py-5">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-mint-300" />
          <p className="text-sm leading-6 text-white/72">
            Your payment stays protected by escrow. Funds are only released after you confirm the
            job is done.
          </p>
        </div>
      </div>
    </div>
  );
}
