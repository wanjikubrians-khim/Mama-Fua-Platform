'use client';
// Mama Fua — Step 4: Confirm & Pay
// KhimTech | 2026

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatKES, normalisePhone, COMMISSION } from '@mama-fua/shared';
import { paymentsApi, userApi } from '@/lib/api';
import { MapPin, Calendar, Zap, Search, MessageSquare, CreditCard, Wallet, Banknote, Smartphone, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import type { BookingDraft, PaymentMethod } from '@/app/book/page';
import { useAuthStore } from '@/store/auth.store';

interface Props {
  draft: BookingDraft;
  onChange: (updates: Partial<BookingDraft>) => void;
  onConfirm: () => void;
  isLoading: boolean;
  error: Error | null;
}

const MODE_LABELS = { AUTO_ASSIGN: 'Auto-assign', BROWSE_PICK: 'Browse & pick', POST_BID: 'Post & bid' };
const MODE_ICONS = { AUTO_ASSIGN: <Zap className="h-4 w-4" />, BROWSE_PICK: <Search className="h-4 w-4" />, POST_BID: <MessageSquare className="h-4 w-4" /> };

interface PaymentOption {
  value: PaymentMethod;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

export default function StepConfirm({ draft, onChange, onConfirm, isLoading, error }: Props) {
  const user = useAuthStore((s) => s.user);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { data: profileRes } = useQuery({
    queryKey: ['my-profile-confirm'],
    queryFn: () => userApi.me(),
  });

  const walletBalance: number = profileRes?.data?.data?.clientProfile?.walletBalance ?? 0;

  // Commission calc for display
  const platformFee = Math.round(draft.servicePrice * COMMISSION.STANDARD);
  const cleanerEarnings = draft.servicePrice - platformFee;

  const paymentOptions: PaymentOption[] = [
    {
      value: 'MPESA',
      label: 'M-Pesa',
      desc: `Pay via Safaricom M-Pesa STK Push`,
      icon: <Smartphone className="h-5 w-5 text-green-600" />,
    },
    {
      value: 'WALLET',
      label: 'Wallet',
      desc: `Balance: ${formatKES(walletBalance)}${walletBalance < draft.servicePrice ? ' — insufficient' : ''}`,
      icon: <Wallet className="h-5 w-5 text-brand-600" />,
    },
    {
      value: 'CASH',
      label: 'Cash on completion',
      desc: 'Pay directly to cleaner after job is done',
      icon: <Banknote className="h-5 w-5 text-amber-600" />,
    },
  ];

  const canPay = agreedToTerms && (
    draft.paymentMethod !== 'WALLET' || walletBalance >= draft.servicePrice
  );

  const addressDisplay = draft.address
    ? `${draft.address.addressLine1}, ${draft.address.area}`
    : 'Saved address';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review your booking</h1>
        <p className="text-gray-500 mt-1">Confirm everything looks right before paying</p>
      </div>

      {/* Booking summary card */}
      <div className="card divide-y divide-gray-100 p-0 overflow-hidden">
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Service</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{draft.serviceName}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-600`}>
                  {MODE_ICONS[draft.mode]}
                  {MODE_LABELS[draft.mode]}
                </span>
                {draft.bookingType === 'RECURRING' && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                    {draft.recurringFrequency?.toLowerCase()}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatKES(draft.servicePrice)}</p>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Location</p>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-brand-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">{addressDisplay}</p>
          </div>
          {(draft.address?.instructions || draft.specialInstructions) && (
            <p className="text-xs text-gray-500 mt-1.5 pl-6">
              {draft.address?.instructions || draft.specialInstructions}
            </p>
          )}
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Date & time</p>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-600 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              {format(new Date(draft.scheduledAt!), "EEEE, dd MMMM yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="px-5 py-4 bg-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Price breakdown</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service price</span>
              <span className="text-gray-900">{formatKES(draft.servicePrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Platform fee (15%)</span>
              <span className="text-gray-400">{formatKES(platformFee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Cleaner earns</span>
              <span className="text-gray-400">{formatKES(cleanerEarnings)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Total charged</span>
              <span className="font-bold text-gray-900 text-lg">{formatKES(draft.servicePrice)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Payment held in escrow until job is complete and confirmed.
          </p>
        </div>
      </div>

      {/* Payment method */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Payment method</h2>
        <div className="space-y-2">
          {paymentOptions.map((opt) => {
            const selected = draft.paymentMethod === opt.value;
            const isWalletInsufficient = opt.value === 'WALLET' && walletBalance < draft.servicePrice;
            return (
              <button
                key={opt.value}
                onClick={() => !isWalletInsufficient && onChange({ paymentMethod: opt.value })}
                disabled={isWalletInsufficient}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  selected ? 'border-brand-600 bg-brand-50' : isWalletInsufficient ? 'border-gray-100 opacity-50 cursor-not-allowed bg-gray-50' : 'border-gray-200 bg-white hover:border-brand-200'
                }`}
              >
                <span className="p-2 rounded-xl bg-white border border-gray-100 flex-shrink-0">
                  {opt.icon}
                </span>
                <div className="flex-1">
                  <p className={`font-medium ${selected ? 'text-brand-900' : 'text-gray-900'}`}>{opt.label}</p>
                  <p className={`text-xs ${isWalletInsufficient ? 'text-red-400' : 'text-gray-500'}`}>{opt.desc}</p>
                </div>
                {selected && <CheckCircle className="h-5 w-5 text-brand-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* M-Pesa phone input */}
        {draft.paymentMethod === 'MPESA' && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">M-Pesa phone number</label>
            <input
              type="tel"
              value={draft.mpesaPhone ?? ''}
              onChange={(e) => onChange({ mpesaPhone: e.target.value })}
              placeholder="+254 712 345 678"
              className="input"
            />
            <p className="text-xs text-gray-400 mt-1">
              You will receive a payment prompt on this number.
            </p>
          </div>
        )}
      </div>

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-gray-600">
          I agree to the{' '}
          <a href="/terms" className="text-brand-600 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</a>.
          I understand that payment will be held in escrow until I confirm the job is complete.
        </span>
      </label>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Booking failed</p>
            <p className="text-sm text-red-600 mt-0.5">
              {(error as Error & { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? error.message}
            </p>
          </div>
        </div>
      )}

      {/* Confirm button */}
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

      <p className="text-center text-xs text-gray-400">
        🔒 Your payment is secured by escrow. Funds are only released after you confirm the job is done.
      </p>
    </div>
  );
}
