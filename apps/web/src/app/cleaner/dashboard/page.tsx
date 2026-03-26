'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatKES } from '@mama-fua/shared';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  MapPin,
  Phone,
  Play,
  ShieldCheck,
  Star,
  Wallet,
  XCircle,
} from 'lucide-react';
import { Avatar, StatusBadge } from '@/components/ui';
import { bookingApi, cleanerApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface CleanerProfile {
  bio: string | null;
  isAvailable: boolean;
  mpesaPhone: string | null;
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
    phone: string;
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

interface CleanerWallet {
  balance: number;
  transactions: Array<{
    id: string;
  }>;
}

interface CleanerBooking {
  id: string;
  bookingRef: string;
  cleanerId: string | null;
  cleanerEarnings: number;
  scheduledAt: string;
  status: string;
  totalAmount: number;
  actualStartAt?: string | null;
  service: {
    name: string;
    category: string;
  };
  address: {
    area: string;
    city: string;
  };
  client: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

type CleanerAction = 'accept' | 'decline' | 'start' | 'complete';

const VERIFICATION_STYLES: Record<string, string> = {
  VERIFIED: 'bg-teal-100 text-teal-800',
  UNDER_REVIEW: 'bg-brand-100 text-brand-800',
  PENDING: 'bg-amber-100 text-amber-800',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function CleanerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ['cleaner-profile'],
    queryFn: () => cleanerApi.me(),
    enabled: user?.role === 'CLEANER',
  });

  const { data: bookingsRes, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', 'cleaner'],
    queryFn: () => bookingApi.list({ pageSize: 30 }),
    enabled: user?.role === 'CLEANER',
    refetchInterval: 15000,
  });

  const { data: walletRes } = useQuery({
    queryKey: ['cleaner-wallet'],
    queryFn: () => cleanerApi.wallet(),
    enabled: user?.role === 'CLEANER',
  });

  const toggleAvailability = useMutation({
    mutationFn: (isAvailable: boolean) => cleanerApi.setAvailable(isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaner-profile'] });
    },
  });

  const bookingAction = useMutation({
    mutationFn: ({ bookingId, action }: { bookingId: string; action: CleanerAction }) => {
      switch (action) {
        case 'accept':
          return bookingApi.accept(bookingId);
        case 'decline':
          return bookingApi.decline(bookingId);
        case 'start':
          return bookingApi.start(bookingId);
        case 'complete':
          return bookingApi.complete(bookingId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'cleaner'] });
    },
  });

  if (!user) {
    return (
      <AccessState
        title="Sign in required"
        body="Log in with a cleaner account to view your jobs."
        href="/login"
        cta="Go to login"
      />
    );
  }

  if (user.role !== 'CLEANER') {
    return (
      <AccessState
        title="Cleaner workspace only"
        body="This screen is reserved for cleaner accounts. Client accounts should use the standard dashboard."
        href="/dashboard"
        cta="Open dashboard"
      />
    );
  }

  const profile: CleanerProfile | null = profileRes?.data?.data ?? null;
  const bookings: CleanerBooking[] = bookingsRes?.data?.data ?? [];
  const wallet: CleanerWallet | null = walletRes?.data?.data ?? null;

  const pending = bookings.filter((booking) => booking.status === 'PENDING');
  const active = bookings.filter((booking) =>
    ['ACCEPTED', 'PAID', 'IN_PROGRESS'].includes(booking.status)
  );
  const recent = bookings.filter((booking) =>
    ['COMPLETED', 'CONFIRMED', 'CANCELLED'].includes(booking.status)
  );

  const rating = Number(profile?.rating ?? 0);
  const balance = wallet?.balance ?? 0;
  const isBusy = profileLoading || bookingsLoading;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(24,95,165,0.16),_transparent_35%),linear-gradient(180deg,#f8fbff_0%,#f8fafc_52%,#ffffff_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
          <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 px-6 py-6 text-white shadow-card sm:px-8 sm:py-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-brand-100">Cleaner dashboard</p>
                <h1 className="mt-2 text-3xl sm:text-4xl">
                  Good {getTimeOfDay()}, {user.firstName}
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/72">
                  Track incoming jobs, manage check-ins, and keep your payout status visible from
                  one place.
                </p>
              </div>

              <button
                onClick={() => toggleAvailability.mutate(!(profile?.isAvailable ?? false))}
                disabled={toggleAvailability.isPending}
                className={`inline-flex min-w-[13rem] items-center justify-between rounded-[1.5rem] border px-4 py-4 text-left shadow-card transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                  profile?.isAvailable
                    ? 'border-teal-200 bg-teal-50 text-teal-900'
                    : 'border-white/15 bg-white/10 text-white'
                }`}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                    Availability
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {profile?.isAvailable ? 'Taking jobs' : 'Offline'}
                  </p>
                </div>
                {toggleAvailability.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span
                    className={`flex h-7 w-12 items-center rounded-full px-1 transition-colors ${
                      profile?.isAvailable ? 'bg-teal-800' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white transition-transform ${
                        profile?.isAvailable ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </span>
                )}
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <StatPanel
                icon={<Wallet className="h-5 w-5 text-brand-100" />}
                label="Wallet balance"
                value={formatKES(balance)}
                hint={`${wallet?.transactions?.length ?? 0} recent wallet entries`}
                dark
              />
              <StatPanel
                icon={<Star className="h-5 w-5 text-amber-300" />}
                label="Rating"
                value={profile ? `${rating.toFixed(1)} / 5` : '—'}
                hint={`${profile?.totalReviews ?? 0} public reviews`}
                dark
              />
              <StatPanel
                icon={<CheckCircle2 className="h-5 w-5 text-teal-100" />}
                label="Completed jobs"
                value={String(profile?.totalJobs ?? 0)}
                hint={`${active.length} currently active`}
                dark
              />
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
            <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-card">
              <div className="flex items-start gap-4">
                <Avatar
                  name={`${user.firstName} ${user.lastName}`}
                  src={user.avatarUrl}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-700">Profile snapshot</p>
                  <h2 className="mt-1 text-2xl text-ink-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`badge ${VERIFICATION_STYLES[profile?.verificationStatus ?? 'PENDING'] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {(profile?.verificationStatus ?? 'PENDING').replace('_', ' ')}
                    </span>
                    <span className="badge bg-brand-50 text-brand-800">
                      <MapPin className="h-3.5 w-3.5" />
                      {profile?.serviceAreaRadius ?? 0} km radius
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-ink-600">
                <p>
                  {profile?.bio?.trim() ||
                    'Add a short bio and service details next so clients know what makes your work stand out.'}
                </p>
                <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Active services
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile?.services?.length ? (
                      profile.services.map((service) => (
                        <span
                          key={service.id}
                          className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 ring-1 ring-slate-200"
                        >
                          {service.service.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-ink-400">No services configured yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-card">
              <p className="text-sm font-medium text-brand-700">Quick links</p>
              <div className="mt-4 space-y-3">
                <Link
                  href="/cleaner/wallet"
                  className="flex items-center justify-between rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 transition-colors hover:border-brand-200 hover:bg-brand-50/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white">
                      <CircleDollarSign className="h-5 w-5 text-brand-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-ink-900">Wallet & payouts</p>
                      <p className="text-sm text-ink-500">Withdraw your available balance.</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-400" />
                </Link>

                <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Payout phone
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-medium text-ink-800">
                    <Phone className="h-4 w-4 text-brand-600" />
                    {profile?.mpesaPhone || profile?.user?.phone || user.phone}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </header>

        {pending.length > 0 && (
          <section className="rounded-[2rem] border border-brand-100 bg-white px-6 py-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-brand-700">Incoming work</p>
                <h2 className="mt-1 text-3xl text-ink-900">New job offers</h2>
              </div>
              <span className="badge bg-red-50 text-red-700">{pending.length} waiting</span>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {pending.map((booking) => (
                <JobCard
                  key={booking.id}
                  booking={booking}
                  actionState={bookingAction}
                  isPendingAction={isBookingActionPending(bookingAction, booking.id)}
                />
              ))}
            </div>
          </section>
        )}

        {active.length > 0 && (
          <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-brand-700">Current work</p>
                <h2 className="mt-1 text-3xl text-ink-900">Active jobs</h2>
              </div>
              <span className="badge bg-brand-50 text-brand-800">{active.length} active</span>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {active.map((booking) => (
                <JobCard
                  key={booking.id}
                  booking={booking}
                  actionState={bookingAction}
                  isPendingAction={isBookingActionPending(bookingAction, booking.id)}
                />
              ))}
            </div>
          </section>
        )}

        {recent.length > 0 && (
          <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-brand-700">History</p>
                <h2 className="mt-1 text-3xl text-ink-900">Recent jobs</h2>
              </div>
              <Link href="/bookings" className="btn-ghost px-4 py-2.5 text-sm">
                View all
              </Link>
            </div>
            <div className="mt-6 space-y-3">
              {recent.slice(0, 6).map((booking) => (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}`}
                  className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-ink-900">
                      {booking.service.name}
                    </p>
                    <p className="mt-1 truncate text-sm text-ink-500">
                      {booking.client.firstName} {booking.client.lastName} · {booking.address.area}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink-900">
                      {formatKES(booking.cleanerEarnings)}
                    </p>
                    <p className="mt-1 text-xs text-ink-400">
                      {format(new Date(booking.scheduledAt), 'dd MMM, h:mm a')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {!isBusy && bookings.length === 0 && (
          <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-card">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
              <AlertCircle className="h-8 w-8 text-brand-700" />
            </div>
            <h2 className="mt-5 text-3xl text-ink-900">No jobs yet</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-500">
              Keep your availability turned on and make sure your profile details stay complete so
              you appear in matching.
            </p>
            <Link href="/cleaner/wallet" className="btn-secondary mt-7 px-6 py-3">
              Open wallet
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}

function JobCard({
  booking,
  actionState,
  isPendingAction,
}: {
  booking: CleanerBooking;
  actionState: ReturnType<
    typeof useMutation<unknown, Error, { bookingId: string; action: CleanerAction }>
  >;
  isPendingAction: boolean;
}) {
  const isOffer = booking.status === 'PENDING';
  const canStart = ['ACCEPTED', 'PAID'].includes(booking.status);
  const canComplete = booking.status === 'IN_PROGRESS';

  return (
    <article className="rounded-[1.6rem] border border-slate-200 bg-slate-50 px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-xl font-semibold text-ink-900">{booking.service.name}</p>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-2 text-sm text-ink-500">{booking.bookingRef}</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Earnings</p>
          <p className="mt-1 text-lg font-semibold text-ink-900">
            {formatKES(booking.cleanerEarnings)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Client</p>
          <div className="mt-3 flex items-center gap-3">
            <Avatar
              name={`${booking.client.firstName} ${booking.client.lastName}`}
              src={booking.client.avatarUrl}
              size="sm"
            />
            <p className="text-sm font-medium text-ink-800">
              {booking.client.firstName} {booking.client.lastName}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Schedule</p>
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-ink-800">
            <CalendarDays className="h-4 w-4 text-brand-600" />
            {format(new Date(booking.scheduledAt), 'EEE dd MMM, h:mm a')}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-500">
            <MapPin className="h-4 w-4 text-brand-600" />
            {booking.address.area}, {booking.address.city}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/bookings/${booking.id}`}
          className="btn-ghost flex-1 justify-center rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm text-ink-700 hover:bg-slate-100"
        >
          View details
        </Link>

        {isOffer && (
          <>
            <button
              onClick={() => actionState.mutate({ bookingId: booking.id, action: 'decline' })}
              disabled={isPendingAction}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPendingAction ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Decline
            </button>
            <button
              onClick={() => actionState.mutate({ bookingId: booking.id, action: 'accept' })}
              disabled={isPendingAction}
              className="btn-primary flex-1 justify-center rounded-[1.2rem] px-4 py-3 text-sm"
            >
              {isPendingAction ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Accept job
            </button>
          </>
        )}

        {canStart && (
          <button
            onClick={() => actionState.mutate({ bookingId: booking.id, action: 'start' })}
            disabled={isPendingAction}
            className="btn-primary flex-1 justify-center rounded-[1.2rem] px-4 py-3 text-sm"
          >
            {isPendingAction ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Start job
          </button>
        )}

        {canComplete && (
          <button
            onClick={() => actionState.mutate({ bookingId: booking.id, action: 'complete' })}
            disabled={isPendingAction}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[1.2rem] bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPendingAction ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Mark complete
          </button>
        )}
      </div>
    </article>
  );
}

function StatPanel({
  icon,
  label,
  value,
  hint,
  dark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border px-4 py-4 ${
        dark ? 'border-white/10 bg-white/10' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${dark ? 'bg-white/10' : 'bg-brand-50'}`}
        >
          {icon}
        </div>
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.16em] ${dark ? 'text-white/60' : 'text-ink-400'}`}
          >
            {label}
          </p>
          <p className={`mt-1 text-xl font-semibold ${dark ? 'text-white' : 'text-ink-900'}`}>
            {value}
          </p>
        </div>
      </div>
      <p className={`mt-3 text-sm ${dark ? 'text-white/65' : 'text-ink-500'}`}>{hint}</p>
    </div>
  );
}

function AccessState({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white px-8 py-10 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
          <AlertCircle className="h-8 w-8 text-brand-700" />
        </div>
        <h1 className="mt-5 text-3xl text-ink-900">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-ink-500">{body}</p>
        <Link href={href} className="btn-primary mt-7 px-6 py-3">
          {cta}
        </Link>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function isBookingActionPending(
  actionState: {
    isPending: boolean;
    variables: { bookingId: string; action: CleanerAction } | undefined;
  },
  bookingId: string
) {
  return actionState.isPending && actionState.variables?.bookingId === bookingId;
}
