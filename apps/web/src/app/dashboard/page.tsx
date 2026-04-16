'use client';
// Mama Fua — Client Dashboard
// KhimTech | 2026

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Plus, Clock3, CheckCircle2, ChevronRight,
  TrendingUp, CalendarDays, ArrowRight,
} from 'lucide-react';
import { bookingApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatKES } from '@mama-fua/shared';
import { format } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  PENDING:     'bg-amber-50   text-amber-700',
  ACCEPTED:    'bg-brand-50   text-brand-700',
  PAID:        'bg-brand-50   text-brand-700',
  IN_PROGRESS: 'bg-mint-50    text-mint-700',
  COMPLETED:   'bg-purple-50  text-purple-700',
  CONFIRMED:   'bg-green-50   text-green-700',
  CANCELLED:   'bg-ink-100    text-ink-500',
  DISPUTED:    'bg-red-50     text-red-700',
};

const STATUS_DOTS: Record<string, string> = {
  PENDING:     'bg-amber-400',
  ACCEPTED:    'bg-brand-500',
  PAID:        'bg-brand-500',
  IN_PROGRESS: 'bg-mint-500',
  COMPLETED:   'bg-purple-500',
  CONFIRMED:   'bg-green-500',
  CANCELLED:   'bg-ink-400',
  DISPUTED:    'bg-red-500',
};

const quickActions = [
  { label: 'Home Cleaning',    href: '/book?service=home',          emoji: '🏠', price: 'From KES 1,200', color: 'bg-blue-50' },
  { label: 'Laundry',          href: '/book?service=laundry',       emoji: '👕', price: 'From KES 500',   color: 'bg-amber-50' },
  { label: 'Office Cleaning',  href: '/book?service=office',        emoji: '🏢', price: 'From KES 2,000', color: 'bg-mint-50' },
  { label: 'Deep Cleaning',    href: '/book?service=deep',          emoji: '✨', price: 'From KES 3,500', color: 'bg-purple-50' },
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
  const totalSpent = bookings
    .filter((b: { status: string }) => ['CONFIRMED', 'COMPLETED', 'PAID', 'IN_PROGRESS'].includes(b.status))
    .reduce((sum: number, b: { totalAmount: number }) => sum + b.totalAmount, 0);

  const timeOfDay = getTimeOfDay();

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">

        {/* ── GREETING HEADER ─────────────────────────────────────── */}
        <header className="rounded-3xl overflow-hidden shadow-[var(--shadow-card)]">
          {/* Top dark strip */}
          <div className="bg-ink-900 px-6 pt-7 pb-8 sm:px-8 sm:pt-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white/50 uppercase tracking-widest">
                  Good {timeOfDay}
                </p>
                <h1 className="mt-1.5 text-3xl font-extrabold text-white sm:text-4xl">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="mt-1.5 text-sm text-white/50">
                  {bookings.length > 0
                    ? `${bookings.length} booking${bookings.length > 1 ? 's' : ''} in your account`
                    : "Let's get your home cleaned."}
                </p>
              </div>

              {unreadCount > 0 && (
                <Link
                  href="/notifications"
                  className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700 transition-colors"
                >
                  <span className="h-2 w-2 rounded-full bg-white animate-ping-slow" />
                  {unreadCount} new
                </Link>
              )}
            </div>

            {/* Stats row */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-xs text-white/40 uppercase tracking-wide">Total spent</p>
                <p className="mt-1.5 text-xl font-extrabold text-white">
                  {formatKES(totalSpent)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-xs text-white/40 uppercase tracking-wide">Active</p>
                <p className="mt-1.5 text-xl font-extrabold text-white">{active.length}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-xs text-white/40 uppercase tracking-wide">Completed</p>
                <p className="mt-1.5 text-xl font-extrabold text-white">{completedCount}</p>
              </div>
            </div>
          </div>

          {/* White bottom strip with CTA */}
          <div className="bg-white px-6 py-4 sm:px-8 flex items-center justify-between">
            <p className="text-sm text-ink-500">
              {active.length > 0
                ? `${active.length} job${active.length > 1 ? 's' : ''} in progress`
                : 'No active bookings right now'}
            </p>
            <Link href="/book" className="btn-primary text-sm gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New booking
            </Link>
          </div>
        </header>

        {/* ── QUICK ACTIONS ────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink-900">Quick book</h2>
            <Link href="/book" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              All services <ChevronRight className="inline h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="service-quick-card"
              >
                <div className={`service-icon-wrap ${action.color}`}>
                  {action.emoji}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-ink-900">{action.label}</p>
                  <p className="mt-0.5 text-xs text-ink-400">{action.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── ACTIVE BOOKINGS ──────────────────────────────────────── */}
        {active.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-mint-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              <h2 className="text-lg font-bold text-ink-900">Active bookings</h2>
              <span className="rounded-full bg-mint-50 px-2 py-0.5 text-xs font-bold text-mint-700">
                {active.length}
              </span>
            </div>

            <div className="space-y-3">
              {active.map((booking: BookingSummary) => (
                <BookingCard key={booking.id} booking={booking} highlight />
              ))}
            </div>
          </section>
        )}

        {/* ── PAST BOOKINGS ────────────────────────────────────────── */}
        {past.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-900">Past bookings</h2>
              {past.length > 5 && (
                <Link href="/bookings" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {past.slice(0, 5).map((booking: BookingSummary) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </section>
        )}

        {/* ── EMPTY STATE ──────────────────────────────────────────── */}
        {!isLoading && bookings.length === 0 && (
          <section className="rounded-3xl bg-white shadow-[var(--shadow-card)] overflow-hidden">
            {/* Decorative top */}
            <div className="h-2 bg-gradient-to-r from-brand-400 via-brand-600 to-brand-800" />
            <div className="px-8 py-16 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50">
                <span className="text-4xl">🧹</span>
              </div>
              <h2 className="mt-6 text-2xl font-extrabold text-ink-900">No bookings yet</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm text-ink-500 leading-relaxed">
                Book your first clean and this dashboard will come alive. Takes under 3 minutes.
              </p>
              <Link href="/book" className="btn-primary-lg mt-8 inline-flex">
                Book your first clean
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

        {/* ── LOADING STATE ────────────────────────────────────────── */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
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

function BookingCard({ booking, highlight = false }: { booking: BookingSummary; highlight?: boolean }) {
  const statusStyle = STATUS_STYLES[booking.status] ?? 'bg-ink-100 text-ink-500';
  const dotColor   = STATUS_DOTS[booking.status]   ?? 'bg-ink-400';

  return (
    <Link
      href={`/bookings/${booking.id}`}
      className={`booking-row group ${highlight ? 'border-brand-200 bg-brand-50/30' : ''}`}
    >
      {/* Service icon */}
      <div className={`booking-icon flex-shrink-0 ${highlight ? 'bg-brand-100' : 'bg-surface-50'}`}>
        🧹
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink-900 group-hover:text-brand-700 transition-colors">
          {booking.service.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-500">
          {booking.address.area} · {format(new Date(booking.scheduledAt), 'dd MMM, h:mm a')}
        </p>
        {booking.cleaner && (
          <p className="mt-0.5 text-xs text-ink-400">
            {booking.cleaner.firstName} {booking.cleaner.lastName}
          </p>
        )}
      </div>

      {/* Status + price */}
      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
        <p className="text-sm font-bold text-ink-900">{formatKES(booking.totalAmount)}</p>
        <span className={`badge ${statusStyle} gap-1.5`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
          {booking.status.replace('_', ' ')}
        </span>
      </div>

      <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-300 group-hover:text-brand-500 transition-colors" />
    </Link>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
