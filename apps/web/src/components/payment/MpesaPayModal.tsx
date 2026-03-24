'use client';
// Mama Fua — M-Pesa Pay Modal
// KhimTech | 2026

import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { normalisePhone, formatKES } from '@mama-fua/shared';
import { X, Smartphone, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  bookingId: string;
  amount: number;
  defaultPhone: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'input' | 'pending' | 'success' | 'failed';

export default function MpesaPayModal({
  bookingId,
  amount,
  defaultPhone,
  onClose,
  onSuccess,
}: Props) {
  const [phone, setPhone] = useState(defaultPhone);
  const [step, setStep] = useState<Step>('input');
  const [checkoutId, setCheckoutId] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const pollRef = useRef<NodeJS.Timeout>();

  const initiateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/payments/mpesa/initiate', {
        bookingId,
        phone: normalisePhone(phone),
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setCheckoutId(data.checkoutRequestId);
      setStep('pending');
      startPolling(data.checkoutRequestId);
    },
    onError: (err: Error & { response?: { data?: { error?: { message?: string } } } }) => {
      setFailureReason(err.response?.data?.error?.message ?? 'Failed to initiate payment');
      setStep('failed');
    },
  });

  const startPolling = (requestId: string) => {
    let attempts = 0;
    const maxAttempts = 12;

    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const res = await api.get(`/payments/mpesa/status/${requestId}`);
        const payment = res.data.data;

        if (payment.status === 'SUCCEEDED') {
          clearInterval(pollRef.current);
          setReceiptNumber(payment.mpesaReceiptNumber ?? '');
          setStep('success');
          setTimeout(onSuccess, 2000);
        } else if (payment.status === 'FAILED') {
          clearInterval(pollRef.current);
          setFailureReason(payment.failureReason ?? 'Payment was not completed');
          setStep('failed');
        } else if (attempts >= maxAttempts) {
          clearInterval(pollRef.current);
          setStep('failed');
          setFailureReason('Payment timed out. Please try again.');
        }
      } catch {
        // Silently continue polling on network error
      }
    }, 5000);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  const normalised = normalisePhone(phone);
  const isValidPhone = normalised.startsWith('+254') && normalised.length === 13;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/55 p-4 backdrop-blur-sm sm:items-center"
      onClick={(event) => event.target === event.currentTarget && step !== 'pending' && onClose()}
    >
      <div className="section-shell shine-panel w-full max-w-md overflow-hidden">
        <div className="dark-panel shine-panel rounded-none border-0 px-6 py-5 shadow-none">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <Smartphone className="h-5 w-5 text-mint-300" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Pay via M-Pesa</p>
                <p className="text-sm text-white/72">{formatKES(amount)}</p>
              </div>
            </div>
            {step !== 'pending' && (
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/15"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-6">
          {step === 'input' && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">
                  M-Pesa phone number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+254 712 345 678"
                  className="input text-lg font-semibold"
                  autoFocus
                />
                {phone && !isValidPhone && (
                  <p className="mt-2 text-xs text-red-500">Enter a valid Kenyan M-Pesa number</p>
                )}
              </div>

              <div className="card-muted shine-panel p-4">
                <p className="text-sm font-semibold text-ink-900">How it works</p>
                <ol className="mt-3 space-y-2 text-sm text-ink-600">
                  <li>1. Tap the button below.</li>
                  <li>2. Approve the prompt on your phone.</li>
                  <li>3. Enter your M-Pesa PIN to finish payment.</li>
                </ol>
              </div>

              <button
                onClick={() => initiateMutation.mutate()}
                disabled={!isValidPhone || initiateMutation.isPending}
                className="btn-primary w-full py-4 text-base"
              >
                {initiateMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending prompt...
                  </span>
                ) : (
                  `Send prompt to ${normalised}`
                )}
              </button>
            </div>
          )}

          {step === 'pending' && (
            <div className="space-y-5 py-2 text-center">
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-mint-100 animate-ping opacity-50" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-50 to-mint-50">
                  <Smartphone className="h-9 w-9 text-brand-700" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl text-ink-900">Check your phone</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  An M-Pesa prompt has been sent to{' '}
                  <span className="font-semibold text-ink-800">{normalised}</span>.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-brand-100 bg-brand-50/70 px-4 py-4">
                <p className="text-sm text-ink-600">
                  Waiting for confirmation of{' '}
                  <span className="font-semibold text-ink-900">{formatKES(amount)}</span>.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink-400 shadow-soft">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Listening for payment status...
              </div>
              <p className="text-xs text-ink-300">Request ID: {checkoutId}</p>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 py-2 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-50 to-mint-50">
                <CheckCircle className="h-10 w-10 text-mint-700" />
              </div>
              <div>
                <h3 className="text-3xl text-ink-900">Payment confirmed</h3>
                <p className="mt-2 text-sm text-ink-500">
                  {formatKES(amount)} received successfully.
                </p>
              </div>
              {receiptNumber && (
                <div className="card-muted shine-panel p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
                    M-Pesa receipt
                  </p>
                  <p className="mt-2 font-mono text-xl font-semibold text-ink-900">
                    {receiptNumber}
                  </p>
                </div>
              )}
              <p className="text-sm text-ink-500">
                Your booking is confirmed. Redirecting automatically.
              </p>
            </div>
          )}

          {step === 'failed' && (
            <div className="space-y-5 py-2 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <div>
                <h3 className="text-3xl text-ink-900">Payment failed</h3>
                <p className="mt-2 text-sm text-ink-500">{failureReason}</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setStep('input');
                    setFailureReason('');
                  }}
                  className="btn-primary w-full"
                >
                  <RefreshCw className="h-4 w-4" /> Try again
                </button>
                <button onClick={onClose} className="btn-secondary w-full">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
