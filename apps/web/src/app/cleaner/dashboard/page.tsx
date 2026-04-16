'use client';
// Mama Fua — Cleaner Dashboard
// KhimTech | 2026

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatKES } from '@mama-fua/shared';
import {
  AlertCircle, ArrowRight, CalendarDays, CheckCircle2,
  CircleDollarSign, Loader2, MapPin, Phone, Play,
  ShieldCheck, Star, Wallet, XCircle,
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
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null; phone: string };
  services: Array<{ id: string; customPrice: number; service: { id: string; name: string; category: string } }>;
}

interface CleanerWallet { balance: number; transactions: Array<{ id: string }> }

interface CleanerBooking {
  id: string;
  bookingRef: string;
  cleanerEarnings: number;
  scheduledAt: string;
  status: string;
  service: { name: string; category: string };
  address: { area: string; city: string };
  client: { firstName: string; lastName: string; avatarUrl: string | null };
}

type CleanerAction = 'accept' | 'decline' | 'start' | 'complete';

const VERIFICATION_STYLES: Record<string, string> = {
  VERIFIED:     'bg-mint-50  text-mint-700',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700',
  PENDING:      'bg-ink-100  text-ink-500',
  REJECTED:     'bg-red-50   text-red-700',
};

export default function CleanerDashboardPage() {
  const user         = useAuthStore((s) => s.user);
  const queryClient  = useQueryClient();

  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ['cleaner-profile'],
    queryFn:  () => cleanerApi.me(),
    enabled:  user?.role === 'CLEANER',
  });

  const { data: bookingsRes, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', 'cleaner'],
    queryFn:  () => bookingApi.list({ pageSize: 30 }),
    enabled:  user?.role === 'CLEANER',
    refetchInterval: 15_000,
  });

  const { data: walletRes } = useQuery({
    queryKey: ['cleaner-wallet'],
    queryFn:  () => cleanerApi.wallet(),
    enabled:  user?.role === 'CLEANER',
  });

  const toggleAvailability = useMutation({
    mutationFn: (isAvailable: boolean) => cleanerApi.setAvailable(isAvailable),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['cleaner-profile'] }),
  });

  const bookingAction = useMutation({
    mutationFn: ({ bookingId, action }: { bookingId: string; action: CleanerAction }) => {
      switch (action) {
        case 'accept':   return bookingApi.accept(bookingId);
        case 'decline':  return bookingApi.decline(bookingId);
        case 'start':    return bookingApi.start(bookingId);
        case 'complete': return bookingApi.complete(bookingId);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'cleaner'] }),
  });

  if (!user) return <AccessGate title="Sign in required" body="Log in with a cleaner account to view your jobs." href="/login" cta="Go to login" />;
  if (user.role !== 'CLEANER') return <AccessGate title="Cleaner workspace only" body="This screen is for cleaner accounts. Clients use the standard dashboard." href="/dashboard" cta="Open dashboard" />;

  const profile: CleanerProfile | null  = profileRes?.data?.data ?? null;
  const bookings: CleanerBooking[]       = bookingsRes?.data?.data ?? [];
  const wallet: CleanerWallet | null     = walletRes?.data?.data ?? null;

  const pending = bookings.filter(b => b.status === 'PENDING');
  const active  = bookings.filter(b => ['ACCEPTED', 'PAID', 'IN_PROGRESS'].includes(b.status));
  const recent  = bookings.filter(b => ['COMPLETED', 'CONFIRMED', 'CANCELLED'].includes(b.status));
  const rating  = Number(profile?.rating ?? 0);
  const balance = wallet?.balance ?? 0;
  const isBusy  = profileLoading || bookingsLoading;
  const isAvailable = profile?.isAvailable ?? false;

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <header className="rounded-3xl overflow-hidden shadow-[var(--shadow-card)]">
          <div className="bg-ink-900 px-6 pt-7 pb-8 sm:px-8 sm:pt-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Cleaner dashboard
                </p>
                <h1 className="mt-1.5 text-3xl font-extrabold text-white sm:text-4xl">
                  Good {getTimeOfDay()}, {user.firstName}
                </h1>
                <p className="mt-1.5 text-sm text-white/50">
                  {bookings.length > 0
                    ? `${bookings.length} job${bookings.length !== 1 ? 's' : ''} in your workspace`
                    : 'Keep your availability on to receive new jobs.'}
                </p>
              </div>

              {/* Availability toggle */}
              <button
                onClick={() => toggleAvailability.mutate(!isAvailable)}
                disabled={toggleAvailability.isPending}
                className={`flex-shrink-0 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 border transition-all duration-200 min-w-[11rem] disabled:opacity-60 ${
                  isAvailable
                    ? 'bg-mint-50 border-mint-200 text-mint-900'
                    : 'bg-white/8 border-white/15 text-white'
                }`}
              >
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-widest ${isAvailable ? 'text-mint-600' : 'text-white/40'}`}>
                    Status
                  </p>
                  <p className={`mt-0.5 text-sm font-bold ${isAvailable ? 'text-mint-800' : 'text-white'}`}>
                    {isAvailable ? 'Taking jobs' : 'Offline'}
                  </p>
                </div>
                {toggleAvailability.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${isAvailable ? 'bg-mint-500' : 'bg-white/20'}`}>
                    <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${isAvailable ? 'translate-x-5' : 'translate-x-0'}`} />
                  </span>
                )}
              </button>
            </div>

            {/* Stats row */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-xs text-white/40 uppercase tracking-wide">Wallet</p>
                <p className="mt-1.5 text-xl font-extrabold text-white">{formatKES(balance)}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-xs text-white/40 uppercase tracking-wide">Rating</p>
                <p className="mt-1.5 text-xl font-extrabold text-white">
                  {profile ? rating.toFixed(1) : '—'}
                  <span className="ml-1 text-xs text-white/40 font-normal">/ 5</span>
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-xs text-white/40 uppercase tracking-wide">Completed</p>
                <p className="mt-1.5 text-xl font-extrabold text-white">{profile?.totalJobs ?? 0}</p>
              </div>
            </div>
          </div>

          {/* White strip — quick actions */}
          <div className="bg-white px-6 py-4 sm:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink-900 truncate">{user.firstName} {user.lastName}</p>
                <span className={`badge text-[10px] mt-0.5 ${VERIFICATION_STYLES[profile?.verificationStatus ?? 'PENDING'] ?? 'bg-ink-100 text-ink-500'}`}>
                  <ShieldCheck className="h-3 w-3" />
                  {(profile?.verificationStatus ?? 'PENDING').replace('_', ' ')}
                </span>
              </div>
            </div>
            <Link href="/cleaner/wallet" className="btn-primary text-sm gap-1.5 flex-shrink-0">
              <Wallet className="h-3.5 w-3.5" />
              Wallet
            </Link>
          </div>
        </header>

        {/* ── PROFILE SNAPSHOT ────────────────────────────────── */}
        <section className="rounded-3xl bg-white shadow-[var(--shadow-card)] px-6 py-6">
          <div className="flex items-start gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Payout phone</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink-800">
                <Phone className="h-4 w-4 text-brand-600" />
                {profile?.mpesaPhone || profile?.user?.phone || user.phone}
              </p>
            </div>
            <div className="ml-auto">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Service area</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink-800">
                <MapPin className="h-4 w-4 text-brand-600" />
                {profile?.serviceAreaRadius ?? 0} km radius
              </p>
            </div>
          </div>

          {profile?.services && profile.services.length > 0 && (
            <div className="mt-5 pt-5 border-t border-ink-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-3">Services offered</p>
              <div className="flex flex-wrap gap-2">
                {profile.services.map(s => (
                  <span key={s.id} className="rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                    {s.service.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── PENDING JOBS ─────────────────────────────────────── */}
        {pending.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse" />
              <h2 className="text-lg font-bold text-ink-900">New job offers</h2>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                {pending.length} waiting
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {pending.map(booking => (
                <JobCard
                  key={booking.id}
                  booking={booking}
                  actionState={bookingAction}
                  isPendingAction={isActionPending(bookingAction, booking.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── ACTIVE JOBS ──────────────────────────────────────── */}
        {active.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-mint-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              <h2 className="text-lg font-bold text-ink-900">Active jobs</h2>
              <span className="rounded-full bg-mint-50 px-2 py-0.5 text-xs font-bold text-mint-700">
                {active.length}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {active.map(booking => (
                <JobCard
                  key={booking.id}
                  booking={booking}
                  actionState={bookingAction}
                  isPendingAction={isActionPending(bookingAction, booking.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── RECENT JOBS ──────────────────────────────────────── */}
        {recent.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-900">Recent jobs</h2>
              <Link href="/bookings" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                View all <ArrowRight className="inline h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {recent.slice(0, 6).map(booking => (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl bg-white shadow-[var(--shadow-card)] px-5 py-4
                             hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink-900 group-hover:text-brand-700 transition-colors">
                      {booking.service.name}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {booking.client.firstName} {booking.client.lastName} · {booking.address.area}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-extrabold text-ink-900">{formatKES(booking.cleanerEarnings)}</p>
                    <p className="mt-0.5 text-xs text-ink-400">{format(new Date(booking.scheduledAt), 'dd MMM, h:mm a')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── EMPTY STATE ──────────────────────────────────────── */}
        {!isBusy && bookings.length === 0 && (
          <section className="rounded-3xl bg-white shadow-[var(--shadow-card)] overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-brand-400 via-brand-600 to-brand-800" />
            <div className="px-8 py-16 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50">
                <span className="text-4xl">🧹</span>
              </div>
              <h2 className="mt-6 text-2xl font-extrabold text-ink-900">No jobs yet</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm text-ink-500 leading-relaxed">
                Keep your availability on and complete your profile so clients can find and match with you.
              </p>
              <Link href="/cleaner/wallet" className="btn-secondary mt-8 inline-flex">
                View wallet <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

        {/* Loading */}
        {isBusy && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── JOB CARD ─────────────────────────────────────────────── */
function JobCard({
  booking,
  actionState,
  isPendingAction,
}: {
  booking: CleanerBooking;
  actionState: ReturnType<typeof useMutation<unknown, Error, { bookingId: string; action: CleanerAction }>>;
  isPendingAction: boolean;
}) {
  const isOffer    = booking.status === 'PENDING';
  const canStart   = ['ACCEPTED', 'PAID'].includes(booking.status);
  const canComplete = booking.status === 'IN_PROGRESS';

  return (
    <article className="rounded-2xl bg-white shadow-[var(--shadow-card)] px-5 py-5 border border-ink-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink-900 truncate">{booking.service.name}</p>
          <p className="mt-0.5 text-xs text-ink-400">{booking.bookingRef}</p>
        </div>
        <div className="flex-shrink-0 rounded-xl bg-surface-50 border border-ink-100 px-3 py-2 text-right">
          <p className="text-[10px] text-ink-400 uppercase tracking-wide">Earnings</p>
          <p className="mt-0.5 text-sm font-extrabold text-ink-900">{formatKES(booking.cleanerEarnings)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-50 px-3 py-3">
          <p className="text-[10px] text-ink-400 uppercase tracking-wide">Client</p>
          <div className="mt-2 flex items-center gap-2">
            <Avatar name={`${booking.client.firstName} ${booking.client.lastName}`} src={booking.client.avatarUrl} size="xs" />
            <span className="text-xs font-semibold text-ink-800 truncate">
              {booking.client.firstName} {booking.client.lastName}
            </span>
          </div>
        </div>
        <div className="rounded-xl bg-surface-50 px-3 py-3">
          <p className="text-[10px] text-ink-400 uppercase tracking-wide">Schedule</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-ink-800">
            <CalendarDays className="h-3.5 w-3.5 text-brand-600 flex-shrink-0" />
            {format(new Date(booking.scheduledAt), 'dd MMM, h:mm a')}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-500">
            <MapPin className="h-3.5 w-3.5 text-brand-600 flex-shrink-0" />
            {booking.address.area}, {booking.address.city}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link href={`/bookings/${booking.id}`} className="btn-ghost text-xs px-3 py-2 flex-shrink-0">
          Details
        </Link>

        {isOffer && (
          <>
            <button
              onClick={() => actionState.mutate({ bookingId: booking.id, action: 'decline' })}
              disabled={isPendingAction}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-surface-50 disabled:opacity-50 transition-colors"
            >
              {isPendingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Decline
            </button>
            <button
              onClick={() => actionState.mutate({ bookingId: booking.id, action: 'accept' })}
              disabled={isPendingAction}
              className="btn-primary flex-1 text-xs py-2 gap-1.5 justify-center"
            >
              {isPendingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Accept
            </button>
          </>
        )}

        {canStart && (
          <button
            onClick={() => actionState.mutate({ bookingId: booking.id, action: 'start' })}
            disabled={isPendingAction}
            className="btn-primary flex-1 text-xs py-2 gap-1.5 justify-center"
          >
            {isPendingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Start job
          </button>
        )}

        {canComplete && (
          <button
            onClick={() => actionState.mutate({ bookingId: booking.id, action: 'complete' })}
            disabled={isPendingAction}
            className="btn-mint flex-1 text-xs py-2 gap-1.5 justify-center"
          >
            {isPendingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Complete
          </button>
        )}
      </div>
    </article>
  );
}

/* ── ACCESS GATE ──────────────────────────────────────────── */
function AccessGate({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-[var(--shadow-card)] overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-brand-400 to-brand-600" />
        <div className="px-8 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
            <AlertCircle className="h-8 w-8 text-brand-600" />
          </div>
          <h2 className="mt-5 text-xl font-extrabold text-ink-900">{title}</h2>
          <p className="mt-2 text-sm text-ink-500">{body}</p>
          <Link href={href} className="btn-primary mt-6 inline-flex">{cta} <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function isActionPending(
  state: { isPending: boolean; variables?: { bookingId: string; action: CleanerAction } },
  bookingId: string
) {
  return state.isPending && state.variables?.bookingId === bookingId;
}
