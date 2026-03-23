'use client';
// Mama Fua — Step 1: Service Selection
// KhimTech | 2026

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatKES } from '@mama-fua/shared';
import type { BookingDraft, BookingMode, BookingType } from '@/app/book/page';
import { CheckCircle, Zap, Search, MessageSquare, RefreshCw } from 'lucide-react';

interface Props {
  draft: Partial<BookingDraft>;
  onChange: (updates: Partial<BookingDraft>) => void;
  onNext: () => void;
}

const BOOKING_MODES: { value: BookingMode; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: 'AUTO_ASSIGN',
    label: 'Auto-assign',
    desc: 'We find the best cleaner nearby. Fastest option.',
    icon: <Zap className="h-5 w-5" />,
  },
  {
    value: 'BROWSE_PICK',
    label: 'Browse & pick',
    desc: 'See available cleaners, read reviews, choose yours.',
    icon: <Search className="h-5 w-5" />,
  },
  {
    value: 'POST_BID',
    label: 'Post & bid',
    desc: 'Post your job. Cleaners apply with their best price.',
    icon: <MessageSquare className="h-5 w-5" />,
  },
];

const RECURRING_OPTIONS: { value: BookingType; label: string; discount?: string }[] = [
  { value: 'ONE_OFF', label: 'One time only' },
  { value: 'RECURRING', label: 'Recurring', discount: 'Save up to 33%' },
];

const FREQUENCY_OPTIONS = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Every 2 weeks' },
  { value: 'MONTHLY', label: 'Monthly' },
];

interface Service {
  id: string;
  name: string;
  nameSwahili?: string;
  description: string;
  basePrice: number;
  durationMinutes: number;
  category: string;
}

const SERVICE_ICONS: Record<string, string> = {
  HOME_CLEANING: '🏠',
  LAUNDRY: '👕',
  OFFICE_CLEANING: '🏢',
  POST_CONSTRUCTION: '🔨',
  DEEP_CLEANING: '✨',
};

export default function StepService({ draft, onChange, onNext }: Props) {
  const { data, isLoading } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await api.get('/services');
      return res.data.data;
    },
  });

  const services: Service[] = data ?? [];
  const canProceed = !!draft.serviceId;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">What do you need?</h1>
        <p className="text-gray-500 mt-1">Choose a service to get started</p>
      </div>

      {/* Service cards */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-32 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {services.map((svc) => {
            const selected = draft.serviceId === svc.id;
            return (
              <button
                key={svc.id}
                onClick={() => onChange({ serviceId: svc.id, serviceName: svc.name, servicePrice: svc.basePrice })}
                className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-150 ${
                  selected
                    ? 'border-brand-600 bg-brand-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-brand-200 hover:shadow-card'
                }`}
              >
                {selected && (
                  <span className="absolute top-3 right-3">
                    <CheckCircle className="h-5 w-5 text-brand-600" />
                  </span>
                )}
                <span className="text-3xl block mb-3">
                  {SERVICE_ICONS[svc.category] ?? '🧹'}
                </span>
                <h3 className="font-semibold text-gray-900">{svc.name}</h3>
                {svc.nameSwahili && (
                  <p className="text-xs text-gray-400 mb-1">{svc.nameSwahili}</p>
                )}
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{svc.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-brand-600">
                    From {formatKES(svc.basePrice)}
                  </span>
                  <span className="text-xs text-gray-400">
                    ~{Math.round(svc.durationMinutes / 60)}hr
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Booking mode */}
      {canProceed && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">How would you like to book?</h2>
          <div className="grid gap-3">
            {BOOKING_MODES.map((mode) => {
              const selected = draft.mode === mode.value;
              return (
                <button
                  key={mode.value}
                  onClick={() => onChange({ mode: mode.value })}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    selected
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-gray-200 bg-white hover:border-brand-200'
                  }`}
                >
                  <span className={`p-2.5 rounded-xl ${selected ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {mode.icon}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{mode.label}</p>
                    <p className="text-sm text-gray-500">{mode.desc}</p>
                  </div>
                  {selected && <CheckCircle className="h-5 w-5 text-brand-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recurring option */}
      {canProceed && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">How often?</h2>
          <div className="grid grid-cols-2 gap-3">
            {RECURRING_OPTIONS.map((opt) => {
              const selected = draft.bookingType === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onChange({ bookingType: opt.value })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selected ? 'border-brand-600 bg-brand-50' : 'border-gray-200 bg-white hover:border-brand-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {opt.value === 'RECURRING' && <RefreshCw className="h-4 w-4 text-brand-600" />}
                    <span className="font-medium text-sm text-gray-900">{opt.label}</span>
                  </div>
                  {opt.discount && (
                    <span className="badge bg-teal-50 text-teal-700 text-xs">{opt.discount}</span>
                  )}
                </button>
              );
            })}
          </div>

          {draft.bookingType === 'RECURRING' && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {FREQUENCY_OPTIONS.map((freq) => (
                <button
                  key={freq.value}
                  onClick={() => onChange({ recurringFrequency: freq.value as BookingDraft['recurringFrequency'] })}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    draft.recurringFrequency === freq.value
                      ? 'border-brand-600 bg-brand-50 text-brand-600'
                      : 'border-gray-200 text-gray-600 hover:border-brand-200'
                  }`}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Special instructions */}
      {canProceed && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Special instructions <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={draft.specialInstructions ?? ''}
            onChange={(e) => onChange({ specialInstructions: e.target.value })}
            placeholder="e.g. Please focus on the kitchen and bathrooms. Dog is friendly."
            rows={3}
            className="input resize-none"
            maxLength={500}
          />
          <p className="text-xs text-gray-400 mt-1">
            {(draft.specialInstructions ?? '').length}/500
          </p>
        </div>
      )}

      {canProceed && (
        <button onClick={onNext} className="btn-primary w-full py-4 text-base">
          Continue → Choose location
        </button>
      )}
    </div>
  );
}
