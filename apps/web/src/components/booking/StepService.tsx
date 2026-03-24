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

const BOOKING_MODES: { value: BookingMode; label: string; desc: string; icon: React.ReactNode }[] =
  [
    {
      value: 'AUTO_ASSIGN',
      label: 'Auto-assign',
      desc: 'We find the best cleaner nearby. Fastest option.',
      icon: <Zap className="h-5 w-5" />,
    },
    {
      value: 'BROWSE_PICK',
      label: 'Browse & pick',
      desc: 'See available cleaners, read reviews, and choose yours.',
      icon: <Search className="h-5 w-5" />,
    },
    {
      value: 'POST_BID',
      label: 'Post & bid',
      desc: 'Post your job and let cleaners apply with their best price.',
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
      <div className="space-y-3">
        <span className="pill">Step 1</span>
        <div>
          <h1 className="text-4xl text-ink-900">What do you need cleaned?</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Start with the service, then choose how you want the booking handled.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-40 rounded-[1.6rem] border border-white/80 bg-white/70 shadow-soft animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((service) => {
            const selected = draft.serviceId === service.id;

            return (
              <button
                key={service.id}
                onClick={() =>
                  onChange({
                    serviceId: service.id,
                    serviceName: service.name,
                    servicePrice: service.basePrice,
                  })
                }
                className={`relative overflow-hidden rounded-[1.6rem] border p-5 text-left transition-all duration-200 ${
                  selected
                    ? 'border-brand-200 bg-gradient-to-br from-white via-brand-50 to-mint-50 shadow-card'
                    : 'border-white/90 bg-white/84 shadow-soft hover:-translate-y-1 hover:border-brand-100 hover:shadow-card-hover'
                }`}
              >
                {selected && (
                  <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-soft">
                    <CheckCircle className="h-5 w-5 text-brand-600" />
                  </span>
                )}
                <span className="block text-3xl">{SERVICE_ICONS[service.category] ?? '🧹'}</span>
                <h2 className="mt-4 text-2xl text-ink-900">{service.name}</h2>
                {service.nameSwahili && (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                    {service.nameSwahili}
                  </p>
                )}
                <p className="mt-3 text-sm leading-6 text-ink-500">{service.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-brand-700">
                    From {formatKES(service.basePrice)}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-400">
                    ~{Math.round(service.durationMinutes / 60)}hr
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {canProceed && (
        <div className="space-y-4">
          <div>
            <h2 className="text-3xl text-ink-900">How would you like to book?</h2>
            <p className="mt-2 text-sm text-ink-500">
              Choose the pace and level of control you want.
            </p>
          </div>

          <div className="grid gap-3">
            {BOOKING_MODES.map((mode) => {
              const selected = draft.mode === mode.value;

              return (
                <button
                  key={mode.value}
                  onClick={() => onChange({ mode: mode.value })}
                  className={`flex items-center gap-4 rounded-[1.5rem] border px-4 py-4 text-left transition-all duration-200 ${
                    selected
                      ? 'border-brand-200 bg-brand-50 text-ink-900 shadow-soft'
                      : 'border-white/90 bg-white/84 text-ink-900 shadow-soft hover:-translate-y-0.5 hover:border-brand-100'
                  }`}
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      selected ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700'
                    }`}
                  >
                    {mode.icon}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{mode.label}</p>
                    <p className="mt-1 text-sm text-ink-500">{mode.desc}</p>
                  </div>
                  {selected && <CheckCircle className="h-5 w-5 text-brand-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {canProceed && (
        <div className="space-y-4">
          <div>
            <h2 className="text-3xl text-ink-900">How often?</h2>
            <p className="mt-2 text-sm text-ink-500">
              Pick a one-off visit or build a repeat routine.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {RECURRING_OPTIONS.map((option) => {
              const selected = draft.bookingType === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => onChange({ bookingType: option.value })}
                  className={`rounded-[1.5rem] border px-5 py-5 text-left transition-all duration-200 ${
                    selected
                      ? 'border-brand-200 bg-gradient-to-br from-white via-brand-50 to-mint-50 shadow-card'
                      : 'border-white/90 bg-white/84 shadow-soft hover:-translate-y-0.5 hover:border-brand-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {option.value === 'RECURRING' && (
                      <RefreshCw className="h-4 w-4 text-brand-600" />
                    )}
                    <span className="font-semibold text-ink-900">{option.label}</span>
                  </div>
                  {option.discount && (
                    <span className="badge mt-3 bg-mint-100 text-mint-800">{option.discount}</span>
                  )}
                </button>
              );
            })}
          </div>

          {draft.bookingType === 'RECURRING' && (
            <div className="grid gap-2 sm:grid-cols-3">
              {FREQUENCY_OPTIONS.map((frequency) => (
                <button
                  key={frequency.value}
                  onClick={() =>
                    onChange({
                      recurringFrequency: frequency.value as BookingDraft['recurringFrequency'],
                    })
                  }
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    draft.recurringFrequency === frequency.value
                      ? 'border-brand-200 bg-brand-50 text-brand-800 shadow-soft'
                      : 'border-white/90 bg-white/84 text-ink-600 shadow-soft hover:border-brand-100'
                  }`}
                >
                  {frequency.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {canProceed && (
        <div className="card-muted shine-panel p-5">
          <label className="mb-2 block text-sm font-medium text-ink-700">
            Special instructions <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <textarea
            value={draft.specialInstructions ?? ''}
            onChange={(event) => onChange({ specialInstructions: event.target.value })}
            placeholder="e.g. Please focus on the kitchen and bathrooms. Dog is friendly."
            rows={3}
            className="input resize-none bg-white/90"
            maxLength={500}
          />
          <p className="mt-2 text-xs text-ink-400">
            {(draft.specialInstructions ?? '').length}/500
          </p>
        </div>
      )}

      {canProceed && (
        <button onClick={onNext} className="btn-primary w-full py-4 text-base">
          Continue to location
        </button>
      )}
    </div>
  );
}
