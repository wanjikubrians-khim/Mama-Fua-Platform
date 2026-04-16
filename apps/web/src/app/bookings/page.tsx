'use client';
// Mama Fua — Bookings List
// KhimTech | 2026

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatKES } from '@mama-fua/shared';
import {
  AlertCircle, CalendarDays, Loader2, MapPin,
  ChevronRight, Plus, ArrowRight,
} from 'lucide-react';
import { Avatar, StatusBadge } from '@/components/ui';
import { bookingApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type FilterKey = 'ALL' | 'OPEN' | 'COMPLETED' | 'CANCELLED';

interface BookingListItem {
  id: string;
  bookingRef: string;
  cleanerEarnings: number;
  scheduledAt: string;
  status: string;
  totalAmount: number;
  service: { name: string; category: string };
  address: { area: string; city: string };
  client:  { firstName: string; lastName: string; avatarUrl: string | null };
  cleaner: { firstName: string; lastName: string; avatarUrl: string | null } | null;
}

const FILTERS: Array<{ key: FilterKey; label: string; desc: string }> = [
  { key: 'ALL',       label: 'All',       desc: 'Everything' },
  { key: 'OPEN',      label: 'Active',    desc: 'In progress' },
  { key: 'COMPLETED', label: 'Completed', desc: 'Done' },
  { key: 'CANCELLED', label: 'Cancelled', desc: 'Closed' },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING:     'bg-amber-50   text-amber-700',
  ACCEPTED:    'bg-brand-50   text-brand-700',
  PAID:        'bg-brand-50   text-brand-700',
  IN_PROGRESS: 'bg-mint-50    text-mint-700',
  COMPLETED:   'bg-purple-50  text-purple-700',
  CONFIRMED:   'bg-green-50   text-green-700',
  CANCELLED:   'bg-ink-100    text-ink-500',
  DISPUTED:    'bg-red-50     text-red-700',
  REFUNDED:    'bg-ink-100    text-ink-500',
};

const STATUS_DOTS: Record<string, string> = {
  PENDING: 'bg-amber-400', ACCEPTED: 'bg-brand-500', PAID: 'bg-brand-500',
  IN_PROGRESS: 'bg-mint-500', COMPLETED: 'bg-purple-500', CONFIRMED: 'bg-green-500',
  CANCELLED: 'bg-ink-400', DISPUTED: 'bg-red-500', REFUNDED: 'bg-ink-400',
};

export default function BookingsPage() {
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<FilterKey>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'index'],
    queryFn: () => bookingApi.list({ pageSize: 40 }),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white shadow-[var(--shadow-card)] overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-brand-400 to-brand-600" />
          <div className="px-8 py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
              <AlertCircle className="h-8 w-8 text-brand-600" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-ink-900">Sign in required</h2>
            <p className="mt-2 text-sm text-ink-500">Log in to see your booking history.</p>
            <Link href="/login" className="btn-primary mt-6 inline-flex">Go to login <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    );
  }

  const isCleaner = user.role === 'CLEANER';
  const bookings: BookingListItem[] = data?.data?.data ?? [];

  const openBookings      = bookings.filter(b => ['PENDING','ACCEPTED','PAID','IN_PROGRESS'].includes(b.status));
  const completedBookings = bookings.filter(b => ['COMPLETED','CONFIRMED'].includes(b.status));
  const cancelledBookings = bookings.filter(b => ['CANCELLED','DISPUTED','REFUNDED'].includes(b.status));

  const visibleBookings = bookings.filter(b => {
    if (filter === 'OPEN')      return openBookings.includes(b);
    if (filter === 'COMPLETED') return completedBookings.includes(b);
    if (filter === 'CANCELLED') return cancelledBookings.includes(b);
    return true;
  });

  const filterCounts: Record<FilterKey, number> = {
    ALL:       bookings.length,
    OPEN:      openBookings.length,
    COMPLETED: completedBookings.length,
    CANCELLED: cancelledBookings.length,
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">

        {/* ── HEADER ──────────────────────────────────────────── */}
        <header>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
                {isCleaner ? 'My jobs' : 'My bookings'}
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                {isCleaner ? 'All assigned and completed jobs.' : 'Every booking in your account.'}
              </p>
            </div>
            {!isCleaner && (
              <Link href="/book" className="btn-primary text-sm gap-1.5 flex-shrink-0">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New booking</span>
              </Link>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-ink-900 px-5 py-4">
              <p className="text-xs text-white/40 uppercase tracking-wide">Total</p>
              <p className="mt-1.5 text-2xl font-extrabold text-white">{bookings.length}</p>
            </div>
            <div className="rounded-2xl bg-white shadow-[var(--shadow-card)] px-5 py-4">
              <p className="text-xs text-ink-400 uppercase tracking-wide">Active</p>
              <p className="mt-1.5 text-2xl font-extrabold text-mint-600">{openBookings.length}</p>
            </div>
            <div className="rounded-2xl bg-white shadow-[var(--shadow-card)] px-5 py-4">
              <p className="text-xs text-ink-400 uppercase tracking-wide">Done</p>
              <p className="mt-1.5 text-2xl font-extrabold text-brand-600">{completedBookings.length}</p>
            </div>
          </div>
        </header>

        {/* ── FILTER TABS ─────────────────────────────────────── */}
        <div className="pill-tabs">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`pill-tab flex items-center justify-center gap-1.5 ${filter === key ? 'pill-tab-active' : ''}`}
            >
              {label}
              {filterCounts[key] > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  filter === key ? 'bg-brand-100 text-brand-700' : 'bg-ink-200 text-ink-600'
                }`}>
                  {filterCounts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── LIST ────────────────────────────────────────────── */}
        <section>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
          )}

          {!isLoading && visibleBookings.length === 0 && (
            <div className="rounded-3xl bg-white shadow-[var(--shadow-card)] px-8 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100">
                <CalendarDays className="h-8 w-8 text-ink-400" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-ink-900">Nothing here yet</h3>
              <p className="mt-2 text-sm text-ink-500 max-w-xs mx-auto">
                {filter !== 'ALL'
                  ? 'No bookings match this filter. Try switching to "All".'
                  : isCleaner
                    ? 'Assigned jobs will appear here automatically.'
                    : 'Your first booking will appear here once created.'}
              </p>
              {!isCleaner && filter === 'ALL' && (
                <Link href="/book" className="btn-primary mt-6 inline-flex">
                  Book a cleaner <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}

          {!isLoading && visibleBookings.length > 0 && (
            <div className="space-y-3">
              {visibleBookings.map(booking => (
                <BookingRow key={booking.id} booking={booking} isCleaner={isCleaner} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function BookingRow({ booking, isCleaner }: { booking: BookingListItem; isCleaner: boolean }) {
  const statusStyle = STATUS_STYLES[booking.status] ?? 'bg-ink-100 text-ink-500';
  const dotColor    = STATUS_DOTS[booking.status]   ?? 'bg-ink-400';

  const counterpart = isCleaner
    ? `${booking.client.firstName} ${booking.client.lastName}`
    : booking.cleaner
      ? `${booking.cleaner.firstName} ${booking.cleaner.lastName}`
      : null;

  const counterpartSrc = isCleaner
    ? booking.client.avatarUrl
    : booking.cleaner?.avatarUrl ?? null;

  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="group flex flex-col gap-4 rounded-2xl bg-white shadow-[var(--shadow-card)] px-5 py-5
                 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all duration-200
                 sm:flex-row sm:items-center"
    >
      {/* Service + status */}
      <div className="flex flex-1 flex-col gap-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-ink-900 group-hover:text-brand-700 transition-colors truncate">
            {booking.service.name}
          </p>
          <span className={`badge ${statusStyle} gap-1.5`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
            {booking.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-xs text-ink-400">{booking.bookingRef}</p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4">
          {counterpart && (
            <div className="flex items-center gap-2">
              <Avatar name={counterpart} src={counterpartSrc} size="xs" />
              <span className="text-xs font-medium text-ink-600">{counterpart}</span>
            </div>
          )}
          {!counterpart && !isCleaner && (
            <span className="text-xs text-ink-400 italic">Awaiting cleaner</span>
          )}
          <div className="flex items-center gap-1.5 text-xs text-ink-500">
            <CalendarDays className="h-3.5 w-3.5 text-ink-400" />
            {format(new Date(booking.scheduledAt), 'EEE dd MMM, h:mm a')}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink-500">
            <MapPin className="h-3.5 w-3.5 text-ink-400" />
            {booking.address.area}, {booking.address.city}
          </div>
        </div>
      </div>

      {/* Price + arrow */}
      <div className="flex flex-shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
        <p className="text-base font-extrabold text-ink-900">
          {formatKES(isCleaner ? booking.cleanerEarnings : booking.totalAmount)}
        </p>
        <p className="text-xs text-ink-400">{isCleaner ? 'your earnings' : 'total'}</p>
      </div>

      <ChevronRight className="hidden h-4 w-4 flex-shrink-0 text-ink-300 group-hover:text-brand-500 transition-colors sm:block" />
    </Link>
  );
}
