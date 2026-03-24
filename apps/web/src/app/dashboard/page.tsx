'use client';
// Mama Fua — Client Dashboard
// KhimTech | 2026

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Calendar, Clock3, CheckCircle2, ChevronRight } from 'lucide-react';
import { bookingApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatKES } from '@mama-fua/shared';
import { format } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-brand-100 text-brand-800',
  PAID: 'bg-brand-100 text-brand-800',
  IN_PROGRESS: 'bg-mint-100 text-mint-800',
  COMPLETED: 'bg-mint-100 text-mint-800',
  CONFIRMED: 'bg-mint-100 text-mint-800',
  CANCELLED: 'bg-slate-100 text-slate-600',
  DISPUTED: 'bg-red-100 text-red-700',
};

const quickActions = [
  { label: 'Home cleaning', href: '/book?service=home', emoji: '🏠' },
  { label: 'Laundry', href: '/book?service=laundry', emoji: '👕' },
  { label: 'Office clean', href: '/book?service=office', emoji: '🏢' },
  { label: 'Deep clean', href: '/book?service=deep', emoji: '✨' },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: bookingsRes, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingApi.list({ pageSize: 10 }),
  });

  const { data: notifRes } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => userApi.notifications(),
  });

  const bookings = bookingsRes?.data?.data ?? [];
  const unreadCount = (notifRes?.data?.data ?? []).filter(
    (n: { isRead: boolean }) => !n.isRead
  ).length;
  const active = bookings.filter((b: { status: string }) =>
    ['PENDING', 'ACCEPTED', 'PAID', 'IN_PROGRESS'].includes(b.status)
  );
  const past = bookings.filter((b: { status: string }) =>
    ['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(b.status)
  );
  const completedCount = bookings.filter((b: { status: string }) =>
    ['COMPLETED', 'CONFIRMED'].includes(b.status)
  ).length;
  const totalBooked = bookings.reduce(
    (sum: number, booking: { totalAmount: number }) => sum + booking.totalAmount,
    0
  );

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="section-shell p-6 sm:p-7">
            <p className="text-sm font-medium text-brand-700">Dashboard</p>
            <h1 className="mt-2 text-3xl sm:text-4xl">
              Good {getTimeOfDay()}, {user?.firstName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-500">
              Your bookings, quick actions, and recent activity are all here without the extra
              visual noise.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/book" className="btn-primary px-6 py-3">
                <Plus className="h-4 w-4" /> Book a cleaner
              </Link>
              {unreadCount > 0 && (
                <div className="inline-flex items-center rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
                  {unreadCount} new updates
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="dark-panel px-6 py-6">
              <p className="text-sm font-medium text-brand-100">Total booked</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatKES(totalBooked)}</p>
              <p className="mt-2 text-sm text-white/65">
                {bookings.length} bookings in this account
              </p>
            </div>
            <div className="stat-chip px-5 py-5">
              <p className="text-sm font-medium text-ink-500">Active</p>
              <p className="mt-2 text-2xl font-semibold text-ink-900">{active.length}</p>
            </div>
            <div className="stat-chip px-5 py-5">
              <p className="text-sm font-medium text-ink-500">Completed</p>
              <p className="mt-2 text-2xl font-semibold text-ink-900">{completedCount}</p>
            </div>
          </section>
        </header>

        <section className="section-shell p-6">
          <div>
            <p className="text-sm font-medium text-brand-700">Quick actions</p>
            <h2 className="mt-1 text-3xl">Start with a common request</h2>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-soft transition-colors hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="text-3xl">{action.emoji}</div>
                <p className="mt-4 text-lg font-semibold text-ink-900">{action.label}</p>
                <p className="mt-2 text-sm text-ink-500">Start a booking in a few taps.</p>
              </Link>
            ))}
          </div>
        </section>

        {active.length > 0 && (
          <section className="section-shell p-6">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-brand-600" />
              <h2 className="text-3xl">Active bookings</h2>
            </div>
            <p className="mt-2 text-sm text-ink-500">
              Jobs that still need attention or confirmation.
            </p>
            <div className="mt-6 space-y-4">
              {active.map((booking: BookingSummary) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section className="section-shell p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-brand-600" />
                  <h2 className="text-3xl">Past bookings</h2>
                </div>
                <p className="mt-2 text-sm text-ink-500">Recent completed and archived work.</p>
              </div>
              {past.length > 5 && (
                <Link href="/bookings" className="btn-ghost px-4 py-2.5 text-sm">
                  View all
                </Link>
              )}
            </div>

            <div className="mt-6 space-y-4">
              {past.slice(0, 5).map((booking: BookingSummary) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </section>
        )}

        {!isLoading && bookings.length === 0 && (
          <section className="section-shell px-6 py-12 text-center sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
              <CheckCircle2 className="h-8 w-8 text-brand-600" />
            </div>
            <h2 className="mt-5 text-3xl">No bookings yet</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-500">
              Start with your first booking and this dashboard will begin to fill in automatically.
            </p>
            <Link href="/book" className="btn-primary mt-7 px-7 py-3">
              Book a cleaner
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}

interface BookingSummary {
  id: string;
  bookingRef: string;
  status: string;
  scheduledAt: string;
  totalAmount: number;
  service: { name: string };
  cleaner: { firstName: string; lastName: string; avatarUrl: string | null } | null;
  address: { area: string };
}

function BookingCard({ booking }: { booking: BookingSummary }) {
  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-soft transition-colors hover:border-brand-200 hover:bg-slate-50 sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-xl">
          🧹
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-ink-900">{booking.service.name}</p>
          <p className="truncate text-sm text-ink-500">
            {booking.address.area} · {format(new Date(booking.scheduledAt), 'dd MMM, h:mm a')}
          </p>
          {booking.cleaner && (
            <p className="mt-1 text-xs text-ink-400">
              {booking.cleaner.firstName} {booking.cleaner.lastName}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-ink-900">{formatKES(booking.totalAmount)}</p>
          <span
            className={`badge mt-2 ${STATUS_STYLES[booking.status] ?? 'bg-slate-100 text-slate-600'}`}
          >
            {booking.status.replace('_', ' ')}
          </span>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-brand-50">
          <ChevronRight className="h-4 w-4 text-ink-500 group-hover:text-brand-700" />
        </span>
      </div>
    </Link>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
