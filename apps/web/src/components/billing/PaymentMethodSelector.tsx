'use client';
// Mama Fua — Payment Method Selector Component
// KhimTech | 2026

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Banknote, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Trash2,
  ShieldCheck,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { formatKES } from '@mama-fua/shared';

const paymentMethodSchema = z.object({
  method: z.enum(['MPESA', 'STRIPE_CARD', 'WALLET', 'CASH']),
  saveCard: z.boolean().default(false),
});

type PaymentMethod = z.infer<typeof paymentMethodSchema>;

interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  createdAt: string;
}

interface PaymentMethodSelectorProps {
  amount: number;
  onPaymentSelect: (method: PaymentMethod) => void;
  onCardSelect?: (cardId: string) => void;
  className?: string;
  showCashOption?: boolean;
  disabled?: boolean;
}

export function PaymentMethodSelector({
  amount,
  onPaymentSelect,
  onCardSelect,
  className = '',
  showCashOption = false,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const user = useAuthStore((s) => s.user);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const form = useForm<PaymentMethod>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      method: 'MPESA',
      saveCard: false,
    },
  });

  // Load saved payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      setIsLoading(true);
      try {
        // Mock data - replace with actual API calls
        setSavedCards([
          {
            id: '1',
            last4: '4242',
            brand: 'visa',
            expiryMonth: 12,
            expiryYear: 2025,
            isDefault: true,
            createdAt: '2024-01-15T10:30:00Z',
          },
          {
            id: '2',
            last4: '5555',
            brand: 'mastercard',
            expiryMonth: 8,
            expiryYear: 2024,
            isDefault: false,
            createdAt: '2023-06-20T14:15:00Z',
          },
        ]);
        
        setWalletBalance(2500); // KES 25.00
      } catch (error) {
        console.error('Failed to load payment methods:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentMethods();
  }, []);

  const selectedMethod = form.watch('method');

  const handleMethodSelect = (method: string) => {
    form.setValue('method', method as any);
    if (method === 'STRIPE_CARD' && !selectedCard) {
      // Select first card if none selected
      const defaultCard = savedCards.find(card => card.isDefault);
      if (defaultCard) {
        setSelectedCard(defaultCard.id);
      }
    }
  };

  const handleCardSelect = (cardId: string) => {
    setSelectedCard(cardId);
    if (onCardSelect) {
      onCardSelect(cardId);
    }
  };

  const handleSubmit = (data: PaymentMethod) => {
    if (data.method === 'STRIPE_CARD' && !selectedCard) {
      // Require card selection
      return;
    }
    onPaymentSelect(data);
  };

  const getMethodInfo = (method: string) => {
    const methods = {
      MPESA: {
        icon: Smartphone,
        title: 'M-Pesa',
        description: 'Pay via M-Pesa mobile money',
        color: 'bg-green-50 border-green-200 text-green-700',
        processingTime: 'Instant',
        fees: 'No fees',
      },
      STRIPE_CARD: {
        icon: CreditCard,
        title: 'Credit/Debit Card',
        description: 'Pay with Visa, Mastercard, or other cards',
        color: 'bg-blue-50 border-blue-200 text-blue-700',
        processingTime: 'Instant',
        fees: 'No fees',
      },
      WALLET: {
        icon: Wallet,
        title: 'Mama Fua Wallet',
        description: 'Use your platform wallet balance',
        color: 'bg-purple-50 border-purple-200 text-purple-700',
        processingTime: 'Instant',
        fees: 'No fees',
      },
      CASH: {
        icon: Banknote,
        title: 'Cash on Delivery',
        description: 'Pay cash when cleaner arrives',
        color: 'bg-amber-50 border-amber-200 text-amber-700',
        processingTime: 'On completion',
        fees: 'No fees',
      },
    };

    return methods[method as keyof typeof methods] || methods.MPESA;
  };

  const getCardBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent border-r-transparent border-b-transparent border-l-transparent"></div>
              <p className="mt-4 text-sm text-ink-600">Loading payment methods...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Amount Display */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="text-center">
          <p className="text-sm text-ink-600 mb-2">Amount to Pay</p>
          <p className="text-3xl font-bold text-ink-900">{formatKES(amount)}</p>
        </div>
      </div>

      {/* Payment Methods */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* M-Pesa */}
          <button
            type="button"
            onClick={() => handleMethodSelect('MPESA')}
            className={`relative rounded-xl border-2 p-4 transition-all ${
              selectedMethod === 'MPESA'
                ? 'border-green-500 bg-green-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
          >
            <div className="flex items-start gap-3">
              <div className={`rounded-lg p-2 ${getMethodInfo('MPESA').color}`}>
                <Smartphone className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-ink-900">{getMethodInfo('MPESA').title}</h3>
                <p className="text-sm text-ink-600">{getMethodInfo('MPESA').description}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                  <Clock className="h-3 w-3" />
                  <span>{getMethodInfo('MPESA').processingTime}</span>
                  <span>•</span>
                  <span>{getMethodInfo('MPESA').fees}</span>
                </div>
              </div>
              {selectedMethod === 'MPESA' && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
          </button>

          {/* Credit/Debit Card */}
          <button
            type="button"
            onClick={() => handleMethodSelect('STRIPE_CARD')}
            className={`relative rounded-xl border-2 p-4 transition-all ${
              selectedMethod === 'STRIPE_CARD'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
          >
            <div className="flex items-start gap-3">
              <div className={`rounded-lg p-2 ${getMethodInfo('STRIPE_CARD').color}`}>
                <CreditCard className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-ink-900">{getMethodInfo('STRIPE_CARD').title}</h3>
                <p className="text-sm text-ink-600">{getMethodInfo('STRIPE_CARD').description}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                  <Clock className="h-3 w-3" />
                  <span>{getMethodInfo('STRIPE_CARD').processingTime}</span>
                  <span>•</span>
                  <span>{getMethodInfo('STRIPE_CARD').fees}</span>
                </div>
              </div>
              {selectedMethod === 'STRIPE_CARD' && (
                <CheckCircle className="h-5 w-5 text-blue-600" />
              )}
            </div>
          </button>

          {/* Wallet */}
          <button
            type="button"
            onClick={() => handleMethodSelect('WALLET')}
            className={`relative rounded-xl border-2 p-4 transition-all ${
              selectedMethod === 'WALLET'
                ? 'border-purple-500 bg-purple-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            } ${disabled || walletBalance < amount ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled || walletBalance < amount}
          >
            <div className="flex items-start gap-3">
              <div className={`rounded-lg p-2 ${getMethodInfo('WALLET').color}`}>
                <Wallet className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-ink-900">{getMethodInfo('WALLET').title}</h3>
                <p className="text-sm text-ink-600">{getMethodInfo('WALLET').description}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-ink-500">
                    <Clock className="h-3 w-3" />
                    <span>{getMethodInfo('WALLET').processingTime}</span>
                    <span>•</span>
                    <span>{getMethodInfo('WALLET').fees}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-ink-900">Balance:</span>
                    <span className={walletBalance < amount ? 'text-red-600' : 'text-green-600'}>
                      {formatKES(walletBalance)}
                    </span>
                  </div>
                  {walletBalance < amount && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>Insufficient balance</span>
                    </div>
                  )}
                </div>
              </div>
              {selectedMethod === 'WALLET' && (
                <CheckCircle className="h-5 w-5 text-purple-600" />
              )}
            </div>
          </button>

          {/* Cash */}
          {showCashOption && (
            <button
              type="button"
              onClick={() => handleMethodSelect('CASH')}
              className={`relative rounded-xl border-2 p-4 transition-all ${
                selectedMethod === 'CASH'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={disabled}
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2 ${getMethodInfo('CASH').color}`}>
                  <Banknote className="h-6 w-6" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-ink-900">{getMethodInfo('CASH').title}</h3>
                  <p className="text-sm text-ink-600">{getMethodInfo('CASH').description}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                    <Clock className="h-3 w-3" />
                    <span>{getMethodInfo('CASH').processingTime}</span>
                    <span>•</span>
                    <span>{getMethodInfo('CASH').fees}</span>
                  </div>
                </div>
                {selectedMethod === 'CASH' && (
                  <CheckCircle className="h-5 w-5 text-amber-600" />
                )}
              </div>
            </button>
          )}
        </div>

        {/* Saved Cards (shown when card is selected) */}
        {selectedMethod === 'STRIPE_CARD' && savedCards.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-ink-900 mb-4">Select Card</h3>
            
            <div className="space-y-3">
              {savedCards.map((card) => (
                <label
                  key={card.id}
                  className={`flex items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                    selectedCard === card.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="selectedCard"
                    value={card.id}
                    checked={selectedCard === card.id}
                    onChange={() => handleCardSelect(card.id)}
                    className="sr-only"
                  />
                  
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getCardBrandIcon(card.brand)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-900">••••• {card.last4}</span>
                        {card.isDefault && (
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-ink-500">
                        Expires {card.expiryMonth}/{card.expiryYear}
                      </div>
                    </div>
                  </div>
                  
                  {selectedCard === card.id && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </label>
              ))}
            </div>

            {/* Add New Card */}
            <button
              type="button"
              className="btn-secondary w-full mt-4"
              onClick={() => {
                // Open Stripe Elements modal
                console.log('Open card addition modal');
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Card
            </button>
          </div>
        )}

        {/* Save Card Option (for new cards) */}
        {selectedMethod === 'STRIPE_CARD' && !selectedCard && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                {...form.register('saveCard')}
                type="checkbox"
                className="h-4 w-4 text-brand-600 rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-ink-900">Save card for future use</p>
                <p className="text-sm text-ink-600">Your card information will be securely stored for faster checkout</p>
              </div>
            </label>
          </div>
        )}

        {/* Security Notice */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-mint-600 mt-0.5" />
            <div className="text-sm text-ink-700">
              <h4 className="font-semibold text-ink-900 mb-1">Secure Payment Processing</h4>
              <p>All payments are processed securely through encrypted connections. Your financial information is never stored on our servers.</p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          type="submit"
          disabled={disabled || (selectedMethod === 'STRIPE_CARD' && !selectedCard) || (selectedMethod === 'WALLET' && walletBalance < amount)}
          className="btn-primary w-full py-4"
        >
          Continue with {getMethodInfo(selectedMethod).title}
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
