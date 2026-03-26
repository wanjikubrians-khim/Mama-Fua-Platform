'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatKES } from '@mama-fua/shared';
import { AlertCircle, CalendarDays, Loader2, MapPin, Wallet } from 'lucide-react';
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
  cleaner: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null;
}

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function BookingsPage() {
  const user = useAuthStore((state) => state.user);
  const [filter, setFilter] = useState<FilterKey>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'index'],
    queryFn: () => bookingApi.list({ pageSize: 40 }),
    enabled: !!user,
  });

  if (!user) {
    return (
      <ListAccessState
        title="Sign in required"
        body="Log in to see your booking history and current jobs."
        href="/login"
        cta="Go to login"
      />
    );
  }

  const isCleaner = user.role === 'CLEANER';
  const bookings: BookingListItem[] = data?.data?.data ?? [];

  const openBookings = bookings.filter((booking) =>
    ['PENDING', 'ACCEPTED', 'PAID', 'IN_PROGRESS'].includes(booking.status)
  );
  const completedBookings = bookings.filter((booking) =>
    ['COMPLETED', 'CONFIRMED'].includes(booking.status)
  );
  const cancelledBookings = bookings.filter((booking) =>
    ['CANCELLED', 'DISPUTED', 'REFUNDED'].includes(booking.status)
  );

  const visibleBookings = bookings.filter((booking) => {
    if (filter === 'OPEN') return openBookings.includes(booking);
    if (filter === 'COMPLETED') return completedBookings.includes(booking);
    if (filter === 'CANCELLED') return cancelledBookings.includes(booking);
    return true;
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(24,95,165,0.12),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 px-6 py-6 text-white shadow-card sm:px-8 sm:py-8">
            <p className="text-sm font-medium text-brand-100">
              {isCleaner ? 'Cleaner jobs' : 'Client bookings'}
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl">
              {isCleaner ? 'Keep every assigned job in view' : 'Track every booking in one place'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
              Filter by what still needs attention, what has been completed, and what’s already
              closed.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <BookingStat label="Total" value={String(bookings.length)} />
              <BookingStat
                label={isCleaner ? 'Open jobs' : 'Active bookings'}
                value={String(openBookings.length)}
              />
              <BookingStat
                label={isCleaner ? 'Completed jobs' : 'Completed bookings'}
                value={String(completedBookings.length)}
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-card">
            <p className="text-sm font-medium text-brand-700">Filters</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key)}
                  className={`rounded-[1.3rem] border px-4 py-4 text-left transition-colors ${
                    filter === item.key
                      ? 'border-brand-200 bg-brand-50 text-brand-800'
                      : 'border-slate-200 bg-slate-50 text-ink-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    {item.key === 'ALL'
                      ? 'Everything in this account.'
                      : item.key === 'OPEN'
                        ? 'Jobs still moving.'
                        : item.key === 'COMPLETED'
                          ? 'Closed successfully.'
                          : 'Cancelled or disputed work.'}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </header>

        <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-700">Results</p>
              <h2 className="mt-1 text-3xl text-ink-900">
                {filter === 'ALL'
                  ? 'All records'
                  : FILTERS.find((item) => item.key === filter)?.label}
              </h2>
            </div>
            <span className="badge bg-brand-50 text-brand-800">{visibleBookings.length} shown</span>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand-700" />
            </div>
          )}

          {!isLoading && visibleBookings.length === 0 && (
            <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white">
                <AlertCircle className="h-7 w-7 text-brand-700" />
              </div>
              <h3 className="mt-4 text-2xl text-ink-900">Nothing in this filter yet</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-500">
                {isCleaner
                  ? 'New assigned work and completed jobs will appear here automatically.'
                  : 'As soon as you create a booking, it will start showing up here.'}
              </p>
              {!isCleaner && (
                <Link href="/book" className="btn-primary mt-6 px-6 py-3">
                  Book a cleaner
                </Link>
              )}
            </div>
          )}

          {!isLoading && visibleBookings.length > 0 && (
            <div className="mt-6 space-y-3">
              {visibleBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}`}
                  className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5 transition-colors hover:border-brand-200 hover:bg-brand-50/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-lg font-semibold text-ink-900">
                        {booking.service.name}
                      </p>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="mt-2 text-sm text-ink-500">{booking.bookingRef}</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                          {isCleaner ? 'Client' : 'Cleaner'}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <Avatar
                            name={
                              isCleaner
                                ? `${booking.client.firstName} ${booking.client.lastName}`
                                : `${booking.cleaner?.firstName ?? 'Mama'} ${booking.cleaner?.lastName ?? 'Fua'}`
                            }
                            src={
                              isCleaner
                                ? booking.client.avatarUrl
                                : (booking.cleaner?.avatarUrl ?? null)
                            }
                            size="sm"
                          />
                          <p className="text-sm font-medium text-ink-800">
                            {isCleaner
                              ? `${booking.client.firstName} ${booking.client.lastName}`
                              : booking.cleaner
                                ? `${booking.cleaner.firstName} ${booking.cleaner.lastName}`
                                : 'Pending assignment'}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Schedule
                        </p>
                        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-ink-800">
                          <CalendarDays className="h-4 w-4 text-brand-600" />
                          {format(new Date(booking.scheduledAt), 'EEE dd MMM, h:mm a')}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Location
                        </p>
                        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-ink-800">
                          <MapPin className="h-4 w-4 text-brand-600" />
                          {booking.address.area}, {booking.address.city}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] bg-white px-5 py-4 text-right shadow-sm sm:min-w-[12rem]">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                      {isCleaner ? 'Earnings' : 'Total'}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-ink-900">
                      {formatKES(isCleaner ? booking.cleanerEarnings : booking.totalAmount)}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                      <Wallet className="h-4 w-4" />
                      View details
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function BookingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ListAccessState({
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
