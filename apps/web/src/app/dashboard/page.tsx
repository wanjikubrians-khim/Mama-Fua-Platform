'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Calendar, Clock3, CheckCircle2, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import { bookingApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatKES } from '@mama-fua/shared';
import { format } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  PENDING:     'status-pending',
  ACCEPTED:    'status-accepted',
  PAID:        'status-paid',
  IN_PROGRESS: 'status-in_progress',
  COMPLETED:   'status-completed',
  CONFIRMED:   'status-confirmed',
  CANCELLED:   'status-cancelled',
  DISPUTED:    'status-disputed',
};

const quickActions = [
  { label: 'Home cleaning', href: '/book?service=home',          emoji: '🏠', desc: 'From KES 1,200' },
  { label: 'Laundry',       href: '/book?service=laundry',       emoji: '👕', desc: 'From KES 500' },
  { label: 'Office clean',  href: '/book?service=office',        emoji: '🏢', desc: 'From KES 2,000' },
  { label: 'Deep clean',    href: '/book?service=deep',          emoji: '✨', desc: 'From KES 3,500' },
];

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

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

  const bookings    = bookingsRes?.data?.data ?? [];
  const unreadCount = (notifRes?.data?.data ?? []).filter((n: { isRead: boolean }) => !n.isRead).length;
  const active      = bookings.filter((b: { status: string }) => ['PENDING','ACCEPTED','PAID','IN_PROGRESS'].includes(b.status));
  const past        = bookings.filter((b: { status: string }) => ['CONFIRMED','COMPLETED','CANCELLED'].includes(b.status));
  const completed   = bookings.filter((b: { status: string }) => ['COMPLETED','CONFIRMED'].includes(b.status)).length;
  const totalSpend  = bookings.reduce((s: number, b: { totalAmount: number }) => s + b.totalAmount, 0);

  return (
    <div className="min-h-screen pb-24 sm:pb-8" style={{ background: 'var(--ink-50)' }}>
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">

        {/* ── Header ── */}
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="section-shell p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-600)' }}>Dashboard</p>
            <h1 className="mt-2 text-3xl sm:text-4xl" style={{ color: 'var(--ink-900)' }}>
              Good {getTimeOfDay()}, {user?.firstName ?? 'there'} 👋
            </h1>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--ink-500)' }}>
              Your bookings, quick actions, and activity — all in one place.
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Link href="/book" className="btn-primary px-5 py-2.5 text-sm">
                <Plus className="h-4 w-4" /> Book a cleaner
              </Link>
              {unreadCount > 0 && (
                <Link href="/notifications" className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  {unreadCount} new update{unreadCount > 1 ? 's' : ''}
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="dark-panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-300)' }}>Total spent</p>
              <p className="mt-2 text-2xl font-bold text-white">{formatKES(totalSpend)}</p>
              <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{bookings.length} bookings total</p>
            </div>
            <div className="stat-chip">
              <p className="text-xs font-medium" style={{ color: 'var(--ink-500)' }}>Active</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--ink-900)', fontFamily: 'Sora, sans-serif' }}>{active.length}</p>
            </div>
            <div className="stat-chip">
              <p className="text-xs font-medium" style={{ color: 'var(--ink-500)' }}>Completed</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--ink-900)', fontFamily: 'Sora, sans-serif' }}>{completed}</p>
            </div>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div className="section-shell p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-600)' }}>Quick book</p>
          <h2 className="mt-1.5 text-2xl" style={{ color: 'var(--ink-900)' }}>What do you need today?</h2>
          <div className="mt-5 grid gap-3 grid-cols-2 lg:grid-cols-4">
            {quickActions.map(action => (
              <Link key={action.label} href={action.href}
                className="group rounded-2xl border border-ink-100 bg-white p-5 transition-all duration-200 hover:border-brand-200 hover:shadow-card hover:-translate-y-0.5">
                <div className="text-3xl">{action.emoji}</div>
                <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--ink-900)' }}>{action.label}</p>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-400)' }}>{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Active bookings ── */}
        {active.length > 0 && (
          <div className="section-shell p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--brand-50)' }}>
                <Clock3 className="h-4 w-4" style={{ color: 'var(--brand-600)' }} />
              </div>
              <h2 className="text-xl" style={{ color: 'var(--ink-900)' }}>Active bookings</h2>
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'var(--brand-100)', color: 'var(--brand-800)' }}>{active.length}</span>
            </div>
            <div className="space-y-3">
              {active.map((b: BookingSummary) => <BookingCard key={b.id} booking={b} />)}
            </div>
          </div>
        )}

        {/* ── Past bookings ── */}
        {past.length > 0 && (
          <div className="section-shell p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--ink-100)' }}>
                  <Calendar className="h-4 w-4" style={{ color: 'var(--ink-600)' }} />
                </div>
                <h2 className="text-xl" style={{ color: 'var(--ink-900)' }}>Past bookings</h2>
              </div>
              {past.length > 5 && (
                <Link href="/bookings" className="btn-ghost px-3 py-1.5 text-sm">View all</Link>
              )}
            </div>
            <div className="space-y-3">
              {past.slice(0, 5).map((b: BookingSummary) => <BookingCard key={b.id} booking={b} />)}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && bookings.length === 0 && (
          <div className="section-shell px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--brand-50)' }}>
              <Sparkles className="h-8 w-8" style={{ color: 'var(--brand-600)' }} />
            </div>
            <h2 className="mt-5 text-2xl" style={{ color: 'var(--ink-900)' }}>No bookings yet</h2>
            <p className="mx-auto mt-2.5 max-w-xs text-sm leading-6" style={{ color: 'var(--ink-500)' }}>
              Start with your first booking and your dashboard will fill in automatically.
            </p>
            <Link href="/book" className="btn-primary mt-6 px-7 py-3 text-sm">Book a cleaner</Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface BookingSummary {
  id: string; bookingRef: string; status: string; scheduledAt: string;
  totalAmount: number;
  service: { name: string };
  cleaner: { firstName: string; lastName: string; avatarUrl: string | null } | null;
  address: { area: string };
}

function BookingCard({ booking }: { booking: BookingSummary }) {
  return (
    <Link href={`/bookings/${booking.id}`}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white px-4 py-4 transition-all duration-200 hover:border-brand-200 hover:shadow-soft sm:px-5">
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="booking-icon text-xl">🧹</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink-900)' }}>{booking.service.name}</p>
          <p className="truncate text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
            {booking.address.area} · {format(new Date(booking.scheduledAt), 'dd MMM, h:mm a')}
          </p>
          {booking.cleaner && (
            <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-400)' }}>
              {booking.cleaner.firstName} {booking.cleaner.lastName}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <p className="text-sm font-semibold" style={{ color: 'var(--ink-900)' }}>{formatKES(booking.totalAmount)}</p>
          <span className={`mt-1.5 block ${STATUS_STYLES[booking.status] ?? 'badge bg-ink-100 text-ink-600'}`}>
            {booking.status.replace('_', ' ')}
          </span>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full transition-colors" style={{ background: 'var(--ink-100)' }}>
          <ChevronRight className="h-4 w-4" style={{ color: 'var(--ink-500)' }} />
        </span>
      </div>
    </Link>
  );
}
