'use client';
// Mama Fua — Client Dashboard
// KhimTech | 2026

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Calendar, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { bookingApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatKES } from '@mama-fua/shared';
import { format } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  PENDING:     'bg-amber-50 text-amber-700',
  ACCEPTED:    'bg-blue-50 text-blue-700',
  PAID:        'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-teal-50 text-teal-700',
  COMPLETED:   'bg-purple-50 text-purple-700',
  CONFIRMED:   'bg-green-50 text-green-700',
  CANCELLED:   'bg-gray-100 text-gray-500',
  DISPUTED:    'bg-red-50 text-red-700',
};

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
  const unreadCount = (notifRes?.data?.data ?? []).filter((n: { isRead: boolean }) => !n.isRead).length;
  const active = bookings.filter((b: { status: string }) => ['PENDING', 'ACCEPTED', 'PAID', 'IN_PROGRESS'].includes(b.status));
  const past = bookings.filter((b: { status: string }) => ['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(b.status));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-brand-600">Mama Fua</h1>
            <p className="text-sm text-gray-500">Good {getTimeOfDay()}, {user?.firstName}</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="badge bg-red-100 text-red-700">{unreadCount} new</span>
            )}
            <Link href="/book" className="btn-primary text-sm">
              <Plus className="h-4 w-4" /> Book
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-8">

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Home cleaning', href: '/book?service=home', emoji: '🏠' },
            { label: 'Laundry', href: '/book?service=laundry', emoji: '👕' },
            { label: 'Office clean', href: '/book?service=office', emoji: '🏢' },
            { label: 'Deep clean', href: '/book?service=deep', emoji: '✨' },
          ].map((q) => (
            <Link key={q.label} href={q.href}
              className="card text-center hover:shadow-card-hover transition-shadow py-5">
              <div className="text-3xl mb-2">{q.emoji}</div>
              <p className="text-sm font-medium text-gray-700">{q.label}</p>
            </Link>
          ))}
        </div>

        {/* Active bookings */}
        {active.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-600" />
              Active bookings
            </h2>
            <div className="space-y-3">
              {active.map((b: BookingSummary) => <BookingCard key={b.id} booking={b} />)}
            </div>
          </section>
        )}

        {/* Past bookings */}
        {past.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              Past bookings
            </h2>
            <div className="space-y-3">
              {past.slice(0, 5).map((b: BookingSummary) => <BookingCard key={b.id} booking={b} />)}
            </div>
            {past.length > 5 && (
              <Link href="/bookings" className="btn-ghost mt-3 w-full text-sm">
                View all bookings →
              </Link>
            )}
          </section>
        )}

        {!isLoading && bookings.length === 0 && (
          <div className="card text-center py-14">
            <CheckCircle className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-600 mb-2">No bookings yet</h3>
            <p className="text-sm text-gray-400 mb-6">Book your first cleaner in under 2 minutes</p>
            <Link href="/book" className="btn-primary">Book a cleaner</Link>
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

function BookingCard({ booking }: { booking: BookingSummary }) {
  return (
    <Link href={`/bookings/${booking.id}`}
      className="card flex items-center justify-between hover:shadow-card-hover transition-shadow">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center text-xl">🧹</div>
        <div>
          <p className="font-medium text-gray-900">{booking.service.name}</p>
          <p className="text-sm text-gray-500">
            {booking.address.area} · {format(new Date(booking.scheduledAt), 'dd MMM, h:mm a')}
          </p>
          {booking.cleaner && (
            <p className="text-xs text-gray-400 mt-0.5">
              {booking.cleaner.firstName} {booking.cleaner.lastName}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{formatKES(booking.totalAmount)}</p>
          <span className={`badge text-xs mt-1 ${STATUS_STYLES[booking.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {booking.status.replace('_', ' ')}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300" />
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
