'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatKES } from '@mama-fua/shared';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleOff,
  Filter,
  Loader2,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Wallet,
  X,
} from 'lucide-react';
import type { BookingDraft } from '@/app/book/page';
import { Avatar } from '@/components/ui';
import { cleanerApi, locationApi, reviewsApi } from '@/lib/api';

interface Props {
  draft: Partial<BookingDraft>;
  onChange: (updates: Partial<BookingDraft>) => void;
  onNext: () => void;
}

interface CleanerSearchResult {
  id: string;
  bio: string | null;
  distanceKm: number;
  nextAvailableLabel: string;
  rating: number;
  recommendedScore: number;
  serviceAreaLat: number;
  serviceAreaLng: number;
  serviceAreaRadius: number;
  servicePrice: number;
  totalJobs: number;
  totalReviews: number;
  verificationStatus: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  services: Array<{
    id: string;
    customPrice: number;
    service: {
      id: string;
      name: string;
      category: string;
    };
  }>;
}

interface CleanerProfileDetail {
  bio: string | null;
  rating: number | string;
  serviceAreaRadius: number;
  totalJobs: number;
  totalReviews: number;
  verificationStatus: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  services: Array<{
    id: string;
    customPrice: number;
    service: {
      id: string;
      name: string;
      category: string;
      description: string;
    };
  }>;
  availabilitySlots: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    specificDate: string | null;
    isBlocked: boolean;
  }>;
}

interface CleanerReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  client: {
    firstName: string;
    avatarUrl: string | null;
  };
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'distance', label: 'Nearest first' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price', label: 'Lowest price' },
] as const;
const RATING_OPTIONS = [
  { value: 3.5, label: '3.5+' },
  { value: 4, label: '4.0+' },
  { value: 4.5, label: '4.5+' },
] as const;
const RADIUS_OPTIONS = [
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
] as const;
const PRICE_CAP_OPTIONS = [
  { label: 'Any price', value: undefined },
  { label: 'Up to KES 1,500', value: 150000 },
  { label: 'Up to KES 2,500', value: 250000 },
  { label: 'Up to KES 5,000', value: 500000 },
] as const;

