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

export default function MpesaPayModal({ bookingId, amount, defaultPhone, onClose, onSuccess }: Props) {
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

  const startPolling = (cid: string) => {
    let attempts = 0;
    const maxAttempts = 12; // poll for 60s (every 5s)

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/payments/mpesa/status/${cid}`);
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
      style={{ background: 'rgba(0,0,0,0.5)' }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && step !== 'pending' && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-green-100 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Pay via M-Pesa</p>
              <p className="text-xs text-gray-500">{formatKES(amount)}</p>
            </div>
          </div>
          {step !== 'pending' && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="px-6 py-6">
          {/* Step: Input phone */}
          {step === 'input' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  M-Pesa phone number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 712 345 678"
                  className="input text-lg font-medium"
                  autoFocus
                />
                {phone && !isValidPhone && (
                  <p className="text-xs text-red-500 mt-1">Enter a valid Kenyan M-Pesa number</p>
                )}
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-sm text-green-800">
                <p className="font-semibold mb-1">How it works:</p>
                <ol className="space-y-1 list-decimal list-inside text-green-700">
                  <li>Tap the button below</li>
                  <li>A prompt appears on your phone</li>
                  <li>Enter your M-Pesa PIN to confirm</li>
                </ol>
              </div>
              <button
                onClick={() => initiateMutation.mutate()}
                disabled={!isValidPhone || initiateMutation.isPending}
                className="btn-primary w-full py-4 text-base bg-green-600 hover:bg-green-700 focus:ring-green-400"
              >
                {initiateMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending prompt...
                  </span>
                ) : (
                  `Send M-Pesa prompt → ${normalised}`
                )}
              </button>
            </div>
          )}

          {/* Step: Pending */}
          {step === 'pending' && (
            <div className="text-center py-4 space-y-5">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-40" />
                <div className="relative h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                  <Smartphone className="h-9 w-9 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Check your phone</h3>
                <p className="text-gray-500 text-sm mt-1">
                  An M-Pesa payment prompt has been sent to
                </p>
                <p className="font-semibold text-gray-800 mt-0.5">{normalised}</p>
              </div>
              <p className="text-sm text-gray-400">
                Enter your M-Pesa PIN on your phone to confirm payment of{' '}
                <span className="font-semibold text-gray-700">{formatKES(amount)}</span>
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Waiting for confirmation...
              </div>
              <p className="text-xs text-gray-300">This will automatically update when payment is confirmed</p>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payment confirmed!</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {formatKES(amount)} received successfully
                </p>
              </div>
              {receiptNumber && (
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-xs text-green-600 font-medium">M-Pesa Receipt</p>
                  <p className="text-lg font-bold text-green-800 font-mono">{receiptNumber}</p>
                </div>
              )}
              <p className="text-sm text-gray-500">
                Your booking is confirmed. You'll be redirected automatically.
              </p>
            </div>
          )}

          {/* Step: Failed */}
          {step === 'failed' && (
            <div className="text-center py-4 space-y-5">
              <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payment failed</h3>
                <p className="text-gray-500 text-sm mt-1">{failureReason}</p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => { setStep('input'); setFailureReason(''); }}
                  className="btn-primary w-full"
                >
                  <RefreshCw className="h-4 w-4" /> Try again
                </button>
                <button onClick={onClose} className="btn-ghost w-full">
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
