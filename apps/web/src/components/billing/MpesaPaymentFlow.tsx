'use client';
// Mama Fua — M-Pesa Payment Flow Component
// KhimTech | 2026

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Smartphone, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  Info,
  X,
  Loader2
} from 'lucide-react';
import { formatKES } from '@mama-fua/shared';

const mpesaFormSchema = z.object({
  phone: z.string().regex(/^254[0-9]{9}$/, 'Enter a valid Kenyan phone number'),
  amount: z.number().min(100, 'Minimum amount is KES 100').max(150000, 'Maximum amount is KES 150,000'),
  confirmAmount: z.number(),
});

type MpesaFormData = z.infer<typeof mpesaFormSchema>;

interface MpesaPaymentFlowProps {
  amount: number;
  bookingRef: string;
  onSuccess: (result: { checkoutRequestId: string; transactionId: string }) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  className?: string;
}

export function MpesaPaymentFlow({
  amount,
  bookingRef,
  onSuccess,
  onError,
  onCancel,
  className = '',
}: MpesaPaymentFlowProps) {
  const [step, setStep] = useState<'form' | 'processing' | 'prompt' | 'success' | 'failed' | 'timeout'>('form');
  const [countdown, setCountdown] = useState(60);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<MpesaFormData>({
    resolver: zodResolver(mpesaFormSchema),
    defaultValues: {
      phone: '',
      amount: amount,
      confirmAmount: amount,
    },
  });

  // Countdown timer for STK push
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (step === 'prompt' && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setStep('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, countdown]);

  const handleSubmit = async (data: MpesaFormData) => {
    if (data.amount !== data.confirmAmount) {
      form.setError('confirmAmount', { message: 'Amounts must match' });
      return;
    }

    setStep('processing');
    setError(null);

    try {
      // Mock API call - replace with actual implementation
      const response = await initiateMpesaPayment({
        phone: data.phone,
        amount: data.amount,
        bookingRef,
      });

      setTransactionId(response.transactionId);
      setCheckoutRequestId(response.checkoutRequestId);
      setStep('prompt');
      
      // Start countdown
      setCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setStep('failed');
      onError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  const handleRetry = () => {
    setStep('form');
    setError(null);
    setCountdown(60);
    form.reset();
  };

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  };

  const initiateMpesaPayment = async (data: { phone: string; amount: number; bookingRef: string }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      transactionId: `txn_${Date.now()}`,
      checkoutRequestId: `ws_CO_${Date.now()}`,
    };
  };

  // Render different steps
  switch (step) {
    case 'form':
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Smartphone className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-ink-900 mb-2">M-Pesa Payment</h3>
              <p className="text-ink-600">Enter your M-Pesa number to complete payment</p>
            </div>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">M-Pesa Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                  <input
                    {...form.register('phone')}
                    type="tel"
                    placeholder="254 XXX XXX XXX"
                    className="input pl-10"
                    maxLength={12}
                  />
                  {form.formState.errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Amount (KES)</label>
                <input
                  {...form.register('amount')}
                  type="number"
                  className="input"
                  readOnly
                />
                <p className="mt-1 text-sm text-ink-600">Amount to pay: {formatKES(amount)}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Confirm Amount</label>
                <input
                  {...form.register('confirmAmount')}
                  type="number"
                  placeholder="Enter amount again to confirm"
                  className="input"
                />
                {form.formState.errors.confirmAmount && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.confirmAmount.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="btn-primary flex-1 py-3"
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Pay with M-Pesa
                </button>
                
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn-ghost px-6 py-3"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-slate-600 mt-0.5" />
              <div className="text-sm text-slate-700">
                <h4 className="font-semibold text-slate-900 mb-1">How it works:</h4>
                <ol className="space-y-1 text-slate-600">
                  <li>1. Enter your M-Pesa number and confirm amount</li>
	                  <li>2. You&apos;ll receive an STK push prompt on your phone</li>
                  <li>3. Enter your M-Pesa PIN to complete payment</li>
                  <li>4. Payment will be confirmed automatically</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      );

    case 'processing':
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="rounded-xl border border-slate-200 bg-white p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-current border-t-transparent border-r-transparent border-b-transparent border-l-transparent"></div>
              <h3 className="text-xl font-semibold text-ink-900 mb-2">Initiating Payment</h3>
              <p className="text-ink-600">Sending payment request to M-Pesa...</p>
            </div>
          </div>
        </div>
      );

    case 'prompt':
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 h-16 w-16 animate-pulse rounded-full bg-green-100">
                <Smartphone className="h-8 w-8 text-green-600" />
              </div>
	              <h3 className="text-xl font-semibold text-ink-900 mb-2">Check Your Phone</h3>
	              <p className="text-ink-600 mb-4">
	                You should receive an M-Pesa prompt on:{' '}
	                <strong>{formatPhoneDisplay(form.getValues('phone'))}</strong>
	              </p>
              
              <div className="mb-4">
                <div className="mx-auto h-2 w-32 rounded-full bg-slate-200">
                  <div 
                    className="h-2 rounded-full bg-green-500 transition-all duration-1000"
                    style={{ width: `${((60 - countdown) / 60) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-600">Waiting for response... {countdown}s</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-ink-600">
                  <Info className="h-4 w-4" />
                  <span>Keep your phone unlocked and M-Pesa app open</span>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-sm text-ink-600">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Never share your PIN with anyone</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="btn-ghost px-6 py-3"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </button>
                
                <button
                  onClick={onCancel}
                  className="btn-ghost px-6 py-3 text-red-600"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      );

    case 'success':
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="rounded-xl border border-green-200 bg-green-50 p-6">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-green-600">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-green-900 mb-2">Payment Successful!</h3>
              <p className="text-green-700 mb-4">
                Your payment of {formatKES(amount)} has been processed successfully.
              </p>
              
              <div className="rounded-lg bg-white p-4 text-left">
                <h4 className="font-semibold text-ink-900 mb-3">Transaction Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-600">Transaction ID:</span>
                    <span className="font-medium text-ink-900">{transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600">Booking Reference:</span>
                    <span className="font-medium text-ink-900">{bookingRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600">Amount Paid:</span>
                    <span className="font-medium text-ink-900">{formatKES(amount)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (transactionId && checkoutRequestId) {
                    onSuccess({ transactionId, checkoutRequestId });
                  }
                }}
                className="btn-primary mt-6"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Continue
              </button>
            </div>
          </div>
        </div>
      );

    case 'failed':
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-red-600">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-red-900 mb-2">Payment Failed</h3>
              <p className="text-red-700 mb-4">
                {error || 'Payment could not be processed. Please try again.'}
              </p>
              
              <div className="space-y-3">
                <div className="rounded-lg bg-white p-4">
                  <h4 className="font-semibold text-ink-900 mb-2">What you can do:</h4>
                  <ul className="space-y-2 text-sm text-ink-600">
                    <li>• Check your M-Pesa balance</li>
                    <li>• Ensure you have sufficient funds</li>
                    <li>• Verify your phone number is correct</li>
                    <li>• Try again in a few minutes</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleRetry}
                    className="btn-primary px-6 py-3"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </button>
                  
                  <button
                    onClick={onCancel}
                    className="btn-ghost px-6 py-3"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'timeout':
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-amber-600">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-amber-900 mb-2">Payment Timeout</h3>
              <p className="text-amber-700 mb-4">
                The M-Pesa prompt was not responded to within 60 seconds.
              </p>
              
              <div className="space-y-3">
                <div className="rounded-lg bg-white p-4">
                  <h4 className="font-semibold text-ink-900 mb-2">Possible reasons:</h4>
                  <ul className="space-y-2 text-sm text-ink-600">
                    <li>• Phone was off or had no signal</li>
                    <li>• M-Pesa app was not open</li>
                    <li>• Insufficient funds in M-Pesa account</li>
                    <li>• Network congestion</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleRetry}
                    className="btn-primary px-6 py-3"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </button>
                  
                  <button
                    onClick={onCancel}
                    className="btn-ghost px-6 py-3"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