export default function StepCleaner({ draft, onChange, onNext }: Props) {
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]['value']>('recommended');
  const [minRating, setMinRating] = useState<(typeof RATING_OPTIONS)[number]['value']>(3.5);
  const [radiusKm, setRadiusKm] = useState<(typeof RADIUS_OPTIONS)[number]['value']>(10);
  const [priceCap, setPriceCap] = useState<number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'split' | 'list'>('split');
  const [activeCleanerId, setActiveCleanerId] = useState<string | null>(null);

  const canQuery =
    !!draft.serviceId &&
    !!draft.scheduledAt &&
    draft.address?.lat != null &&
    draft.address?.lng != null;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'nearby-cleaners',
      draft.serviceId,
      draft.address?.lat,
      draft.address?.lng,
      draft.scheduledAt,
      sort,
      minRating,
      radiusKm,
      priceCap ?? 'any',
    ],
    queryFn: async () => {
      const params: Parameters<typeof locationApi.nearbyCleaners>[0] = {
        lat: draft.address!.lat,
        lng: draft.address!.lng,
        serviceId: draft.serviceId!,
        sort,
        minRating,
        radiusKm,
        ...(draft.scheduledAt ? { scheduledAt: draft.scheduledAt } : {}),
        ...(priceCap != null ? { maxPrice: priceCap } : {}),
      };
      const res = await locationApi.nearbyCleaners(params);
      return res.data.data as CleanerSearchResult[];
    },
    enabled: canQuery,
  });

  const cleaners = data ?? [];
  const selectedCleanerResult = cleaners.find((cleaner) => cleaner.id === draft.cleanerId);
  const selectedCleaner = selectedCleanerResult
    ? {
        id: selectedCleanerResult.id,
        firstName: selectedCleanerResult.user.firstName,
        lastName: selectedCleanerResult.user.lastName,
        avatarUrl: selectedCleanerResult.user.avatarUrl,
        rating: selectedCleanerResult.rating,
        totalReviews: selectedCleanerResult.totalReviews,
        servicePrice: selectedCleanerResult.servicePrice,
        distanceKm: selectedCleanerResult.distanceKm,
        nextAvailableLabel: selectedCleanerResult.nextAvailableLabel,
      }
    : (draft.cleanerProfile ?? null);

  const detailQuery = useQuery({
    queryKey: ['cleaner-detail', activeCleanerId],
    queryFn: async () => {
      const res = await cleanerApi.get(activeCleanerId!);
      return res.data.data as CleanerProfileDetail;
    },
    enabled: !!activeCleanerId,
  });

  const reviewsQuery = useQuery({
    queryKey: ['cleaner-reviews', activeCleanerId],
    queryFn: async () => {
      const res = await reviewsApi.forCleaner(activeCleanerId!);
      return res.data.data as CleanerReview[];
    },
    enabled: !!activeCleanerId,
  });

  const availabilityByDay = useMemo(() => {
    const slots = detailQuery.data?.availabilitySlots ?? [];
    return DAY_LABELS.map((label, index) => ({
      label,
      slots: slots.filter((slot) => slot.dayOfWeek === index),
    }));
  }, [detailQuery.data?.availabilitySlots]);

  const selectCleaner = (cleaner: CleanerSearchResult) => {
    onChange({
      cleanerId: cleaner.id,
      servicePrice: cleaner.servicePrice,
      cleanerProfile: {
        id: cleaner.id,
        firstName: cleaner.user.firstName,
        lastName: cleaner.user.lastName,
        avatarUrl: cleaner.user.avatarUrl,
        rating: cleaner.rating,
        totalReviews: cleaner.totalReviews,
        servicePrice: cleaner.servicePrice,
        distanceKm: cleaner.distanceKm,
        nextAvailableLabel: cleaner.nextAvailableLabel,
      },
    });
  };

  const canProceed = !!draft.cleanerId;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className="pill">Step 4</span>
        <div>
          <h1 className="text-4xl text-ink-900">Browse cleaners near your job</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Compare nearby professionals by rating, distance, price, and availability before you
            send the request.
          </p>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/90 bg-white/72 p-5 shadow-soft backdrop-blur">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                Search setup
              </p>
              <p className="mt-2 text-sm text-ink-600">
                {draft.serviceName} in {draft.address?.area} on{' '}
                {draft.scheduledAt
                  ? format(new Date(draft.scheduledAt), "EEE dd MMM 'at' h:mm a")
                  : 'your selected time'}
              </p>
            </div>
            <div className="inline-flex rounded-[1.2rem] border border-slate-200 bg-slate-50 p-1">
              {[
                { value: 'split', label: 'Map + list' },
                { value: 'list', label: 'List only' },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setViewMode(item.value as 'split' | 'list')}
                  className={`rounded-[0.9rem] px-3 py-2 text-sm font-semibold transition-colors ${
                    viewMode === item.value
                      ? 'bg-white text-ink-900 shadow-soft'
                      : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <FilterPills
              icon={<SlidersHorizontal className="h-4 w-4" />}
              label="Sort"
              options={SORT_OPTIONS}
              value={sort}
              onChange={(value) => setSort(value as (typeof SORT_OPTIONS)[number]['value'])}
            />
            <FilterPills
              icon={<Star className="h-4 w-4" />}
              label="Rating"
              options={RATING_OPTIONS}
              value={minRating}
              onChange={(value) => setMinRating(value as (typeof RATING_OPTIONS)[number]['value'])}
            />
            <FilterPills
              icon={<MapPin className="h-4 w-4" />}
              label="Radius"
              options={RADIUS_OPTIONS}
              value={radiusKm}
              onChange={(value) => setRadiusKm(value as (typeof RADIUS_OPTIONS)[number]['value'])}
            />
            <FilterPills
              icon={<Wallet className="h-4 w-4" />}
              label="Price"
              options={PRICE_CAP_OPTIONS}
              value={priceCap}
              onChange={(value) => setPriceCap(value as number | undefined)}
            />
          </div>
        </div>
      </div>

      {selectedCleaner && (
        <div className="rounded-[1.75rem] border border-teal-200 bg-gradient-to-br from-white via-teal-50 to-brand-50 p-5 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                name={`${selectedCleaner.firstName} ${selectedCleaner.lastName}`}
                src={selectedCleaner.avatarUrl ?? null}
                size="lg"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                  Selected cleaner
                </p>
                <h2 className="mt-1 text-2xl text-ink-900">
                  {selectedCleaner.firstName} {selectedCleaner.lastName}
                </h2>
                <p className="mt-2 text-sm text-ink-600">
                  {selectedCleaner.distanceKm.toFixed(1)} km away ·{' '}
                  {formatKES(selectedCleaner.servicePrice)} · {selectedCleaner.totalReviews} reviews
                </p>
              </div>
            </div>
            <div className="rounded-[1.2rem] bg-white/80 px-4 py-3 text-sm text-ink-700 shadow-soft">
              {selectedCleaner.nextAvailableLabel}
            </div>
          </div>
        </div>
      )}

      {!canQuery ? (
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-800">
          Choose a service, address, and schedule first so the search can narrow to eligible
          cleaners.
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="h-[24rem] rounded-[1.8rem] border border-slate-200 bg-white/70 shadow-soft animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 rounded-[1.6rem] border border-slate-200 bg-white/70 shadow-soft animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : cleaners.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-soft">
          <CircleOff className="mx-auto h-10 w-10 text-ink-300" />
          <h2 className="mt-4 text-3xl text-ink-900">No cleaners match this set</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-ink-500">
            Try widening the radius, lowering the minimum rating, or clearing the price cap to see
            more available options.
          </p>
        </div>
      ) : (
        <div className={`grid gap-4 ${viewMode === 'split' ? 'lg:grid-cols-[0.72fr_1.28fr]' : ''}`}>
          {viewMode === 'split' && (
            <CleanerMapPanel
              cleaners={cleaners}
              selectedCleanerId={draft.cleanerId ?? null}
              focusArea={draft.address?.area ?? 'Selected area'}
            />
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink-500">
                {cleaners.length} cleaner{cleaners.length === 1 ? '' : 's'} found
              </p>
              {isFetching && <Loader2 className="h-4 w-4 animate-spin text-ink-400" />}
            </div>

            {cleaners.map((cleaner) => {
              const selected = draft.cleanerId === cleaner.id;

              return (
                <article
                  key={cleaner.id}
                  className={`rounded-[1.7rem] border px-5 py-5 shadow-soft transition-all duration-200 ${
                    selected
                      ? 'border-brand-200 bg-gradient-to-br from-white via-brand-50 to-teal-50'
                      : 'border-white/90 bg-white/84 hover:-translate-y-0.5 hover:border-brand-100'
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <Avatar
                        name={`${cleaner.user.firstName} ${cleaner.user.lastName}`}
                        src={cleaner.user.avatarUrl ?? null}
                        size="lg"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl text-ink-900">
                            {cleaner.user.firstName} {cleaner.user.lastName}
                          </h2>
                          {cleaner.verificationStatus === 'VERIFIED' && (
                            <span className="badge bg-teal-100 text-teal-800">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Verified
                            </span>
                          )}
                          {selected && (
                            <span className="badge bg-brand-100 text-brand-800">Selected</span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <MetricChip
                            icon={<Star className="h-3.5 w-3.5 text-amber-500" />}
                            text={`${cleaner.rating.toFixed(1)} · ${cleaner.totalReviews} reviews`}
                          />
                          <MetricChip
                            icon={<MapPin className="h-3.5 w-3.5 text-brand-600" />}
                            text={`${cleaner.distanceKm.toFixed(1)} km away`}
                          />
                          <MetricChip
                            icon={<Wallet className="h-3.5 w-3.5 text-brand-600" />}
                            text={formatKES(cleaner.servicePrice)}
                          />
                        </div>

                        <p className="mt-4 line-clamp-2 text-sm leading-6 text-ink-500">
                          {cleaner.bio || 'Experienced cleaner available for this service window.'}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {cleaner.services.map((service) => (
                            <span
                              key={service.id}
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 ring-1 ring-slate-200"
                            >
                              {service.service.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.3rem] bg-white px-4 py-4 shadow-soft lg:min-w-[15rem]">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Availability
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {cleaner.nextAvailableLabel}
                      </p>
                      <p className="mt-2 text-xs text-ink-400">
                        {cleaner.totalJobs} jobs completed
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => setActiveCleanerId(cleaner.id)}
                      className="btn-ghost flex-1 justify-center rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm text-ink-700"
                    >
                      View profile
                    </button>
                    <button
                      onClick={() => selectCleaner(cleaner)}
                      className="btn-primary flex-1 justify-center rounded-[1.2rem] px-4 py-3 text-sm"
                    >
                      {selected ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Cleaner selected
                        </>
                      ) : (
                        <>
                          Choose cleaner
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-[1.5rem] border border-brand-100 bg-brand-50/70 px-4 py-4 text-sm text-ink-700">
        Once you send this request, the selected cleaner will have 30 minutes to accept or decline.
        Payment is only completed after the cleaner confirms the job.
      </div>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="btn-primary w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue to review
      </button>

      {activeCleanerId && (
        <div className="modal-overlay" onClick={() => setActiveCleanerId(null)}>
          <div
            className="mx-auto w-full max-w-4xl rounded-[2rem] bg-white shadow-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-sm font-medium text-brand-700">Cleaner profile</p>
                <h2 className="mt-1 text-2xl text-ink-900">
                  {detailQuery.data?.user.firstName} {detailQuery.data?.user.lastName}
                </h2>
              </div>
              <button
                onClick={() => setActiveCleanerId(null)}
                className="btn-icon rounded-full bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailQuery.isLoading ? (
              <div className="flex items-center justify-center px-6 py-16">
                <Loader2 className="h-7 w-7 animate-spin text-brand-700" />
              </div>
            ) : detailQuery.data ? (
              <div className="grid gap-6 px-6 py-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-5">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
                    <div className="flex items-center gap-4">
                      <Avatar
                        name={`${detailQuery.data.user.firstName} ${detailQuery.data.user.lastName}`}
                        src={detailQuery.data.user.avatarUrl ?? null}
                        size="xl"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xl font-semibold text-ink-900">
                            {detailQuery.data.user.firstName} {detailQuery.data.user.lastName}
                          </p>
                          <span className="badge bg-teal-100 text-teal-800">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {(detailQuery.data.verificationStatus ?? 'PENDING').replace('_', ' ')}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-ink-500">
                          Rated {Number(detailQuery.data.rating).toFixed(1)} from{' '}
                          {detailQuery.data.totalReviews} reviews
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-ink-600">
                      {detailQuery.data.bio || 'No profile bio has been added yet.'}
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Services & pricing
                    </p>
                    <div className="mt-4 space-y-3">
                      {detailQuery.data.services.map((service) => (
                        <div
                          key={service.id}
                          className="rounded-[1.2rem] bg-white px-4 py-4 shadow-soft"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-ink-900">{service.service.name}</p>
                              <p className="mt-1 text-sm text-ink-500">
                                {service.service.description}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-brand-700">
                              {formatKES(service.customPrice || 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Weekly availability
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {availabilityByDay.map((day) => (
                        <div
                          key={day.label}
                          className="rounded-[1.2rem] bg-white px-4 py-4 shadow-soft"
                        >
                          <p className="font-semibold text-ink-900">{day.label}</p>
                          <div className="mt-3 space-y-1.5">
                            {day.slots.length > 0 ? (
                              day.slots.map((slot) => (
                                <p key={slot.id} className="text-sm text-ink-500">
                                  {slot.startTime} - {slot.endTime}
                                </p>
                              ))
                            ) : (
                              <p className="text-sm text-ink-400">No recurring slots</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Client reviews
                    </p>
                    {reviewsQuery.isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-brand-700" />
                      </div>
                    ) : reviewsQuery.data && reviewsQuery.data.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {reviewsQuery.data.map((review) => (
                          <div
                            key={review.id}
                            className="rounded-[1.2rem] bg-white px-4 py-4 shadow-soft"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  name={review.client.firstName}
                                  src={review.client.avatarUrl ?? null}
                                  size="sm"
                                />
                                <div>
                                  <p className="text-sm font-semibold text-ink-900">
                                    {review.client.firstName}
                                  </p>
                                  <p className="text-xs text-ink-400">
                                    {format(new Date(review.createdAt), 'dd MMM yyyy')}
                                  </p>
                                </div>
                              </div>
                              <span className="badge bg-amber-50 text-amber-700">
                                <Star className="h-3.5 w-3.5 fill-current" />
                                {review.rating}/5
                              </span>
                            </div>
                            {(review.title || review.body) && (
                              <div className="mt-3 space-y-2">
                                {review.title && (
                                  <p className="text-sm font-semibold text-ink-900">
                                    {review.title}
                                  </p>
                                )}
                                {review.body && (
                                  <p className="text-sm leading-6 text-ink-500">{review.body}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-ink-400">No public reviews yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-sm text-ink-500">
                Cleaner details are unavailable right now.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPills({
  icon,
  label,
  options,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  options: ReadonlyArray<{ label: string; value: string | number | undefined }>;
  value: string | number | undefined;
  onChange: (value: string | number | undefined) => void;
}) {
  return (
    <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
        {icon}
        {label}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={`${label}-${option.label}`}
              onClick={() => onChange(option.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                selected
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-ink-600 ring-1 ring-slate-200 hover:text-ink-900'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MetricChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 ring-1 ring-slate-200">
      {icon}
      {text}
    </span>
  );
}

function CleanerMapPanel({
  cleaners,
  selectedCleanerId,
  focusArea,
}: {
  cleaners: CleanerSearchResult[];
  selectedCleanerId: string | null;
  focusArea: string;
}) {
  const coordinates = cleaners.map((cleaner) => ({
    lat: cleaner.serviceAreaLat,
    lng: cleaner.serviceAreaLng,
  }));
  const minLat = Math.min(...coordinates.map((point) => point.lat));
  const maxLat = Math.max(...coordinates.map((point) => point.lat));
  const minLng = Math.min(...coordinates.map((point) => point.lng));
  const maxLng = Math.max(...coordinates.map((point) => point.lng));
  const latSpan = maxLat - minLat || 0.02;
  const lngSpan = maxLng - minLng || 0.02;

  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-sm font-medium text-brand-700">Cleaner map</p>
        <p className="mt-1 text-sm text-ink-500">
          Relative service coverage view around {focusArea}
        </p>
      </div>
      <div className="relative h-[28rem] overflow-hidden bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_48%,#ecfeff_100%)]">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(24,95,165,0.08),transparent_45%)]" />
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-brand ring-8 ring-white/60">
            JOB
          </div>
          <p className="mt-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
            Job
          </p>
        </div>

        {cleaners.map((cleaner) => {
          const x = ((cleaner.serviceAreaLng - minLng) / lngSpan) * 78 + 11;
          const y = (1 - (cleaner.serviceAreaLat - minLat) / latSpan) * 74 + 13;
          const selected = cleaner.id === selectedCleanerId;

          return (
            <div
              key={cleaner.id}
              className="absolute z-20"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full border-4 text-sm font-bold shadow-soft ${
                  selected
                    ? 'border-brand-100 bg-brand-600 text-white'
                    : 'border-white bg-white text-brand-700'
                }`}
              >
                {cleaner.user.firstName[0]}
              </div>
              <div className="mt-2 min-w-[7rem] rounded-[1rem] bg-white/95 px-3 py-2 text-center shadow-soft">
                <p className="truncate text-xs font-semibold text-ink-900">
                  {cleaner.user.firstName}
                </p>
                <p className="truncate text-[11px] text-ink-500">
                  {cleaner.distanceKm.toFixed(1)} km
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
